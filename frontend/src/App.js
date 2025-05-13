import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage";
import SignupPage from "./pages/SignupPage";
import LoginPage from "./pages/LoginPage";
import Dashboard from './pages/MainApp/Dashboard';

// Simple auth check (for demo: use localStorage token)
const isAuthenticated = () => !!localStorage.getItem('token');

function App() {
  return (
    <div style={{ height: "100%", width: "100%" }}>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={isAuthenticated() ? <Dashboard /> : <Navigate to="/login" />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;


