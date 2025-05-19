import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import '../App.css';
import { toast } from 'react-hot-toast';
import Spinner from '../components/Spinner';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [redirecting, setRedirecting] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [showResendButton, setShowResendButton] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const navigate = useNavigate();

  const handleResendVerification = async () => {
    if (!email) return;
    
    setResendingEmail(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/login`
        }
      });

      if (error) throw error;
      
      toast.success('Verification email resent! Please check your inbox.');
    } catch (err) {
      console.error('Error resending verification:', err);
      toast.error('Failed to resend verification email');
    } finally {
      setResendingEmail(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setResetEmailSent(true);
      toast.success('Password reset instructions sent to your email!');
    } catch (err) {
      console.error('Reset password error:', err);
      setError(err.message);
      toast.error('Failed to send reset instructions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setShowResendButton(false);

    try {
      // First check if the email exists and is verified
      const { data: existingUser, error: existingError } = await supabase
        .from('users')
        .select('email_confirmed_at')
        .eq('email', email)
        .maybeSingle();

      if (existingUser && !existingUser.email_confirmed_at) {
        setShowResendButton(true);
        throw new Error('Please verify your email before logging in. Check your inbox for the verification link.');
      }

      // First ensure we're starting fresh
      await supabase.auth.signOut();
      
      // Supabase login
      const { data, error: supabaseError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (supabaseError) {
        if (supabaseError.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password. Please try again.');
        }
        throw supabaseError;
      }

      if (!data?.session) {
        throw new Error('Login failed: No session received.');
      }

      // Check if email is verified
      if (!data.user.email_confirmed_at) {
        setShowResendButton(true);
        throw new Error('Please verify your email before logging in. Check your inbox for the verification link.');
      }

      // Initialize the session
      const { error: initError } = await supabase.auth.initialize();
      if (initError) throw initError;

      // Verify we can get the user data
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Login succeeded but user verification failed.');
      }

      setRedirecting(true);
      navigate('/dashboard');
      toast.success('Welcome back!');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Add this useEffect hook to check for users after email verification redirects
  useEffect(() => {
    const checkUserProfileAfterVerification = async () => {
      try {
        // Check if there's a user session (which would happen after email verification redirect)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) return;

        console.log("User detected on login page after verification:", session.user.id);
        
        // Check if user exists in users table
        const { data: existingProfile, error: fetchError } = await supabase
          .from('users')
          .select('id')
          .eq('id', session.user.id)
          .maybeSingle();

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('Error checking user profile:', fetchError);
          return;
        }

        // If user doesn't exist in users table, create one
        if (!existingProfile) {
          console.log('Creating user record after verification redirect');
          const { error: insertError } = await supabase
            .from('users')
            .insert([
              {
                id: session.user.id,
                email: session.user.email,
                name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || null,
                created_at: new Date().toISOString(),
                email_confirmed_at: session.user.email_confirmed_at || new Date().toISOString()
              },
            ]);

          if (insertError) {
            console.error('Error creating user record after verification:', insertError);
          } else {
            console.log('Successfully created user record after verification');
          }
        }
      } catch (err) {
        console.error("Error handling post-verification user check:", err);
      }
    };

    checkUserProfileAfterVerification();
  }, []);

  return (
    <div className="signup-page">
      <div className="signup-container">
        {/* Left Section - Logo and Welcome */}
        <div className="signup-left-section">
          <span className="warq-logo-container" style={{ fontSize: '80px', marginBottom: '15px' }}>WARQ</span>
          <h3 style={{ color: '#47e584', fontSize: '24px', marginTop: '20px' }}>
            {isResetMode ? 'Reset Password' : 'Welcome Back'}
          </h3>
        </div>

        {/* Divider */}
        <div className="signup-divider"></div>

        {/* Right Section - Login Form */}
        <div className="signup-right-section">
          <div className="signup-form-container">
            <h2>{isResetMode ? 'Reset Password' : 'Log In'}</h2>
            
            {isResetMode ? (
              <form onSubmit={handleForgotPassword}>
                <div className="signup-input-group">
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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

                {resetEmailSent && (
                  <div style={{ 
                    color: '#47e584', 
                    marginBottom: '16px',
                    padding: '8px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(71, 229, 132, 0.1)',
                    border: '1px solid #47e584'
                  }}>
                    Check your email for password reset instructions!
                  </div>
                )}

                <button 
                  type="submit" 
                  className="signup-submit-btn"
                  disabled={loading || !email}
                  style={{
                    opacity: (loading || !email) ? 0.7 : 1,
                    cursor: (loading || !email) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? 'Sending...' : 'Send Reset Instructions'}
                </button>

                <button 
                  type="button"
                  onClick={() => {
                    setIsResetMode(false);
                    setError('');
                    setResetEmailSent(false);
                  }}
                  className="signup-submit-btn"
                  style={{
                    backgroundColor: 'transparent',
                    border: '2px solid #47e584',
                    color: '#47e584',
                    marginTop: '10px'
                  }}
                >
                  Back to Login
                </button>
              </form>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="signup-input-group">
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="signup-input-group">
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                  disabled={loading || redirecting}
                  style={{
                    opacity: (loading || redirecting) ? 0.7 : 1,
                    cursor: (loading || redirecting) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? <Spinner /> : redirecting ? 'Redirecting...' : 'Log In'}
                </button>

                <div style={{
                  textAlign: 'center',
                  marginTop: '20px',
                  color: '#ababab'
                }}>
                  <button
                    type="button"
                    onClick={() => setIsResetMode(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#47e584',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      padding: '0',
                      margin: '0 0 10px 0',
                      width: 'auto'
                    }}
                  >
                    Forgot Password?
                  </button>
                  <div>
                    <p style={{ display: 'inline' }}>Don't have an account? </p>
                    <Link 
                      to="/signup" 
                      style={{
                        color: '#47e584',
                        textDecoration: 'none',
                        marginLeft: '5px'
                      }}
                    >
                      Sign Up
                    </Link>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
