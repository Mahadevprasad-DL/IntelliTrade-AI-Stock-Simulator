import React, { useState } from "react";
import "./Login.css";
import bg from "./assets/home.jpeg";

function Login({ onRegister, onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validateEmail = (email) => {
    return /^\S+@\S+\.\S+$/.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    if (!email || !password) {
      setMessage("Email and password are required");
      return;
    }
    if (!validateEmail(email)) {
      setMessage("Invalid email format");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("http://localhost:4000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("");
        if (onLoginSuccess) {
          onLoginSuccess({ username: data.username, email });
        }
      } else {
        if (data && data.message) {
          setMessage(data.message);
        } else {
          setMessage("Incorrect email or password");
        }
      }
    } catch (err) {
      setMessage("Server error");
    }
    setLoading(false);
  };

  return (
    <div className="login-container">

      {/* LEFT SIDE */}
      <div className="login-left">

        <img src={bg} alt="background" />

        <div className="login-text">
          <h1>
            Welcome Back to <br />
            IntelliTrade
          </h1>

          <p>
            Login to continue trading in trusted markets.
          </p>
        </div>

      </div>


      {/* RIGHT SIDE */}
      <div className="login-right">

        <form className="form-card" onSubmit={handleSubmit}>

          <div className="form-header">
            <h2>Sign In</h2>
            <span className="close-btn">×</span>
          </div>


          {/* EMAIL */}

          <div className="form-group">
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} />
            <label>Email Address</label>
          </div>


          {/* PASSWORD */}

          <div className="form-group password-group">
            <input 
              type={showPassword ? "text" : "password"} 
              required 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
            />
            <label>Password</label>
            <span 
              className="password-toggle-icon"
              onClick={() => setShowPassword(!showPassword)}
              style={{ cursor: "pointer" }}
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "👁️" : "👁️‍🗨️"}
            </span>
          </div>


          {/* BUTTON */}

          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? "Logging in..." : "LOGIN"}
          </button>

          {message && <div style={{ color: "red", marginTop: 10 }}>{message}</div>}


          {/* REGISTER LINK */}
          <p className="register-text">
            Don't have an account?
            <span onClick={onRegister}> Register</span>
          </p>

        </form>

      </div>

    </div>
  );
}

export default Login;