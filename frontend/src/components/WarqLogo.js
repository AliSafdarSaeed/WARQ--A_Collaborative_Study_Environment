import React from 'react';

const WarqLogo = ({ size = 'medium', variant = 'default' }) => {
  const sizes = {
    small: { container: 32, logo: 20, text: 14 },
    medium: { container: 40, logo: 24, text: 18 },
    large: { container: 48, logo: 32, text: 24 }
  };

  const currentSize = sizes[size];

  if (variant === 'boxed') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}
      >
        <div
          style={{
            width: `${currentSize.container}px`,
            height: `${currentSize.container}px`,
            background: '#47e584',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: `${currentSize.logo}px`,
            color: '#0f0f0f',
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            letterSpacing: '-0.5px',
            boxShadow: '0 2px 10px rgba(71, 229, 132, 0.2)'
          }}
        >
          W
        </div>
        <span
          style={{
            fontSize: `${currentSize.text}px`,
            fontWeight: 700,
            color: '#47e584',
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            letterSpacing: '-0.5px'
          }}
          className="warq-logo-text"
        >
          WARQ
        </span>
      </div>
    );
  }

  // Default variant - full background
  return (
    <div
      style={{
        background: '#47e584',
        padding: '8px 16px',
        borderRadius: '8px',
        display: 'inline-flex',
        alignItems: 'center',
        boxShadow: '0 2px 10px rgba(71, 229, 132, 0.2)'
      }}
    >
      <span
        style={{
          fontSize: `${currentSize.text}px`,
          fontWeight: 800,
          color: '#0f0f0f',
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
          letterSpacing: '-0.5px'
        }}
      >
        WARQ
      </span>
    </div>
  );
};

export default WarqLogo; 