const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('searchorg', { title: 'Search Organizations', layout: 'main' });
});

module.exports = router;