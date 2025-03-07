const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('useredit', { title: 'Edit User', layout: 'clear' });
});

module.exports = router;
