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
    cookie: { secure: false }
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
        const findUser = await Review.findOne({ userPage: userPage }).lean();

        if (!findUser) {
            return res.status(404).send("User not found.");
        }

        let userName = findUser.userName;
        const user = await User.findOne({ userName: userName }).lean();

        let query = { userName: userName };

        if (req.query.rating) query.reviewRating = parseInt(req.query.rating, 10);
        if (req.query.search) query.reviewText = { $regex: req.query.search, $options: "i" }; // Case-insensitive search

        const reviews = await Review.find(query).lean();

        if (req.headers["x-requested-with"] === "XMLHttpRequest") {
            res.render("partials/reloadreview", { reviews, layout: false });
        } else {
            res.render("userpage", { user, reviews });
        }
    } catch (error) {
        console.error("Error loading user page:", error);
        res.status(500).send("Error loading user page");
    }
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

// signing up
app.post("/review/:id/react", async (req, res) => {
    try {
        const { reaction } = req.body;
        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({ success: false, message: "Review not found" });
        }

        if (reaction === "like") {
            review.likesCount += 1;
        } 
        else if (reaction === "dislike") {
            review.dislikesCount += 1;
        }
        else if (reaction === "undoLike" && review.likesCount > 0) {
            review.likesCount -= 1;
        } 
        else if (reaction === "undoDislike" && review.dislikesCount > 0) {
            review.dislikesCount -= 1;
        }

        await review.save();

        res.json({ success: true, likesCount: review.likesCount, dislikesCount: review.dislikesCount });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error" });
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

        // validating password
        let isPasswordValid = false;
        if (accountType === "student") {
            isPasswordValid = password === account.userPassword;
        } else if (accountType === "organization") {
            isPasswordValid = password === account.orgPassword;
        }

        if (!isPasswordValid) {
            return res.status(401).json({ error: "Invalid credentials." });
        }

        // storing user session
        if (accountType === "student") {
            req.session.user = {
                userName: account.userName,
                userPage: account.userPage,         
                accountType: accountType,
                userDesc: account.userDesc,
                profileImage: account.profileImage,
                userPassword: password
            };
        } else if (accountType === "organization") {
            req.session.user = {
                orgName: account.orgName,
                orgPage: account.orgPage,     
                accountType: accountType,
                orgDesc: account.userDesc,
                orgPic: account.orgPic,
                orgRating: 0,
                orgReviews: 0,
                orgCollege: "Others",
                orgPassword: password
            };
        }

        console.log(`✅ ${accountType} logged in:`, req.session.user);
        res.json({ message: `Welcome back, ${username}!`, accountType });

    } catch (error) {
        console.error("❌ Error during login:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// logging out
app.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Logout error:", err);
            return res.status(500).json({ error: "Error logging out." });
        }
        res.redirect("/");
    });
});

//replying to a review
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

// using routes
app.use('/', homepageRoutes);
app.use('/signup', signupRoutes);
app.use('/login', loginRoutes);

app.use('/searchorg', searchOrgRoutes);
app.use('/searchreview', searchRevRoutes);

app.use('/reviewpage', revPageRoutes);
app.use('/reviewedit', revEditRoutes);
app.use('/editorg', editOrgRoutes);
app.use('/', orgPageRoutes);

app.use('/userpage', userPageRoutes);

app.listen(3000, () => console.log('Server running on http://localhost:3000'));

// closing db connection
const closeDatabase = () => {
    mongoose.connection.close(() => {
        console.log("MongoDB connection closed.");
        process.exit(0);
    });
};

process.on("SIGINT", closeDatabase);
process.on("SIGTERM", closeDatabase);
process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
    closeDatabase();
});
