import React, { useState } from 'react';
import '../App.css';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Login submitted:', formData);
  };

  return (
    <div className="signup-page">
      <div className="signup-container">
        
        {/* Left Section - Logo and Welcome */}
        <div className="signup-left-section">
          <span className="warq-logo-container" style={{ fontSize: '80px', marginBottom: '15px' }}>WARQ</span>
          <h3>Welcome Back!</h3>
        </div>

        {/* Divider */}
        <div className="signup-divider"></div>

        {/* Right Section - Login Form */}
        <div className="signup-right-section">
          <div className="signup-form-container">
            <h2>Log In</h2>

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
              Log In
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
