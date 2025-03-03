const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
    userName: { type: String, required: true },
    profileImage: { type: String, default: "/images/default-profile.png" },
    timePosted: { type: Date, default: Date.now },
    ratings: { type: Number, required: true, min: 1, max: 5 },
    orgPage: { type: String, required: true },
    orgName: { type: String, required: true },
    shortReview: { type: String, required: true },
    fullReview: { type: String, required: true },
    reviewImage: { type: String },
    responseOrg: { type: String },
    responseMessage: { type: String },
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 }
});

const Review = mongoose.model("Review", reviewSchema);
module.exports = Review;
