const express = require('express');
const router = express.Router();

const Review = require("../models/reviews.js");

router.get('/', async (req, res) => {
    try {
        res.render('searchreview', { 
            title: 'Search Reviews', 
            layout: 'main',
            reviewList: await Review.find().lean(),
            loggedIn: req.session.user
        });
    }
    catch (err) {
        res.status(500).send("Error fetching reviews");
    }
});

router.get("/searchfilter/search:search?/qry1:qry1?/qry2:qry2?", async (req, res) => {
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
        if (req.params.search) {
            query["$or"] = [{"reviewText": {$regex: new RegExp(req.params.search, "i")}}, {"org.orgName": {$regex: new RegExp(req.params.search, "i")}}];
        }   
        if (filterStars.length > 0) {
            query["reviewRating"] = {$in: filterStars};
        }
        if (filterCollege.length > 0) {
            query["orgCollege"] = {$in: filterCollege};
        }
        if (Object.keys(query).length == 0) {
             query = {};
        }

        const result = await Review.find(query).lean();
        res.send({reviewList: result});
        console.log(`Query: ${query}`);
    }
    catch (err) {
        res.status(500).send("Error in Searching and Filter");
    }
});
module.exports = router;