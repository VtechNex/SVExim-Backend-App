// scripts/fetchEbay.js
import fetch from "node-fetch";
import pkg from "pg";

const { Client } = pkg;

// Database setup
const client = new Client({
  connectionString: process.env.DATABASE_URL || "postgres://marine_admin:admin123@localhost:5433/marine_db",
});

// eBay API settings
const EBAY_API_URL = process.env.EBAY_API_URL || "https://api.ebay.com/buy/browse/v1/item_summary/search";
const EBAY_OAUTH_TOKEN = process.env.EBAY_OAUTH_TOKEN; // add this in your .env

async function fetchEbayProducts(query = "marine engine") {
  try {
    await client.connect();

    console.log(`🔎 Fetching products from eBay for query: ${query}`);

    const response = await fetch(`${EBAY_API_URL}?q=${encodeURIComponent(query)}`, {
      headers: {
        Authorization: `Bearer ${EBAY_OAUTH_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`eBay API failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.itemSummaries) {
      console.log("⚠️ No items found.");
      return;
    }

    for (const item of data.itemSummaries) {
      const { itemId, title, price, itemWebUrl } = item;
      const product = {
        ebay_id: itemId,
        title: title || "Untitled",
        price: price?.value ? parseFloat(price.value) : 0,
        url: itemWebUrl || "",
      };

      // Upsert into DB
      await client.query(
        `INSERT INTO products (ebay_id, title, price, url)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (ebay_id) DO UPDATE SET title = EXCLUDED.title, price = EXCLUDED.price, url = EXCLUDED.url`,
        [product.ebay_id, product.title, product.price, product.url]
      );

      console.log(`✅ Upserted product: ${product.title}`);
    }
  } catch (err) {
    console.error("❌ Error fetching eBay products:", err.message);
  } finally {
    await client.end();
  }
}

// Run the script
fetchEbayProducts("marine machines");
