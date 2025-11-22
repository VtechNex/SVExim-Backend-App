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

router.put('/:id', async (req, res)=>{
    const { id } = req.params;
    const { name, email } = req.body;
    if (!name || !email) return res.status(400).json({error: 'Missing username or email'})
    try {
        const updated = await db.updateUser(id, name, email);
        return res.status(200).json({message: 'User is modified!'})
    } catch (error) {
        console.error('Error updating user', error);
        return res.status(500).json({ error: 'Internal serer error'})
    }
})

router.delete('/:id', async (req, res)=>{
    const { id } = req.params;
    if (!id) return res.status(400).json({error: 'Id is required to delete user'})
    try {
        const result = await db.deleteUser(id);
        return res.status(200).json({message: 'User deleted successfully!'})
    } catch (error) {
        console.error('Error deleting user', error);
        return res.status(500).json({error: 'Internal server error'})
    }
})

module.exports = router;
