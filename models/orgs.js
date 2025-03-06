const mongoose = require("mongoose");

// let orgsSchema = new mongoose.Schema({
//     orgName: {type: String, required: true},
//     orgPic: {type: String},
//     reviewPlural: Boolean,
//     orgRating: {type: Number, required: true, min: 1, max: 5 },
//     orgReviews: {type: Number, required: true, min: 0},
//     reviewDesc: {type: String},
//     orgCollege: {type: String, required: true}
// });
const orgSchema = new mongoose.Schema({
    orgName: { type: String, required: true, unique: true },
    orgPic: { type: String, default: "/images/icon.png" },
    orgRating: { type: Number, default: 0 },
    orgReviews: [{ type: Number }],
    orgDesc: {type: String},
    orgCollege: { type: String },
    orgPassword: { type: String, required: true } 
}, { timestamps: true });

let Orgs = mongoose.model("Organization", orgSchema);
module.exports = Orgs;

/*
const mongoose = require('mongoose');

const orgSchema = new mongoose.Schema({
    orgName: { type: String, required: true, unique: true },
    orgPic: { type: String, default: "/images/icon.png" },
    orgRating: { type: Number, default: 0 },
    orgReviews: [{ type: Number }],
    orgCollege: { type: String },
    orgPassword: { type: String, required: true } 
}, { timestamps: true });

module.exports = mongoose.model('Organization', orgSchema);

*/