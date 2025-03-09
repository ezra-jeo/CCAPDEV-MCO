const express = require("express");
const mongoose = require("mongoose");
const exphbs = require("express-handlebars");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");
const session = require("express-session");

require("./db"); // connecting to mongoDB
const Review = require("./models/reviews");
const Organization = require("./models/organizations");
const User = require("./models/users");

const app = express();

// handlebars
const hbs = exphbs.create({
    extname: "hbs",
    defaultLayout: "main",
    layoutsDir: path.join(__dirname, "views", "layouts"),
    partialsDir: path.join(__dirname, 'views', 'partials'),
    helpers: {
        times: function(n, block) { // for showing stars in reviews
            let result = "";
            for (let i = 0; i < n; i++) {
                result += block.fn(i);
            }
            return result;
        },
        timeAgo: function(timestamp) { // computing time posted in reviews
            const now = new Date();
            const past = new Date(timestamp);
            const diffInSeconds = Math.floor((now - past) / 1000);

            const timeIntervals = {
                year: 31536000,
                month: 2592000,
                week: 604800,
                day: 86400,
                hour: 3600,
                minute: 60,
                second: 1
            };

            for (const [unit, seconds] of Object.entries(timeIntervals)) {
                const interval = Math.floor(diffInSeconds / seconds);
                if (interval >= 1) {
                    return `${interval} ${unit}${interval > 1 ? "s" : ""} ago`;
                }
            }
            return "Just now";
        },
        lt: function (a, b) {
            return a < b;
        },
        eq: function(a, b, options) {
            if (a === b) {
                return true; 
            } else {
                return false; 
            }
        },
        sub: function(a, b) { return a - b; },
        round: function(n) { return Math.round(n); },
        gt: function(a, b) { return a > b; },
    }
});

// hbs views
app.engine("hbs", hbs.engine);
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));

// to keep track if logged in
app.use(session({
    secret: "yourSecretKey",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, httpOnly: true } 
}));

// pass logged-in user to all views
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

app.get('/reviews', (req, res) => {
    res.render('reviews', { 
        loggedIn: req.session.user
    });
});

// public
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// initializing routes
const homepageRoutes = require('./routes/homepage');

const signupRoutes = require('./routes/signup');
const loginRoutes = require('./routes/login');

const searchOrgRoutes = require('./routes/searchorg');
const searchRevRoutes = require('./routes/searchreview');

const revPageRoutes = require('./routes/reviewpage');
const revEditRoutes = require('./routes/reviewedit');
const editOrgRoutes = require('./routes/editorg');
const orgPageRoutes = require('./routes/orgpage');

const userPageRoutes = require('./routes/userpage');
const userEditRoutes = require('./routes/useredit');
const aboutRoutes = require('./routes/about');

// fetching recent reviews for homepage
app.get("/", async (req, res) => {
    try {
        const reviews = await Review.find().sort({ timePosted: -1 }).lean(); // sort by latest time
        res.render("homepage", { reviews, loggedIn: req.session.user || null });
    } catch (error) {
        console.error("Error fetching reviews:", error);
        res.status(500).send("Error loading reviews");
    }
});

// for userpage filtering (search + ratings)
app.get("/userpage/:userPage", async (req, res) => {
    try {
        const userPage = req.params.userPage;
        
        // finding user
        let user = await User.findOne({ userPage }).lean();
        let isOrganization = false;

        // or org
        if (!user) {
            user = await Organization.findOne({ orgPage: userPage }).lean();
            if (!user) {
                return res.status(404).send("User not found.");
            }
            isOrganization = true;
        }

        // fetch reviews based on the username (stored in reviews)
        const userName = isOrganization ? user.orgName : user.userName;
        let query = { userName };

        if (req.query.rating) {
            query.reviewRating = parseInt(req.query.rating, 10);
        }
        if (req.query.search) {
            query.reviewText = { $regex: req.query.search, $options: "i" };
        }

        const reviews = await Review.find(query).lean();

        if (req.headers["x-requested-with"] === "XMLHttpRequest") {
            res.render("partials/reloadreview", { reviews, layout: false });
        } else {
            res.render("userpage", { 
                user, 
                reviews, 
                userPage: user.userPage, 
                loggedIn: req.session.user || null,
                isOrganization
            });
        }
    } catch (error) {
        console.error("Error loading user page:", error);
        res.status(500).send("Error loading user page");
    }
});

// user edit page
app.get("/useredit/:userPage", async (req, res) => {
    try {
        const userPage = req.params.userPage;
        
        // Find the user based on userPage
        const user = await User.findOne({ userPage }).lean();


        if (!user) {
            return res.status(404).send("User not found.");
        }

        res.render("useredit", { user, layout: false });
    } catch (error) {
        console.error("Error loading user edit page:", error);
        res.status(500).send("Error loading user edit page.");
    }
});

// user edit
app.post("/useredit/:userPage", async (req, res) => {
    try {
        const userPage = req.params.userPage;
        const findUser = await Review.findOne({ userPage: userPage }).lean();
        let userName = findUser.userName;
        const user = await User.findOne({ userName: userName }).lean();

        const { description } = req.body;

        if (description && description.trim() !== "") {
            await User.updateOne({ userName: userName }, { $set: { userDesc: description } });
        }
    
        res.redirect(`/userpage/${userPage}`);

    } catch (error) {
        console.error("Error loading user edit page:", error);
        res.status(500).send("Error loading user edit page.");
    }
});

// signing up
app.post("/signup", async (req, res) => {       
    try {
        const { username, password, accountType, description } = req.body;

        if (!accountType) {
            return res.status(400).json({ error: "Account type is required." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        let newAccount;

        if (accountType === "student") {
            if (!username || !hashedPassword) {
                return res.status(400).json({ error: "Username and password are required for users." });
            }

            newAccount = new User({ 
                userName: username, 
                userDesc: description,
                userPage: username,
                profileImage: "/images/default-icon-user.png",
                userPassword: hashedPassword
            });
        } 
        else if (accountType === "organization") {
            if (!username || !hashedPassword) {
                return res.status(400).json({ error: "Organization name and password are required." });
            }
            newAccount = new Organization({
                orgName: username,
                orgPic: "/images/default-icon-org.png",
                orgDesc: description,
                orgPage: username,
                orgRating: 0,
                orgReviews: 0,
                orgCollege: "Others",
                orgPassword: hashedPassword
            });
        } 
        else {
            return res.status(400).json({ error: "Invalid account type." });
        }

        await newAccount.save();

        console.log(`✅ ${accountType} created:`, newAccount);
        res.json({ message: `${accountType} created successfully!`, account: newAccount });
    } catch (error) {
        console.error("❌ Error creating account:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// logging in
app.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: "Username and password are required." });
        }

        let account;
        let accountType = "student";
        account = await User.findOne({ userName: username }).lean();

        if (!account) {
            account = await Organization.findOne({ orgName: username }).lean();
            accountType = "organization";
        }

        if (!account) {
            return res.status(404).json({ error: "Account not found." });
        }

        const storedPassword = account.userPassword || account.orgPassword;

        let isPasswordValid = false;

        if (storedPassword.startsWith("$2b$")) {
            // hashed password
            isPasswordValid = await bcrypt.compare(password, storedPassword);
        } else {
            // comparing with plain text
            isPasswordValid = password === storedPassword;

            if (isPasswordValid) {
                const hashedPassword = await bcrypt.hash(password, 10);
                if (accountType === "student") {
                    await User.updateOne({ userName: username }, { userPassword: hashedPassword });
                } else {
                    await Organization.updateOne({ orgName: username }, { orgPassword: hashedPassword });
                }
                console.log(`🔄 Password upgraded to bcrypt for ${username}`);
            }
        }

        if (!isPasswordValid) {
            return res.status(401).json({ error: "Invalid credentials." });
        }

        // storing in user session
        req.session.user = (accountType === "student") ? {
            userName: account.userName,
            userPage: account.userPage,     
            accountType: accountType,
            userDesc: account.userDesc,
            profileImage: account.profileImage,
        } : {
            orgName: account.orgName,
            orgPage: account.orgPage,     
            accountType: accountType,
            orgDesc: account.orgDesc,
            orgPic: account.orgPic,
            orgRating: 0,
            orgReviews: 0,
            orgCollege: "Others",
        };

        console.log(`✅ ${accountType} logged in:`, req.session.user);
        res.json({ message: `Welcome back, ${username}!`, accountType });

    } catch (error) {
        console.error("❌ Error during login:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// logout
app.get("/logout", (req, res) => {
    console.log("Logging out user:", req.session.user);
    
    req.session.destroy((err) => {
        if (err) {
            console.error("Logout error:", err);
            return res.status(500).json({ error: "Error logging out." });
        }

        res.clearCookie("connect.sid"); 
        res.redirect("/");
    });
});

// dis/liking reviews
app.post("/review/:id/react", async (req, res) => {
    try {
        const { reaction } = req.body;
        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({ success: false, message: "Review not found" });
        }

        // undo action
        if (reaction === "undoLike") {
            if (review.likesCount > 0) review.likesCount -= 1;
        }
        else if (reaction === "undoDislike") {
            if (review.dislikesCount > 0) review.dislikesCount -= 1;
        }
        // dis/like
        else if (reaction === "like") {
            review.likesCount += 1;
        } else if (reaction === "dislike") {
            review.dislikesCount += 1;
        }
        // cancelling
        else if (reaction === "cancelDislike") {
            review.likesCount += 1;
            review.dislikesCount -= 1;
        }
        else if (reaction === "cancelLike") {
            review.likesCount -= 1;
            review.dislikesCount += 1;
        }

        await review.save();

        res.json({ success: true, likesCount: review.likesCount, dislikesCount: review.dislikesCount });

    } catch (err) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// replying to a review
app.post("/reply-to-review", async (req, res) => {
    try {
        const { reviewId, replyText } = req.body;

        if (!reviewId || !replyText) {
            return res.status(400).json({ success: false, message: "Review ID or reply message is missing." });
        }

        // Update the review with the organization's response
        await Review.findByIdAndUpdate(reviewId, {
            responseMessage: replyText
        });

        res.json({ success: true, message: "Reply added successfully!" });
    } catch (err) {
        console.error("Error replying to review:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

// writing a review
app.post("/submit-review", async (req, res) => {
    try {
        const { userName, userPage, profileImage, reviewRating, reviewText, orgName, orgPage } = req.body;

        if (!reviewRating || !reviewText.trim() || !orgName || !orgPage) {
            return res.status(400).json({ error: "All required fields must be provided." });
        }

        const newReview = new Review({
            userName,
            userPage,
            profileImage,
            reviewRating,
            reviewText,
            orgName,
            orgPage,
            timePosted: new Date()
        });

        await newReview.save();
        res.json({ message: "Review submitted successfully!", orgPage });
    } catch (error) {
        console.error("Error submitting review:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// using routes
app.use('/', homepageRoutes);
app.use('/signup', signupRoutes);
app.use('/login', loginRoutes);

app.use('/about', aboutRoutes);

app.use('/searchorg', searchOrgRoutes);
app.use('/searchreview', searchRevRoutes);

app.use('/reviewpage', revPageRoutes);
app.use('/reviewedit', revEditRoutes);
app.use('/editorg', editOrgRoutes);
app.use('/', orgPageRoutes);

app.use('/userpage', userPageRoutes);
app.use('/useredit', userEditRoutes);

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
