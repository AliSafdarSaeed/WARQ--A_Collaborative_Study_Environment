import React, { useState } from "react";
import axios from "axios";
import { supabase } from "../supabaseClient";

const Signup = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Create user in Supabase Authentication
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: { name: formData.name }
        }
      });

      if (error) throw error;
      
      const supabaseUid = data.user.id;

      // Send user data to your backend
      const response = await axios.post("http://localhost:5000/api/auth/signup", {
        supabaseUid,
        email: formData.email,
        name: formData.name,
      });

      console.log("Signup successful:", response.data);
      alert("Signup successful!");
    } catch (error) {
      console.error("Error during signup:", error.message);
      alert("Signup failed!");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        name="name"
        placeholder="Name"
        value={formData.name}
        onChange={handleChange}
        required
      />
      <input
        type="email"
        name="email"
        placeholder="Email"
        value={formData.email}
        onChange={handleChange}
        required
      />
      <input
        type="password"
        name="password"
        placeholder="Password"
        value={formData.password}
        onChange={handleChange}
        required
      />
      <button type="submit">Signup</button>
    </form>
  );
};

export default Signup;