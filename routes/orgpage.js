const express = require("express");
const Organization = require("../models/organizations");
const Review = require("../models/reviews");

const router = express.Router();

// GET route to fetch an organization's profile and its reviews
router.get("/:orgName", async (req, res) => {
    try {
        const orgName = req.params.orgName; 
        const page = parseInt(req.query.page, 10) || 1;
        const limit = 6; 
        const skip = (page - 1) * limit;

        // Fetch organization details
        const org = await Organization.findOne({ orgName: new RegExp("^" + orgName + "$", "i") }).lean();
        if (!org) {
            return res.status(404).send("Organization not found");
        }

        // Fetch reviews
        const reviews = await Review.find({ orgName: new RegExp("^" + orgName + "$", "i") })
            .skip(skip)
            .limit(limit)
            .lean(); 

        // Count total reviews for this organization
        const totalReviews = await Review.countDocuments({ orgName: new RegExp("^" + orgName + "$", "i") });

        // Calculate average rating from reviews
        const totalRatings = await Review.aggregate([
            { $match: { orgName: new RegExp("^" + orgName + "$", "i") } }, 
            { $group: { _id: null, avgRating: { $avg: "$reviewRating" } } }
        ]);

        const avgRating = totalRatings.length > 0 ? totalRatings[0].avgRating.toFixed(1) : "0.0";

        // Update the organization's rating and review count in the db
        await Organization.findOneAndUpdate(
            { orgName: new RegExp("^" + orgName + "$", "i") },
            { orgRating: avgRating, orgReviews: [totalReviews] }
        );

        // Pagination logic
        const totalPages = totalReviews > 0 ? Math.ceil(totalReviews / limit) : 1;
        const currentPage = Math.min(Math.max(page, 1), totalPages);

        res.render("orgpage", { 
            org, 
            reviews, 
            avgRating, 
            totalReviews, 
            totalPages, 
            currentPage,
            loggedIn: req.session.user,
        });
    } catch (err) {
        console.error("Error fetching organization data:", err);
        res.status(500).send("Error loading orgpage"); 
    }
});

module.exports = router;
