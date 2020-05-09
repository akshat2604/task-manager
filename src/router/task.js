const express = require('express'),
    auth = require('../middleware/auth'),
    router = new express.Router(),
    Task = require('../models/task');

router.get('/', auth, async (req, res) => {
    const match = {}, sort = {};
    if (req.query.completed) {
        match.completed = req.query.completed === 'true'
    };
    if (req.query.sortBy) {
        const parts = req.query.sortBy.split('_');
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 0;
    }
    try {
        //const tasks = await Task.find({ owner: req.user._id });
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate();
        res.status(201).send(req.user.tasks);
    } catch (e) {
        res.status(500).send(e);
    }
});

router.get('/:id', auth, async (req, res) => {
    let _id = req.params.id
    try {
        const task = await Task.findOne({ _id, owner: req.user._id })
        if (!task) return res.status(404).send()
        res.send(task);
    } catch (e) {
        res.status(500).send(e);
    }
});

router.post('/', auth, async (req, res) => {
    const task = new Task({
        ...req.body,
        owner: req.user._id
    });
    try {
        await task.save();
        res.status(201).send(task);
    } catch (e) {
        res.status(400).send(e);
    }
});

router.patch('/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['description', 'completed'];
    const isvalidOperation = updates.every((update) => allowedUpdates.includes(update));
    if (!isvalidOperation) return res.status(400).send({ error: "Invalid Operation!" });
    try {
        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });
        updates.forEach(update => task[update] = req.body[update]);
        if (!task) return res.status(404).send();
        await task.save();
        if (!task) return res.status(404).send();
        res.status(200).send(task);
    } catch (e) {
        res.status(400).send(e);
    }
});

router.delete('/:id', auth, async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
        if (!task)
            return res.status(404).send({ error: "No Such task exists" });
        res.send(task);
    } catch (e) {
        res.status(400).send(e);
    };
});

module.exports = router;
