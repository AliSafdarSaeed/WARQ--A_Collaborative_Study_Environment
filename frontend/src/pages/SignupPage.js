import React, { useState, useEffect } from 'react';
import '../App.css';
import { supabase } from '../services/supabase';
import { sendWelcomeEmail } from '../services/emailService';
import Spinner from '../components/Spinner';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';

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
    // Check if there's an invitation token and pre-fill email
    const checkInvitation = async () => {
      if (!invitationToken) return;
      try {
        const { data: invitation, error } = await supabase
          .from('projects_invitations')
          .select('invited_email, project:project_id(title)')
          .eq('invitation_token', invitationToken)
          .eq('status', 'pending')
          .gt('expires_at', new Date().toISOString())
          .single();

        if (error) throw error;
        if (invitation?.invited_email) {
          setFormData(prevState => ({
            ...prevState,
            email: invitation.invited_email
          }));
          toast.success(`You've been invited to join ${invitation.project?.title || 'a group'}!`);
        }
      } catch (err) {
        console.error('Error checking invitation:', err);
        toast.error('Invalid or expired invitation link');
      }
    };
    checkInvitation();
  }, [invitationToken]);

  async function handleSignup(email, password, invitationToken) {
    try {
      // Validate invitation token if provided
      if (invitationToken) {
        const { data: invitation, error } = await supabase
          .from('projects_invitations')
          .select('invited_email, project:project_id(title)')
          .eq('invitation_token', invitationToken)
          .eq('status', 'pending')
          .gt('expires_at', new Date().toISOString())
          .maybeSingle();

        if (error || !invitation) {
          console.error('Invitation error:', error?.message || 'No valid invitation');
          return { error: 'Invalid or expired invitation' };
        }

        // Accept invitation
        const { data, error: acceptError } = await supabase.functions.invoke('accept-invitation', {
          body: { token: invitationToken },
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        });

        if (acceptError) {
          console.error('Accept invitation error:', acceptError);
          return { error: 'Failed to accept invitation' };
        }
        console.log('Invitation accepted:', data);
      }

      // Sign up user
      const { data: authData, error: signupError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signupError) {
        console.error('Signup error:', signupError);
        return { error: signupError.message };
      }

      // Send welcome email
      await sendWelcomeEmail(email);
      console.log('Welcome email sent to:', email);

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

    try {
      // Input validation
      if (!formData.name.trim()) {
        setError('Name is required');
        setLoading(false);
        return;
      }
      if (!formData.email.trim()) {
        setError('Email is required');
        setLoading(false);
        return;
      }
      if (!formData.password || formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        setLoading(false);
        return;
      }
      if (passwordStrength === 'weak') {
        setError('Please choose a stronger password');
        setLoading(false);
        return;
      }

      console.log("Starting signup process...");

      const result = await handleSignup(formData.email, formData.password, invitationToken);

      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      setSuccess('Sign up successful! Please check your email to verify your account.');
      
      // Clear form data
      setFormData({
        name: '',
        email: '',
        password: ''
      });

      // Redirect based on whether there was an invitation
      if (result.data) {
        // Redirect to dashboard with group parameter
        navigate(`/dashboard`);
      } else {
        navigate('/dashboard');
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
          <h3>{invitationToken ? "Accept Invitation" : "Create Account"}</h3>
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
                  <div className={`password-strength ${passwordStrength}`}>
                    Password strength: {passwordStrength}
                    {passwordStrength === 'weak' && (
                      <div className="password-tips">
                        Include uppercase, lowercase, numbers, and special characters
                      </div>
                    )}
                  </div>
                )}
              </div>

              {error && <div style={{ color: 'red', marginBottom: '8px' }}>{error}</div>}
              {success && <div style={{ color: 'green', marginBottom: '8px' }}>{success}</div>}

              <button
                type="submit"
                className="signup-submit-btn"
                disabled={loading || passwordStrength === 'weak'}
              >
                {loading ? 'Creating Account...' : 'Sign Up'}
              </button>

              <div className="signup-link-container">
                <p>Already have an account?</p>
                <Link 
                  to="/login" 
                  className="signup-link"
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
