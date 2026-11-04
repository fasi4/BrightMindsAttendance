
const db = require("./db");
const bcrypt = require("bcryptjs");

async function createAdmin() {
  try {
    const username = "admin";
    const password = "Admin@12345";

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
      [username, hashedPassword, "admin"]
    );

    console.log("Administrator account created successfully!");
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await db.end();
  }
}

createAdmin();
