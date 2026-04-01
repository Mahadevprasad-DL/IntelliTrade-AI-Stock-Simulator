import React, { useState } from "react";
import "./Register.css";
import bg from "./assets/home.jpeg";

function Register({ onSignIn }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    country: "",
    phone: "",
    password: "",
  });

  const validateEmail = (email) => {
    // Simple email regex
    return /^\S+@\S+\.\S+$/.test(email);
  };

  const validateName = (value) => {
    return /^[A-Za-z ]{2,50}$/.test(value.trim());
  };

  const validatePhone = (value) => {
    return /^\d{10}$/.test(value);
  };

  const validatePassword = (value) => {
    // At least 8 chars, one letter and one number.
    return /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(value);
  };

  const validateForm = () => {
    const newErrors = {
      name: "",
      email: "",
      country: "",
      phone: "",
      password: "",
    };

    if (!name.trim()) {
      newErrors.name = "Name is required";
    } else if (!validateName(name)) {
      newErrors.name = "Name must be 2-50 letters only";
    }

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(email)) {
      newErrors.email = "Invalid email format";
    }

    if (!country) {
      newErrors.country = "Country is required";
    }

    if (!phone) {
      newErrors.phone = "Phone number is required";
    } else if (!validatePhone(phone)) {
      newErrors.phone = "Phone number must be exactly 10 digits";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (!validatePassword(password)) {
      newErrors.password = "Password must be 8+ chars with letters and numbers";
    }

    setErrors(newErrors);

    return !Object.values(newErrors).some(Boolean);
  };

  const clearFieldError = (field) => {
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    if (!validateForm()) {
      setMessage("Please fix the highlighted fields");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("http://localhost:4000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: name,
          email,
          password,
          country,
          phone,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Account created successfully!");
        setTimeout(() => {
          onSignIn();
        }, 1200);
      } else {
        setMessage(data.message || "Registration failed");
      }
    } catch (err) {
      setMessage("Server error");
    }
    setLoading(false);
  };

  return (
    <div className="register-container">

      {/* LEFT SIDE */}
      <div className="register-left">
        <img src={bg} alt="background" />

        <div className="left-text">
          <h1>
            AI Trade in the world's <br />
            most trusted markets.
          </h1>
          <p className="brand">IntelliTrade</p>
        </div>
      </div>


      {/* RIGHT SIDE */}
      <div className="register-right">

          <form className="form-card" onSubmit={handleSubmit}>

          <div className="form-header">
            <h2>Registration Form</h2>
            <span className="close-btn">×</span>
          </div>


          <div className="form-group">
            <input
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                clearFieldError("name");
              }}
            />
            <label>Name</label>
            {errors.name && <p className="field-error">{errors.name}</p>}
          </div>

          <div className="form-group">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearFieldError("email");
              }}
            />
            <label>Email address</label>
            {errors.email && <p className="field-error">{errors.email}</p>}
          </div>

          <div className="form-group">
            <select
              required
              value={country}
              onChange={(e) => {
                setCountry(e.target.value);
                clearFieldError("country");
              }}
            >
              <option value=""></option>
              <option>India</option>
              <option>United States</option>
              <option>United Kingdom</option>
            </select>
            <label>Country</label>
            {errors.country && <p className="field-error">{errors.country}</p>}
          </div>

          <div className="form-group">
            <input
              type="text"
              required
              value={phone}
              maxLength={10}
              inputMode="numeric"
              onChange={(e) => {
                const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 10);
                setPhone(digitsOnly);
                clearFieldError("phone");
              }}
            />
            <label>Phone</label>
            {errors.phone && <p className="field-error">{errors.phone}</p>}
          </div>

          <div className="form-group password-group">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearFieldError("password");
              }}
            />
            <label>Password</label>
            <span
              className="password-toggle-icon"
              onClick={() => setShowPassword((prev) => !prev)}
              title={showPassword ? "Hide password" : "Show password"}
              aria-label={showPassword ? "Hide password" : "Show password"}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setShowPassword((prev) => !prev);
                }
              }}
            >
              &#128065;
            </span>
            {errors.password && <p className="field-error">{errors.password}</p>}
          </div>


          <button className="create-btn" type="submit" disabled={loading}>
            {loading ? "Creating..." : "CREATE ACCOUNT"}
          </button>

          {message && <div style={{ color: message.includes("success") ? "green" : "red", marginTop: 10 }}>{message}</div>}


          <p className="signin-text">
            Already have an account?
            <span onClick={onSignIn}> Sign in</span>
          </p>

        </form>
      </div>
    </div>
  );
}

export default Register;