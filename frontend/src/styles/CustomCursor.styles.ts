import { CSSProperties } from 'react';

export const cursorStyles = (mousePosition: { x: number; y: number }): CSSProperties => ({
  position: 'fixed',
  width: '10px',
  height: '10px',
  background: '#ffffff',
  borderRadius: '50%',
  pointerEvents: 'none',
  zIndex: 10000,
  transform: 'translate(-50%, -50%)',
  left: mousePosition.x,
  top: mousePosition.y,
  boxShadow: '0 0 10px rgba(255, 255, 255, 1), 0 0 20px rgba(100, 180, 255, 0.6), 0 0 30px rgba(100, 180, 255, 0.3)',
});

export const reticleStyles = (
  mousePosition: { x: number; y: number },
  isContracted: boolean,
  targetElement: HTMLElement | null,
  targetBounds: DOMRect | null,
  isPressed: boolean
): CSSProperties => ({
  position: 'fixed',
  width: isContracted ? '25px' : '45px',
  height: isContracted ? '25px' : '45px',
  pointerEvents: 'none',
  zIndex: 9999,
  transform: 'translate(-50%, -50%)',
  left: targetElement && !isPressed ? (targetBounds ? targetBounds.left + targetBounds.width / 2 : mousePosition.x) : mousePosition.x,
  top: targetElement && !isPressed ? (targetBounds ? targetBounds.top + targetBounds.height / 2 : mousePosition.y) : mousePosition.y,
  animation: targetElement ? 'none' : 'rotate 2s linear infinite',
  transition: (targetElement && !isPressed) ? 'width 0.2s ease, height 0.2s ease, left 0.3s ease, top 0.3s ease' : 'width 0.2s ease, height 0.2s ease',
});

const baseBracketStyle: CSSProperties = {
  position: 'absolute',
  width: '13px',
  height: '13px',
  border: '2.6px solid #ffffff',
  filter: 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.8)) drop-shadow(0 0 8px rgba(255, 255, 255, 0.4))',
};

export const getBracketStyles = (
  position: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight',
  targetElement: HTMLElement | null,
  targetBounds: DOMRect | null,
  isPressed: boolean,
  isScrolling: boolean
): CSSProperties => {
  const bracketSize = 13;
  const completeBracketStyle: CSSProperties = {
    ...baseBracketStyle,
    transition: targetElement && !isPressed 
      ? (isScrolling ? 'all 0.0025s ease' : 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)')
      : 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
  };

  const positions = {
    topLeft: { top: 0, left: 0, borderRight: 'none', borderBottom: 'none' },
    topRight: { top: 0, right: 0, borderLeft: 'none', borderBottom: 'none' },
    bottomLeft: { bottom: 0, left: 0, borderRight: 'none', borderTop: 'none' },
    bottomRight: { bottom: 0, right: 0, borderLeft: 'none', borderTop: 'none' },
  };

  let expandedStyle: CSSProperties = {};

  if (targetElement && targetBounds && !isPressed) {
    // When hovering over a magnetic target (and not clicking)
    // Lock brackets to the target's corners
    const reticleSize = 45;
    const halfReticle = reticleSize / 2;
    const centerX = targetBounds.left + targetBounds.width / 2;
    const centerY = targetBounds.top + targetBounds.height / 2;

    const leftOffset = targetBounds.left - centerX + halfReticle - bracketSize / 2;
    const rightOffset = centerX - targetBounds.right + halfReticle - bracketSize / 2;
    const topOffset = targetBounds.top - centerY + halfReticle - bracketSize / 2;
    const bottomOffset = centerY - targetBounds.bottom + halfReticle - bracketSize / 2;

    const expansions = {
      topLeft: { 
        top: topOffset, 
        left: leftOffset,
        transform: 'rotate(0deg)',
      },
      topRight: { 
        top: topOffset, 
        right: rightOffset,
        transform: 'rotate(0deg)',
      },
      bottomLeft: { 
        bottom: bottomOffset, 
        left: leftOffset,
        transform: 'rotate(0deg)',
      },
      bottomRight: { 
        bottom: bottomOffset, 
        right: rightOffset,
        transform: 'rotate(0deg)',
      },
    };

    expandedStyle = expansions[position];
  }

  return {
    ...completeBracketStyle,
    ...positions[position],
    ...expandedStyle,
  };
};

export const rotateKeyframes = `
  @keyframes rotate {
    from {
      transform: translate(-50%, -50%) rotate(0deg);
    }
    to {
      transform: translate(-50%, -50%) rotate(360deg);
    }
  }
`;
