const express = require("express");
const multer = require("multer");
const Organization = require("../models/orgs");

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(), 
    fileFilter: (req, file, cb) => {
        // Only allow image files
        if (file.mimetype.startsWith("image/")) {
            cb(null, true); // Accept the file
        } else {
            cb(new Error("Only image files are allowed!"), false);
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
});

// GET route to retrieve the editorg page
router.get("/:orgPage", async (req, res) => {
    try {
        const { orgPage } = req.params;
        const org = await Organization.findOne({ orgPage }); // Find organization in db

        if (!org) {
            console.log(`Organization "${orgPage}" not found!`);
            return res.status(404).send("Organization not found");
        }
        res.render("editorg", { org: org.toObject() }); // Convert Mongoose document to plain object & render page
    } catch (error) {
        console.error("Error fetching organization:", error);
        res.status(500).send("Internal Server Error");
    }
});

// POST route to update organization profile
router.post("/:orgPage", upload.single("logo"), async (req, res) => {
    try {
        const { orgPage } = req.params; // Extract organization page identifier from URL
        const { description } = req.body; // Get description from form data
        const logoFile = req.file; // Retrieve uploaded file (if any)

        // Fields to update
        const updateFields = { orgDesc: description };
        if (logoFile) {
            // Convert image file to Base64 format and store as a data URL
            updateFields.orgPic = `data:${logoFile.mimetype};base64,${logoFile.buffer.toString("base64")}`;
        }

        // Find the org
        const updatedOrg = await Organization.findOneAndUpdate(
            { orgPage }, // Find by orgPage
            { $set: updateFields }, // Update
            { new: true } // Return the updated details
        );

        if (!updatedOrg) {
            return res.status(404).json({ error: "Organization not found." }); 
        }

        // Send a message orgPage for redirection
        res.json({ message: "Organization updated successfully!", orgPage: updatedOrg.orgPage });
    } catch (error) {
        console.error("Error updating organization:", error);
        res.status(500).json({ error: "Internal server error." });
    }
});

module.exports = router; 
