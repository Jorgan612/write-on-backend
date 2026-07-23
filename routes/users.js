const { UsersList, Groups } = require('../mockData.js');
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
        const { email, password, username, pronouns, bio, website, socials, goals, joinGroupId } = req.body;
        const formattedEmail = email.toLowerCase().trim();
        const existingUser = await UsersList.find(user => user.email.toLowerCase() === formattedEmail);

        if (existingUser) {
            return res.status(400).json({ message: 'An account with this email already exists.'});
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const verificationToken = crypto.randomBytes(32).toString('hex');

        const newUser = {
            id: Date.now(),
            isVerified: false,
            email: formattedEmail,
            username,
            password: hashedPassword,
            pronouns,
            bio,
            website,
            socials,
            goals,
            entries: [],
            joined: new Date(),
            groups: [],
            verificationToken: verificationToken
        };

        if (joinGroupId) {
            const group = Groups.find((group) => {
                return group.groupId === joinGroupId.toString();
            })

            if (group) {
                const isInvited = group.invites.some(invite => invite.toLowerCase() === formattedEmail);

                if (isInvited) { 
                    group.invites = group.invites.filter((invite) => {
                        return invite.toLowerCase() !== formattedEmail;
                    })

                    if (!group.members.includes(newUser.id)) {
                        group.members.push(newUser.id);
                    }

                    newUser.isVerified = true;
                    newUser.groups.push(group.groupId);
                }
            } else {
                console.warn(`Signup invite warning: Group ID ${joinGroupId} was not found.`);
            }
        }

        UsersList.push(newUser);

        if (joinedGroupId && newUser.groups.includes(joinGroupId.toString())) {
            const sessionToken = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET, { expiresIn: '30D'});
            const { password: _, ...userWithoutPw } = newUser;

            return res.status(201).json({
                message: 'Welcome to Write On!',
                token: sessionToken,
                user: userWithoutPw
            });
        }

        if (!newUser.isVerified) {
            await sendConfirmationEmail(newUser.email, newUser.username, verificationToken);
        }

        if (joinGroupId && newUser.groups.includes(joinGroupId.toString())) {
            return res.status(201).json({ message: 'Registration successful! You have successfully joined your group. Please check your email to verify your account.'})
        }

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

router.get('/:groupId', verifyToken, (req, res) => {
    const { groupId } = req.params;
    const authenticatedUserID = req.user.id;

    const group = Groups.find((group) => {
        return group.groupId === groupId;
    })

    if (!group) {
        return res.status(404).json({ message: "Group not found."});
    }

    const isMember = group.members.includes(Number(authenticatedUserID)) || Number(group.ownerId) === Number(authenticatedUserID);

    if (!isMember) {
        return res.status(403).json({ message: "Unauthorized."});
    }

    const groupMembers = UsersList.filter((user) => {
        return user.groups.includes(groupId);
    });

    const secureMembers = groupMembers.map(({password, verificationToken, resetPasswordToken, ...secureMember}) => {
        return secureMember;
    });

    res.json(secureMembers);
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

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    res.json({ message: 'Your password has been successfully updated! You can now log in.' });
});

router.route('/:id')
.get(verifyToken, (req, res) => {
    const user = UsersList.find((user)=> {
        return user.id === Number(req.params.id);
    })

    if (!user) {
        return res.status(404).json({ message: "User not found."});
    }

    const { password, ...secureUser } = user;
    res.json(secureUser);
})
.put(verifyToken, (req, res) => {
    if (Number(req.params.id) !== Number(req.user.id)) {
        return res.status(403).json({ message: "Unauthorized: You cannot modify this profile."});
    }

    res.send(`Updated User profile for ID ${req.user.id}`);
})
.delete((req, res) => {
    if (Number(req.params.id) !== Number(req.user.id)) {
        return res.status(403).json({ message: "Unauthorized: You cannot delete this account."});
    }
    res.send(`Deleted User profile for ID ${req.params.id}`);
});

 module.exports = router;