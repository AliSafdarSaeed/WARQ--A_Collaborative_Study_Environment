import React, { useState, useEffect } from 'react';
import { getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead, acceptGroupInvitation, declineGroupInvitation } from '../services/groupService';
import { Bell, Check, X, CheckCircle, XCircle } from 'react-feather';
import './NotificationPanel.css';

const NotificationPanel = ({ isOpen, onClose, userId, onInvitationResponse }) => {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, filter]);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const data = await getUserNotifications(userId, filter);
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead(userId);
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleInvitationResponse = async (notificationId, invitationToken, accept) => {
    try {
      if (accept) {
        await acceptGroupInvitation(invitationToken, userId);
      } else {
        await declineGroupInvitation(invitationToken, userId);
      }
      
      await handleMarkAsRead(notificationId);
      onInvitationResponse && onInvitationResponse(accept);
      
      // Refresh notifications
      fetchNotifications();
    } catch (error) {
      console.error('Error handling invitation response:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="notification-panel">
      <div className="notification-header">
        <div className="notification-title">
          <Bell size={20} />
          <h3>Notifications</h3>
        </div>
        <div className="notification-actions">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="notification-filter"
          >
            <option value="all">All</option>
            <option value="unread">Unread</option>
          </select>
          <button
            className="mark-all-read"
            onClick={handleMarkAllAsRead}
            disabled={!notifications.some(n => !n.is_read)}
          >
            Mark all as read
          </button>
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="notifications-list">
        {isLoading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
            <p>Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <Bell size={24} />
            <p>No notifications to show</p>
          </div>
        ) : (
          notifications.map(notification => (
            <div
              key={notification.id}
              className={`notification-item ${notification.is_read ? 'read' : ''}`}
            >
              <div className="notification-content">
                <div className="notification-message">
                  <h4>{notification.title}</h4>
                  <p>{notification.message}</p>
                </div>
                <div className="notification-time">
                  {new Date(notification.created_at).toLocaleDateString()}
                </div>
              </div>

              {notification.type === 'group_invitation' && !notification.is_read && (
                <div className="invitation-actions">
                  <button
                    className="accept-btn"
                    onClick={() => handleInvitationResponse(
                      notification.id,
                      notification.data.invitation_token,
                      true
                    )}
                  >
                    <CheckCircle size={16} />
                    Accept
                  </button>
                  <button
                    className="decline-btn"
                    onClick={() => handleInvitationResponse(
                      notification.id,
                      notification.data.invitation_token,
                      false
                    )}
                  >
                    <XCircle size={16} />
                    Decline
                  </button>
                </div>
              )}

              {!notification.is_read && (
                <button
                  className="mark-read-btn"
                  onClick={() => handleMarkAsRead(notification.id)}
                >
                  <Check size={16} />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationPanel; 