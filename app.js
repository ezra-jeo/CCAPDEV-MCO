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

app.use((req, res, next) => {
    res.locals.loggedIn = req.session.user || null; // pass logged-in user to all views
    next();     
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
            res.render("userpage", { user, reviews, userPage: reviews[0].userPage, loggedIn: req.session.user || null });
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
        const user = await Review.findOne({ userPage }).lean();


        if (!user) {
            return res.status(404).send("User not found.");
        }

        res.render("useredit", { user, layout: false });
    } catch (error) {
        console.error("Error loading user edit page:", error);
        res.status(500).send("Error loading user edit page.");
    }
});

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

        let newAccount;

        if (accountType === "student") {
            if (!username || !password) {
                return res.status(400).json({ error: "Username and password are required for users." });
            }

            newAccount = new User({ 
                userName: username, 
                userDesc: description,
                userPage: username,
                profileImage: "/images/default-icon-user.png",
                userPassword: password
            });
        } 
        else if (accountType === "organization") {
            if (!username || !password) {
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
                orgPassword: password
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
                userPage: account.userPage,     
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
app.use('/useredit', userEditRoutes);

// Search and Filter
app.get("/orgs/searchfilter/org:org?/qry1:qry1?/qry2:qry2?", async (req, res) => {
    try {
        let filterStars = [];
        if (req.params.qry1) {
            for (let filter of req.params.qry1.split(",")) {
                if (filter >= "1" && filter <= "5") 
                    filterStars.push(Number(filter));
            }
        }    

        let filterCollege = [];
        if (req.params.qry2) {
            for (let filter of req.params.qry2.split(",")) {
                filterCollege.push(filter);
            }
        }  

        let query = {};
        if (req.params.org) {
            query["orgName"] = {$regex: new RegExp(req.params.org, "i")};
        }   
        if (filterStars.length > 0) {
            query["orgRating"] = {$in: filterStars};
        }
        if (filterCollege.length > 0) {
            query["orgCollege"] = {$in: filterCollege};
        }
        if (Object.keys(query).length == 0) {
             query = {};
        }
        
        const result = await Organization.find(query).lean();
        res.send({orgList: result});
        console.log("Org Sent Result " + result + " Query: " + query);

    }
    catch (err) {
        res.status(500).send("Error in Searching and Filter");
    }
});

app.get("/reviews/searchfilter/search:search?/qry1:qry1?/qry2:qry2?", async (req, res) => {
    try {
        let filterStars = [];
        if (req.params.qry1) {
            for (let filter of req.params.qry1.split(",")) {
                if (filter >= "1" && filter <= "5") 
                    filterStars.push(Number(filter));
            }
        }    

        let filterCollege = [];
        if (req.params.qry2) {
            for (let filter of req.params.qry2.split(",")) {
                filterCollege.push(filter);
            }
        }    

        let query = {};
        if (req.params.search) {
            query["$or"] = [{"reviewText": {$regex: new RegExp(req.params.search, "i")}}, {"org.orgName": {$regex: new RegExp(req.params.search, "i")}}];
        }   
        if (filterStars.length > 0) {
            query["reviewRating"] = {$in: filterStars};
        }
        if (filterCollege.length > 0) {
            query["orgCollege"] = {$in: filterCollege};
        }
        if (Object.keys(query).length == 0) {
             query = {};
        }

        const result = await Review.find(query).lean();
        res.send({reviewList: result});
        console.log("Review Sent Result " + result + " Query: " + query);
    }
    catch (err) {
        res.status(500).send("Error in Searching and Filter");
    }
});

// Sort orgs
app.get("/orgs/sort/org:org?/qry1:qry1?/qry2:qry2?/method:method/order:order", async (req, res) => {
    try {

        let filterStars = [];
        if (req.params.qry1) {
            for (let filter of req.params.qry1.split(",")) {
                if (filter >= "1" && filter <= "5") 
                    filterStars.push(Number(filter));
            }
        }    

        let filterCollege = [];
        if (req.params.qry2) {
            for (let filter of req.params.qry2.split(",")) {
                filterCollege.push(filter);
            }
        }    

        let query = {};
        if (req.params.org) {
            query["orgName"] = {$regex: new RegExp(req.params.org, "i")};
        }   
        if (filterStars.length > 0) {
            query["orgRating"] = {$in: filterStars};
        }
        if (filterCollege.length > 0) {
            query["orgCollege"] = {$in: filterCollege};
        }
        if (Object.keys(query).length == 0) {
             query = {};
        }
        
        let order = {};
        
        if (req.params.method && req.params.method == "name") {
            order = {"orgName": Number(req.params.order)};
        }
        else if (req.params.method && req.params.method == "rating") {
            order = {"orgRating": Number(req.params.order)};
        }

        const result = await Organization.find(query).sort(order).lean();
        res.send({orgList: result});
        console.log("Org Sent Result " + result + " Query: " + query);

    }
    catch (err) {
        res.status(500).send("Error in Sorting");
    }
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));

// // closing db connection
// const closeDatabase = () => {
//     mongoose.connection.close(() => {
//         console.log("MongoDB connection closed.");
//         process.exit(0);
//     });
// };

// process.on("SIGINT", closeDatabase);
// process.on("SIGTERM", closeDatabase);
// process.on("uncaughtException", (err) => {
//     console.error("Uncaught Exception:", err);
//     closeDatabase();
// });
