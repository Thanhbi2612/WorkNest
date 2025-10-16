import React from 'react';

const Badge = ({ count, color = '#dc2626', size = 'sm', rightOffset = '-4px', topOffset = '-4px' }) => {
  // Không hiển thị badge nếu count = 0
  if (!count || count === 0) return null;

  // Size configurations
  const sizeConfig = {
    sm: { width: '18px', height: '18px', fontSize: '10px' },
    md: { width: '20px', height: '20px', fontSize: '11px' },
    lg: { width: '24px', height: '24px', fontSize: '12px' }
  };

  const { width, height, fontSize } = sizeConfig[size] || sizeConfig.sm;

  return (
    <span
      style={{
        position: 'absolute',
        top: topOffset,
        right: rightOffset,
        backgroundColor: color,
        color: 'white',
        borderRadius: '50%',
        width,
        height,
        fontSize,
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: width,
        border: '2px solid var(--background-color, #1f2937)',
        zIndex: 10,
        animation: count > 0 ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none'
      }}
    >
      {count > 99 ? '99+' : count}
      <style>
        {`
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.8;
              transform: scale(1.05);
            }
          }
        `}
      </style>
    </span>
  );
};

export default Badge;
