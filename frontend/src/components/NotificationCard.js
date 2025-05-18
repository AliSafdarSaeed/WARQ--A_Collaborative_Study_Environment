import React from 'react';
import {
  FaFileAlt, FaComment, FaUserPlus, FaBell, FaUserSlash, FaBullhorn, FaAt, FaCheckCircle
} from 'react-icons/fa';

const typeIcon = {
  file_upload: <FaFileAlt color='#47e584' />,
  file_delete: <FaFileAlt color='#ff6b6b' />,
  comment: <FaComment color='#3498DB' />,
  invite: <FaUserPlus color='#47e584' />,
  role_change: <FaCheckCircle color='#F1C40F' />,
  membership_change: <FaUserSlash color='#ff6b6b' />,
  announcement: <FaBullhorn color='#F1C40F' />,
  mention: <FaAt color='#9B59B6' />,
  quiz_assignment: <FaBell color='#47e584' />,
  quiz_result: <FaCheckCircle color='#3498DB' />,
  default: <FaBell color='#aaa' />
};

export default function NotificationCard({ n, onMarkRead, onMarkUnread }) {
  return (
    <div
      className={`notification-card${!n.is_read ? ' unread' : ''}`}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        background: n.is_read ? '#232323' : '#2ecc71',
        color: n.is_read ? '#fff' : '#181818',
        borderRadius: 8,
        marginBottom: 10,
        padding: '12px 16px',
        boxShadow: n.is_read
          ? '0 2px 8px rgba(71,229,132,0.10)'
          : '0 4px 16px rgba(71,229,132,0.18)',
        transition: 'background 0.22s, color 0.22s, box-shadow 0.18s',
        animation: 'fadeSlideIn 0.32s cubic-bezier(0.23, 1, 0.32, 1)'
      }}
    >
      <div style={{ fontSize: '1.6rem', marginTop: 2 }}>
        {typeIcon[n.type] || typeIcon.default}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, marginBottom: 2 }}>{n.title || n.type.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())}</div>
        <div style={{ fontSize: 15, marginBottom: 2 }}>{n.message}</div>
        <div style={{ fontSize: 12, color: '#aaa' }}>{new Date(n.created_at).toLocaleString()}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {!n.is_read ? (
          <button
            onClick={() => onMarkRead(n.id)}
            style={{
              background: 'none',
              border: 'none',
              color: '#3498DB',
              cursor: 'pointer',
              fontSize: 13,
              padding: 0
            }}
            title="Mark as read"
          >✓</button>
        ) : (
          <button
            onClick={() => onMarkUnread(n.id)}
            style={{
              background: 'none',
              border: 'none',
              color: '#aaa',
              cursor: 'pointer',
              fontSize: 13,
              padding: 0
            }}
            title="Mark as unread"
          >↺</button>
        )}
      </div>
    </div>
  );
}
