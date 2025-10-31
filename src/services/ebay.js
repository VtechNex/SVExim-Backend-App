const axios = require('axios');
const dotenv = require('dotenv');
const { saveEbayToken, addProductsToDatabase } = require('../db');
dotenv.config();


async function oAuthToken(email, code, res) {
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
        const result = await saveEbayToken(email, response.data);
        console.log("Token saved for user:", result);

        return res.status(200).json({
            success: true,
        });
    } catch (error) {
        console.error("❌ Token exchange error:", error.response?.data || error.message);
        return res.status(500).json({
        success: false,
        error: error.response?.data || error.message,
        });
    }
}

async function getProducts(user) {
  try {
    const accessToken = user.access_token;
    const limit = 100; // max allowed by eBay API
    let offset = 0;
    let totalFetched = 0;
    let hasMore = true;

    console.log(`🔄 Syncing eBay products for user: ${user.email}`);

    while (hasMore) {
      const ebayUrl = `https://api.ebay.com/sell/inventory/v1/inventory_item?limit=${limit}&offset=${offset}`;

      const response = await axios.get(ebayUrl, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
          "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
        },
      });

      const { inventoryItems = [], total, size } = response.data;

      if (inventoryItems.length === 0) {
        hasMore = false;
        break;
      }

      console.log(`📦 Fetched ${inventoryItems.length} items (offset ${offset})`);
      await addProductsToDatabase(inventoryItems);

      totalFetched += inventoryItems.length;
      offset += limit;
      
      if (totalFetched >= total) hasMore = false;

    }

    console.log(`✅ Completed sync for ${user.email}: ${totalFetched} products synced.`);
    return { success: true, totalFetched };
  } catch (error) {
    console.error("Error syncing eBay products:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Failed to sync eBay products");
  }
}


const EBAY = {
    oAuthToken,
    getProducts
};

module.exports = { default: EBAY };
