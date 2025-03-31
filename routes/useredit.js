const express = require('express');
const router = express.Router();

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
        const user = await User.findOne({ userPage }).lean();


        if (!user) {
            return res.status(404).send("User not found.");
        }

        res.render("useredit", { user, layout: false });
    } catch (error) {
        console.error("Error loading user edit page:", error);
        res.status(500).send("Error loading user edit page.");
    }
});

// user edit
router.post("/:userPage", async (req, res) => {
    try {
        const userPage = req.params.userPage;
        const findUser = await Review.findOne({ userPage: userPage }).lean();
        let userName = findUser.userName;
        const user = await User.findOne({ userName: userName }).lean();

        const { description, "profileImage": profileImage } = req.body;

        if (description && description.trim() !== "") {
            await User.updateOne({ userName: userName }, { $set: { userDesc: description } });
        }

        if (profileImage && profileUrl.trim() !== "") {
            await User.updateOne({ profileImage: profileImage }, { $set: { profileImage: profileImage } });
        }
    
        res.redirect(`/userpage/${userPage}`);

    } catch (error) {
        console.error("Error loading user edit page:", error);
        res.status(500).send("Error loading user edit page.");
    }
});


module.exports = router;
