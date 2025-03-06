const express = require('express');
const mongoose = require("mongoose");
const router = express.Router();
const reviews = mongoose.connection.collection("reviews");

router.get('/', async (req, res) => {
    try {
        res.render('searchreview', { 
            title: 'Search Reviews', 
            layout: 'main',
            reviewList: await reviews.find().toArray()
        });
    }
    catch (err) {
        res.status(500).send("Error fetching reviews");
    }
});

module.exports = router;