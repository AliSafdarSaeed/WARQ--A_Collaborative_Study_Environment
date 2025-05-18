import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage";
import SignupPage from "./pages/SignupPage";
import LoginPage from "./pages/LoginPage";
import Dashboard from './pages/MainApp/Dashboard';
import { supabase } from "./services/supabase";
import Spinner from "./components/Spinner";
import JoinProjectPage from './pages/JoinProjectPage';
import AcceptInvitation from "./pages/AcceptInvitation/AcceptInvitation";

// Improved auth state management
function App() {
  const [authStatus, setAuthStatus] = useState({
    isAuthenticated: false,
    isLoading: true,
    token: null,
    user: null
  });

  useEffect(() => {
    let mounted = true;

    // Check auth status on initial load
    const checkAuth = async () => {
      try {
        console.log("Checking initial auth status...");
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (sessionError) {
          console.error("Initial session check error:", sessionError);
          throw sessionError;
        }

        if (!session) {
          console.log("No initial session found");
          clearAuthData();
          return;
        }

        console.log("Initial session found:", {
          userId: session.user?.id,
          expiresAt: new Date(session.expires_at * 1000).toISOString()
        });

        // Set up the auth state
        if (mounted) {
          setAuthStatus({
            isAuthenticated: true,
            isLoading: false,
            token: session.access_token,
            user: session.user
          });
        }
      } catch (error) {
        console.error("Initial auth check error:", error);
        if (mounted) clearAuthData();
      }
    };

    checkAuth();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log("Auth state change:", event, {
          hasSession: !!session,
          userId: session?.user?.id,
          expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : null
        });

        try {
          switch (event) {
            case 'INITIAL_SESSION':
            case 'SIGNED_IN':
              if (!session?.access_token) {
                console.error(`${event} event but no access token`);
                clearAuthData();
                return;
              }

              // Store session data in localStorage
              localStorage.setItem('sb-access-token', session.access_token);
              if (session.refresh_token) {
                localStorage.setItem('sb-refresh-token', session.refresh_token);
              }

              // Update auth state
              setAuthStatus({
                isAuthenticated: true,
                isLoading: false,
                token: session.access_token,
                user: session.user
              });

              // Set up refresh timer if session has an expiry
              if (session.expires_at) {
                const expiresAt = new Date(session.expires_at * 1000);
                const timeUntilExpiry = expiresAt - new Date();
                const refreshTime = timeUntilExpiry - (5 * 60 * 1000); // Refresh 5 minutes before expiry
                
                if (refreshTime > 0) {
                  console.log(`Setting up token refresh in ${Math.round(refreshTime/1000/60)} minutes`);
                  setTimeout(async () => {
                    try {
                      const { data: { session: newSession }, error: refreshError } = await supabase.auth.refreshSession();
                      if (refreshError) throw refreshError;
                      if (!newSession) throw new Error('No session after refresh');
                      
                      console.log('Session refreshed successfully');
                    } catch (error) {
                      console.error('Failed to refresh session:', error);
                      clearAuthData();
                    }
                  }, refreshTime);
                }
              }
              break;

            case 'SIGNED_OUT':
            case 'USER_DELETED':
              console.log(`Handling ${event} event`);
              clearAuthData();
              break;

            case 'TOKEN_REFRESHED':
              if (!session?.access_token) {
                console.error("TOKEN_REFRESHED event but no access token");
                clearAuthData();
                return;
              }
              console.log("Token refreshed successfully");
              localStorage.setItem('sb-access-token', session.access_token);
              if (session.refresh_token) {
                localStorage.setItem('sb-refresh-token', session.refresh_token);
              }
              setAuthStatus(prev => ({
                ...prev,
                token: session.access_token,
                isAuthenticated: true
              }));
              break;

            case 'USER_UPDATED':
              if (!session?.access_token) {
                console.error("USER_UPDATED event but no access token");
                clearAuthData();
                return;
              }
              setAuthStatus(prev => ({
                ...prev,
                user: session.user,
                token: session.access_token
              }));
              break;

            default:
              console.log(`Unhandled auth event: ${event}`);
          }
        } catch (error) {
          console.error(`Error handling auth event ${event}:`, error);
          clearAuthData();
        }
      }
    );

    // Cleanup function
    return () => {
      mounted = false;
      if (typeof subscription?.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, []);

  const clearAuthData = () => {
    console.log("Clearing auth data");
    localStorage.removeItem('sb-access-token');
    localStorage.removeItem('sb-refresh-token');
    setAuthStatus({
      isAuthenticated: false,
      isLoading: false,
      token: null,
      user: null
    });
  };

  // Show loading spinner while checking auth
  if (authStatus.isLoading) {
    return <Spinner />;
  }

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route 
            path="/dashboard" 
            element={
              authStatus.isAuthenticated ? 
              <Dashboard token={authStatus.token} /> : 
              <Navigate to="/login" />
            } 
          />
          <Route path="/join/:projectId" element={<JoinProjectPage />} />
          <Route path="/accept-invitation" element={<AcceptInvitation />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;


