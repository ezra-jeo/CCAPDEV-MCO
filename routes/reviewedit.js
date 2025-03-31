const express = require("express");
const Review = require("../models/reviews");
const Organization = require("../models/organizations");

const router = express.Router();

// GET route to render edit review page
router.get("/:id", async (req, res) => {
    try {
        const {id} = req.params;
        const review = await Review.findById(id).lean();

        if (!review) {
            return res.status(404).send("Review not found.");
        }

        res.render("reviewedit", { 
            review, 
            loggedIn: req.session.user || null 
        });
    } catch (error) {
        console.error("Error loading edit review page:", error);
        res.status(500).send("Internal Server Error");
    }
});

// POST route to update review
router.post("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        let {reviewRating, reviewText} = req.body;

        // Convert reviewRating to a number
        reviewRating = Number(reviewRating);

        // Fetch the existing review 
        const existingReview = await Review.findById(id);
        if (!existingReview) {
            return res.status(404).json({error: "Review not found."});
        }

        // Check if changes are made
        if (existingReview.reviewRating === reviewRating && existingReview.reviewText === reviewText) {
            return res.status(400).json({error: "No changes detected. Please modify your review before submitting."});
        }

        // Mark as edited and update the review
        existingReview.reviewRating = reviewRating;
        existingReview.reviewText = reviewText;
        existingReview.edited = true;
        await existingReview.save();

        // Update Organization's Average Rating
        const orgName = existingReview.orgName;
        const reviews = await Review.find({orgName});

        if (reviews.length > 0) {
            const totalRating = reviews.reduce((sum, review) => sum + review.reviewRating, 0);
            const newAvgRating = totalRating / reviews.length;

            await Organization.findOneAndUpdate(
                {orgName},
                {orgRating: newAvgRating}
            );
        }

        res.json({message: "Review updated successfully!", orgPage: existingReview.orgPage});
    } catch (error) {
        console.error("Error updating review:", error);
        res.status(500).json({error: "Internal Server Error"});
    }
});

module.exports = router;
