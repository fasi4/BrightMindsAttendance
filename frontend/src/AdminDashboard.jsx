
import { useEffect, useState } from "react";
import API_BASE_URL from "./api";

function AdminDashboard({ user, token, onLogout }) {
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [archivedStudents, setArchivedStudents] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [showTeacherForm, setShowTeacherForm] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    admission_number: "",
    first_name: "",
    last_name: "",
    class_name: "",
    parent_name: "",
    parent_phone: ""
  });

  const [teacherData, setTeacherData] = useState({
    username: "",
    password: "",
    class_name: ""
  });

  const today = new Date();

  const localDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0")
  ].join("-");

  const [attendanceDate, setAttendanceDate] = useState(localDate);
  const [selectedClass, setSelectedClass] = useState("");
  const [attendance, setAttendance] = useState({});
  const [attendanceRecords, setAttendanceRecords] = useState([]);

  // Report states
  const [reportStartDate, setReportStartDate] = useState(localDate);
  const [reportEndDate, setReportEndDate] = useState(localDate);
  const [reportClass, setReportClass] = useState("");
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState("");

  const [savingAttendance, setSavingAttendance] = useState(false);

  // Student editing states
  const [editingStudent, setEditingStudent] = useState(null);

  const [editStudentData, setEditStudentData] = useState({
    admission_number: "",
    first_name: "",
    last_name: "",
    class_name: "",
    parent_name: "",
    parent_phone: ""
  });

  const headers = {
    Authorization: `Bearer ${token}`
  };

  const classes = [
    ...new Set(students.map(student => student.class_name))
  ].sort();

  // Fetch registered students
  const fetchStudents = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/students`,
        { headers }
      );

      if (!response.ok) {
        throw new Error("Could not load students.");
      }

      const data = await response.json();
      setStudents(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch archived students
  const fetchArchivedStudents = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/students/archived`,
        { headers }
      );

      if (!response.ok) {
        throw new Error("Could not load archived students.");
      }

      const data = await response.json();
      setArchivedStudents(data);
    } catch (err) {
      setError(err.message);
    }
  };

  // Fetch registered teachers
  const fetchTeachers = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/teachers`,
        { headers }
      );

      if (!response.ok) {
        throw new Error("Could not load teachers.");
      }

      const data = await response.json();
      setTeachers(data);
    } catch (err) {
      setError(err.message);
    }
  };

  // Fetch attendance records
  const fetchAttendance = async () => {
    try {
      const params = new URLSearchParams({
        date: attendanceDate
      });

      if (selectedClass) {
        params.append("class_name", selectedClass);
      }

      const response = await fetch(
        `${API_BASE_URL}/api/attendance?${params}`,
        { headers }
      );

      if (!response.ok) {
        throw new Error("Could not load attendance records.");
      }

      const records = await response.json();
      setAttendanceRecords(records);

      const savedStatuses = {};

      records.forEach(record => {
        savedStatuses[record.student_id] = record.status;
      });

      setAttendance(savedStatuses);
    } catch (err) {
      setError(err.message);
    }
  };

  // Load dashboard data
  useEffect(() => {
    if (token) {
      fetchStudents();
      fetchTeachers();
      fetchArchivedStudents();
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchAttendance();
    }
  }, [token, attendanceDate, selectedClass]);

  // Student registration form
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Register a new student
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/students`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...headers
          },
          body: JSON.stringify(formData)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to add student.");
      }

      setSuccess("Student added successfully!");

      setFormData({
        admission_number: "",
        first_name: "",
        last_name: "",
        class_name: "",
        parent_name: "",
        parent_phone: ""
      });

      setShowForm(false);
      await fetchStudents();
    } catch (err) {
      setError(err.message);
    }
  };

  // Open student edit form
  const handleEditStudent = (student) => {
    setEditingStudent(student.id);

    setEditStudentData({
      admission_number: student.admission_number || "",
      first_name: student.first_name || "",
      last_name: student.last_name || "",
      class_name: student.class_name || "",
      parent_name: student.parent_name || "",
      parent_phone: student.parent_phone || ""
    });

    setError("");
    setSuccess("");
    setShowForm(false);
  };

  // Handle changes in edit form
  const handleEditChange = (e) => {
    setEditStudentData({
      ...editStudentData,
      [e.target.name]: e.target.value
    });
  };

  // Save edited student details
  const handleUpdateStudent = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/students/${editingStudent}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...headers
          },
          body: JSON.stringify(editStudentData)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update student.");
      }

      setSuccess("Student details updated successfully!");
      setEditingStudent(null);

      await fetchStudents();
    } catch (err) {
      setError(err.message);
    }
  };

  // Cancel student editing
  const cancelEditStudent = () => {
    setEditingStudent(null);

    setEditStudentData({
      admission_number: "",
      first_name: "",
      last_name: "",
      class_name: "",
      parent_name: "",
      parent_phone: ""
    });
  };

  // Archive student instead of permanently deleting
  const handleDeleteStudent = async (studentId) => {
    const confirmed = window.confirm(
      "Are you sure you want to archive this student? Their attendance history will be preserved."
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/students/${studentId}`,
        {
          method: "DELETE",
          headers
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to archive student.");
      }

      setSuccess("Student archived successfully. Attendance history preserved!");

      if (editingStudent === studentId) {
        cancelEditStudent();
      }

      await fetchStudents();
      await fetchArchivedStudents();
      await fetchAttendance();
    } catch (err) {
      setError(err.message);
    }
  };

  // Restore an archived student
  const handleRestoreStudent = async (studentId) => {
    const confirmed = window.confirm(
      "Are you sure you want to restore this student?"
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/students/${studentId}/restore`,
        {
          method: "PUT",
          headers
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to restore student.");
      }

      setSuccess("Student restored successfully!");

      await fetchStudents();
      await fetchArchivedStudents();
    } catch (err) {
      setError(err.message);
    }
  };

  // Teacher form
  const handleTeacherChange = (e) => {
    setTeacherData({
      ...teacherData,
      [e.target.name]: e.target.value
    });
  };

  // Create teacher account and assign class
  const handleCreateTeacher = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/teachers`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...headers
          },
          body: JSON.stringify({
            username: teacherData.username,
            password: teacherData.password
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create teacher.");
      }

      try {
        const assignResponse = await fetch(
          `${API_BASE_URL}/api/teachers/${data.teacherId}/classes`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...headers
            },
            body: JSON.stringify({
              class_name: teacherData.class_name
            })
          }
        );

        const assignData = await assignResponse.json();

        if (!assignResponse.ok) {
          throw new Error(
            assignData.message || "Class assignment failed."
          );
        }

        setSuccess(
          "Teacher account created and class assigned successfully!"
        );
      } catch (assignError) {
        setSuccess(
          `Teacher account created, but class assignment failed: ${assignError.message}`
        );
      }

      setTeacherData({
        username: "",
        password: "",
        class_name: ""
      });

      setShowTeacherForm(false);
      await fetchTeachers();
    } catch (err) {
      setError(err.message);
    }
  };

  // Delete teacher
  const handleDeleteTeacher = async (teacherId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this teacher account?"
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/teachers/${teacherId}`,
        {
          method: "DELETE",
          headers
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete teacher.");
      }

      setSuccess("Teacher account deleted successfully!");
      await fetchTeachers();
    } catch (err) {
      setError(err.message);
    }
  };

  // Generate attendance report
  const generateReport = async () => {
    setReportError("");
    setReportData(null);

    if (!reportStartDate || !reportEndDate) {
      setReportError("Please select both report dates.");
      return;
    }

    if (reportStartDate > reportEndDate) {
      setReportError("Start date cannot be after end date.");
      return;
    }

    setReportLoading(true);

    try {
      const params = new URLSearchParams({
        start_date: reportStartDate,
        end_date: reportEndDate
      });

      if (reportClass) {
        params.append("class_name", reportClass);
      }

      const response = await fetch(
        `${API_BASE_URL}/api/attendance/reports?${params}`,
        { headers }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to generate report.");
      }

      setReportData(data);
    } catch (err) {
      setReportError(err.message);
    } finally {
      setReportLoading(false);
    }
  };

  // Download attendance report as CSV
  const downloadReportCSV = () => {
    if (!reportData || reportData.records.length === 0) {
      setReportError("There are no records to download.");
      return;
    }

    const columns = [
      "Admission Number",
      "First Name",
      "Last Name",
      "Class",
      "Attendance Date",
      "Status"
    ];

    const rows = reportData.records.map(record => [
      record.admission_number,
      record.first_name,
      record.last_name,
      record.class_name,
      record.attendance_date,
      record.status
    ]);

    const escapeCSV = value =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const csvContent = [
      columns,
      ...rows
    ].map(row => row.map(escapeCSV).join(",")).join("\n");

    const blob = new Blob(
      ["\uFEFF" + csvContent],
      { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `BrightMinds_Attendance_${reportStartDate}_to_${reportEndDate}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  // Attendance functions
  const markStudent = (studentId, status) => {
    setAttendance(previous => ({
      ...previous,
      [studentId]: status
    }));
  };

  // Save attendance
  const saveAttendance = async () => {
    const classStudents = students.filter(
      student =>
        !selectedClass || student.class_name === selectedClass
    );

    const unmarked = classStudents.filter(
      student => !attendance[student.id]
    );

    if (unmarked.length > 0) {
      setError(
        `Please mark all students. ${unmarked.length} student(s) are not marked.`
      );
      return;
    }

    setSavingAttendance(true);

    try {
      for (const student of classStudents) {
        const response = await fetch(
          `${API_BASE_URL}/api/attendance`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...headers
            },
            body: JSON.stringify({
              student_id: student.id,
              attendance_date: attendanceDate,
              status: attendance[student.id]
            })
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to save attendance."
          );
        }
      }

      setSuccess("Attendance saved successfully!");
      await fetchAttendance();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingAttendance(false);
    }
  };

  const classStudents = students.filter(
    student =>
      !selectedClass || student.class_name === selectedClass
  );

  const presentCount = classStudents.filter(
    student => attendance[student.id] === "Present"
  ).length;

  const absentCount = classStudents.filter(
    student => attendance[student.id] === "Absent"
  ).length;

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <h2>BMA</h2>
          <p>Bright Minds Academy</p>
        </div>

        <nav className="sidebar-nav">
          <a href="#overview" className="active">Dashboard</a>
          <a href="#students">Students</a>
          <a href="#archived">Archived Students</a>
          <a href="#teachers">Teachers</a>
          <a href="#attendance">Attendance Records</a>
          <a href="#reports">Reports</a>
        </nav>

        <button className="logout-button" onClick={onLogout}>
          Logout
        </button>
      </aside>

      <main className="admin-main" id="overview">
        <header className="dashboard-header">
          <div>
            <h1>Administrator Dashboard</h1>
            <p>Welcome back, {user?.username || "Administrator"}!</p>
          </div>

          <div className="admin-profile">
            <div className="profile-avatar">A</div>
            <span>{user?.username || "Admin"}</span>
          </div>
        </header>

        {/* Overview */}
        <section className="dashboard-section">
          <h2>Overview</h2>
          <p className="section-description">
            Summary of school attendance activities.
          </p>

          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-icon">👨‍🎓</span>
              <h3>Total Students</h3>
              <p className="stat-number">{students.length}</p>
              <small>Registered students</small>
            </div>

            <div className="stat-card">
              <span className="stat-icon">👩‍🏫</span>
              <h3>Total Teachers</h3>
              <p className="stat-number">{teachers.length}</p>
              <small>Registered teachers</small>
            </div>

            <div className="stat-card">
              <span className="stat-icon">✅</span>
              <h3>Present Today</h3>
              <p className="stat-number">
                {attendanceDate === localDate ? presentCount : "--"}
              </p>
              <small>Based on selected class</small>
            </div>

            <div className="stat-card">
              <span className="stat-icon">❌</span>
              <h3>Absent Today</h3>
              <p className="stat-number">
                {attendanceDate === localDate ? absentCount : "--"}
              </p>
              <small>Based on selected class</small>
            </div>
          </div>
        </section>

        {/* Student Management */}
        <section className="dashboard-section" id="students">
          <div className="section-heading-row">
            <div>
              <h2>Student Management</h2>
              <p className="section-description">
                Register and manage student information.
              </p>
            </div>

            <button
              className="add-student-button"
              onClick={() => {
                setShowForm(!showForm);
                setEditingStudent(null);
                setError("");
                setSuccess("");
              }}
            >
              {showForm ? "Close Form" : "+ Add Student"}
            </button>
          </div>

          {error && <p className="error-message">{error}</p>}
          {success && <p className="success-message">{success}</p>}

          {/* New student form */}
          {showForm && (
            <form className="student-form" onSubmit={handleSubmit}>
              <h3>Register New Student</h3>

              <div className="student-form-grid">
                <input
                  name="admission_number"
                  placeholder="Admission Number"
                  value={formData.admission_number}
                  onChange={handleChange}
                  required
                />

                <input
                  name="first_name"
                  placeholder="First Name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                />

                <input
                  name="last_name"
                  placeholder="Last Name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                />

                <input
                  name="class_name"
                  placeholder="Class (e.g. Grade 5)"
                  value={formData.class_name}
                  onChange={handleChange}
                  required
                />

                <input
                  name="parent_name"
                  placeholder="Parent/Guardian Name"
                  value={formData.parent_name}
                  onChange={handleChange}
                />

                <input
                  name="parent_phone"
                  placeholder="Parent Phone Number"
                  value={formData.parent_phone}
                  onChange={handleChange}
                />
              </div>

              <button type="submit" className="add-student-button">
                Save Student
              </button>
            </form>
          )}

          {/* Edit student form */}
          {editingStudent !== null && (
            <form
              className="student-form"
              onSubmit={handleUpdateStudent}
            >
              <h3>Edit Student Details</h3>

              <div className="student-form-grid">
                <input
                  name="admission_number"
                  placeholder="Admission Number"
                  value={editStudentData.admission_number}
                  onChange={handleEditChange}
                  required
                />

                <input
                  name="first_name"
                  placeholder="First Name"
                  value={editStudentData.first_name}
                  onChange={handleEditChange}
                  required
                />

                <input
                  name="last_name"
                  placeholder="Last Name"
                  value={editStudentData.last_name}
                  onChange={handleEditChange}
                  required
                />

                <input
                  name="class_name"
                  placeholder="Class"
                  value={editStudentData.class_name}
                  onChange={handleEditChange}
                  required
                />

                <input
                  name="parent_name"
                  placeholder="Parent/Guardian Name"
                  value={editStudentData.parent_name}
                  onChange={handleEditChange}
                />

                <input
                  name="parent_phone"
                  placeholder="Parent Phone Number"
                  value={editStudentData.parent_phone}
                  onChange={handleEditChange}
                />
              </div>

              <button type="submit" className="add-student-button">
                Update Student
              </button>

              <button
                type="button"
                className="logout-button"
                onClick={cancelEditStudent}
              >
                Cancel
              </button>
            </form>
          )}

          {/* Registered students table */}
          <div className="student-table-container">
            <h3>Registered Students</h3>

            {loading ? (
              <p>Loading students...</p>
            ) : students.length === 0 ? (
              <p className="empty-message">
                No students registered yet.
              </p>
            ) : (
              <table className="student-table">
                <thead>
                  <tr>
                    <th>Admission No.</th>
                    <th>First Name</th>
                    <th>Last Name</th>
                    <th>Class</th>
                    <th>Parent</th>
                    <th>Phone</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {students.map(student => (
                    <tr key={student.id}>
                      <td>{student.admission_number}</td>
                      <td>{student.first_name}</td>
                      <td>{student.last_name}</td>
                      <td>{student.class_name}</td>
                      <td>{student.parent_name || "-"}</td>
                      <td>{student.parent_phone || "-"}</td>

                      <td>
                        <button
                          type="button"
                          className="add-student-button"
                          onClick={() => handleEditStudent(student)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="archive-button"
                          onClick={() => handleDeleteStudent(student.id)}
                        >
                          Archive
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Archived Students */}
        <section className="dashboard-section" id="archived">
          <div className="section-heading-row">
            <div>
              <h2>Archived Students</h2>
              <p className="section-description">
                View previously archived students and restore their accounts.
                Their attendance history is preserved.
              </p>
            </div>

            <span className="stat-number">
              {archivedStudents.length} Archived
            </span>
          </div>

          <div className="student-table-container">
            {archivedStudents.length === 0 ? (
              <p className="empty-message">
                No archived students found.
              </p>
            ) : (
              <table className="student-table">
                <thead>
                  <tr>
                    <th>Admission No.</th>
                    <th>First Name</th>
                    <th>Last Name</th>
                    <th>Class</th>
                    <th>Parent</th>
                    <th>Phone</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {archivedStudents.map(student => (
                    <tr key={student.id}>
                      <td>{student.admission_number}</td>
                      <td>{student.first_name}</td>
                      <td>{student.last_name}</td>
                      <td>{student.class_name}</td>
                      <td>{student.parent_name || "-"}</td>
                      <td>{student.parent_phone || "-"}</td>

                      <td>
                        <button
                          type="button"
                          className="add-student-button"
                          onClick={() => handleRestoreStudent(student.id)}
                        >
                          Restore
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Teacher Management */}
        <section className="dashboard-section" id="teachers">
          <div className="section-heading-row">
            <div>
              <h2>Teacher Management</h2>
              <p className="section-description">
                Create teacher accounts and assign classes.
              </p>
            </div>

            <button
              className="add-student-button"
              onClick={() => {
                setShowTeacherForm(!showTeacherForm);
                setError("");
                setSuccess("");
              }}
            >
              {showTeacherForm ? "Close Form" : "+ Add Teacher"}
            </button>
          </div>

          {showTeacherForm && (
            <form
              className="student-form"
              onSubmit={handleCreateTeacher}
            >
              <h3>Create Teacher Account</h3>

              {classes.length === 0 ? (
                <p className="error-message">
                  Register students and their classes before assigning teachers.
                </p>
              ) : (
                <>
                  <div className="student-form-grid">
                    <input
                      name="username"
                      placeholder="Teacher Username"
                      value={teacherData.username}
                      onChange={handleTeacherChange}
                      required
                    />

                    <input
                      name="password"
                      type="password"
                      placeholder="Password (minimum 8 characters)"
                      value={teacherData.password}
                      onChange={handleTeacherChange}
                      minLength="8"
                      required
                    />

                    <select
                      name="class_name"
                      value={teacherData.class_name}
                      onChange={handleTeacherChange}
                      required
                    >
                      <option value="">Select Class to Assign</option>

                      {classes.map(className => (
                        <option key={className} value={className}>
                          {className}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="add-student-button"
                  >
                    Create Teacher Account
                  </button>
                </>
              )}
            </form>
          )}

          <div className="student-table-container">
            <h3>Registered Teachers</h3>

            {teachers.length === 0 ? (
              <p className="empty-message">
                No teachers registered yet.
              </p>
            ) : (
              <table className="student-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Assigned Classes</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {teachers.map(teacher => (
                    <tr key={teacher.id}>
                      <td>{teacher.username}</td>
                      <td>{teacher.assigned_classes || "Not assigned"}</td>

                      <td>
                        <button
                          type="button"
                          className="logout-button"
                          onClick={() => handleDeleteTeacher(teacher.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Attendance Management */}
        <section className="dashboard-section" id="attendance">
          <h2>Attendance Records</h2>

          <p className="section-description">
            View student attendance records submitted by teachers.
          </p>

          <div className="student-form-grid">
            <label>
              Select Class

              <select
                value={selectedClass}
                onChange={e => setSelectedClass(e.target.value)}
              >
                <option value="">All Classes</option>

                {classes.map(className => (
                  <option key={className} value={className}>
                    {className}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Attendance Date

              <input
                type="date"
                value={attendanceDate}
                onChange={e => setAttendanceDate(e.target.value)}
              />
            </label>
          </div>

          <h3>Saved Attendance Records</h3>

          {attendanceRecords.length === 0 ? (
            <p>No attendance records for this date yet.</p>
          ) : (
            <div className="student-table-container">
              <table className="student-table">
                <thead>
                  <tr>
                    <th>Admission No.</th>
                    <th>Student Name</th>
                    <th>Class</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {attendanceRecords.map(record => (
                    <tr key={record.id}>
                      <td>{record.admission_number}</td>

                      <td>
                        {record.first_name} {record.last_name}
                      </td>

                      <td>{record.class_name}</td>

                      <td>
                        {String(record.attendance_date).slice(0, 10)}
                      </td>

                      <td>{record.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Reports */}
        <section className="dashboard-section" id="reports">
          <h2>Attendance Reports</h2>

          <p className="section-description">
            Generate attendance reports by date range and class.
          </p>

          <div className="student-form-grid">
            <label>
              Start Date

              <input
                type="date"
                value={reportStartDate}
                onChange={e => setReportStartDate(e.target.value)}
              />
            </label>

            <label>
              End Date

              <input
                type="date"
                value={reportEndDate}
                onChange={e => setReportEndDate(e.target.value)}
              />
            </label>

            <label>
              Select Class

              <select
                value={reportClass}
                onChange={e => setReportClass(e.target.value)}
              >
                <option value="">All Classes</option>

                {classes.map(className => (
                  <option key={className} value={className}>
                    {className}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <button
            className="add-student-button"
            onClick={generateReport}
            disabled={reportLoading}
          >
            {reportLoading ? "Generating..." : "Generate Report"}
          </button>

          {reportError && (
            <p className="error-message">{reportError}</p>
          )}

          {reportData && (
            <>
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>Total Records</h3>
                  <p className="stat-number">
                    {reportData.summary.total}
                  </p>
                </div>

                <div className="stat-card">
                  <h3>Present</h3>
                  <p className="stat-number">
                    {reportData.summary.present}
                  </p>
                </div>

                <div className="stat-card">
                  <h3>Absent</h3>
                  <p className="stat-number">
                    {reportData.summary.absent}
                  </p>
                </div>

                <div className="stat-card">
                  <h3>Attendance Rate</h3>
                  <p className="stat-number">
                    {reportData.summary.attendancePercentage}%
                  </p>
                </div>
              </div>

              <div className="section-heading-row">
                <h3>Report Details</h3>

                <button
                  className="add-student-button"
                  onClick={downloadReportCSV}
                  disabled={reportData.records.length === 0}
                >
                  Download CSV
                </button>
              </div>

              {reportData.records.length === 0 ? (
                <p className="empty-message">
                  No attendance records found for this selection.
                </p>
              ) : (
                <div className="student-table-container">
                  <table className="student-table">
                    <thead>
                      <tr>
                        <th>Admission No.</th>
                        <th>Student</th>
                        <th>Class</th>
                        <th>Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      {reportData.records.map(record => (
                        <tr key={record.id}>
                          <td>{record.admission_number}</td>

                          <td>
                            {record.first_name} {record.last_name}
                          </td>

                          <td>{record.class_name}</td>
                          <td>{record.attendance_date}</td>
                          <td>{record.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </section>

        <footer className="dashboard-footer">
          Bright Minds Academy © 2026
          <p>Student Attendance Management System</p>
        </footer>
      </main>
    </div>
  );
}

export default AdminDashboard;
