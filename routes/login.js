const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('login', { 
        title: 'Log In', 
        layout: 'clear',
        loggedIn: req.session.user
    });
});

module.exports = router;