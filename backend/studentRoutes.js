
const express = require("express");
const router = express.Router();
const db = require("./db");
const { authenticateToken, requireAdmin } = require("./authMiddleware");

// Protect all student routes: admin access only
router.use(authenticateToken, requireAdmin);

// Get all active students
router.get("/", async (req, res) => {
  try {
    const [students] = await db.query(
      "SELECT * FROM students WHERE is_archived = 0 ORDER BY id DESC"
    );

    res.json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ message: "Failed to fetch students." });
  }
});

// Get archived students
router.get("/archived", async (req, res) => {
  try {
    const [students] = await db.query(
      "SELECT * FROM students WHERE is_archived = 1 ORDER BY id DESC"
    );

    res.json(students);
  } catch (error) {
    console.error("Error fetching archived students:", error);
    res.status(500).json({ message: "Failed to fetch archived students." });
  }
});

// Add a new student
router.post("/", async (req, res) => {
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
        admission_number.trim(),
        first_name.trim(),
        last_name.trim(),
        class_name.trim(),
        parent_name?.trim() || null,
        parent_phone?.trim() || null
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
        message: "That admission number already exists. Check whether the student is archived."
      });
    }

    res.status(500).json({ message: "Failed to add student." });
  }
});

// Edit student details
router.put("/:id", async (req, res) => {
  try {
    const studentId = Number(req.params.id);

    if (!Number.isInteger(studentId) || studentId <= 0) {
      return res.status(400).json({
        message: "Invalid student ID."
      });
    }

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
      `UPDATE students
       SET admission_number = ?,
           first_name = ?,
           last_name = ?,
           class_name = ?,
           parent_name = ?,
           parent_phone = ?
       WHERE id = ? AND is_archived = 0`,
      [
        admission_number.trim(),
        first_name.trim(),
        last_name.trim(),
        class_name.trim(),
        parent_name?.trim() || null,
        parent_phone?.trim() || null,
        studentId
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Active student not found."
      });
    }

    res.json({
      message: "Student details updated successfully."
    });

  } catch (error) {
    console.error("Error updating student:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "That admission number already exists."
      });
    }

    res.status(500).json({
      message: "Failed to update student details."
    });
  }
});

// Archive a student instead of permanently deleting them
router.delete("/:id", async (req, res) => {
  try {
    const studentId = Number(req.params.id);

    if (!Number.isInteger(studentId) || studentId <= 0) {
      return res.status(400).json({
        message: "Invalid student ID."
      });
    }

    const [result] = await db.query(
      `UPDATE students
       SET is_archived = 1
       WHERE id = ? AND is_archived = 0`,
      [studentId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Active student not found."
      });
    }

    res.json({
      message: "Student archived successfully. Attendance records have been preserved."
    });

  } catch (error) {
    console.error("Error archiving student:", error);

    res.status(500).json({
      message: "Failed to archive student."
    });
  }
});

// Restore an archived student
router.put("/:id/restore", async (req, res) => {
  try {
    const studentId = Number(req.params.id);

    if (!Number.isInteger(studentId) || studentId <= 0) {
      return res.status(400).json({
        message: "Invalid student ID."
      });
    }

    const [result] = await db.query(
      `UPDATE students
       SET is_archived = 0
       WHERE id = ? AND is_archived = 1`,
      [studentId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Archived student not found."
      });
    }

    res.json({
      message: "Student restored successfully."
    });

  } catch (error) {
    console.error("Error restoring student:", error);

    res.status(500).json({
      message: "Failed to restore student."
    });
  }
});

module.exports = router;
