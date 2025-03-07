const express = require('express');
const router = express.Router();

const Review = require("../models/reviews.js");

router.get('/', async (req, res) => {
    try {
        res.render('searchreview', { 
            title: 'Search Reviews', 
            layout: 'main',
            reviewList: await Review.find().lean()
        });
    }
    catch (err) {
        res.status(500).send("Error fetching reviews");
    }
});

module.exports = router;