const UsersList = require('../mockData.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const express = require('express');
const router = express.Router();
const verifyToken =  require('../middleware/auth.js');

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const user = UsersList.find((user) => {
        return user.email.toLowerCase().trim() === email.toLowerCase().trim();
    })

    if (!user) {
        return res.status(400). json({message: 'User not found'});
    }

    const isMatch = (password === user.password);
    // const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(400).json({message: 'Invalid credentials'});
    }

    const token = jwt.sign(
        {id: user.id},
        process.env.JWT_SECRET,
        {expiresIn: '1h'}
    );

    const { password: _, ...userWithoutPassword } = user;
    res.json({
        token,
        user: userWithoutPassword
    });
});

router.get('/', verifyToken, (req, res) => {
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