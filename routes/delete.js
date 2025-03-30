const express = require("express");
const router = express.Router();
const Review = require("../models/reviews"); // Your review model
const Organization = require("../models/organizations"); // Your org model

// DELETE review
router.delete("/delete/:id", async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const reviewId = req.params.id;
        const userName = req.session.user.userName;

        // Find the review
        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({ message: "Review not found" });
        }

        // Check if logged-in user is the review owner
        if (review.userName !== userName) {
            return res.status(403).json({ message: "You can only delete your own reviews" });
        }

        // Delete the review
        await Review.findByIdAndDelete(reviewId);

        // Count reviews for the org after deletion and update orgReviews
        const totalReviews = await Review.countDocuments({ orgName: review.orgName });
        await Organization.findOneAndUpdate(
            { orgName: review.orgName },
            { orgReviews: totalReviews }
        );

        res.json({ success: true, message: "Review deleted successfully" });
    } catch (error) {
        console.error("Error deleting review:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = router;