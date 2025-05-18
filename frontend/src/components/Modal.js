import React from 'react';
import './Modal.css';

export default function Modal({ children, onClose }) {
  return (
    <div className="modal-backdrop">
      <div className="modal-content animated-modal">
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: 'none',
            border: 'none',
            color: '#47e584',
            fontSize: 22,
            cursor: 'pointer',
          }}
          aria-label="Close"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
}
