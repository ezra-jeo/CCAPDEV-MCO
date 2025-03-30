const express = require("express");
const Review = require("../models/reviews");

const router = express.Router();

// POST route for replying to a review
router.post("/reply-to-review", async (req, res) => {
    try {
        const {reviewId, replyText} = req.body;

        if (!reviewId || !replyText) {
            return res.status(400).json({success: false, message: "Review ID or reply message is missing."});
        }

        const responseUser = req.session.user.orgName || req.session.user.userName;

        await Review.findByIdAndUpdate(reviewId, {
            responseMessage: replyText,
            responseUser: responseUser
        });

        res.json({success: true, message: "Reply added successfully!"});
    } catch (err) {
        console.error("Error replying to review:", err);
        res.status(500).json({success: false, message: "Server error"});
    }
});

module.exports = router;
