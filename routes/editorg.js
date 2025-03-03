const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('editorg', { title: 'Edit Org' });
});

module.exports = router;