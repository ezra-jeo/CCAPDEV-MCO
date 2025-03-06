const express = require("express");
const mongoose = require("mongoose");
const exphbs = require("express-handlebars");
const path = require("path");
mongoose.connect("mongodb://localhost:27017/orgs");

const orgs = mongoose.connection.collection("organizations");
const app = express();

// handlebars
app.engine('hbs', exphbs.engine({
    extname: 'hbs',
    defaultLayout: 'main', 
    layoutsDir: path.join(__dirname, 'views', 'layouts'),
    helpers: {
        times: function(n, block) { 
            let result = "";
            for (let i = 0; i < n; i++) {
                result += block.fn(i);
            }
            return result;
        },
    }
}));    

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// initializing routes
const homepageRoutes = require('./routes/homepage');

const signupRoutes = require('./routes/signup');
const loginRoutes = require('./routes/login');

const searchOrgRoutes = require('./routes/searchorg');
const searchRevRoutes = require('./routes/searchreview');

const revPageRoutes = require('./routes/reviewpage');
const revEditRoutes = require('./routes/reviewedit');
const editOrgRoutes = require('./routes/editorg');
const orgPageRoutes = require('./routes/orgpage');

// using routes
app.use('/', homepageRoutes);
app.use('/signup', signupRoutes);
app.use('/login', loginRoutes);
app.use('/searchorg', searchOrgRoutes);
app.use('/searchreview', searchRevRoutes);
app.use('/reviewpage', revPageRoutes);
app.use('/reviewedit', revEditRoutes);
app.use('/editorg', editOrgRoutes);
app.use('/orgpage', orgPageRoutes);

// Search org
// app.get("/search/org=:org?", async (req, res) => {
//     try {
//         console.log(req.params.org);
//         if (req.params.org) {
//             const org = await orgs.find({orgName: {$regex: new RegExp(req.params.org, "i")}}).toArray();
//             console.log(org);
//             res.send({orgList: org});
            
//         }
//         else {
//             // res.status(400).send("Error in Search");
//             const def = await orgs.find().toArray();
//             console.log(def);
//             res.send({orgList: def});
//             console.log("No Search");

//         }
//     }
//     catch (err) {
//         res.status(500).send("Error in Searching for " + req.params.org);
//     }

// });

// // Filter
// app.get("/filter/query=:query?", async (req, res) => {
//         try {
//             console.log(req.params.query);
//             if (req.params.query) { // Filter
//                 let filterStars = [];
//                 for (let filter of req.params.query) {
//                     if (filter >= "1" && filter <= "5") 
//                         filterStars.push(Number(filter));
//                 }
             
//                 const org = await orgs.find({orgRating: {$in: filterStars}}).toArray();
//                 res.send({orgList: org});   
//             }
//             else {
//                 const def = await orgs.find().toArray();
//                 console.log(def);
//                 res.send({orgList: def});
//                 console.log("No filter");
//             }
//         }
//         catch (err) {
//             res.status(500).send("Error in Filtering for");
//         }

//     });

// Search and Filter
// app.get("/searchfilter/org=?query=?", (req, res) => {
//     res.send("Hello World this works!");
//     console.log("Test");
// });

app.get("/searchfilter/org=:org/query=:query?", async (req, res) => {
    try {

        let filterStars = [];
        if (req.params.query) {
            for (let filter of req.params.query) {
                if (filter >= "1" && filter <= "5") 
                    filterStars.push(Number(filter));
            }
        }    

        let query = {};
        if (filterStars.length > 0) {
            query["orgRating"] = {$in: filterStars};
        }
        if (req.params.org) {
            query["orgName"] = {$regex: new RegExp(req.params.org, "i")};
        }   
        console.log(query);
        const result = await orgs.find(query).toArray();
        console.log(result);
        res.send({orgList: result});
        // if (!(req.params.org || req.params.query)) {
        //     console.log(Object.keys(query).length);
        //     const result = await orgs.find().toArray();
        //     console.log(result);
        //     res.send({orgList: result});
        // }
        //else {
            
            
        //}

        // else {
        //     console.log(query);
        //     const result = await orgs.find().toArray();
        //     res.send({orgList: result});
        //     console.log(result)
        // }

        // if (filterStars && req.params.org) {
        //     const result = await orgs.find({$and: [{orgName: {$regex: new RegExp(req.params.org, "i")}}, {orgRating: {$in: filterStars}}]}).toArray();
        //     res.send({orgList: result});
        //     console.log(result)
        // }   
        // else if (req.params.org) {
        //     const result = await orgs.find({orgName: {$regex: new RegExp(req.params.org, "i")}}).toArray();
        //     res.send({orgList: result});
        //     console.log(result)
        // }
        // else if (filterStars) {
        //     const result = await orgs.find({orgRating: {$in: filterStars}}).toArray();
        //     res.send({orgList: result});
        //     console.log(result)
        // }
        // else {
        //     const result = await orgs.find().toArray();
        //     res.send({orgList: result});
        //     console.log(result);
        // }
    }
    catch (err) {
        res.status(500).send("Error in Searching and Filter");

    }

});
app.listen(3000, () => console.log('Server running on http://localhost:3000'));
