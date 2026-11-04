
import { useState } from "react";
import "./App.css";
import AdminDashboard from "./AdminDashboard";

function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password) {
      setError("Please enter your username and password.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed.");
      }

      if (!data.user || !data.token) {
        throw new Error("Login response is missing user details or token.");
      }

      setUser(data.user);
      setToken(data.token);
      setPassword("");

    } catch (err) {
      setError(err.message || "Could not connect to the backend.");
    }
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    setUsername("");
    setPassword("");
    setError("");
  };

  if (user?.role === "admin") {
    return (
     <AdminDashboard
  user={user}
  token={token}
  onLogout={handleLogout}
/>
    );
  }

  if (user?.role === "teacher") {
    return (
      <div className="dashboard">
        <h1>Bright Minds Academy</h1>
        <h2>Teacher Dashboard</h2>
        <p>Welcome, {user.username}!</p>
        <button onClick={handleLogout}>Logout</button>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-container">

        <div className="login-header">
          <h1>Bright Minds Academy</h1>
          <p>Student Attendance Management System</p>
        </div>

        <div className="login-card">
          <h2>Welcome Back</h2>
          <p className="login-subtitle">
            Sign in to access the attendance system
          </p>

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email or Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your email or username"
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>

            <button type="submit" className="login-button">
              Login
            </button>

            {error && <p className="error-message">{error}</p>}
          </form>

          <p className="login-role">
            Authorized Teachers and Administrators
          </p>
        </div>

      </div>
    </div>
  );
}

export default App;

