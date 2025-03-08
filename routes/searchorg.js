const express = require('express');
const router = express.Router();

const Organization = require("../models/organizations.js");

router.get('/', async (req, res) => {
    try {
        res.render('searchorg', { 
            title: 'Search Organizations', 
            layout: 'main',
            orgList: await Organization.find().lean(),
            loggedIn: req.session.user
        });
    }
    catch (err) {
        res.status(500).send("Error fetching organizations");
    }
});

module.exports = router;