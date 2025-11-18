// scripts/seedAdmin.js
import { Pool } from "pg";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import readline from "readline";
dotenv.config();

const client = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    ssl: {
        rejectUnauthorized: false
    }
});

async function seedAdmin() {
  try {

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const question = (q) => new Promise((resolve) => rl.question(q, (ans) => resolve(ans)));

    const email = await question("Admin email: ");
    const password = await question("Admin password: ");
    rl.close();

    if (!email || !password) {
      throw new Error("Email and password must be provided.");
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if admin already exists
    const existing = await client.query("SELECT * FROM admins WHERE email = $1", [email]);

    if (existing.rows.length > 0) {
      console.log("✅ Admin already exists:", email);
    } else {
      await client.query(
        "INSERT INTO admins (email, password) VALUES ($1, $2)",
        [email, hashedPassword]
      );
      console.log("🎉 Admin seeded successfully:", email);
    }
  } catch (err) {
    console.error("❌ Error seeding admin:", err);
  }
}

seedAdmin();
