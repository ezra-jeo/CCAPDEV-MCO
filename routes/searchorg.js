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

router.get("/searchfilter/org:org?/qry1:qry1?/qry2:qry2?", async (req, res) => {
    try {
        let filterStars = [];
        if (req.params.qry1) {
            for (let filter of req.params.qry1.split(",")) {
                if (filter >= "1" && filter <= "5") 
                    filterStars.push(Number(filter));
            }
        }    

        let filterCollege = [];
        if (req.params.qry2) {
            for (let filter of req.params.qry2.split(",")) {
                filterCollege.push(filter);
            }
        }  

        let query = {};
        if (req.params.org) {
            query["orgName"] = {$regex: new RegExp(req.params.org, "i")};
        }   
        if (filterStars.length > 0) {
            query["orgRating"] = {$in: filterStars};
        }
        if (filterCollege.length > 0) {
            query["orgCollege"] = {$in: filterCollege};
        }
        if (Object.keys(query).length == 0) {
             query = {};
        }
        
        const result = await Organization.find(query).lean();
        res.send({orgList: result});
        console.log(`Query: ${query}`);
    }
    catch (err) {
        res.status(500).send("Error in Searching and Filter");
    }
});

router.get("/sort/org:org?/qry1:qry1?/qry2:qry2?/method:method/order:order", async (req, res) => {
    try {

        let filterStars = [];
        if (req.params.qry1) {
            for (let filter of req.params.qry1.split(",")) {
                if (filter >= "1" && filter <= "5") 
                    filterStars.push(Number(filter));
            }
        }    

        let filterCollege = [];
        if (req.params.qry2) {
            for (let filter of req.params.qry2.split(",")) {
                filterCollege.push(filter);
            }
        }    

        let query = {};
        if (req.params.org) {
            query["orgName"] = {$regex: new RegExp(req.params.org, "i")};
        }   
        if (filterStars.length > 0) {
            query["orgRating"] = {$in: filterStars};
        }
        if (filterCollege.length > 0) {
            query["orgCollege"] = {$in: filterCollege};
        }
        if (Object.keys(query).length == 0) {
             query = {};
        }
        
        let order = {};
        
        if (req.params.method && req.params.method == "name") {
            order = {"orgName": Number(req.params.order)};
        }
        else if (req.params.method && req.params.method == "rating") {
            order = {"orgRating": Number(req.params.order)};
        }

        const result = await Organization.find(query).sort(order).lean();
        res.send({orgList: result});
        console.log(`Query: ${query}`);

    }
    catch (err) {
        res.status(500).send("Error in Sorting");
    }
});

module.exports = router;