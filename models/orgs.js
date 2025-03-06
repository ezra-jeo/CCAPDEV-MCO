const mongoose = require('mongoose');

const orgSchema = new mongoose.Schema({
    orgName: { type: String, required: true, unique: true },
    orgPic: { type: String, default: "/images/icon.png" },
    orgDesc: { type: String },
    orgPage: { type: String },
    orgRating: { type: Number, default: 0 },
    orgReviews: [{ type: Number }],
    orgCollege: { type: String },
    orgPassword: { type: String, required: true } 
}, { timestamps: true });

module.exports = mongoose.model('Organization', orgSchema);
