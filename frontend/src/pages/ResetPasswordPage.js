import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import '../App.css';
import './ResetPasswordPage.css';
import { toast } from 'react-hot-toast';
import Spinner from '../components/Spinner';
import WarqLogo from '../components/WarqLogo';

const ResetPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordStrength, setPasswordStrength] = useState('');
  const navigate = useNavigate();

  // Check if the URL contains a hash which indicates a valid password reset link
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) {
      setError('Invalid or expired password reset link');
    }
  }, []);

  // Check password strength
  const checkPasswordStrength = (pass) => {
    if (!pass) return '';
    const hasUpperCase = /[A-Z]/.test(pass);
    const hasLowerCase = /[a-z]/.test(pass);
    const hasNumbers = /\d/.test(pass);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(pass);
    const isLongEnough = pass.length >= 8;

    const strength = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar, isLongEnough]
      .filter(Boolean).length;

    if (strength < 3) return 'weak';
    if (strength < 5) return 'medium';
    return 'strong';
  };

  // Update password strength when password changes
  useEffect(() => {
    setPasswordStrength(checkPasswordStrength(password));
  }, [password]);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (passwordStrength === 'weak') {
      setError('Please create a stronger password');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      setSuccess('Password reset successfully!');
      toast.success('Your password has been reset!');
      
      // Redirect to login page after successful reset
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      console.error('Password reset error:', err);
      setError(err.message || 'Failed to reset password. Please try again.');
      toast.error('Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page reset-password-page">
      <div className="signup-container">
        {/* Left Section - Logo and Welcome */}
        <div className="signup-left-section">
          <span className="warq-logo-container" style={{ fontSize: '80px', marginBottom: '15px' }}>WARQ</span>
          <h3 style={{ color: '#47e584', fontSize: '24px', marginTop: '20px' }}>
            Reset Your Password
          </h3>
        </div>

        {/* Divider */}
        <div className="signup-divider"></div>

        {/* Right Section - Reset Password Form */}
        <div className="signup-right-section">
          <div className="signup-form-container">
            <h2>Create New Password</h2>
            <form onSubmit={handleResetPassword}>
              <div className="signup-input-group">
                <input
                  type="password"
                  placeholder="New Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                {password && (
                  <div className="password-strength" style={{
                    marginTop: '8px',
                    fontSize: '14px',
                    color: passwordStrength === 'weak' ? '#ff4d4d' : 
                           passwordStrength === 'medium' ? '#ffd700' : '#47e584'
                  }}>
                    Password strength: {passwordStrength}
                    {passwordStrength === 'weak' && (
                      <div className="password-tips" style={{
                        fontSize: '12px',
                        color: '#ababab',
                        marginTop: '4px'
                      }}>
                        Include uppercase, lowercase, numbers, and special characters
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="signup-input-group">
                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <div style={{ 
                  color: '#ff4d4d', 
                  marginBottom: '16px',
                  padding: '8px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(255, 77, 77, 0.1)',
                  border: '1px solid #ff4d4d'
                }}>
                  {error}
                </div>
              )}
              
              {success && (
                <div style={{ 
                  color: '#47e584', 
                  marginBottom: '16px',
                  padding: '8px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(71, 229, 132, 0.1)',
                  border: '1px solid #47e584'
                }}>
                  {success}
                </div>
              )}

              <button
                type="submit"
                className="signup-submit-btn"
                disabled={loading || passwordStrength === 'weak' || !password || !confirmPassword}
                style={{
                  opacity: (loading || passwordStrength === 'weak' || !password || !confirmPassword) ? 0.7 : 1,
                  cursor: (loading || passwordStrength === 'weak' || !password || !confirmPassword) ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? <Spinner /> : 'Reset Password'}
              </button>

              <div style={{
                textAlign: 'center',
                marginTop: '20px',
                color: '#ababab'
              }}>
                <p style={{ display: 'inline' }}>Remember your password? </p>
                <Link 
                  to="/login" 
                  style={{
                    color: '#47e584',
                    textDecoration: 'none',
                    marginLeft: '5px'
                  }}
                >
                  Log In
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;