const verifyToken = require('../middleware/auth.js');
const { UsersList, Groups, Excerpts } = require('../mockData.js');
const express = require('express');
const router = express.Router();

router.get('/', verifyToken, (req, res) => {
    const { ids } = req.query;
    const authenticatedUserID = Number(req.user.id);

    if (!ids) {
        return res.status(400).json({ message: 'No group IDs provided.' });
    }

    const requestedIds = Array.isArray(ids) ? ids : [ids];

    const matchedGroups = Groups.filter((group) => {
        return requestedIds.includes(group.groupId);
    });

    if (matchedGroups.length === 0) {
        return res.status(404).json({ message: 'No matching groups found.'});
    }

    const authorizedGroups = matchedGroups.filter((group) => {
        const isMember = group.members.includes(authenticatedUserID) || Number(group.ownerID) === authenticatedUserID;

        return isMember;
    });

    if (authorizedGroups.length === 0 ) {
        return res.status(403).json({ message: "Unauthorized: You do not have access to this group."});
    }

    return res.status(200).json(authorizedGroups);
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

    const isMember = group.members.includes(Number(authenticatedUserID)) || Number(group.ownerID) === Number(authenticatedUserID);

    if (!isMember) {
        return res.status(403).json({ message: "Unauthorized: You do not belong to this group." });
    }

    const excerpts = Excerpts.filter((excerpt) => {
        return excerpt.groupId === groupId;
    });

    return res.json(excerpts);
});

router.post('/group/excerpts', verifyToken, (req, res) => {
    const authenticatedUserID = req.user.id;
    const { groupId, meetingDate, username, userIcon, links, description } = req.body;

    const group = Groups.find((group) => {
        return group.groupId === groupId;
    })

    if (!group) {
        return res.status(404).json({ message: "Group not found." });
    }

    const isMember = group.members.includes(Number(authenticatedUserID)) || Number(group.ownerID) === Number(authenticatedUserID);

    if (!isMember) {
        return res.status(403).json({ message: "Unauthorized: You cannot add new excerpts to a group you are not a member of."});
    }


    const newExcerpt = {
        id: Date.now(),
        groupId,
        meetingDate,
        userID: Number(authenticatedUserID),
        username,
        userIcon,
        links: Array.isArray(links) ? links.slice(0,5) : [],
        description: typeof description === 'string' ? description : '',
        createdAt: Date.now().toString()
    };

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

    if (description !== undefined && typeof description === 'string') {
        currentExcerpt.description = description;
    }

    if (links !== undefined && Array.isArray(links)) {
        currentExcerpt.links = links.slice(0, 5);
    }
    
    Excerpts[index] = currentExcerpt;
    res.json(currentExcerpt);
});

router.delete('/excerpts/:id', verifyToken, (req, res) => {
    const { id } = req.params;
    const authenticatedUserID = req.user.id;

    const index = Excerpts.findIndex(exc => exc.id === Number(id));

    if (index === -1) {
        return res.status(404).json({ message: "Excerpt not found." });
    }

    const currentExcerpt = Excerpts[index];

    if (Number(currentExcerpt.userID) !== Number(authenticatedUserID)) {
        return res.status(403).json({ message:  "Unauthorized: You can only delete your own excerpts." });
    }

    Excerpts.splice(index, 1);

    res.status(200).json({ message: "Excerpt deleted successfully. "});
});

router.post('/:id/meetings', verifyToken, (req, res) => {
    const { id } = req.params;
    const authenticatedUserID = req.user.id;

    const group = Groups.find((group) => {
        return group.groupId === id;
    })

    if (!group) {
        return res.status(404).json({ message: "Group not found."});
    }

    if (Number(group.ownerID) !== Number(authenticatedUserID)) {
        return res.status(403).json({ message: "Unauthorized: Only the group manager can schedule meetings."});
    }

    const { dateTime } = req.body;

    if (dateTime) {
        group.meetings.push(dateTime);
    }

    res.status(200).json({ message: 'Meeting(s) scheduled successfully.', meetings: group.meetings });
});

module.exports = router;