import React, { useState } from 'react';
import '../App.css';

const SignUpPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
  };

  return (
    <div className="signup-page">
      <div className="signup-container">
        
        {/* Left Section - Site Heading */}
        <div className="signup-left-section">
          <span className="warq-logo-container" style={{ fontSize: '80px',marginBottom: '15px'}}>WARQ</span>
          <h3>Sign Up and Join Our Community!</h3>
        </div>

        {/* Vertical Divider */}
        <div className="signup-divider"></div>

        {/* Right Section - Sign Up Form */}
        <div className="signup-right-section">
          <div className="signup-form-container">
            <h2>Sign Up</h2>

            <div className="signup-input-group">
              <input
                type="text"
                placeholder="Username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>

            <div className="signup-input-group">
              <input
                type="email"
                placeholder="Email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="signup-input-group">
              <input
                type="password"
                placeholder="Password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <button
              onClick={handleSubmit}
              className="signup-submit-btn"
            >
              Sign Up
            </button>
          </div>
        </div>

      </div> {/* ✅ Correct placement of this closing div */}
    </div>
  );
};

export default SignUpPage;
