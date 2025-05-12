import axios from "axios";
import { supabase } from '../supabaseClient';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL
    ? process.env.REACT_APP_API_URL + "/api"
    : "http://localhost:5000/api"
});

// Helper to get Supabase auth token
const getToken = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");
  return session.access_token;
};

// Create Project
export const createProject = async (projectData) => {
  const token = await getToken();
  const res = await axios.post(
    "/api/projects",
    projectData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  return res.data.data;
};

// Get Projects
export const getProjects = async () => {
  const token = await getToken();
  const res = await axios.get("/api/projects", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.data;
};

export const editNote = async (noteId, data) => {
  const token = await getToken();
  const res = await axios.put(`/api/notes/${noteId}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data.data;
};

export const joinProject = async (projectId) => {
  const token = await getToken();
  const res = await axios.post("/api/projects/join", { projectId }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data.data;
};

// Upload file to Supabase Storage and return metadata
export async function uploadFileToSupabase(file, noteId) {
  return await supabase.uploadFileToSupabase(file, noteId);
}

// Upload file metadata to backend (after uploading to Supabase Storage)
export const uploadNoteFile = async ({ noteId, url, type, name, size, delete: isDelete }) => {
  try {
    console.log("Sending to backend:", { noteId, url, type, name, size, delete: isDelete });
    const token = await getToken();
    console.log("Using token (first 20 chars):", token.substring(0, 20) + "...");
    
    const res = await API.post(
      "/notes/upload-file",
      { noteId, url, type, name, size, delete: isDelete },
      { 
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      }
    );
    return res.data.data;
  } catch (error) {
    console.error("Error in uploadNoteFile:", error);
    
    if (error.response) {
      // The request was made, but the server responded with an error
      console.error("Response error data:", error.response.data);
      console.error("Response status:", error.response.status);
      console.error("Response headers:", error.response.headers);
    }
    
    throw error;
  }
};