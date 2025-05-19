import React, { useState, useEffect } from 'react';
import { searchUsers } from '../services/groupService';
import { X, Search, UserPlus } from 'react-feather';
import './InviteModal.css';

const InviteModal = ({ isOpen, onClose, onInvite, groupName }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    const searchUsersDebounced = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const results = await searchUsers(searchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error('Error searching users:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(searchUsersDebounced, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      await onInvite(selectedUser);
      setSearchQuery('');
      setSelectedUser(null);
      setSearchResults([]);
    } catch (error) {
      console.error('Error inviting user:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-content invite-modal">
        <div className="modal-header">
          <h3>Invite to {groupName}</h3>
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="search-container">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedUser(null);
              }}
              className="search-input"
            />
            {isLoading && <div className="loading-spinner" />}
          </div>

          {searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map(user => (
                <div
                  key={user.id}
                  className={`user-result ${selectedUser?.id === user.id ? 'selected' : ''}`}
                  onClick={() => setSelectedUser(user)}
                >
                  <div className="user-avatar">
                    {user.name ? user.name[0].toUpperCase() : (user.email ? user.email[0].toUpperCase() : 'U')}
                  </div>
                  <div className="user-info">
                    <div className="user-name">{user.name || 'No name available'}</div>
                    <div className="user-email">{user.email || 'No email available'}</div>
                  </div>
                  {selectedUser?.id === user.id && (
                    <div className="selected-indicator">✓</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {searchQuery && searchResults.length === 0 && !isLoading && (
            <div className="no-results">
              User not available. Invite them to sign up at WARQ!
            </div>
          )}

          <div className="modal-footer">
            <button
              type="button"
              className="cancel-button"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="invite-button"
              disabled={!selectedUser}
            >
              <UserPlus size={16} />
              Invite User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InviteModal;