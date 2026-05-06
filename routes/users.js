const UsersList = require('../mockData.js');
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    if (!UsersList) {
        return res.status(404).json({error: "No users found."});
    }

    res.json(UsersList);
});

router.get('/new', (req, res) => {
    res.send("NEW USER FORM");
}); 

router.post('/', (req, res) => {
    res.send('Create User');
});

router.route('/:id')
.get((req, res) => {
    res.send(`Get User with ID ${req.params.id}`);
})
.put((req, res) => {
    res.send(`Post new user with ID ${req.params.id}`);
})
.delete((req, res) => {
    res.send(`Delete User with ID ${req.params.id}`);
});

 module.exports = router;