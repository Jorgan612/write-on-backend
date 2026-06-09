const express = require('express');
const router = express.Router();


let groups = [];

router.post('', (req, require, res) => {
    const { name, dates, invites } = req.body;

    if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'Group name is required.' });
    }

    const newGroup = {
        id: Date.now().toString(),
        name: name.trim(),
        dates: dates || [],
        invites: invites || []
    };

    groups.push(newGroup);

    res.status(201).json(newGroup);
})