import React, { useState, useEffect, useRef } from 'react';
import { cursorStyles, reticleStyles, getBracketStyles, rotateKeyframes } from '../styles/CustomCursor.styles';

const CustomCursor: React.FC = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isContracted, setIsContracted] = useState(false);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [targetBounds, setTargetBounds] = useState<DOMRect | null>(null);
  const [isPressed, setIsPressed] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const dotRef = useRef<HTMLDivElement>(null);
  const reticleRef = useRef<HTMLDivElement>(null);
  const targetElementRef = useRef<HTMLElement | null>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Set global cursor to none
    document.body.style.cursor = 'none';
    
    // Add global CSS rule to ensure no default cursor appears anywhere
    const style = document.createElement('style');
    style.textContent = `
      *, *::before, *::after {
        cursor: none !important;
      }
    `;
    document.head.appendChild(style);

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      
      // Check if hovering over a magnetic target
      const target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
      const magneticTarget = target?.closest('[data-magnetic]') as HTMLElement;
      
      if (magneticTarget) {
        setTargetElement(magneticTarget);
        setTargetBounds(magneticTarget.getBoundingClientRect());
        targetElementRef.current = magneticTarget;
      } else {
        setTargetElement(null);
        setTargetBounds(null);
        targetElementRef.current = null;
      }
    };

    const handleMouseDown = () => {
      setIsContracted(true);
      setIsPressed(true);
    };

    const handleMouseUp = () => {
      setIsContracted(false);
      setIsPressed(false);
    };

    const handleScroll = () => {
      // Update target bounds when scrolling if we're locked to an element
      if (targetElementRef.current) {
        setTargetBounds(targetElementRef.current.getBoundingClientRect());
      }
      
      // Set scrolling state to true
      setIsScrolling(true);
      
      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      // Set timeout to detect when scrolling stops
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 50); // 50ms delay after scroll stops
    };

    // MutationObserver to detect when the target element is removed from DOM
    const observer = new MutationObserver((_mutations) => {
      const currentTarget = targetElementRef.current;
      if (!currentTarget) return;

      // Check if the target element is still in the DOM
      if (!document.contains(currentTarget)) {
        // Element was removed, detach cursor
        setTargetElement(null);
        setTargetBounds(null);
        targetElementRef.current = null;
      }
    });

    // Observe the entire document for removed nodes
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      document.body.style.cursor = 'auto';
      document.head.removeChild(style);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('scroll', handleScroll, true);
      observer.disconnect();
      
      // Clear timeout on cleanup
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <div
        ref={dotRef}
        style={cursorStyles(mousePosition)}
      />
      <div
        ref={reticleRef}
        className={isContracted ? 'contract' : ''}
        style={reticleStyles(mousePosition, isContracted, targetElement, targetBounds, isPressed)}
      >
        <div className="bracket top-left" style={getBracketStyles('topLeft', targetElement, targetBounds, isPressed, isScrolling)} />
        <div className="bracket top-right" style={getBracketStyles('topRight', targetElement, targetBounds, isPressed, isScrolling)} />
        <div className="bracket bottom-left" style={getBracketStyles('bottomLeft', targetElement, targetBounds, isPressed, isScrolling)} />
        <div className="bracket bottom-right" style={getBracketStyles('bottomRight', targetElement, targetBounds, isPressed, isScrolling)} />
      </div>
      <style>{rotateKeyframes}</style>
    </>
  );
};

export default CustomCursor;
