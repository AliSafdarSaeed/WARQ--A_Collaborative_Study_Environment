import React from 'react';
import { createAvatar } from '@dicebear/core';
import { initials } from '@dicebear/collection';

export const Avatar = ({ name, email, size = 32, className = '' }) => {
  // Generate initials from name or email
  const getInitials = () => {
    if (name) {
      return name.split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) {
      return email.split('@')[0][0].toUpperCase();
    }
    return '?';
  };

  // Generate background color based on name or email
  const getBackgroundColor = () => {
    const colors = [
      '#FF5733', '#47e584', '#3357FF', '#F1C40F',
      '#9B59B6', '#E74C3C', '#1ABC9C', '#F39C12',
      '#3498DB', '#2ECC71', '#E67E22', '#9B59B6'
    ];
    
    const string = name || email || 'default';
    const hash = string.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  };

  // Generate avatar URL using DiceBear
  const getAvatarUrl = () => {
    const avatar = createAvatar(initials, {
      seed: name || email || 'default',
      backgroundColor: [getBackgroundColor().slice(1)], // Remove # from hex color
      chars: 2
    });
    
    return avatar.toDataUriSync();
  };

  return (
    <div
      className={`avatar ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: getBackgroundColor(),
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: `${size * 0.4}px`,
        fontWeight: 600,
        overflow: 'hidden',
        border: '2px solid rgba(255, 255, 255, 0.1)'
      }}
    >
      {getInitials()}
    </div>
  );
}; 