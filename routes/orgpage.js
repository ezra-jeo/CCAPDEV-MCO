const express = require("express");
const Organization = require("../models/organizations");
const Review = require("../models/reviews");

const router = express.Router();

// GET route to fetch an organization's profile and its reviews
router.get("/:orgName", async (req, res) => {
    try {
        const orgName = req.params.orgName; // Get organization name from URL
        const page = parseInt(req.query.page, 10) || 1;
        const limit = 6; // Number of reviews per page
        const skip = (page - 1) * limit; // Calculate how many reviews to skip

        // Fetch organization details
        const org = await Organization.findOne({ orgName: new RegExp("^" + orgName + "$", "i") }).lean();
        if (!org) {
            return res.status(404).send("Organization not found");
        }

        // Fetch and sort reviews by newest first
        const reviews = await Review.find({ orgName: new RegExp("^" + orgName + "$", "i") })
            .sort({ timePosted: -1 }) // Sort by newest first
            .skip(skip) // Skip reviews based on the current page
            .limit(limit)
            .lean(); 

        // Get the total number of reviews for this organization
        const totalReviews = await Review.countDocuments({ orgName: new RegExp("^" + orgName + "$", "i") });

        // Calculate the total number of pages
        const totalPages = totalReviews > 0 ? Math.ceil(totalReviews / limit) : 1;
        const currentPage = Math.min(Math.max(page, 1), totalPages);

        // Calculate the average rating for the organization
        const totalRatings = await Review.aggregate([
            { $match: { orgName: new RegExp("^" + orgName + "$", "i") } }, // Match the organization's reviews
            { $group: { _id: null, avgRating: { $avg: "$ratings" } } } // Compute the average rating
        ]);

        // get the average rating, default to "0.0" if there are no ratings
        const avgRating = totalRatings?.[0]?.avgRating ? totalRatings[0].avgRating.toFixed(1) : "0.0";

        res.render("orgpage", { 
            org, 
            reviews, 
            avgRating, 
            totalReviews, 
            totalPages, 
            currentPage,
        });
    } catch (err) {
        console.error("Error fetching organization data:", err);
        res.status(500).send("Error loading orgpage"); 
    }
});

module.exports = router;
