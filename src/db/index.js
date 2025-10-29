const { Pool } = require('pg');
require('dotenv').config();


const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB
});

// ✅ Function to save eBay OAuth token
async function saveEbayToken(email, tokenData) {
  try {
    const expiryDate = new Date(Date.now() + tokenData.expires_in * 1000); // convert seconds → ms
    const refreshTokenExpiryDate = new Date(Date.now() + tokenData.refresh_token_expires_in * 1000);
    const queryText = `
      UPDATE admins
      SET access_token = $1, access_token_expires = $2, refresh_token = $3, refresh_token_expires = $4
      WHERE email = $5
      RETURNING id, email, access_token, access_token_expires;
    `;

    const result = await pool.query(queryText, [tokenData.access_token, expiryDate, tokenData.refresh_token, refreshTokenExpiryDate, email]);
    return result.rows[0];
  } catch (error) {
    console.error("❌ Error saving eBay token:", error);
    throw error;
  }
}

async function getExpiringTokens() {
  const query = `
    SELECT id, email, refresh_token, refresh_token_expires
    FROM admins
    WHERE access_token_expires < NOW() + INTERVAL '5 minutes';
  `;
  const result = await pool.query(query);
  return result.rows;
}

async function updateEbayTokens(adminEmail, newAccessToken, newExpiresIn) {
  const newExpiry = new Date(Date.now() + newExpiresIn * 1000);
  await pool.query(
    `UPDATE admins SET access_token = $1, access_token_expires = $2 WHERE email = $3`,
    [newAccessToken, newExpiry, adminEmail]
  );
}

async function getUserByEmail(email) {
  const result = await pool.query(
    `SELECT id, email, access_token, access_token_expires, refresh_token, refresh_token_expires FROM admins WHERE email = $1`,
    [email]
  );
  return result.rows[0];
}


module.exports = {
    query: (text, params) => pool.query(text, params),
    pool,
    saveEbayToken,
    getExpiringTokens,
    updateEbayTokens,
    getUserByEmail
};
