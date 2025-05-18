import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Check for email confirmation success
    const checkEmailConfirmation = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      // If we have a confirmation_success parameter and a session, the email was just confirmed
      if (searchParams.get('confirmation_success') && session) {
        toast.success('Email confirmed successfully! You can now log in.');
      }
    };
    
    checkEmailConfirmation();
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // First ensure we're starting fresh
      await supabase.auth.signOut();
      
      // Supabase login
      const { data, error: supabaseError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (supabaseError) {
        if (supabaseError.message.includes('Email not confirmed')) {
          throw new Error('Please check your email and confirm your account before logging in.');
        }
        throw supabaseError;
      }

      if (!data?.session) {
        throw new Error('Login failed: No session received.');
      }

      // Initialize the session
      const { error: initError } = await supabase.auth.initialize();
      if (initError) throw initError;

      // Verify we can get the user data
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Login succeeded but user verification failed.');
      }

      // Verify email is confirmed
      if (!user.email_confirmed_at) {
        throw new Error('Please check your email and confirm your account before logging in.');
      }

      setRedirecting(true);
      // Successful login
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

              {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}

              <button
                type="submit"
                className="signup-submit-btn"
                disabled={loading}
              >
                {loading ? 'Logging In...' : 'Log In'}
              </button>

              <div className="signup-link-container">
                <p>Don't have an account?</p>
                <Link 
                  to="/signup" 
                  className="signup-link"
                >
                  Create an account
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
      {(loading || redirecting) && <Spinner />}
      <style>{`
        .signup-link-container {
          margin-top: 1.5rem;
          text-align: center;
          color: #ffffff;
        }
        .signup-link {
          display: inline-block;
          margin-top: 0.5rem;
          color: #47e584;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s ease;
        }
        .signup-link:hover {
          color: #03ae45;
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
