const express = require('express');
const axios = require('axios');
require('dotenv').config();
// const { default: EBAY } = require('../services/ebay');

const router = express.Router();

// eBay redirects here after login success
router.get("/oauth", async (req, res) => {
  const { code, success } = req.query;

  if (!code) {
    return res.status(400).send("No code received from eBay.");
  }

  try {
    const response = await axios.post(
      "https://api.ebay.com/identity/v1/oauth2/token",
      new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: process.env.EBAY_RUNAME,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(
            `${process.env.EBAY_CLIENT_ID}:${process.env.EBAY_CLIENT_SECRET}`
          ).toString("base64")}`,
        },
      }
    );

    console.log("✅ Token Response:", response.data);

    return res.status(200).json({
      success: true,
      ebay_response: response.data,
    });
  } catch (error) {
    console.error("❌ Token exchange error:", error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
    });
  }
});

module.exports = router;
