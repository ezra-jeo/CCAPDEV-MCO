const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userName: { type: String, required: true, unique: true },
    userDesc: { type: String },
    userPage: { type: String },
    profileImage: { type: String, default: "/images/icon.png" },
    userPassword: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
