const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('signup', { title: 'Sign Up', layout: 'clear' });
});

module.exports = router;
