const { UsersList, Groups } = require('../mockData.js');
const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
    const { name, meetings, invites, members, ownerID, groupId, creationDate } = req.body;

    if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'A group name is required.' });
    }

    const newGroup = {
        groupId: Date.now().toString(),
        name: name.trim(),
        ownerID: ownerID,
        creationDate: creationDate,
        meetings: meetings || [],
        invites: invites,
        members: members || [],
    };

    Groups.push(newGroup);

    const currentUser = UsersList.find((user) => {
        return user.id === ownerID;
    });

    if (currentUser)  {
        if (!currentUser.groups) {
            currentUser.groups = [];
        }

        currentUser.groups.push(newGroup.groupId);
    } else {
        console.warn(`Warning: Owner ID ${ownerID} not found in mock database.`);
    }

    res.status(201).json({ message: 'Group created successfully!' });
});

router.post('/:id/meetings', (req, res) => {
    const { id } = req.params;
    const { dateTime } = req.body;

    res.status(200).json({ message: 'Meeting(s) scheduled successfully.' });
});

module.exports = router;