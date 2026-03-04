import pool from "../db.js";

async function seedDatabase() {
  try {
    console.log("🌱 Starting database seed with minimal data...");

    // Seed roles
    await pool.query(`
      TRUNCATE TABLE roles RESTART IDENTITY CASCADE;
      INSERT INTO roles (role_name) VALUES ('ADMIN');
      INSERT INTO roles (role_name) VALUES ('BRANCH_MANAGER');
      INSERT INTO roles (role_name) VALUES ('STAFF');
      INSERT INTO roles (role_name) VALUES ('ACCOUNTANT');
    `);
    console.log("✅ Roles seeded");

    // Seed branches
    await pool.query(`
      TRUNCATE TABLE branches RESTART IDENTITY CASCADE;
      INSERT INTO branches (branch_code, branch_name, address, location, pincode, branch_mobile, branch_type, is_active, created_at) 
      VALUES ('CDL001', 'Main Branch', 'Address 1', 'Location 1', '600001', '9999999999', 'MAIN', TRUE, NOW());
    `);
    console.log("✅ Branches seeded");

    // Seed admin user
    await pool.query(`
      TRUNCATE TABLE users RESTART IDENTITY CASCADE;
      INSERT INTO users (full_name, username, password_hash, role_id, branch_id, is_active, created_at) 
      VALUES ('System Admin', 'admin', '$2b$12$HycAd7pqI843iKQksCV2EORu02rmwKXY3tExTH1QxhTc53HnvstY2', 1, NULL, TRUE, NOW());
    `);
    console.log("✅ Admin user created");
    console.log("\n✅ Database seeded successfully!");
    console.log("\n📝 Test credentials:");
    console.log("   Username: admin");
    console.log("   Password: admin123");

    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
    console.error(err);
    process.exit(1);
  }
}

seedDatabase();
