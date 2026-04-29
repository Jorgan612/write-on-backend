const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.send('GET USERS LIST');
});


router.get('/new', (req, res) => {
    res.send("NEW USER FORM");
});

 module.exports = router;