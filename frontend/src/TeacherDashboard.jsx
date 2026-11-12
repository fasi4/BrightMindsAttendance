
import { useEffect, useState } from "react";
import "./TeacherDashboard.css";

const API_URL = "http://localhost:5000/api";

function getToday() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function TeacherDashboard({ user, token, onLogout }) {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [students, setStudents] = useState([]);
  const [attendanceDate, setAttendanceDate] = useState(getToday());
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  // Load classes assigned to this teacher
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await fetch(`${API_URL}/teacher/classes`, {
          headers,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Could not load classes.");
        }

        setClasses(data);

        if (data.length > 0) {
          setSelectedClass(data[0].class_name);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, [token]);

 
  // Load students and their saved attendance whenever class or date changes
  useEffect(() => {
    if (!selectedClass || !attendanceDate) {
      setStudents([]);
      setAttendance({});
      return;
    }

    const fetchStudentsAndAttendance = async () => {
      try {
        setError("");
        setMessage("");
        setLoading(true);

        // First, retrieve active students in the selected class
        const studentsResponse = await fetch(
          `${API_URL}/teacher/students?class_name=${encodeURIComponent(selectedClass)}`,
          { headers }
        );

        const studentsData = await studentsResponse.json();

        if (!studentsResponse.ok) {
          throw new Error(
            studentsData.message || "Could not load students."
          );
        }

        setStudents(studentsData);

        // Then retrieve previously saved attendance
        const attendanceResponse = await fetch(
          `${API_URL}/teacher/attendance?class_name=${encodeURIComponent(selectedClass)}&date=${attendanceDate}`,
          { headers }
        );

        const attendanceData = await attendanceResponse.json();

        if (!attendanceResponse.ok) {
          throw new Error(
            attendanceData.message || "Could not load attendance history."
          );
        }

        // Convert saved records into the format used by the dashboard
        const savedAttendance = {};

        attendanceData.forEach((record) => {
          savedAttendance[record.student_id] = record.status;
        });

        setAttendance(savedAttendance);

      } catch (err) {
        setError(err.message);
        setAttendance({});
      } finally {
        setLoading(false);
      }
    };

    fetchStudentsAndAttendance();
  }, [selectedClass, attendanceDate, token]);


  const markStudent = (studentId, status) => {
    setAttendance((previous) => ({
      ...previous,
      [studentId]: status,
    }));
  };

  const saveAttendance = async () => {
    setError("");
    setMessage("");

    if (students.length === 0) {
      setError("There are no students to mark.");
      return;
    }

    if (Object.keys(attendance).length !== students.length) {
      setError("Please mark every student as Present or Absent.");
      return;
    }

    try {
      setSaving(true);

      const results = await Promise.all(
        students.map((student) =>
          fetch(`${API_URL}/teacher/attendance`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              student_id: student.id,
              attendance_date: attendanceDate,
              status: attendance[student.id],
            }),
          })
        )
      );

      const failedResponse = results.find((response) => !response.ok);

      if (failedResponse) {
        const data = await failedResponse.json();
        throw new Error(data.message || "Some attendance records could not be saved.");
      }

      setMessage("Attendance saved successfully!");
    } catch (err) {
      setError(err.message || "Failed to save attendance.");
    } finally {
      setSaving(false);
    }
  };

  const presentCount = Object.values(attendance).filter(
    (status) => status === "Present"
  ).length;

  const absentCount = Object.values(attendance).filter(
    (status) => status === "Absent"
  ).length;

  const markedCount = presentCount + absentCount;

  return (
    <div className="teacher-page">
      <header className="teacher-header">
        <div>
          <h1>Bright Minds Academy</h1>
          <p>Student Attendance Management System</p>
        </div>

        <div className="teacher-user">
          <span>Welcome, {user.username}</span>
          <button onClick={onLogout}>Logout</button>
        </div>
      </header>

      <main className="teacher-content">
        <section className="teacher-welcome">
          <div>
            <h2>Teacher Dashboard</h2>
            <p>Manage attendance for your assigned classes.</p>
          </div>
        </section>

        {error && <div className="teacher-alert error">{error}</div>}
        {message && <div className="teacher-alert success">{message}</div>}

        {loading && <p className="teacher-loading">Loading...</p>}

        {!loading && (
          <>
            <section className="teacher-summary">
              <div className="teacher-summary-card">
                <span>Assigned Classes</span>
                <strong>{classes.length}</strong>
              </div>

              <div className="teacher-summary-card">
                <span>Total Students</span>
                <strong>{students.length}</strong>
              </div>

              <div className="teacher-summary-card">
                <span>Present</span>
                <strong>{presentCount}</strong>
              </div>

              <div className="teacher-summary-card">
                <span>Absent</span>
                <strong>{absentCount}</strong>
              </div>
            </section>

            <section className="teacher-attendance-card">
              <h3>Mark Student Attendance</h3>

              {classes.length === 0 ? (
                <p>
                  No classes have been assigned to your account.
                  Please contact the administrator.
                </p>
              ) : (
                <>
                  <div className="teacher-filters">
                    <div>
                      <label htmlFor="teacher-class">Select Class</label>
                      <select
                        id="teacher-class"
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                      >
                        {classes.map((item) => (
                          <option
                            key={item.class_name}
                            value={item.class_name}
                          >
                            {item.class_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="attendance-date">Attendance Date</label>
                      <input
                        id="attendance-date"
                        type="date"
                        value={attendanceDate}
                       onChange={(e) => {
                        setAttendanceDate(e.target.value);
                        setMessage("");
                        setError("");
                      }}
                      />
                    </div>
                  </div>

                  <div className="teacher-progress">
                    <span>
                      Marked: {markedCount} of {students.length}
                    </span>
                    <span>
                      {students.length > 0
                        ? Math.round((markedCount / students.length) * 100)
                        : 0}%
                    </span>
                  </div>

                  <div className="teacher-table-wrapper">
                    <table className="teacher-table">
                      <thead>
                        <tr>
                          <th>Admission No.</th>
                          <th>Student Name</th>
                          <th>Attendance Status</th>
                        </tr>
                      </thead>

                      <tbody>
                        {students.map((student) => (
                          <tr key={student.id}>
                            <td>{student.admission_number}</td>
                            <td>
                              {student.first_name} {student.last_name}
                            </td>
                            <td>
                              <div className="attendance-actions">
                                <button
                                  className={
                                    attendance[student.id] === "Present"
                                      ? "status-button present active"
                                      : "status-button present"
                                  }
                                  onClick={() =>
                                    markStudent(student.id, "Present")
                                  }
                                >
                                  Present
                                </button>

                                <button
                                  className={
                                    attendance[student.id] === "Absent"
                                      ? "status-button absent active"
                                      : "status-button absent"
                                  }
                                  onClick={() =>
                                    markStudent(student.id, "Absent")
                                  }
                                >
                                  Absent
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}

                        {students.length === 0 && (
                          <tr>
                            <td colSpan="3">
                              No students found in this class.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {students.length > 0 && (
                    <button
                      className="save-attendance-button"
                      onClick={saveAttendance}
                      disabled={saving || markedCount !== students.length}
                    >
                      {saving ? "Saving..." : "Save Attendance"}
                    </button>
                  )}
                </>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default TeacherDashboard;
