const express = require('express');
require('dotenv').config();
const db = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const rows = await db.getUsers();
        return res.status(200).json({ users: rows });
    } catch (error) {
        console.error('Error fetching users:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/', async (req, res) => {
    const { name, email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing credentials' });
    try {
        const newUser = await db.createUser(name, email, password);
        return res.status(201).json({ user: newUser });
    } catch (error) {
        console.error('Error creating user:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
