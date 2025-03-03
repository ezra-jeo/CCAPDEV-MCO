const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('searchreview', { title: 'Search Reviews', layout: 'main' });
});

module.exports = router;