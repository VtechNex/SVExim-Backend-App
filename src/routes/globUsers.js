const express = require('express');
const { getAllProducts } = require('../db');
const router = express.Router();

// Get all products in chunks
router.get('/products', async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;

  try {
    const rows = await getAllProducts(page, limit, search);
    res.json({ items: rows.products, pagination: rows.pagination });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


module.exports = router;
