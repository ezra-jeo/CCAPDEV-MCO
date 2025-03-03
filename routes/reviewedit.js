const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('reviewedit', { title: 'Edit Review' });
});

module.exports = router;