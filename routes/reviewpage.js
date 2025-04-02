const express = require("express");
const Organization = require("../models/organizations");
const Review = require("../models/reviews");

const router = express.Router();

// GET route to render review page for a specific org
router.get("/:orgPage", async (req, res) => {
    try {
        const {orgPage} = req.params;

        const org = await Organization.findOne({orgPage: new RegExp("^" + orgPage + "$", "i")});

        if (!org) {
            return res.status(404).send("Organization not found.");
        }

        res.render("reviewpage", { 
            orgName: org.orgName, 
            orgPage: org.orgPage, 
            loggedIn: req.session.user
         });
    } catch (error) {
        console.error("Error loading review page:", error);
        res.status(500).send("Internal Server Error");
    }
});

router.get("/", async (req, res) => {
    try {
        // Fetch list of organizations to populate the dropdown
        const organizations = await Organization.find({}, "orgName orgPage");
        
        res.render("reviewpage", { 
            organizations, 
            loggedIn: req.session.user || null 
        });
    } catch (error) {
        console.error("Error loading review page:", error);
        res.status(500).send("Internal Server Error");
    }
});

// POST route to submit a review
router.post("/submit-review", async (req, res) => {
    try {
        const { reviewRating, reviewText, orgName, orgPage, reviewImage} = req.body;
        const {userName, userPage, profileImage} = req.session.user;
        
        if (!reviewRating || !reviewText.trim() || !orgName || !orgPage) {
            return res.status(400).json({error: "All required fields must be provided."});
        }

        // Create review data object
        let reviewData = {
            userName,
            userPage,
            profileImage,
            reviewRating : Number(reviewRating),
            reviewText,
            orgName,
            orgPage,
            reviewImage,
            timePosted: new Date(),
        };

        // Save new review
        const newReview = new Review(reviewData);
        await newReview.save();

        // Fetch all reviews for the organization to recalculate rating
        const reviews = await Review.find({orgName});
        const totalReviews = reviews.length;

        let newAvgRating = 0;
        if (totalReviews > 0) {
            const totalRating = reviews.reduce((sum, review) => sum + review.reviewRating, 0);
            newAvgRating = totalRating / totalReviews;
        }

        // Update organization details with new average rating
        const org = await Organization.findOneAndUpdate(
            {orgName},
            {orgRating: newAvgRating, orgReviews: totalReviews},
            {new: true} 
        );

        res.json({ message: "Review submitted successfully!", orgPage: org.orgPage});
    } catch (error) {
        console.error("Error submitting review:", error);
        res.status(500).json({error: "Server Error"});
    }
});

module.exports = router;
