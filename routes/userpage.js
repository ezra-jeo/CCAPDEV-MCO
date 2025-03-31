const express = require('express');
const router = express.Router();

const User = require("../models/users.js");
const Organization = require("../models/organizations.js");
const Review = require("../models/reviews.js");

// for userpage filtering (search + ratings)
router.get("/userpage/:userPage", async (req, res) => {
    try {
        const userPage = req.params.userPage;
        
        // finding user
        let user = await User.findOne({ userPage: userPage }).lean();

        // fetch reviews based on the username (stored in reviews)
        const userName = user.userName;
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
            });
        }
    } catch (error) {
        console.error("Error loading user page:", error);
        res.status(500).send("Error loading user page");
    }
});

module.exports = router;