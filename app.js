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

// using routes
app.use('/', homepageRoutes);
app.use('/signup', signupRoutes);
app.use('/login', loginRoutes);

app.use('/searchorg', searchOrgRoutes);
app.use('/searchreview', searchRevRoutes);

app.use('/reviewpage', revPageRoutes);
app.use('/reviewedit', revEditRoutes);
app.use('/editorg', editOrgRoutes);
app.use('/orgpage', orgPageRoutes);

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
