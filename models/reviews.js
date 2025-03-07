const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    userName: { type: String, required: true, default: "Anonymous" }, 
    userPage: { type: String },
    profileImage: { type: String, default: "/images/default-icon-user.png" },
    timePosted: { type: Date, default: Date.now },
    reviewRating: { type: Number, required: true, min: 1, max: 5 },
    orgName: { type: String, required: true, default: "Unknown Organization" },
    orgPage: { type: String },
    reviewText: { type: String, required: true, default: "No review provided." },
    reviewImage: { type: String },
    responseMessage: { type: String, default: "" },
    likesCount: { type: Number, default: 0 },
    dislikesCount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);
