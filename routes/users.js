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
    
    const compatibleHash = user.password.replace(/^\$2b\$/, '$2a$');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(400).json({message: 'Invalid credentials'});
    }

    const token = jwt.sign(
        {id: user.id},
        process.env.JWT_SECRET,
        {expiresIn: '30d'}
    );

    const { password: _, ...userWithoutPassword } = user;
    res.json({
        token,
        user: userWithoutPassword
    });
});

router.post('/signup', async (req, res) => {
    try {
        const { email, password, username, pronouns, bio, website, socials, goals } = req.body;

        const existingUser = await UsersList.find(user => user.email.toLowerCase() === email.toLowerCase());
        if (existingUser) {
            return res.status(400).json({ message: 'An account with this email already exists.'});
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = {
            id: Date.now(),
            email,
            username,
            password: hashedPassword,
            pronouns,
            bio,
            website,
            socials,
            goals,
            entries: [],
            joined: new Date()
        };

        UsersList.push(newUser);

        const token = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET, {expiresIn: '30d' });

        res.status(201).json({
            token, 
            user: {
                id: newUser.id,
                email: newUser.email,
                username: newUser.username,
                goals: newUser.goals,
                socials: newUser.socials,
                entries: newUser.entries
            }
        });

    } catch (err) {
        res.status(500).json({ message: 'Server error during registration.' });
    }
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