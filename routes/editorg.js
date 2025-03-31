const express = require("express");
const Organization = require("../models/organizations");

const router = express.Router();

// GET route to retrieve the editorg page
router.get("/:orgPage", async (req, res) => {
    try {
        const {orgPage} = req.params;
        const org = await Organization.findOne({orgPage: new RegExp("^" + orgPage + "$", "i")}); // Find org in db

        if (!org) {
            return res.status(404).send("Organization not found");
        }

        res.render("editorg", { 
            org: org.toObject(),
            loggedIn: req.session.user,
        });
    } catch (error) {
        console.error("Error fetching organization:", error);
        res.status(500).send("Internal Server Error");
    }
});

// POST route to update org profile
router.post("/:orgPage", async (req, res) => {
    try {
        const {orgPage} = req.params;
        const {orgDesc, orgPic} = req.body; 

        // Validate required fields
        if (!orgDesc || !orgPic) {
            return res.status(400).json({ error: "Both description and image URL are required." });
        }

        // Find the org
        const org = await Organization.findOne({orgPage});
        if (!org) {
            return res.status(404).json({error: "Organization not found."});
        }

        // Update org profile in the db
        const updatedOrg = await Organization.findOneAndUpdate(
            {orgPage},
            {orgDesc, orgPic},
            {new: true}
        );

        //Update session data
        req.session.user.orgPic = updatedOrg.orgPic;

        res.json({success: true, message: "Organization profile updated successfully!", orgPage: updatedOrg.orgPage});
    } catch (error) {
        console.error("Error updating organization:", error);
        res.status(500).json({error: "Server error."});
    }
});

module.exports = router;
