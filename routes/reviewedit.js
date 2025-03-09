const express = require("express");
const router = express.Router();
const Review = require("../models/reviews");

// GET route to render edit review page
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
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

// POST route to update review (instead of PUT)
router.post("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { reviewRating, reviewText } = req.body;

        const updatedReview = await Review.findByIdAndUpdate(
            id,
            { reviewRating, reviewText },
            { new: true }
        );

        if (!updatedReview) {
            return res.status(404).json({ error: "Review not found." });
        }

        res.json({ message: "Review updated successfully!", orgPage: updatedReview.orgPage });
    } catch (error) {
        console.error("Error updating review:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
