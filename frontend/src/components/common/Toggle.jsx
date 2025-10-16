import React from 'react';
import * as Switch from '@radix-ui/react-switch';

const Toggle = ({
  checked,
  onCheckedChange,
  disabled = false,
  label,
  description,
  size = 'default' // 'small' | 'default' | 'large'
}) => {
  const sizeStyles = {
    small: {
      width: '36px',
      height: '20px',
      thumbSize: '16px',
      thumbTranslate: '18px'
    },
    default: {
      width: '44px',
      height: '24px',
      thumbSize: '20px',
      thumbTranslate: '22px'
    },
    large: {
      width: '52px',
      height: '28px',
      thumbSize: '24px',
      thumbTranslate: '26px'
    }
  };

  const currentSize = sizeStyles[size];

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%'
    }}>
      {/* Label and Description */}
      {(label || description) && (
        <div style={{ flex: 1, marginRight: '1rem' }}>
          {label && (
            <label
              htmlFor={label}
              style={{
                color: checked ? '#f9fafb' : '#d1d5db',
                fontSize: '0.95rem',
                fontWeight: '500',
                display: 'block',
                marginBottom: description ? '0.25rem' : '0',
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'color 0.2s ease'
              }}
            >
              {label}
            </label>
          )}
          {description && (
            <p style={{
              color: '#9ca3af',
              fontSize: '0.85rem',
              margin: 0,
              lineHeight: '1.4'
            }}>
              {description}
            </p>
          )}
        </div>
      )}

      {/* Switch */}
      <Switch.Root
        id={label}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        style={{
          all: 'unset',
          width: currentSize.width,
          height: currentSize.height,
          backgroundColor: checked ? '#10b981' : '#374151',
          borderRadius: '9999px',
          position: 'relative',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'background-color 0.2s ease',
          flexShrink: 0,
          border: checked ? '2px solid #059669' : '2px solid #4b5563',
          opacity: disabled ? 0.5 : 1
        }}
      >
        <Switch.Thumb
          style={{
            display: 'block',
            width: currentSize.thumbSize,
            height: currentSize.thumbSize,
            backgroundColor: 'white',
            borderRadius: '9999px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
            transition: 'transform 0.2s ease',
            transform: checked ? `translateX(${currentSize.thumbTranslate})` : 'translateX(2px)',
            willChange: 'transform'
          }}
        />
      </Switch.Root>
    </div>
  );
};

export default Toggle;
