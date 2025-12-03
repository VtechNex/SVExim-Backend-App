const express = require('express');
require('dotenv').config();
const { getUserByEmail, addProductsToDatabase, getExpiringTokens } = require('../db');
const { default: EBAY } = require('../services/ebay');
const { refreshEbayTokens } = require('../jobs/tokenRefresher');

const router = express.Router();


router.get("/oauth", async (req, res) => {
  const { email, code, success } = req.query;

  await refreshEbayTokens(email);

  const user = await getUserByEmail(email);
  if (!user) {
    return res.status(404).send("User not found.");
  }

  if (new Date(user.refresh_token_expires) > new Date()) {
    return res.status(201).send("Your ebay connection is active");
  }

  if (!code) {
    return res.status(400).send("No code received from eBay.");
  }
  return await EBAY.oAuthToken(email, code, res);
});

router.get("/products", async (req, res) => {
  const { email, page = 1, totalPages = 1 } = req.query;
  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
    await refreshEbayTokens(email);
    const user = await getUserByEmail(email);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (!user.access_token) return res.status(403).json({ error: "eBay access token not found" });

    const result = await EBAY.getProducts(user, page, totalPages);
    return res.status(200).json(result);

  } catch (err) {
    console.error("Sync Error:", err.message);
    return res.status(500).json({ error: "Failed to sync eBay products", details: err.message });
  }
});



module.exports = router;
