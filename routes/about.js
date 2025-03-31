const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('about', { 
        title: 'About Us', 
        layout: 'main',
        loggedIn: req.session.user
     });
});

module.exports = router;
