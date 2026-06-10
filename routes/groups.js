const express = require('express');
const router = express.Router();


let groups = [];

router.post('/', (req, res) => {
    const { name, meetings, members, ownerID, groupId, creationDate } = req.body;

    if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'A group name is required.' });
    }

    const newGroup = {
        name: name.trim(),
        meetings: meetings || [],
        members: members || [],
        ownerID: ownerID,
        groupId: Date.now().toString(),
        creationDate: creationDate,
    };

    groups.push(newGroup);

    res.status(201).json({ message: 'Group created successfully!' });
});

router.post('/:id/meetings', (req, res) => {
    const { id } = req.params;
    const { dateTime } = req.body;



    res.status(200).json({ message: 'Meeting(s) scheduled successfully.' });
});

module.exports = router;