const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
require('dotenv').config();

// POST /auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing credentials' });
    try {
        const { rows } = await db.query('SELECT * FROM admins WHERE email = $1', [email]);
        const admin = rows[0];
        if (!admin) return res.status(401).json({ error: 'Invalid email or password' });
        const match = await bcrypt.compare(password, admin.password);
        if (!match) return res.status(401).json({ error: 'Invalid email or password' });
        const payload = { id: admin.id, email: admin.email };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });
        res.json({ token, admin: { id: admin.id, email: admin.email, name: admin.name } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});


// POST /auth/forgot-password
router.post('/api/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    try {
        const { rows } = await db.query('SELECT * FROM admins WHERE email = $1', [email]);
        const admin = rows[0];
        if (!admin) return res.status(200).json({ message: 'If the account exists, a reset email will be sent' });

        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 3600 * 1000); // 1 hour
        await db.query('UPDATE admins SET reset_token=$1, reset_expires=$2 WHERE id=$3', [token, expires, admin.id]);

        // Send email (placeholder) - configure SMTP in .env
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
        await transporter.sendMail({
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: email,
            subject: 'Password reset',
            text: `Reset your password using: ${resetUrl}`
        });

        res.json({ message: 'If the account exists, a reset email will be sent' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});


// POST /auth/reset-password
router.post('/api/reset-password', async (req, res) => {
    const { email, token, password } = req.body;
    if (!email || !token || !password) return res.status(400).json({ error: 'Missing fields' });
    try {
        const { rows } = await db.query('SELECT * FROM admins WHERE email=$1 AND reset_token=$2 AND reset_expires > now()', [email, token]);
        const admin = rows[0];
        if (!admin) return res.status(400).json({ error: 'Invalid or expired token' });
        const hash = await bcrypt.hash(password, 10);
        await db.query('UPDATE admins SET password=$1, reset_token=NULL, reset_expires=NULL WHERE id=$2', [hash, admin.id]);
        res.json({ message: 'Password reset successful' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});


module.exports = router;
