import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage";
import SignupPage from "./pages/SignupPage";
import LoginPage from "./pages/LoginPage";
import Dashboard from './pages/MainApp/Dashboard';
import { supabase } from "./services/supabase";
import Spinner from "./components/Spinner";

// Improved auth state management
function App() {
  const [authStatus, setAuthStatus] = useState({
    isAuthenticated: false,
    isLoading: true,
    token: null
  });

  useEffect(() => {
    // Check auth status on initial load
    const checkAuth = async () => {
      try {
        // Get session from Supabase
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.access_token) {
          localStorage.setItem('token', session.access_token);
          setAuthStatus({
            isAuthenticated: true,
            isLoading: false,
            token: session.access_token
          });
        } else {
          localStorage.removeItem('token');
          setAuthStatus({
            isAuthenticated: false,
            isLoading: false,
            token: null
          });
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setAuthStatus({
          isAuthenticated: false,
          isLoading: false,
          token: null
        });
      }
    };

    checkAuth();

    // Also listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.access_token) {
          localStorage.setItem('token', session.access_token);
          setAuthStatus({
            isAuthenticated: true,
            isLoading: false,
            token: session.access_token
          });
        } else {
          localStorage.removeItem('token');
          setAuthStatus({
            isAuthenticated: false,
            isLoading: false,
            token: null
          });
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

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
        </Routes>
      </Router>
    </div>
  );
}

export default App;


