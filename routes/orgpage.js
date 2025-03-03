const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('orgpage', { title: 'Org Page' });
});

module.exports = router;