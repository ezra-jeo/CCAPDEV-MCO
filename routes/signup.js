const express = require('express');
const router = express.Router();

router.get('/', (req, res) => { // ✅ "/" instead of "/signup"
    res.render('signup', { title: 'Sign Up', layout: 'clear' });
});

module.exports = router;
