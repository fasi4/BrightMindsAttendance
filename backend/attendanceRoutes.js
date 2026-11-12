
const express = require("express");
const router = express.Router();
const db = require("./db");

const { authenticateToken, requireAdmin } = require("./authMiddleware");
const { sendAbsenceSMS } = require("./smsService");

router.use(authenticateToken, requireAdmin);

// Retrieve attendance records, optionally filtered by date and class
router.get("/", async (req, res) => {
    try {
        const { date, class_name } = req.query;

        let sql = `
            SELECT
                attendance.id,
                attendance.student_id,
                students.admission_number,
                students.first_name,
                students.last_name,
                students.class_name,
                attendance.attendance_date,
                attendance.status
            FROM attendance
            JOIN students ON attendance.student_id = students.id
            WHERE 1 = 1
        `;

        const params = [];

        if (date) {
            sql += " AND attendance.attendance_date = ?";
            params.push(date);
        }

        if (class_name) {
            sql += " AND students.class_name = ?";
            params.push(class_name);
        }

        sql += " ORDER BY attendance.attendance_date DESC";

        const [records] = await db.execute(sql, params);
        res.json(records);

    } catch (error) {
        console.error("Fetch attendance error:", error);
        res.status(500).json({
            message: "Failed to retrieve attendance."
        });
    }
});

// Generate attendance reports for a date range
router.get("/reports", async (req, res) => {
    try {
        const { start_date, end_date, class_name } = req.query;

        const datePattern = /^\d{4}-\d{2}-\d{2}$/;

        if (
            !datePattern.test(start_date || "") ||
            !datePattern.test(end_date || "")
        ) {
            return res.status(400).json({
                message: "Please provide valid start and end dates."
            });
        }

        if (start_date > end_date) {
            return res.status(400).json({
                message: "Start date cannot be after end date."
            });
        }

        let sql = `
            SELECT
                attendance.id,
                attendance.student_id,
                students.admission_number,
                students.first_name,
                students.last_name,
                students.class_name,
                DATE_FORMAT(
                    attendance.attendance_date, '%Y-%m-%d'
                ) AS attendance_date,
                attendance.status
            FROM attendance
            INNER JOIN students
                ON attendance.student_id = students.id
           WHERE attendance.attendance_date BETWEEN ? AND ?
  AND students.is_archived = 0
        `;

        const params = [start_date, end_date];

        if (class_name) {
            sql += " AND students.class_name = ?";
            params.push(class_name);
        }

        sql += " ORDER BY attendance.attendance_date DESC, students.first_name ASC";

        const [records] = await db.execute(sql, params);

        const present = records.filter(
            record => record.status === "Present"
        ).length;

        const absent = records.filter(
            record => record.status === "Absent"
        ).length;

        const total = records.length;

        const percentage = total > 0
            ? Number(((present / total) * 100).toFixed(2))
            : 0;

        res.json({
            summary: {
                total,
                present,
                absent,
                attendancePercentage: percentage
            },
            records
        });

    } catch (error) {
        console.error("Attendance report error:", error);

        res.status(500).json({
            message: "Failed to generate attendance report."
        });
    }
});

module.exports = router;
