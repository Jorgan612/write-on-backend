const UsersList = require('../mockData.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const verifyToken =  require('../middleware/auth.js');
const { sendConfirmationEmail, sendPasswordResetEmail } = require('../utils/mailer.js');

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const user = UsersList.find((user) => {
        return user.email.toLowerCase().trim() === email.toLowerCase().trim();
    })

    if (!user) {
        return res.status(400). json({message: 'User not found'});
    }

    if (!user.isVerified) {
        return res.status(403).json({ message: 'Please verify your email address before logging in.' });
    }

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
        const verificationToken = crypto.randomBytes(32).toString('hex');

        const newUser = {
            id: Date.now(),
            isVerified: false,
            email,
            username,
            password: hashedPassword,
            pronouns,
            bio,
            website,
            socials,
            goals,
            entries: [],
            joined: new Date(),
            verificationToken: verificationToken
        };

        UsersList.push(newUser);

        await sendConfirmationEmail(newUser.email, newUser.username, verificationToken);

        res.status(201).json({ message: 'Registration successful! Please check your email to verify your account before logging in.' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error during registration.' });
    }
});

router.get('/verify/:token', (req, res) => {
    const { token } = req.params;

    const user = UsersList.find((user) => {
        return user.verificationToken === token;
    })

    if (!user) {
        return res.status(400).send('<h1>Invalid or expired verificaiton token.</h1>');
    }

    user.isVerified = true;
    user.verificationToken = undefined;

    res.send('<h1>Email Verified successfully!</h1><p>You can now close this tab and log into Write On App.</p>')
});

router.get('/', verifyToken, (req, res) => {
    if (!UsersList) {
        return res.status(404).json({error: "No users found."});
    }

    res.json(UsersList);
});

router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    const user = UsersList.find((user) => {
        return user.email.toLowerCase().trim() === email.toLowerCase().trim();
    });

    if (!user) {
        return res.json({ message: 'If that email exists in our system, a reset link has been sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000;

    await sendPasswordResetEmail(user.email, resetToken);

    res.json({ message: 'If that email exists in our system, a reset link has been sent.' });
});

router.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;

    const user = UsersList.find((user) => {
        return user.resetPasswordToken === token && user.resetPasswordExpires > Date.now();
    });

    if (!user) {
        return res.status(400).json({ message: 'Password reset token is invalid or has expired.' });
    }

    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    res.json({ message: 'Your password has been successfully updated! You can now log in.' });
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