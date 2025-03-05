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
app.get("/search/org=:org", async (req, res) => {
        try {
            if (req.params.org) {
                const org = await orgs.find({orgName: (req.params.org).toUpperCase()}).toArray();
                console.log(org);
                res.send({orgList: org});
            }
            else {
                res.status(400).send("No search entered");
            }
        }
        catch (err) {
            res.status(500).send("Error in Searching for " + req.params.org);
        }

    });

// Filter
app.get("/filter/query=:query?", async (req, res) => {
        try {
            if (req.params.query) {
                if (req.params.query >= "1" && req.params.query <= "5") {
                    const org = await orgs.find({orgRating: Number(req.params.query)}).toArray();
                    res.send({orgList: org});
                }
            }
            else {
                res.status(400).send("No filter entered");
            }
        }
        catch (err) {
            res.status(500).send("Error in Filtering for");
        }

    });
app.listen(3000, () => console.log('Server running on http://localhost:3000'));
