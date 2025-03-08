const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('reviewpage', { 
        title: 'Write a Review',
        loggedIn: req.session.user 
    });
});

module.exports = router;