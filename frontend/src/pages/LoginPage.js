import React, { useState } from 'react';
import '../App.css';
import { login } from '../services/api';
import Spinner from '../components/Spinner';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [redirecting, setRedirecting] = useState(false);
  const navigate = useNavigate();

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
      // Supabase login
      const { data, error: supabaseError } = await supabase.auth.signInWithPassword({ email: formData.email, password: formData.password });
      if (supabaseError) {
        setError(supabaseError.message);
        setLoading(false);
        return;
      }
      // Get Supabase access token
      const supabaseToken = data?.session?.access_token;
      if (!supabaseToken) {
        setError('No Supabase session token received.');
        setLoading(false);
        return;
      }
      // Call backend login to get backend JWT and user info
      const backendRes = await login(formData.email, undefined, supabaseToken);
      if (backendRes.data && backendRes.data.data && backendRes.data.data.token) {
        localStorage.setItem('token', backendRes.data.data.token);
        navigate('/dashboard');
      } else {
        setError('Login failed: No backend token received.');
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
