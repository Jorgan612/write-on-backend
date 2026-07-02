const verifyToken = require('../middleware/auth.js');
const { UsersList, Groups, Excerpts } = require('../mockData.js');
const express = require('express');
const router = express.Router();

router.get('/group/:id', verifyToken, (req, res) => {
    const { id } = req.params;
    const authenticatedUserID = req.user.id;

    const group = Groups.find((group) => {
        return group.groupId === id;
    })

    if (!group) {
        return res.status(404).json({ message: 'Group not found.' });
    }

    const isMember = group.members.includes(Number(authenticatedUserID)) || Number(group.ownerID) === Number(authenticatedUserID);

    if (!isMember) {
        return res.status(403).json({ message: "Unauthorized: You do not have access to this group."});
    }

    return res.status(200).json(group);
});

router.post('/', verifyToken, (req, res) => { 
    const { name, meetings, invites, members, creationDate } = req.body;
    const  authenticatedUserID = req.user.id;

    if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'A group name is required.' });
    }

    const newGroup = {
        groupId: Date.now().toString(),
        name: name.trim(),
        ownerID: Number(authenticatedUserID),
        creationDate: creationDate,
        meetings: meetings || [],
        invites: invites,
        members: members || [Number(authenticatedUserID)],
    };

    Groups.push(newGroup);

    const currentUser = UsersList.find((user) => {
        return user.id === Number(authenticatedUserID);
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

router.get('/group/:groupId/excerpts', verifyToken, (req, res) => {
    const { groupId } = req.params;
    const authenticatedUserID = req.user.id;

    const group = Groups.find((group) => {
        return group.groupId === groupId;
    });

    if (!group) {
        return res.status(404).json({ message: "Group not found."});
    }

    const isMember = group.members.includes(Number(authenticatedUserId)) || Number(group.ownerID) === Number(authenticatedUserId);

    if (!isMember) {
        return res.status(403).json({ message: "Unauthorized: You do not belong to this group." });
    }

    const excerpts = Excerpts.filter((excerpt) => {
        return excerpt.groupId === groupId;
    });

    return res.json(excerpts);
});

router.post('/:id/meetings', (req, res) => {
    const { id } = req.params;
    const { dateTime } = req.body;

    res.status(200).json({ message: 'Meeting(s) scheduled successfully.' });
});

module.exports = router;