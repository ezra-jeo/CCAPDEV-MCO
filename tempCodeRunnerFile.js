const express = require('express');
const exphbs = require('express-handlebars');
const path = require('path');

const app = express();

// handlebars
app.engine('hbs', exphbs.engine({
    extname: 'hbs',
    defaultLayout: 'main', 
    layoutsDir: path.join(__dirname, 'views', 'layouts')
}));    

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

// initializing routes
const homepageRoutes = require('./routes/homepage');
const signupRoutes = require('./routes/signup');

// using routes
app.use('/', homepageRoutes);
app.use('/', signupRoutes);

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
