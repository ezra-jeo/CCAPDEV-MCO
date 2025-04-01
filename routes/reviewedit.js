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
        const {id} = req.params;
        let {reviewRating, reviewText} = req.body;

        // Convert reviewRating to a number
        reviewRating = Number(reviewRating);

        // Fetch the existing review from the database
        const existingReview = await Review.findById(id);
        if (!existingReview) {
            return res.status(404).json({error: "Review not found."});
        }

        // Fetch the organization to get orgPage
        const organization = await Organization.findOne({orgName: existingReview.orgName});
        if (!organization) {
            return res.status(404).json({error: "Associated organization not found."});
        }

        // Mark as edited and update the review
        existingReview.reviewRating = reviewRating;
        existingReview.reviewText = reviewText;
        existingReview.edited = true;
        await existingReview.save();

        // Update orgs' Average Rating
        const reviews = await Review.find({orgName: existingReview.orgName});

        if (reviews.length > 0) {
            const totalRating = reviews.reduce((sum, review) => sum + review.reviewRating, 0);
            const newAvgRating = totalRating / reviews.length;

            await Organization.findOneAndUpdate(
                {orgName: existingReview.orgName},
                {orgRating: newAvgRating}
            );
        }

        res.json({message: "Review updated successfully!", orgPage: organization.orgPage});

    } catch (error) {
        console.error("Error updating review:", error);
        res.status(500).json({error: "Internal Server Error"});
    }
});

module.exports = router;