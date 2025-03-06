const express = require("express");
const mongoose = require("mongoose");
const exphbs = require("express-handlebars");
const path = require("path");
const fs = require("fs");

require("./db"); // connecting to mongoDB
const Review = require("./models/reviews");
const Organization = require("./models/orgs");
const User = require("./models/users");

const app = express();

// handlebars
const hbs = exphbs.create({
    extname: "hbs",
    defaultLayout: "main",
    layoutsDir: path.join(__dirname, "views", "layouts"),
    helpers: {
        times: function(n, block) { // for showing stars in reviews
            let result = "";
            for (let i = 0; i < n; i++) {
                result += block.fn(i);
            }
            return result;
        },
        add: function(a, b) { return a + b; },
        sub: function(a, b) { return a - b; },
        gt: function(a, b) { return a > b; },
        lt: function(a, b) { return a < b; },
        eq: function(a, b) { return a === b; },
        round: function(n) { return Math.round(n); },
        
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
        }
    }
});

// hbs views
app.engine("hbs", hbs.engine);
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));

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

// fetching reviews
app.get("/", async (req, res) => {
    try {
        const reviews = await Review.find().lean(); // converting to json
        res.render("homepage", { reviews });
    } catch (error) {
        console.error("Error fetching reviews:", error);
        res.status(500).send("Error loading reviews");
    }
});

// fetching userpage
app.get("/userpage/:userPage", async (req, res) => {
    try {
        const userPage = req.params.userPage;

        const reviews = await Review.find({ userPage: userPage }).lean();

        if (reviews.length === 0) {
            //add div for no reviews later
            return res.status(404).send("No reviews found for this user.");
        }

        const userName = reviews[0].userName;

        const user = await User.findOne({ userName: userName }).lean();
        
        res.render("userpage", {
            user: user,
            reviews: reviews
        });

    } catch (error) {
        res.status(500).send("Error loading userpage");
    }
});

app.get("/orgs/:orgName", async (req, res) => {
    try {
        const orgName = req.params.orgName; // Get organization name
        const page = parseInt(req.query.page, 10) || 1;
        const limit = 6; // Number of reviews per page
        const skip = (page - 1) * limit; // Calculate how many reviews to skip

        // Fetch organization details
        const org = await Organization.findOne({ orgName: new RegExp("^" + orgName + "$", "i") }).lean();
        if (!org) {
            return res.status(404).send("Organization not found");
        }

        // Fetch and sort reviews by newest first
        const reviews = await Review.find({ orgName: new RegExp("^" + orgName + "$", "i") })
            .sort({ timePosted: -1 }) // Sort by newest first
            .skip(skip) // Skip reviews based on the current page
            .limit(limit)
            .lean(); 

        // Get the total number of reviews for this organization
        const totalReviews = await Review.countDocuments({ orgName: new RegExp("^" + orgName + "$", "i") });

        /* NOT DONE
        // Calculate the total number of pages based on the total reviews and limit per page
        const totalPages = totalReviews > 0 ? Math.ceil(totalReviews / limit) : 1;

        // Ensure the current page is within a valid range
        const currentPage = Math.min(Math.max(page, 1), totalPages);

        // Calculate the average rating for the organization
        const totalRatings = await Review.aggregate([
            { $match: { orgName: new RegExp("^" + orgName + "$", "i") } }, // Match the organization's reviews
            { $group: { _id: null, avgRating: { $avg: "$ratings" } } } // Compute the average rating
        ]);

        // Extract the average rating, default to "0.0" if there are no ratings
        const avgRating = totalRatings?.[0]?.avgRating ? totalRatings[0].avgRating.toFixed(1) : "0.0";
        */
        res.render("orgpage", { 
            org, 
            reviews, 
            //avgRating, 
            totalReviews, 
            //totalPages, 
            //currentPage 
        });
    } catch (err) {
        console.error("Error fetching organization data:", err);
        res.status(500).send("Error loading orgpage"); 
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
