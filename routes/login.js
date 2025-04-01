const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('login', { 
        title: 'Log In', 
        layout: 'clear',
        loggedIn: req.session.user
    });
});

// Login route
router.post("/login", async (req, res) => {
    try {
        const { username, password, remember } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: "Username and password are required." });
        }

        let account;
        let accountType = "student";
        account = await User.findOne({ userName: username }).lean();

        if (!account) {
            account = await Organization.findOne({ orgName: username }).lean();
            accountType = "organization";
        }

        if (!account) {
            return res.status(404).json({ error: "Account not found." });
        }

        const storedPassword = account.userPassword || account.orgPassword;

        let isPasswordValid = storedPassword.startsWith("$2b$")
            ? await bcrypt.compare(password, storedPassword)
            : password === storedPassword;

        if (!isPasswordValid) {
            return res.status(401).json({ error: "Invalid credentials." });
        }

        if (storedPassword && !storedPassword.startsWith("$2b$")) {
            const hashedPassword = await bcrypt.hash(password, 10);
            if (accountType === "student") {
                await User.updateOne({ userName: username }, { userPassword: hashedPassword });
            } else {
                await Organization.updateOne({ orgName: username }, { orgPassword: hashedPassword });
            }
            console.log(`🔄 Password upgraded to bcrypt for ${username}`);
        }

        req.session.cookie.maxAge = remember ? 30 * 24 * 60 * 60 * 1000 : false;
        req.session.user = accountType === "student"
            ? {
                userName: account.userName,
                userPage: account.userPage,
                accountType,
                userDesc: account.userDesc,
                profileImage: account.profileImage,
            }
            : {
                orgName: account.orgName,
                orgPage: account.orgPage,
                accountType,
                orgDesc: account.orgDesc,
                orgPic: account.orgPic,
                orgRating: account.orgRating || 0,
                orgReviews: account.orgReviews || 0,
                orgCollege: account.orgCollege || "Others",
            };

        console.log(`✅ ${accountType} logged in:`, req.session.user);
        res.json({ message: `Welcome back, ${username}!`, accountType });

    } catch (error) {
        console.error("❌ Error during login:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Logout route
router.get("/logout", (req, res) => {
    console.log("Logging out user:", req.session.user);
    req.session.destroy((err) => {
        if (err) {
            console.error("Logout error:", err);
            return res.status(500).json({ error: "Error logging out." });
        }
        res.clearCookie("connect.sid");
        res.redirect("/");
    });
});

module.exports = router;