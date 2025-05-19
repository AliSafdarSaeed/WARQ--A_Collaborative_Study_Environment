import React, { useState, useEffect } from 'react';
import '../App.css';
import { supabase } from '../services/supabase';
import Spinner from '../components/Spinner';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { acceptGroupInvitation } from '../services/groupService';

// Helper function to get the network URL
const getNetworkUrl = () => {
  return window.location.origin;
};

const SignUpPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendingEmail, setResendingEmail] = useState(false);
  const [showResendButton, setShowResendButton] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const invitationToken = searchParams.get('token');
  const [passwordStrength, setPasswordStrength] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

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
    setPasswordStrength(checkPasswordStrength(formData.password));
  }, [formData.password]);

  useEffect(() => {
    // Check if there's an invitation token
    const checkInvitation = async () => {
      if (!invitationToken) return;
      try {
        const { data: invitation, error } = await supabase
          .from('projects_invitations')
          .select('project:project_id(title)')
          .eq('invitation_token', invitationToken)
          .eq('status', 'pending')
          .gt('expires_at', new Date().toISOString())
          .single();

        if (error) throw error;
        if (invitation?.project?.title) {
          toast.success(`You've been invited to join ${invitation.project.title}!`);
        }
      } catch (err) {
        console.error('Error checking invitation:', err);
        toast.error('Invalid or expired invitation link');
      }
    };
    checkInvitation();
  }, [invitationToken]);

  // Add resend verification email function
  const handleResendVerification = async () => {
    if (!formData.email) return;
    
    setResendingEmail(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: formData.email,
        options: {
          emailRedirectTo: `${window.location.origin}/login`
        }
      });

      if (error) throw error;
      
      toast.success('Verification email resent! Please check your inbox.');
      setSuccess('A new verification email has been sent. Please check your inbox.');
    } catch (err) {
      console.error('Error resending verification:', err);
      setError('Failed to resend verification email. Please try again.');
      toast.error('Failed to resend verification email');
    } finally {
      setResendingEmail(false);
    }
  };

  async function handleSignup(email, password, invitationToken) {
    try {
      // First check if the email already exists and is verified
      const { data: existingUser, error: existingError } = await supabase
        .from('users')
        .select('email_confirmed_at')
        .eq('email', email)
        .maybeSingle();

      if (existingUser?.email_confirmed_at) {
        return { error: 'This email is already registered. Please log in instead.' };
      }

      // Sign up user with email confirmation enabled
      const { data: authData, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: {
            full_name: formData.name,
          }
        }
      });

      if (signupError) {
        console.error('Signup error:', signupError);
        return { error: signupError.message };
      }

      // Check if email confirmation is needed
      if (authData?.user?.identities?.length === 0) {
        // Email exists but might not be verified
        return { 
          error: 'This email address is registered but not verified. Please check your email for the verification link, or request a new one.',
          needsVerification: true 
        };
      }

      if (!authData?.user?.confirmed_at) {
        return { 
          data: authData,
          message: 'Please check your email for the verification link before logging in.',
          needsVerification: true
        };
      }

      // If email is already confirmed, handle invitation if present
      if (invitationToken) {
        try {
          await acceptGroupInvitation(invitationToken, authData.user.id);
        } catch (error) {
          console.error('Error accepting invitation:', error);
          return { error: error.message };
        }
      }

      return { data: authData };
    } catch (error) {
      console.error('Unexpected signup error:', error);
      return { error: error.message };
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    setShowResendButton(false);

    if (!formData.name || !formData.email || !formData.password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    try {
      const result = await handleSignup(formData.email, formData.password, invitationToken);

      if (result.error) {
        setError(result.error);
        // Show resend button if the error indicates unverified email
        if (result.needsVerification) {
          setShowResendButton(true);
        }
        setLoading(false);
        return;
      }

      // Clear form data
      setFormData({
        name: '',
        email: '',
        password: ''
      });

      // Show success message if email verification is needed
      if (result.message) {
        setSuccess(result.message);
        toast.success(result.message);
        if (result.needsVerification) {
          setShowResendButton(true);
        }
      } else {
        // If email is already verified, redirect to dashboard
        navigate('/dashboard');
        toast.success('Account created successfully!');
      }

    } catch (err) {
      console.error("Unexpected signup error:", err);
      setError(err.message || 'An unexpected error occurred during signup.');
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
          <h3 style={{ color: '#47e584', fontSize: '24px', marginTop: '20px' }}>
            {invitationToken ? "Accept Invitation" : "Create Account"}
          </h3>
        </div>

        {/* Divider */}
        <div className="signup-divider"></div>

        {/* Right Section - Signup Form */}
        <div className="signup-right-section">
          <div className="signup-form-container">
            <h2>{invitationToken ? "Join Study Group" : "Sign Up"}</h2>
            <form onSubmit={handleSubmit}>
              <div className="signup-input-group">
                <input
                  type="text"
                  placeholder="Full Name"
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
                  disabled={invitationToken && formData.email}
                  style={{ 
                    opacity: (invitationToken && formData.email) ? 0.7 : 1,
                    cursor: (invitationToken && formData.email) ? 'not-allowed' : 'text'
                  }}
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
                {formData.password && (
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

              {showResendButton && (
                <button
                  type="button"
                  className="signup-submit-btn"
                  onClick={handleResendVerification}
                  disabled={resendingEmail}
                  style={{
                    backgroundColor: 'transparent',
                    border: '2px solid #47e584',
                    color: '#47e584',
                    marginBottom: '16px'
                  }}
                >
                  {resendingEmail ? 'Sending...' : 'Resend Verification Email'}
                </button>
              )}

              <button
                type="submit"
                className="signup-submit-btn"
                disabled={loading || passwordStrength === 'weak'}
                style={{
                  opacity: (loading || passwordStrength === 'weak') ? 0.7 : 1,
                  cursor: (loading || passwordStrength === 'weak') ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Creating Account...' : 'Sign Up'}
              </button>

              <div style={{
                textAlign: 'center',
                marginTop: '20px',
                color: '#ababab'
              }}>
                <p style={{ display: 'inline' }}>Already have an account? </p>
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
      {loading && <Spinner />}
    </div>
  );
};

export default SignUpPage;
