
import { useEffect, useState } from "react";

function AdminDashboard({ user, token,onLogout }) {
  const [students, setStudents] = useState([]);
  const [showForm, setShowForm] = useState(false);
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

  const fetchStudents = async () => {
  try {
    const response = await fetch("http://localhost:5000/api/students", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

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

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await fetch("http://localhost:5000/api/students", {
        method: "POST",
        headers: {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`
},
        body: JSON.stringify(formData)
      });

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
      fetchStudents();
    } catch (err) {
      setError(err.message);
    }
  };

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
              <p className="stat-number">--</p>
              <small>Teacher records pending</small>
            </div>

            <div className="stat-card">
              <span className="stat-icon">✅</span>
              <h3>Present Today</h3>
              <p className="stat-number">--</p>
              <small>Attendance records pending</small>
            </div>

            <div className="stat-card">
              <span className="stat-icon">❌</span>
              <h3>Absent Today</h3>
              <p className="stat-number">--</p>
              <small>Attendance records pending</small>
            </div>
          </div>
        </section>

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
                setError("");
                setSuccess("");
              }}
            >
              {showForm ? "Close Form" : "+ Add Student"}
            </button>
          </div>

          {error && <p className="error-message">{error}</p>}
          {success && <p className="success-message">{success}</p>}

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

          <div className="student-table-container">
            <h3>Registered Students</h3>

            {loading ? (
              <p>Loading students...</p>
            ) : students.length === 0 ? (
              <p className="empty-message">
                No students registered yet. Click Add Student to begin.
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
                  </tr>
                </thead>

                <tbody>
                  {students.map((student) => (
                    <tr key={student.id}>
                      <td>{student.admission_number}</td>
                      <td>{student.first_name}</td>
                      <td>{student.last_name}</td>
                      <td>{student.class_name}</td>
                      <td>{student.parent_name || "-"}</td>
                      <td>{student.parent_phone || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <section className="dashboard-section" id="teachers">
          <h2>Teacher Management</h2>
          <p>Teacher management will be implemented next.</p>
        </section>

        <section className="dashboard-section" id="attendance">
          <h2>Attendance Records</h2>
          <p>Attendance management will be implemented next.</p>
        </section>

        <section className="dashboard-section" id="reports">
          <h2>Reports</h2>
          <p>Attendance reports will be implemented next.</p>
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
