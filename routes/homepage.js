const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('homepage', { 
        title: 'Home Page',
        loggedIn: req.session.user 
    });
    
});

module.exports = router;