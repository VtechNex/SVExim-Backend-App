const express = require('express');
require('dotenv').config();
const { saveEbayToken, getUserByEmail } = require('../db');
const { default: EBAY } = require('../services/ebay');
const { refreshEbayTokens } = require('../jobs/tokenRefresher');

const router = express.Router();


router.get("/oauth", async (req, res) => {
  const { email, code, success } = req.query;

  if (!code) {
    return res.status(400).send("No code received from eBay.");
  }
  return await EBAY.oAuthToken(email, code, res);
});

router.get("/products", async (req, res) => {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: "Email is required" });

    await refreshEbayTokens(email);

    // Fetch user from your database
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    else if (!user.access_token) {
      return res.status(403).json({ error: "eBay access token not found for this user" });
    }

    return await EBAY.getProducts(user, res);

});

// POST /products/add
router.post("/products/add", async (req, res) => {
    const { email, sku, title, description, quantity, imageUrls } = req.body;

    if (!email || !sku || !title || !quantity) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    await refreshEbayTokens(email);

    const user = await getUserByEmail(email);
    if (!user || !user.access_token) {
      return res.status(404).json({ error: "User not found or not authorized" });
    }

    return await EBAY.addProductToInventory(
      user, 
      sku, 
      title, 
      description,
      quantity, 
      imageUrls, 
      res
    );

});

router.put('/products', async (req, res) => {
  const { sku, email } = req.query;
  const { title, description, quantity, imageUrls } = req.body;

  if (!email || !sku) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  await refreshEbayTokens(email);

  const user = await getUserByEmail(email);
  if (!user || !user.access_token) {
    return res.status(404).json({ error: "User not found or not authorized" });
  }
  
  return await EBAY.updateProductInInventory(
    user,
    sku,
    title,
    description,
    quantity,
    imageUrls,
    res
  );

});

router.delete('/products', async (req, res) => {
  const { sku, email } = req.query;
  
  if (!sku || !email) {
    return res.status(400).json({ success: false, message: 'SKU and Email is required' });
  }

  await refreshEbayTokens(email);

  const user = await getUserByEmail(req.query.email);
  if (!user || !user.access_token) {
    return res.status(404).json({ error: "User not found or not authorized" });
  }

  return await EBAY.deleteProductFromInventory(
    user,
    sku,
    res
  );
});



module.exports = router;
