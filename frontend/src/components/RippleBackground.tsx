import React, { useEffect, useRef } from 'react';
import { RippleEngine, Params } from '../utils/rippleEngine';
import { canvasStyles, glassStyles } from '../styles/RippleBackground.styles';

const RippleBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glassRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<RippleEngine | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const params: Params = {
      speed: 1.0,
      maxRipples: 150,
      expansionSpeed: 105,
      maxRadius: 140,
      fadeSpeed: 0.8,
      minAlpha: 0.02,
      maxAlpha: 0.9
    };

    engineRef.current = new RippleEngine(canvas, ctx, params);
    engineRef.current.initialize();

    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
      }
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        style={canvasStyles}
      />
      <div
        ref={glassRef}
        style={glassStyles}
      />
    </>
  );
};

export default RippleBackground;
