import React, { useState } from 'react';
import '../App.css';
import { supabase } from '../services/supabase';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';
import Spinner from '../components/Spinner';

const SignUpPage = () => {
  const [formData, setFormData] = useState({
    name: '', // Collect name directly
    email: '',
    password: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [redirecting, setRedirecting] = useState(false);
  const navigate = useNavigate();

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
      // Supabase signup
      const { data, error: supabaseError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name // Send name to Supabase
          },
          emailRedirectTo: window.location.origin + '/login'
        }
      });

      if (supabaseError) {
        setError(supabaseError.message || 'Signup failed.');
        setLoading(false);
        return;
      }

      console.log("Supabase signup response:", data);

      // Only proceed if session exists (user is auto-confirmed)
      const supabaseToken = data?.session?.access_token;
      if (supabaseToken) {
        localStorage.setItem('token', supabaseToken);

        // Call backend to save name and supabaseUid in MongoDB
        if (data?.user?.id) {
          await API.post('/auth/app-profile', {
            supabaseUid: data.user.id,
            name: formData.name
          });
          console.log("User profile saved in MongoDB");
        }
        setSuccess('Signup successful! You are now logged in.');
      } else {
        setSuccess('Signup successful! Please check your email to confirm your account before logging in.');
      }

      setFormData({ name: '', email: '', password: '' });

      // Redirect to login
      setRedirecting(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      console.error("Signup error:", err);
      setError(err.message || 'Signup failed due to an unexpected error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-container">
        <div className="signup-left-section">
          <span className="warq-logo-container" style={{ fontSize: '80px', marginBottom: '15px' }}>WARQ</span>
          <h3>Sign Up and Join Our Community!</h3>
        </div>
        <div className="signup-divider"></div>
        <div className="signup-right-section">
          <div className="signup-form-container">
            <h2>Sign Up</h2>
            {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
            {success && <div style={{ color: 'green', marginBottom: 8 }}>{success}</div>}
            <div className="signup-input-group">
              <input
                type="text"
                placeholder="Name"
                name="name"
                value={formData.name}
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
                minLength="6"
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
      </div>
    </div>
  );
};

export default SignUpPage;
