const express = require('express');
const { getAllProducts, makeQuote } = require('../db');
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

// Make quote from user
router.post('/quotes', async (req, res)=>{
  const quote = req.body;
  quote.location = quote.location !== "" ? quote.location : "";
  quote.budget = quote.budget !== "" ? quote.budget : "";
  quote.message = quote.message !== "" ? quote.message : "";
  quote.product = quote.product !== "" ? quote.product : "";
  
  try {
    const rows = await makeQuote(quote);
    return res.status(201).json({quotes: rows})
  } catch (error) {
    console.error('Error while making quote:', error);
    return res.status(500).json({ error: 'Internal server error!' })
  }
})


module.exports = router;
