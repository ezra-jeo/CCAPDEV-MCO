const express = require("express");
const Organization = require("../models/organizations");

const router = express.Router();

// GET route to retrieve the editorg page
router.get("/:orgPage", async (req, res) => {
    try {
        const { orgPage } = req.params;
        const org = await Organization.findOne({ orgPage }); // Find organization in db

        if (!org) {
            console.log(`Organization "${orgPage}" not found!`);
            return res.status(404).send("Organization not found");
        }
        res.render("editorg", { org: org.toObject() });
    } catch (error) {
        console.error("Error fetching organization:", error);
        res.status(500).send("Internal Server Error");
    }
});

// POST route to update organization profile
router.post("/:orgPage", async (req, res) => {
    try {
        const { orgPage } = req.params; 
        const { description } = req.body; // Get description from form data

        // Update only the description field
        const updatedOrg = await Organization.findOneAndUpdate(
            { orgPage }, // Find by orgPage
            { $set: { orgDesc: description } }, // Update orgDesc
            { new: true } // Return the updated details
        );

        if (!updatedOrg) {
            return res.status(404).json({ error: "Organization not found." }); 
        }

        // Send a response with success message and orgPage for redirection
        res.json({ message: "Organization updated successfully!", orgPage: updatedOrg.orgPage });
    } catch (error) {
        console.error("Error updating organization:", error);
        res.status(500).json({ error: "Internal server error." });
    }
});

module.exports = router;
