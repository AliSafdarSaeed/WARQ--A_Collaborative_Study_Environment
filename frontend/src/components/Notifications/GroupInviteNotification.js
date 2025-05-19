import React from 'react';
import { acceptGroupInvitation, declineGroupInvitation } from '../../services/groupService';
import { toast } from 'react-hot-toast';
import './GroupInviteNotification.css';
import { UserPlus, Check, X } from 'react-feather';

const GroupInviteNotification = ({ notification, onAccept, onDecline }) => {
  const { group_title, invitation_token } = notification.data || {};
  const inviterName = notification.data?.inviter_name || 'Someone';

  const handleAccept = async () => {
    try {
      const loadingToast = toast.loading('Accepting invitation...');
      await acceptGroupInvitation(invitation_token, notification.user_id);
      toast.dismiss(loadingToast);
      toast.success(`Successfully joined ${group_title}!`);
      if (onAccept) onAccept(notification.id);
    } catch (error) {
      toast.error('Failed to accept invitation: ' + error.message);
    }
  };

  const handleDecline = async () => {
    try {
      const loadingToast = toast.loading('Declining invitation...');
      await declineGroupInvitation(invitation_token, notification.user_id);
      toast.dismiss(loadingToast);
      toast.success('Invitation declined');
      if (onDecline) onDecline(notification.id);
    } catch (error) {
      toast.error('Failed to decline invitation: ' + error.message);
    }
  };

  return (
    <div className="group-invite-notification">
      <div className="notification-icon">
        <UserPlus size={20} />
      </div>
      <div className="notification-content">
        <h4>{notification.title}</h4>
        <p className="invite-message">
          {inviterName} has invited you to join <strong>{group_title}</strong>
        </p>
        <div className="notification-meta">
          <span className="notification-time">
            {new Date(notification.created_at).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>
        <div className="notification-actions">
          <button 
            className="accept-btn" 
            onClick={handleAccept}
            title="Accept Invitation"
          >
            <Check size={14} />
            Accept
          </button>
          <button 
            className="decline-btn" 
            onClick={handleDecline}
            title="Decline Invitation"
          >
            <X size={14} />
            Decline
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupInviteNotification; 