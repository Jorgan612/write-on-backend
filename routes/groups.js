const { UsersList, Groups, Excerpts } = require('../mockData.js');
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth.js');

router.get('/group/:id', (req, res) => {
    const { id } = req.params;

    const group = Groups.find((group) => {
        return group.groupId === id;
    })

    if (!group) {
        return res.status(404).json({ message: 'Group not found.' });
    }

    return res.status(200).json(group);
});

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

router.get('/group/:groupId/excerpts', (req, res) => {

    const { groupId } = req.params;

    if (!Excerpts) {
        return res.status(404).json({error:"No excerpts found."});
    }

    const excerpts = Excerpts.filter((excerpt) => {
        return excerpt.groupId === groupId;
    });

    return res.json(excerpts);

});

router.post('/group/excerpts', (req, res) => {
    const newExcerpt = req.body;

    Excerpts.push(newExcerpt);

    res.status(201).json(newExcerpt);
});

router.put('/excerpts/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    const authenticatedUserID = req.user.id;

    const index = Excerpts.findIndex(exc => exc.id === Number(id));

    if (index === -1) {
        return res.status(404).json({ message: "Excerpt not found" });
    }

    const currentExcerpt = Excerpts[index];

    if (Number(currentExcerpt.userID) !== Number(authenticatedUserID)) {
        return res.status(403).json({ message: "Unauthorized: You can only edit your own excerpts." });
    }

    const {links, description} = req.body;

    if (description !== undefined) {
        if (typeof description !== 'string') {
            return res.status(400).json({ message: "Invalid date type for description."});
        }
        currentExcerpt.description = description;
    }

    if (links !== undefined) {
        if (!Array.isArray(links)) {
            return res.status(400).json({ message: "Links must be an array."});
        }

        currentExcerpt.links = links.slice(0, 5);
    }
    
    Excerpts[index] = currentExcerpt;
        res.json(currentExcerpt);
});

router.post('/:id/meetings', (req, res) => {
    const { id } = req.params;
    const { dateTime } = req.body;

    res.status(200).json({ message: 'Meeting(s) scheduled successfully.' });
});

module.exports = router;