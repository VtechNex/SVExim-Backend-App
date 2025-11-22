const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getQuotes } = require('../db');

// GET /admin/quotes - admin only
router.get('/', async (req, res) => {
  try {
    const rows = await getQuotes();
    return res.status(200).json({quotes: rows})
  } catch (error) {
    console.error('Error while getting quotes', error);
    return res.status(500).json({ error: 'Internal server error!' })
  }
});

// POST /admin/quotes - admin only
router.post('/', auth, async (req, res) => {
  
});

module.exports = router;
