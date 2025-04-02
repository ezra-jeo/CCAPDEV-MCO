const express = require('express');
const router = express.Router();
const User = require("../models/users");
const Review = require("../models/reviews");


router.get('/', (req, res) => {
    res.render('useredit', { 
        title: 'Edit User', 
        layout: 'clear',
        loggedIn: req.session.user
    });
});

// user edit page
router.get("/:userPage", async (req, res) => {
    try {
        const userPage = req.params.userPage;
        
        // Find the user based on userPage
        const user = await User.findOne({ userPage: userPage }).lean();


        if (!user) {
            return res.status(404).send("User not found.");
        }

        res.render("useredit", { user, layout: clear });
    } catch (error) {
        console.error("Error loading user edit page:", error);
        res.status(500).send("Error loading user edit page.");
    }
});


module.exports = router;
