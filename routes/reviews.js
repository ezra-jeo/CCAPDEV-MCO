const express = require("express");
const Review = require("../models/reviews");
const Organization = require("../models/organizations");

const router = express.Router();

router.post("/submit", async (req, res) => {
    try {
        const {userName, orgName, reviewRating, reviewText, reviewImage} = req.body;

        // Create and save the new review
        const newReview = new Review({
            userName,
            orgName,
            reviewRating,
            reviewText,
            reviewImage,
        });
        await newReview.save();

        // Update total review count for the organization
        const totalReviews = await Review.countDocuments({orgName});
        await Organization.findOneAndUpdate({orgName}, {orgReviews: totalReviews});

        res.redirect(`/review/${orgName}`);
    } catch (err) {
        console.error("Error submitting review:", err);
        res.status(500).send("Error saving review");
    }
});

module.exports = router;
