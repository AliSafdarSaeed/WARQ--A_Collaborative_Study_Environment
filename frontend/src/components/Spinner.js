import React from "react";
export default function Spinner() {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      height: "100vh", width: "100vw", background: "rgba(0,0,0,0.6)", zIndex: 9999, position: "fixed", top: 0, left: 0
    }}>
      <div className="loader" style={{
        border: "8px solid #f3f3f3",
        borderTop: "8px solid #47e584",
        borderRadius: "50%",
        width: 60,
        height: 60,
        animation: "spin 1s linear infinite"
      }} />
      <style>
        {`@keyframes spin { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }`}
      </style>
    </div>
  );
}
