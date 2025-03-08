const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('userpage', { 
        title: 'User Page',
        loggedIn: req.session.user 
    });
});

module.exports = router;