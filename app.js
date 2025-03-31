const express = require("express");
const mongoose = require("mongoose");
const exphbs = require("express-handlebars");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");
const session = require("express-session");
require("dotenv").config();
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
const deleteRoutes = require('./routes/delete');
const replyRoutes = require('./routes/reply');

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

// user edit
// user edit
app.post("/useredit/:userPage", async (req, res) => {
    try {
        const userPage = req.params.userPage;
        const findUser = await User.findOne({ userPage: userPage }).lean();
        let userName = findUser.userName;

        const { description, "profileImage": profileImage } = req.body;

        if (description && description.trim() !== "") {
            await User.updateOne({ userName: userName }, { $set: { userDesc: description } });
            // Update session if it's the current user
            if (req.session.user && req.session.user.userName === userName) {
                req.session.user.userDesc = description;
            }
        }

        if (profileImage && profileImage.trim() !== "") {
            await User.updateOne({ userName: userName }, { $set: { profileImage: profileImage } });
            await Review.updateMany({ userName: userName }, { $set: { profileImage: profileImage } });
            // Update session if it's the current user
            if (req.session.user && req.session.user.userName === userName) {
                req.session.user.profileImage = profileImage;
            }
        }
    
        res.redirect(`/userpage/${userPage}`);

    } catch (error) {
        console.error("Error loading user edit page:", error);
        res.status(500).send("Error loading user edit page.");
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
app.use('/orgpage', orgPageRoutes);
app.use('/review',deleteRoutes);
app.use('/', replyRoutes);

app.use('/userpage', userPageRoutes);
app.use('/useredit', userEditRoutes);

function finalClose(){
    console.log('Close connection at the end!');
    mongoose.connection.close();
    process.exit();
}

process.on('SIGTERM',finalClose);
process.on('SIGINT',finalClose);
process.on('SIGQUIT', finalClose);

app.listen(3000, () => console.log('Server running on http://localhost:3000'));