
const express = require("express");
const cors = require("cors");
const studentRoutes = require("./studentRoutes");
const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/students", studentRoutes);

app.get("/", (req, res) => {
  res.send("Bright Minds Attendance System Backend is running!");
});

// Temporary endpoint to test frontend-backend communication

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("./db");
require("dotenv").config();

app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: "Please enter your username and password."
      });
    }

    const [users] = await db.query(
      "SELECT * FROM users WHERE username = ?",
      [username.trim()]
    );

    if (users.length === 0) {
      return res.status(401).json({
        message: "Invalid username or password."
      });
    }

    const user = users[0];

    const isPasswordValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid username or password."
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login successful!",
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Login error:", error.message);

    res.status(500).json({
      message: "Something went wrong during login."
    });
  }
});


app.get("/api/test-db", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT 1 AS connected");

    res.json({
      message: "Database connected successfully!",
      result: rows[0],
    });
  } catch (error) {
    console.error("Database connection error:", error.message);

    res.status(500).json({
      message: "Database connection failed. Check your settings.",
    });
  }
});                
const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
