const express = require('express');
const router = express.Router();

const bcrypt = require("bcrypt");

const Organization = require("../models/organizations");
const User = require("../models/users");


router.get('/', (req, res) => {
    res.render('signup', { 
        title: 'Sign Up', 
        layout: 'clear',
        loggedIn: req.session.user
    });
});

// signing up
router.post("/", async (req, res) => {
    try {
        const { username, password, accountType, description } = req.body;

        if (!accountType) {
            return res.status(400).json({ error: "Account type is required." });
        }

        // check if username already exists for user or organization
        const existingUser = await User.findOne({ userName: username });
        const existingOrg = await Organization.findOne({ orgName: username });

        if (existingUser || existingOrg) {
            return res.status(400).json({ error: "Username is already taken." });
        }

        // hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        let newAccount;

        if (accountType === "student") {
            if (!username || !hashedPassword) {
                return res.status(400).json({ error: "Username and password are required for users." });
            }

            newAccount = new User({
                userName: username,
                userDesc: description,
                userPage: username,
                profileImage: "/images/default-icon-user.png",
                userPassword: hashedPassword
            });
        } else if (accountType === "organization") {
            if (!username || !hashedPassword) {
                return res.status(400).json({ error: "Organization name and password are required." });
            }

            newAccount = new Organization({
                orgName: username,
                orgPic: "/images/default-icon-org.png",
                orgDesc: description,
                orgPage: username,
                orgRating: 0,
                orgReviews: 0,
                orgCollege: "Others",
                orgPassword: hashedPassword
            });
        } else {
            return res.status(400).json({ error: "Invalid account type." });
        }

        // save the new account
        await newAccount.save();

        // save user session
        req.session.user = {
            id: newAccount._id,
            username: newAccount.userName || newAccount.orgName,
            accountType: accountType
        };

        // send a success response
        res.json({ message: `${accountType} created successfully!`, account: newAccount });
    } catch (error) {
        console.error("❌ Error creating account:", error);
        res.status(500).json({ error: "Account already exists." });
    }
});

module.exports = router;