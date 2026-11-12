
const express = require("express");
const router = express.Router();

const db = require("./db");
const { sendAbsenceSMS } = require("./smsService");
const {
  authenticateToken,
  requireTeacher
} = require("./authMiddleware");

router.use(authenticateToken, requireTeacher);

// Get classes assigned to the logged-in teacher
router.get("/classes", async (req, res) => {
  try {
    const [classes] = await db.execute(
      `SELECT DISTINCT tc.class_name
 FROM teacher_classes tc
 INNER JOIN students s
   ON tc.class_name = s.class_name
 WHERE tc.teacher_id = ?
   AND s.is_archived = 0
 ORDER BY tc.class_name`,
[req.user.id]
    );

    res.json(classes);
  } catch (error) {
    console.error("Teacher classes error:", error);
    res.status(500).json({
      message: "Could not retrieve assigned classes."
    });
  }
});

// Get students in a class assigned to the teacher
router.get("/students", async (req, res) => {
  try {
    const { class_name } = req.query;
    const teacherId = req.user.id;

    if (!class_name) {
      return res.status(400).json({
        message: "Please select a class."
      });
    }

    // Verify that this class belongs to the logged-in teacher
    const [assignedClasses] = await db.execute(
      `SELECT id FROM teacher_classes
       WHERE teacher_id = ? AND class_name = ?`,
      [teacherId, class_name]
    );

    if (assignedClasses.length === 0) {
      return res.status(403).json({
        message: "You are not assigned to this class."
      });
    }

    // Retrieve active students in the assigned class
    const [students] = await db.execute(
      `SELECT id, admission_number, first_name, last_name, class_name
       FROM students
       WHERE class_name = ?
         AND is_archived = 0
       ORDER BY first_name, last_name`,
      [class_name]
    );

    res.json(students);

  } catch (error) {
    console.error("Teacher students error:", error);
    res.status(500).json({
      message: "Could not retrieve students."
    });
  }
});
// Get previously saved attendance for an assigned class and date
router.get("/attendance", async (req, res) => {
  try {
    const { class_name, date } = req.query;

    if (
      !class_name ||
      !date ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date)
    ) {
      return res.status(400).json({
        message: "Please provide a valid class and date."
      });
    }

    // Confirm that this class belongs to the logged-in teacher
    const [assigned] = await db.execute(
      `SELECT id
       FROM teacher_classes
       WHERE teacher_id = ? AND class_name = ?`,
      [req.user.id, class_name]
    );

    if (assigned.length === 0) {
      return res.status(403).json({
        message: "You are not assigned to this class."
      });
    }

    // Retrieve saved attendance for active students only
    const [records] = await db.execute(
      `SELECT
         attendance.student_id,
         attendance.attendance_date,
         attendance.status
       FROM attendance
       INNER JOIN students
         ON attendance.student_id = students.id
       WHERE students.class_name = ?
         AND students.is_archived = 0
         AND attendance.attendance_date = ?
       ORDER BY students.first_name, students.last_name`,
      [class_name, date]
    );

    res.json(records);

  } catch (error) {
    console.error("Teacher attendance history error:", error);
    res.status(500).json({
      message: "Could not retrieve attendance history."
    });
  }
});

// Save attendance only for students in the teacher's assigned class
router.post("/attendance", async (req, res) => {
  try {
    const { student_id, attendance_date, status } = req.body;

    if (
      !Number.isInteger(Number(student_id)) ||
      !attendance_date ||
      !/^\d{4}-\d{2}-\d{2}$/.test(attendance_date) ||
      !["Present", "Absent"].includes(status)
    ) {
      return res.status(400).json({
        message: "Please provide valid attendance details."
      });
    }

    // Verify student is active and belongs to an assigned class
    const [students] = await db.execute(
      `SELECT students.id, students.class_name,
              students.first_name, students.last_name,
              students.parent_phone
       FROM students
       INNER JOIN teacher_classes
         ON students.class_name = teacher_classes.class_name
       WHERE students.id = ?
         AND teacher_classes.teacher_id = ?
         AND students.is_archived = 0`,
      [Number(student_id), req.user.id]
    );

    if (students.length === 0) {
      return res.status(403).json({
        message: "You cannot mark attendance for this student."
      });
    }

    const student = students[0];

    // Check previous attendance status
    const [existingRecords] = await db.execute(
      `SELECT status
       FROM attendance
       WHERE student_id = ? AND attendance_date = ?`,
      [Number(student_id), attendance_date]
    );

    const previousStatus = existingRecords.length > 0
      ? existingRecords[0].status
      : null;

    // Save attendance
    await db.execute(
      `INSERT INTO attendance
       (student_id, attendance_date, status)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE status = VALUES(status)`,
      [Number(student_id), attendance_date, status]
    );

    let smsMessage = "";

    // Notify parent only when the student becomes Absent
    if (status === "Absent" && previousStatus !== "Absent") {
      try {
        const studentName =
          `${student.first_name} ${student.last_name}`;

        await sendAbsenceSMS(
          student.parent_phone,
          studentName,
          attendance_date
        );

        smsMessage = " Parent notification sent.";
      } catch (smsError) {
        console.error("Teacher SMS notification failed:", smsError);
        smsMessage = " Attendance saved, but SMS notification failed.";
      }
    }

    res.status(201).json({
      message: "Attendance saved successfully." + smsMessage
    });

  } catch (error) {
    console.error("Teacher attendance error:", error);
    res.status(500).json({
      message: "Failed to save attendance."
    });
  }
});

module.exports = router;
