// scripts/seedAdmin.js
import pkg from "pg";
import bcrypt from "bcrypt";

const { Client } = pkg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function seedAdmin() {
  try {
    await client.connect();

    const email = process.env.SEED_ADMIN_EMAIL;
    const password = process.env.SEED_ADMIN_PASSWORD;
    if (!email || !password) {
      throw new Error("SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set in environment variables.");
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
  } finally {
    await client.end();
  }
}

seedAdmin();
