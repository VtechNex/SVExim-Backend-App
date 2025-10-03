const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// GET /products - public (list with pagination)
router.get('/', async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = (page - 1) * limit;

  try {
    const { rows } = await db.query(
      'SELECT * FROM products ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    res.json({ items: rows, page, limit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /products/:id - public
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM products WHERE id=$1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /products - admin only
router.post('/', auth, async (req, res) => {
  const { title, description, price, currency, ebay_id, images, attributes } = req.body;
  try {
    const { rows } = await db.query(
      `INSERT INTO products (title, description, price, currency, ebay_id, images, attributes)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [
        title,
        description,
        price,
        currency,
        ebay_id,
        images ? JSON.stringify(images) : null,
        attributes ? JSON.stringify(attributes) : null,
      ]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /products/:id - admin only
router.put('/:id', auth, async (req, res) => {
  const { title, description, price, currency, ebay_id, images, attributes } = req.body;
  try {
    const { rows } = await db.query(
      `UPDATE products 
       SET title=$1, description=$2, price=$3, currency=$4, ebay_id=$5, 
           images=$6, attributes=$7, updated_at=now()
       WHERE id=$8 RETURNING *`,
      [
        title,
        description,
        price,
        currency,
        ebay_id,
        images ? JSON.stringify(images) : null,
        attributes ? JSON.stringify(attributes) : null,
        req.params.id,
      ]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /products/:id - admin only
router.delete('/:id', auth, async (req, res) => {
  try {
    const { rowCount } = await db.query('DELETE FROM products WHERE id=$1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
