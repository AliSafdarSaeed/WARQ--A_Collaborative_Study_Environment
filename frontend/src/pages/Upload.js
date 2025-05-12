import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { uploadFileToSupabase } from "../supabaseClient";
import { uploadNoteFile } from "../services/api";
import FileCard from "../components/FileCard";
import "../styles/Upload.css";

const Upload = () => {
  const [user, setUser] = useState(null);
  const [noteId, setNoteId] = useState("");
  const [files, setFiles] = useState([]);
  const [uploadStatus, setUploadStatus] = useState([]);
  const [fileList, setFileList] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const dropRef = useRef(null);
  const navigate = useNavigate();

  // Get current user on component mount
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    getUser();
  }, []);

  // Handle logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  // Fetch files for a note from backend
  const fetchNoteFiles = async (noteId) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log("No Supabase session found");
        return [];
      }
      
      const token = session.access_token;
      console.log("Using token (first 20 chars):", token.substring(0, 20) + "...");
      
      const res = await fetch(`http://localhost:5000/api/notes/${noteId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Error response status:", res.status);
        console.error("Error response body:", errorText);
        return [];
      }
      
      const data = await res.json();
      return data.data.files || [];
    } catch (e) {
      console.error("Error fetching note files:", e);
      return [];
    }
  };

  // Fetch files when noteId changes
  useEffect(() => {
    if (noteId) {
      fetchNoteFiles(noteId).then(setFileList);
    }
  }, [noteId]);

  // File input handling
  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
    setUploadStatus([]);
  };

  // Drag and drop handling
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFiles(Array.from(e.dataTransfer.files));
      setUploadStatus([]);
      e.dataTransfer.clearData();
    }
  };

  // File upload handling
  const handleUpload = async () => {
    if (!files.length || !noteId) {
      setUploadStatus(["Please select file(s) and enter a noteId."]);
      return;
    }
    let statuses = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      statuses[i] = `Uploading "${file.name}" to Supabase...`;
      setUploadStatus([...statuses]);
      try {
        // Upload file to Supabase
        const metadata = await uploadFileToSupabase(file, noteId);

        // Register file metadata with the backend
        statuses[i] = `Registering "${file.name}" with backend...`;
        setUploadStatus([...statuses]);
        await uploadNoteFile({
          noteId,
          ...metadata,
        });

        statuses[i] = `File "${file.name}" uploaded and registered successfully!`;
        setUploadStatus([...statuses]);
      } catch (err) {
        statuses[i] = `Upload failed for "${file.name}": ${err.message}`;
        setUploadStatus([...statuses]);
      }
    }
    // Refetch files from backend after upload
    fetchNoteFiles(noteId).then(setFileList);
  };

  // Handle file delete
  const handleDeleteFile = async (urlToDelete) => {
    try {
      await uploadNoteFile({ noteId, url: urlToDelete, delete: true });
      // Refetch files from backend after delete
      fetchNoteFiles(noteId).then(setFileList);
      setUploadStatus([`File deleted successfully!`]);
    } catch (err) {
      setUploadStatus([`Failed to delete file: ${err.message}`]);
    }
  };

  return (
    <div className="upload-container">
      <header className="header">
        <h1>File Upload</h1>
        <div className="user-info">
          {user && (
            <>
              <span>Logged in as: {user.email}</span>
              <button onClick={handleLogout} className="logout-btn">Logout</button>
            </>
          )}
        </div>
      </header>

      <main>
        <section className="upload-section">
          <h2>Upload File(s) and Register with Note</h2>
          <input
            type="text"
            placeholder="Note ID"
            value={noteId}
            onChange={(e) => setNoteId(e.target.value)}
            className="note-id-input"
          />
          
          <div
            ref={dropRef}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`drop-zone ${dragActive ? 'active' : ''}`}
          >
            {dragActive ? "Drop files here..." : "Drag & drop files here or click to select"}
            <input
              type="file"
              multiple
              style={{ display: "none" }}
              onChange={handleFileChange}
              id="fileInput"
            />
            <label htmlFor="fileInput" className="file-select-label">
              Or click to select files
            </label>
          </div>
          
          <button onClick={handleUpload} className="upload-btn">Upload File(s)</button>
          
          <div className="upload-status">
            {uploadStatus.map((status, idx) => (
              <div key={idx} className="status-message">{status}</div>
            ))}
          </div>
        </section>

        <section className="files-section">
          <h2>Uploaded Files</h2>
          <div className="file-list">
            {fileList.length > 0 ? (
              fileList.map((file) => (
                <FileCard 
                  key={file.url} 
                  url={file.url} 
                  name={file.name} 
                  type={file.type} 
                  size={file.size} 
                  onDelete={handleDeleteFile} 
                />
              ))
            ) : (
              <p>No files uploaded for this note ID yet.</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Upload;