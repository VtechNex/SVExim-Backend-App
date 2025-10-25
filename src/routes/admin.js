const express = require('express');
const router = express.Router();

// Example admin route
router.get('/dashboard', (req, res) => {
  res.send('Admin Dashboard');
});

module.exports = router;
