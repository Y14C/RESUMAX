import { CSSProperties } from 'react';

export const canvasStyles: CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  display: 'block',
  zIndex: 0,
};

export const glassStyles: CSSProperties = {
  pointerEvents: 'none',
  position: 'fixed',
  inset: 0,
  background: 'rgba(255,255,255,0.02)',
  backdropFilter: 'blur(8px) saturate(120%)',
  WebkitBackdropFilter: 'blur(8px) saturate(120%)',
  mixBlendMode: 'screen',
  zIndex: 1,
};
