import React, { useRef, useState } from "react";
import { uploadFile } from "../services/api";
import importFiles from "../assets/import.png";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_FILE_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'application/pdf',
  'text/plain', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

export default function FileUpload({ note, onUpload, userRole, isCollab }) {
  const inputRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);

  // If restricted, disable upload
  const isRestricted = userRole === 'restricted';

  const validateFile = (file) => {
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      throw new Error('File type not allowed');
    }
  };

  const handleFileChange = async (e) => {
    if (isRestricted) {
      setError('You are restricted and cannot upload files.');
      return;
    }

    const files = Array.from(e.target.files);
    if (!note) {
      setError('Please select or create a note before uploading.');
      return;
    }
    if (files.length === 0) return;

    // Only allow upload if (not collab) or (collab and userRole is admin/editor)
    if (isCollab && !(userRole === 'admin' || userRole === 'editor')) {
      setError('You do not have permission to upload files.');
      return;
    }

    setUploading(true);
    setError("");
    setProgress(0);

    let successCount = 0;
    const totalFiles = files.length;

    for (const file of files) {
      try {
        // Validate file
        validateFile(file);

        // Upload file
        await uploadFile(file, note.id, isCollab);
        successCount++;
        setProgress((successCount / totalFiles) * 100);
      } catch (err) {
        console.error("Upload error:", err);
        setError(`Failed to upload ${file.name}: ${err.message}`);
        break;
      }
    }

    setUploading(false);
    inputRef.current.value = "";
    if (successCount === totalFiles && onUpload) {
      onUpload();
    }
  };

  return (
    <div style={{ display: "inline-block", position: "relative" }}>
      <label style={{ cursor: isRestricted ? 'not-allowed' : 'pointer', opacity: isRestricted ? 0.5 : 1 }}>
        <img src={importFiles} alt="Upload" style={{ width: 24, height: 24, opacity: 0.8 }} />
        <input
          ref={inputRef}
          type="file"
          style={{ display: "none" }}
          onChange={handleFileChange}
          multiple
          accept={ALLOWED_FILE_TYPES.join(',')}
          disabled={isRestricted}
        />
      </label>
      {isRestricted && (
        <span style={{ color: "orange", fontSize: 12, marginLeft: 8 }}>
          Restricted: No uploads allowed
        </span>
      )}
      {uploading && (
        <div style={{ position: "relative", marginTop: 4 }}>
          <div style={{ 
            width: '100%', 
            height: '4px', 
            background: '#333', 
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              background: '#47e584',
              transition: 'width 0.3s ease'
            }} />
          </div>
          <span style={{ color: "#47e584", fontSize: 12 }}>
            Uploading... {Math.round(progress)}%
          </span>
        </div>
      )}
      {error && (
        <div style={{ 
          color: "red", 
          fontSize: 12, 
          marginTop: 4,
          maxWidth: 200,
          wordBreak: 'break-word'
        }}>
          {error}
        </div>
      )}
    </div>
  );
}