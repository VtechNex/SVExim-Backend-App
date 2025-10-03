const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// GET /admin/quotes - admin only
router.get('/', auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT q.*, a.email as admin_email 
       FROM quotes q 
       LEFT JOIN admins a ON q.admin_id = a.id 
       ORDER BY q.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /admin/quotes - admin only
router.post('/', auth, async (req, res) => {
  const { product_id, parent_id, content } = req.body;
  if (!content) return res.status(400).json({ error: 'Content required' });

  try {
    const { rows } = await db.query(
      `INSERT INTO quotes (product_id, parent_id, admin_id, content) 
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [product_id || null, parent_id || null, req.admin.id, content]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
