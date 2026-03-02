import React from 'react';

const Logo = ({ size = '40px', className = '', style = {} }) => {
  return (
    <div 
      className={`logo-container ${className}`} 
      style={{ 
        width: size, 
        height: size, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        flexShrink: 0,
        ...style
      }}
    >
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        {/* Background Circle - Optimized for visibility and balance */}
        <circle cx="50" cy="50" r="32" fill="var(--logo-bg)" />
        
        {/* Logo Content */}
        <circle cx="50" cy="50" r="30" stroke="#6366F1" strokeWidth="3" />
        
        <line x1="50" y1="20" x2="50" y2="80" stroke="#6366F1" strokeWidth="1.5" />
        <line x1="20" y1="50" x2="80" y2="50" stroke="#6366F1" strokeWidth="1.5" />
        
        <ellipse cx="50" cy="50" rx="30" ry="15" stroke="#8B5CF6" strokeWidth="1.5" />
        <ellipse cx="50" cy="50" rx="30" ry="8" stroke="#8B5CF6" strokeWidth="1.5" opacity="0.5" />
        <ellipse cx="50" cy="50" rx="15" ry="30" stroke="#EC4899" strokeWidth="1.5" />
        <ellipse cx="50" cy="50" rx="8" ry="30" stroke="#EC4899" strokeWidth="1.5" opacity="0.5" />
        
        <circle cx="50" cy="35" r="3" fill="#EC4899" />
        <circle cx="65" cy="50" r="3" fill="#8B5CF6" />
        <circle cx="50" cy="65" r="3" fill="#3B82F6" />
        <circle cx="35" cy="50" r="3" fill="#A855F7" />
      </svg>
    </div>
  );
};

export default Logo;
