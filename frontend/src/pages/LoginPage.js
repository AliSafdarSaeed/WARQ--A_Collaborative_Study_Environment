import React, { useState } from 'react';
import '../App.css';
import { login } from '../services/api';
import Spinner from '../components/Spinner';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [redirecting, setRedirecting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await login(formData.email, formData.password);
      if (res.data && res.data.token) {
        localStorage.setItem('token', res.data.token);
        setRedirecting(true);
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1000);
      } else {
        setError('No token received.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
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

            {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}

            <button
              onClick={handleSubmit}
              className="signup-submit-btn"
              disabled={loading}
            >
              {loading ? 'Logging In...' : 'Log In'}
            </button>
          </div>
        </div>

      </div>
      {redirecting && <Spinner />}
    </div>
  );
};

export default LoginPage;
