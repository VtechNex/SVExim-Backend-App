const express = require('express');
const { getAllProducts, deleteProduct, updateProduct, addProductToDatabase, getProduct } = require('../db');
const router = express.Router();

// GET /products - public (list with pagination)
router.get('/', async (req, res) => {
  const { page = 1, limit = 20, search = "", ...filters } = req.query;

  try {
    const rows = await getAllProducts(page, limit, search, filters);
    res.json({ items: rows.products, pagination: rows.pagination });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res)=>{
  const { id } = req.params;
  try {
    const row = await getProduct(id);
    res.status(200).json({ product: row })
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/add', async (req, res) => {
  const product = req.body;

  try {
    const result = await addProductToDatabase(product);
    res.json({ message: 'Product added', result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const fields = req.body;

  try {
    const result = await updateProduct(id, fields);
    res.json({ message: 'Product updated', result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await deleteProduct(id);
    res.json({ message: 'Product deleted', result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


module.exports = router;
