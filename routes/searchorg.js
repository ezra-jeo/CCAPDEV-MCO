const express = require('express');
const mongoose = require("mongoose");
const router = express.Router();

mongoose.connect("mongodb://localhost:27017/orgs");

const orgs = mongoose.connection.collection("organizations");

router.get('/', async (req, res) => {
    try {
        res.render('searchorg', { 
            title: 'Search Organizations', 
            layout: 'main',
            orgList: await orgs.find().toArray()
        });
    }
    catch (err) {
        res.status(500).send("Error fetching organizations");
    }
});

module.exports = router;