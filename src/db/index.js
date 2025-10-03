const { Pool } = require('pg');
require('dotenv').config();


const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB
});


module.exports = { query: (text, params) => pool.query(text, params), pool };
