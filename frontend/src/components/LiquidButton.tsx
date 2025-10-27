import React, { useState, forwardRef, useId } from 'react';

interface LiquidButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  color?: string;
}

const LiquidButton = forwardRef<HTMLButtonElement, LiquidButtonProps>(({
  children,
  onClick,
  disabled = false,
  className = '',
  style = {},
  color = '#2c3e50'
}, ref) => {
  const uniqueId = useId().replace(/:/g, '_');
  const [isActive, setIsActive] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMousePosition({ x, y });
    setIsActive(true);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMousePosition({ x, y });
    setIsActive(false);
  };

  const handleClick = () => {
    if (disabled || !onClick) return;
    onClick();
  };

  const buttonClass = `btn-liquid-${uniqueId}`;

  return (
    <>
      <style>{`
        .${buttonClass} {
          background: transparent;
          color: ${isActive ? '#ffffff' : color};
          border: 2px solid ${color};
          position: relative;
          overflow: hidden;
          padding: 15px 40px;
          font-size: 18px;
          font-weight: 600;
          cursor: 'none';
          border-radius: 0;
          transition: color 0.5s ease, transform 0.1s ease, opacity 0.3s ease;
          opacity: ${disabled ? 0.5 : 1};
        }

        .${buttonClass}:active {
          transform: scale(0.95);
        }

        .${buttonClass}::before {
          content: '';
          position: absolute;
          width: 300%;
          height: 300%;
          background: ${color};
          z-index: -1;
          transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
          border-radius: 50%;
          left: var(--mouse-x, 50%);
          top: var(--mouse-y, 50%);
          transform: translate(-50%, -50%) scale(${isActive ? 1 : 0});
        }
      `}</style>
      <button
        ref={ref}
        className={`${buttonClass} ${className}`}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        disabled={disabled}
        data-magnetic
        style={{
          '--mouse-x': `${mousePosition.x}px`,
          '--mouse-y': `${mousePosition.y}px`,
          ...style
        } as React.CSSProperties & { 
          '--mouse-x': string; 
          '--mouse-y': string;
        }}
      >
        {children}
      </button>
    </>
  );
});

LiquidButton.displayName = 'LiquidButton';

export default LiquidButton;
