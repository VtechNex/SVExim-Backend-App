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

async function getExpiringTokens(email) {
  const query = `
    SELECT id, email, refresh_token, refresh_token_expires
    FROM admins
    WHERE email='${email}' and access_token_expires < NOW() + INTERVAL '5 minutes';
  `;
  const result = await pool.query(query);
  return result.rows;
}

async function getRefreshTokenExpiry() {
  // Fetch users whose refresh_token is about to expire in next 5 days
    const query = `
      SELECT id, email, refresh_token_expires
      FROM admins
      WHERE refresh_token_expires BETWEEN NOW() AND NOW() + INTERVAL '5 days';
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

async function addProductsToDatabase(products) {
  if (!products || products.length === 0) return;

  const values = [];
  const placeholders = [];

  products.forEach((p, i) => {
    const {
      sku,
      product: { title, description, imageUrls },
      condition,
      availability: {
        shipToLocationAvailability: { quantity },
      },
    } = p;

    // push the values
    values.push(
      sku || "",
      title || "",
      description || "",
      0, // price (you can map it later if available)
      'USD', // currency (change if needed)
      JSON.stringify(imageUrls || []),
      quantity || 0,
      condition || 'NEW'
    );

    // create placeholder group for each row
    const base = i * 8;
    placeholders.push(
      `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8})`
    );
  });

  const query = `
    INSERT INTO products 
      (sku, title, description, price, currency, images, quantity, condition)
    VALUES 
      ${placeholders.join(', ')}
    ON CONFLICT (sku) 
    DO UPDATE SET
      title = EXCLUDED.title,
      description = EXCLUDED.description,
      images = EXCLUDED.images,
      quantity = EXCLUDED.quantity,
      condition = EXCLUDED.condition,
      updated_at = now();
  `;

  const result = await pool.query(query, values);
  console.log(`✅ Synced ${products.length} products to database`);
  return result;
}

async function addProductToDatabase(product) {
  const { sku, title, description, price, currency, images, quantity, condition } = product;
  const query = `
    INSERT INTO products 
      (sku, title, description, price, currency, images, quantity, condition)
    VALUES 
      ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (sku) 
    DO UPDATE SET
      title = EXCLUDED.title,
      description = EXCLUDED.description,
      images = EXCLUDED.images,
      quantity = EXCLUDED.quantity,
      condition = EXCLUDED.condition,
      updated_at = now();
  `;
  const values = [sku, title, description, price, currency, JSON.stringify(images), quantity, condition];
  const result = await pool.query(query, values);
  return result;
}

async function getAllProducts(page = 1, limit = 20, search = "", sortBy = "updated_at", order = "DESC") {
  const offset = (page - 1) * limit;
  const searchQuery = `%${search}%`;

  const result = await pool.query(
    `SELECT * FROM products 
     WHERE title ILIKE $1 OR description ILIKE $1
     ORDER BY ${sortBy} ${order}
     LIMIT $2 OFFSET $3`,
    [searchQuery, limit, offset]
  );

  const totalResult = await pool.query(
    `SELECT COUNT(*) FROM products WHERE title ILIKE $1 OR description ILIKE $1`,
    [searchQuery]
  );

  const total = parseInt(totalResult.rows[0].count, 10);
  const totalPages = Math.ceil(total / limit);

  return { products: result.rows, pagination: { total, page, limit, totalPages } };
}

async function deleteProduct(id) {
  const result = await pool.query(
    `DELETE FROM products WHERE id = $1`,
    [id]
  );
  return result;
}

async function updateProduct(id, fields) {
  const setClauses = [];
  const values = [];
  let index = 1;

  for (const key in fields) {
    setClauses.push(`${key} = $${index}`);
    values.push(fields[key]);
    index++;
  }

  // add id as the last parameter
  values.push(id);

  const query = `
    UPDATE products
    SET ${setClauses.join(', ')}, updated_at = now()
    WHERE id = ${id}
    RETURNING *;
  `;

  const result = await pool.query(query, values);
  return result.rows[0];
}

async function getBrands() {
  const result = await pool.query(`SELECT * FROM brands ORDER BY name ASC`);
  return result.rows;
}

async function addBrand(name, description, logoUrl) {
  const result = await pool.query(
    `INSERT INTO brands (name, description, logo_url) VALUES ($1, $2, $3) RETURNING *`,
    [name, description, logoUrl]
  );
  return result.rows[0];
}

async function updateBrand(id, name, description, logoUrl) {
  const result = await pool.query(
    `UPDATE brands SET name = $1, description = $2, logo_url = $3 WHERE id = $4 RETURNING *`,
    [name, description, logoUrl, id]
  );
  return result.rows[0];
}

async function deleteBrand(id) {
  const result = await pool.query(
    `DELETE FROM brands WHERE id = $1`,
    [id]
  );
  return result;
}


module.exports = {
    query: (text, params) => pool.query(text, params),
    pool,
    saveEbayToken,
    getExpiringTokens,
    getRefreshTokenExpiry,
    updateEbayTokens,
    getUserByEmail,
    addProductsToDatabase,
    addProductToDatabase,
    getAllProducts,
    deleteProduct,
    updateProduct,
    getBrands,
    addBrand,
    updateBrand,
    deleteBrand
};
