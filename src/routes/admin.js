const express = require('express');
const router = express.Router();
const { getAllProducts, getBrands, getQuotes } = require('../db');

// Example admin route
router.get('/dashboard', (req, res) => {
  res.send('Admin Dashboard');
});

router.get('/dashboard/stats', async (req, res) => {
  try {
    // Fetch all data in parallel for speed
    const [products, brands, quotes] = await Promise.all([
      getAllProducts(1, -1),   // returns all products
      getBrands(),    // returns all brands
      getQuotes(),    // returns all quotes
    ]);

    // Calculated Stats
    const totalProducts = products.products.length;
    const activeBrands = brands.length;
    const pendingRfqs = quotes.filter(q => q.status === "pending").length;

    // If you later add orders:
    const ordersFulfilled = 0; // placeholder

    return res.json({
      success: true,
      stats: {
        totalProducts,
        activeBrands,
        pendingRfqs,
        ordersFulfilled,
      }
    });

  } catch (err) {
    console.error("Dashboard Stats Error:", err);
    return res.status(500).json({
      success: false,
      message: "Error fetching dashboard stats",
    });
  }
});


module.exports = router;
