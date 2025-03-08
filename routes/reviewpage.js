const express = require("express");
const router = express.Router();
const Organization = require("../models/organizations");

// GET route to render review page for a specific org
router.get("/:orgPage", async (req, res) => {
    try {
        const { orgPage } = req.params;

        const org = await Organization.findOne({ orgPage });

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

module.exports = router;
