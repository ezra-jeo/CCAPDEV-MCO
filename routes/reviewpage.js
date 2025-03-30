const express = require("express");
const Organization = require("../models/organizations");
const Review = require("../models/reviews");

const router = express.Router();

// GET route to render review page for a specific org
router.get("/:orgPage", async (req, res) => {
    try {
        const {orgPage} = req.params;

        const org = await Organization.findOne({orgPage});

        if (!org) {
            return res.status(404).send("Organization not found.");
        }

        res.render("reviewpage", { 
            orgName: org.orgName, 
            orgPage: org.orgPage, 
            loggedIn: req.session.user
         });
    } catch (error) {
        console.error("Error loading review page:", error);
        res.status(500).send("Internal Server Error");
    }
});

router.get("/", async (req, res) => {
    try {
        // Fetch list of organizations to populate the dropdown
        const organizations = await Organization.find({}, "orgName orgPage");
        
        res.render("reviewpage", { 
            organizations, 
            loggedIn: req.session.user || null 
        });
    } catch (error) {
        console.error("Error loading review page:", error);
        res.status(500).send("Internal Server Error");
    }
});

router.post("/submit-review", async (req, res) => {
    try {
        const {userName, userPage, profileImage, reviewRating, reviewText, orgName, orgPage} = req.body;

        if (!reviewRating || !reviewText.trim() || !orgName || !orgPage) {
            return res.status(400).json({error: "All required fields must be provided."});
        }

        // Create new review
        const newReview = new Review({
            userName,
            userPage,
            profileImage,
            reviewRating,
            reviewText,
            orgName,
            orgPage,
            timePosted: new Date()
        });

        await newReview.save();

        // Count reviews for the org and update orgReviews
        const totalReviews = await Review.countDocuments({orgName});
        await Organization.findOneAndUpdate(
            { orgName },
            { orgReviews: totalReviews }
        );

        res.json({message: "Review submitted successfully!", orgPage});
    } catch (error) {
        console.error("Error submitting review:", error);
        res.status(500).json({ error: "Server Error" });
    }
});

module.exports = router;
