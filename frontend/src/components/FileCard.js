import React, { useState } from "react";

const getFileExtension = (url) => {
  return url.split('.').pop().split('?')[0].toLowerCase();
};

const FileCard = ({ url, name, onDelete }) => {
  const [open, setOpen] = useState(false);
  const ext = getFileExtension(url);
  const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);
  const isPdf = ext === "pdf";

  return (
    <div style={{
      border: "1px solid #ddd",
      borderRadius: 8,
      padding: 12,
      margin: 8,
      width: 180,
      textAlign: "center", 
      background: "#fafbfc",
      boxShadow: "0 2px 8px #eee"
    }}>
      <div style={{ marginBottom: 8 }}>
        {isImage ? (
          <img src={url} alt={name} style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 4 }} />
        ) : isPdf ? (
          <span style={{ fontSize: 48 }}>📄</span>
        ) : (
          <span style={{ fontSize: 48 }}>📁</span>
        )}
      </div>
      <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 4 }}>{name || url.split('/').pop()}</div>
      <div style={{ fontSize: 12, color: "#888" }}>{ext.toUpperCase()}</div>
      <button
        style={{
          marginTop: 8,
          padding: "4px 12px",
          borderRadius: 4,
          border: "none",
          background: "#007bff",
          color: "#fff",
          cursor: "pointer"
        }}
        onClick={() => setOpen(true)}
      >
        Open
      </button>
      <div style={{ marginTop: 8 }}>
        <a href={url} download target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "#007bff", textDecoration: "underline" }}>
          Download
        </a>
      </div>
      {typeof onDelete === 'function' && (
        <button
          style={{
            marginTop: 8,
            padding: "4px 12px",
            borderRadius: 4,
            border: "none",
            background: "#dc3545",
            color: "#fff",
            cursor: "pointer"
          }}
          onClick={() => onDelete(url)}
        >
          Delete
        </button>
      )}
      {open && (
        <div
          style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
          onClick={() => setOpen(false)}
        >
          <div
            style={{
              background: "#fff",
              padding: 24,
              borderRadius: 8,
              maxWidth: "90vw",
              maxHeight: "90vh",
              overflow: "auto"
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ marginBottom: 12, textAlign: "right" }}>
              <button onClick={() => setOpen(false)} style={{ fontSize: 18, background: "none", border: "none", cursor: "pointer" }}>✖</button>
            </div>
            {isImage ? (
              <img src={url} alt={name} style={{ maxWidth: "80vw", maxHeight: "70vh" }} />
            ) : isPdf ? (
              <iframe src={url} title={name} width="800" height="600" style={{ border: "none" }} />
            ) : (
              <div>
                <span>Preview not available. </span>
                <a href={url} download target="_blank" rel="noopener noreferrer">Download/Open File</a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileCard;
