
const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();

const db = require("./db");
const {
  authenticateToken,
  requireAdmin
} = require("./authMiddleware");

// Only administrators can manage teacher accounts
router.use(authenticateToken, requireAdmin);

// Get all teachers and their assigned classes
router.get("/", async (req, res) => {
  try {
    const [teachers] = await db.execute(`
      SELECT
        users.id,
        users.username,
        users.created_at,
        GROUP_CONCAT(
          teacher_classes.class_name
          ORDER BY teacher_classes.class_name
          SEPARATOR ', '
        ) AS assigned_classes
      FROM users
      LEFT JOIN teacher_classes
        ON users.id = teacher_classes.teacher_id
      WHERE users.role = 'teacher'
      GROUP BY users.id, users.username, users.created_at
      ORDER BY users.id DESC
    `);

    res.json(teachers);
  } catch (error) {
    console.error("Fetch teachers error:", error);
    res.status(500).json({
      message: "Failed to retrieve teachers."
    });
  }
});

// Create a teacher account
router.post("/", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (
      typeof username !== "string" ||
      !username.trim() ||
      typeof password !== "string" ||
      password.length < 8
    ) {
      return res.status(400).json({
        message: "Enter a username and a password of at least 8 characters."
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.execute(
      `INSERT INTO users (username, password, role)
       VALUES (?, ?, 'teacher')`,
      [username.trim(), hashedPassword]
    );

    res.status(201).json({
      message: "Teacher account created successfully.",
      teacherId: result.insertId
    });

  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "That username is already in use."
      });
    }

    console.error("Create teacher error:", error);
    res.status(500).json({
      message: "Failed to create teacher account."
    });
  }
});

// Assign a class to a teacher
router.post("/:teacherId/classes", async (req, res) => {
  try {
    const teacherId = Number(req.params.teacherId);
    const { class_name } = req.body;

    if (
      !Number.isInteger(teacherId) ||
      teacherId <= 0 ||
      typeof class_name !== "string" ||
      !class_name.trim()
    ) {
      return res.status(400).json({
        message: "Provide a valid teacher ID and class name."
      });
    }

    const [teachers] = await db.execute(
      "SELECT id FROM users WHERE id = ? AND role = 'teacher'",
      [teacherId]
    );

    if (teachers.length === 0) {
      return res.status(404).json({
        message: "Teacher not found."
      });
    }

    const [classes] = await db.execute(
      "SELECT DISTINCT class_name FROM students WHERE class_name = ?",
      [class_name.trim()]
    );

    if (classes.length === 0) {
      return res.status(404).json({
        message: "No students were found in that class."
      });
    }

    await db.execute(
      `INSERT INTO teacher_classes (teacher_id, class_name)
       VALUES (?, ?)`,
      [teacherId, class_name.trim()]
    );

    res.status(201).json({
      message: "Class assigned successfully."
    });

  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "This class is already assigned to the teacher."
      });
    }

    console.error("Assign class error:", error);
    res.status(500).json({
      message: "Failed to assign class."
    });
  }
});

// Delete a teacher account
router.delete("/:teacherId", async (req, res) => {
  try {
    const teacherId = Number(req.params.teacherId);

    if (!Number.isInteger(teacherId) || teacherId <= 0) {
      return res.status(400).json({
        message: "Invalid teacher ID."
      });
    }

    const [result] = await db.execute(
      "DELETE FROM users WHERE id = ? AND role = 'teacher'",
      [teacherId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Teacher not found."
      });
    }

    res.json({
      message: "Teacher account deleted successfully."
    });

  } catch (error) {
    console.error("Delete teacher error:", error);
    res.status(500).json({
      message: "Failed to delete teacher."
    });
  }
});

module.exports = router;
