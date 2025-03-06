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

app.get("/searchfilter/org:org?/qry1:qry1?/qry2:qry2?", async (req, res) => {
    try {

        let filterStars = [];
        if (req.params.qry1) {
            for (let filter of req.params.qry1.split(",")) {
                if (filter >= "1" && filter <= "5") 
                    filterStars.push(Number(filter));
            }
        }    
        console.log(req.params.qry1);

        let filterCollege = [];
        if (req.params.qry2) {
            for (let filter of req.params.qry2.split(",")) {
                filterCollege.push(filter);
            }
        }    

        console.log("filterCollege" + filterCollege);
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
        
        console.log(query);
        const result = await orgs.find(query).toArray();
        console.log(result);
        res.send({orgList: result});
    }
    catch (err) {
        res.status(500).send("Error in Searching and Filter");

    }

});
app.listen(3000, () => console.log('Server running on http://localhost:3000'));
