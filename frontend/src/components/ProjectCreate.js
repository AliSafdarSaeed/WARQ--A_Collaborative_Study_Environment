import React, { useState } from "react";
import { createProject } from "../services/api";

const initialState = {
  title: "",
  description: "",
  subject: "",
  tags: "",
  isPublic: false,
};

const ProjectCreate = ({ onProjectCreated }) => {
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createProject({
        ...form,
        tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      });
      setForm(initialState);
      if (onProjectCreated) onProjectCreated();
    } catch (err) {
      alert("Failed to create project.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 max-w-xl mx-auto"
      onSubmit={handleSubmit}
    >
      <h2 className="text-xl font-semibold mb-4">Create New Project</h2>
      <div className="mb-4">
        <label className="block text-gray-700 mb-2">Title</label>
        <input
          className="w-full border rounded px-3 py-2"
          name="title"
          value={form.title}
          onChange={handleChange}
          required
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 mb-2">Description</label>
        <textarea
          className="w-full border rounded px-3 py-2"
          name="description"
          value={form.description}
          onChange={handleChange}
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 mb-2">Subject</label>
        <input
          className="w-full border rounded px-3 py-2"
          name="subject"
          value={form.subject}
          onChange={handleChange}
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 mb-2">Tags (comma separated)</label>
        <input
          className="w-full border rounded px-3 py-2"
          name="tags"
          value={form.tags}
          onChange={handleChange}
        />
      </div>
      <div className="mb-4 flex items-center">
        <input
          type="checkbox"
          name="isPublic"
          checked={form.isPublic}
          onChange={handleChange}
          className="mr-2"
        />
        <label className="text-gray-700">Public Project</label>
      </div>
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        disabled={loading}
      >
        {loading ? "Creating..." : "Create Project"}
      </button>
    </form>
  );
};

export default ProjectCreate;