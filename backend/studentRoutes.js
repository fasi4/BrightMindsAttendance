
const express = require("express");
const router = express.Router();
const db = require("./db");
const { authenticateToken, requireAdmin } = require("./authMiddleware");
router.use(authenticateToken, requireAdmin);
// Get all students
router.get("/", authenticateToken, async (req, res) => {
  try {
    const [students] = await db.query(
      "SELECT * FROM students ORDER BY id DESC"
    );

    res.json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ message: "Failed to fetch students." });
  }
});

// Add a new student
router.post("/", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      admission_number,
      first_name,
      last_name,
      class_name,
      parent_name,
      parent_phone
    } = req.body;

    if (!admission_number || !first_name || !last_name || !class_name) {
      return res.status(400).json({
        message: "Admission number, first name, last name and class are required."
      });
    }

    const [result] = await db.query(
      `INSERT INTO students
      (admission_number, first_name, last_name, class_name, parent_name, parent_phone)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        admission_number,
        first_name,
        last_name,
        class_name,
        parent_name || null,
        parent_phone || null
      ]
    );

    res.status(201).json({
      message: "Student added successfully.",
      studentId: result.insertId
    });
  } catch (error) {
    console.error("Error adding student:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "That admission number already exists."
      });
    }

    res.status(500).json({ message: "Failed to add student." });
  }
});

module.exports = router;
