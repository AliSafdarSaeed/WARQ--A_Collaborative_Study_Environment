import React, { useState } from 'react';
import '../App.css';
import { signup } from '../services/api';
import Spinner from '../components/Spinner';

const SignUpPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [redirecting, setRedirecting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await signup({
        username: formData.username,
        email: formData.email,
        password: formData.password
      });
      setSuccess('Signup successful! Redirecting to login...');
      setFormData({ username: '', email: '', password: '' });
      setRedirecting(true);
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed.');
    } finally {
      setLoading(false);
    }
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

            {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
            {success && <div style={{ color: 'green', marginBottom: 8 }}>{success}</div>}

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
              disabled={loading}
            >
              {loading ? 'Signing Up...' : 'Sign Up'}
            </button>
            {redirecting && <Spinner />}
          </div>
        </div>

      </div> {/* ✅ Correct placement of this closing div */}
    </div>
  );
};

export default SignUpPage;
