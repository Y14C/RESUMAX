import React, { useEffect, useRef, useState } from 'react';
import anime from 'animejs';
import { useNavigate, useLocation } from 'react-router-dom';
import { processResume } from '../utils/api';

const ProcessingPage: React.FC = () => {
  const loaderRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as any;
  
  // State declarations (must be before useEffect hooks that reference them)
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string>('');
  
  // Ref to prevent duplicate API calls in React StrictMode
  const hasProcessed = useRef(false);

  // Initialize wave animation
  useEffect(() => {
    const dots = loaderRef.current?.querySelectorAll('.circle');
    if (!dots || dots.length === 0) return;

    // Animate the dots in a wave pattern
    anime({
      targets: dots,
      translateY: [
        { value: 0 },
        { value: -28 },
        { value: 0 }
      ],
      scale: [
        { value: 1 },
        { value: 1.12 },
        { value: 1 }
      ],
      easing: 'spring(150, 9, 10, 0)',
      duration: 720,
      delay: anime.stagger(85),
      loop: true
    });
  }, []);

  // Animate progress bar
  useEffect(() => {
    const progressBar = document.querySelector('.progress-fill');
    if (!progressBar) return;

    anime({
      targets: progressBar,
      width: ['0%', '90%'], // Stop at 90% to show it's still processing
      easing: 'easeInOutQuad',
      duration: 3000, // 3 seconds to reach 90%
      loop: false
    });
  }, []);

  // Process resume with backend API
  useEffect(() => {
    const processResumeData = async () => {
      if (!state) {
        navigate('/');
        return;
      }

      // Prevent duplicate API calls in React StrictMode
      if (hasProcessed.current) {
        return;
      }
      hasProcessed.current = true;

      console.log('[AI REQUEST] Initiating resume processing:', {
        provider: state.selectedProvider,
        model: state.selectedModel,
        templateId: state.selectedTemplate.id,
        sessionId: state.uploadSessionId.substring(0, 8) + '...'
      });

      const result = await processResume({
        sessionId: state.uploadSessionId,
        provider: state.selectedProvider,
        model: state.selectedModel,
        apiKey: state.apiKey,
        templateId: state.selectedTemplate.id
      });

      if (result.success) {
        console.log('[AI RESPONSE] Resume processing successful:', {
          rawLatexCodeLength: result.data!.rawLatexCode.length,
          processedLatexCodeLength: result.data!.processedLatexCode?.length || 0,
          message: result.data!.message
        });
        
        // Complete the progress bar
        setIsComplete(true);
        
        // Animate progress bar to 100%
        const progressBar = document.querySelector('.progress-fill');
        if (progressBar) {
          anime({
            targets: progressBar,
            width: '100%',
            easing: 'easeInOutQuad',
            duration: 500,
            complete: () => {
              // Navigate to editor after progress bar completes
              setTimeout(() => {
                navigate('/editor', {
                  state: {
                    rawLatexCode: result.data!.rawLatexCode,
                    processedLatexCode: result.data!.processedLatexCode,
                    templateId: state.selectedTemplate.id,
                    timestamp: new Date().toISOString()
                  }
                });
              }, 500);
            }
          });
        } else {
          // Fallback if progress bar not found
          navigate('/editor', {
            state: {
              rawLatexCode: result.data!.rawLatexCode,
              processedLatexCode: result.data!.processedLatexCode,
              templateId: state.selectedTemplate.id,
              timestamp: new Date().toISOString()
            }
          });
        }
      } else {
        console.log('[AI ERROR] Resume processing failed:', {
          error: result.error?.message || 'Processing failed',
          errorType: result.error?.type
        });
        // Show error and allow user to go back
        setError(result.error?.message || 'Processing failed');
        setIsComplete(true);
      }
    };

    processResumeData();
  }, [state, navigate]);

  // Handle completion state changes
  useEffect(() => {
    if (isComplete && error) {
      // If there's an error and processing is complete, show error message
      console.log('[AI ERROR] Processing failed with error:', error);
    }
  }, [isComplete, error]);

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    zIndex: 10,
    pointerEvents: 'none'
  };

  const contentStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '40px'
  };

  const loaderContainerStyle: React.CSSProperties = {
    position: 'relative',
    padding: '20px'
  };

  const loaderStyle: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px 16px',
    position: 'relative',
    zIndex: 1
  };

  const circleStyle: React.CSSProperties = {
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    background: '#00d4ff',
    willChange: 'transform, opacity',
    transform: 'translateZ(0)',
    backfaceVisibility: 'hidden' as const,
    boxShadow: '0 0 15px rgba(0, 212, 255, 0.6)'
  };

  const textContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    marginTop: '20px'
  };

  const headingStyle: React.CSSProperties = {
    fontSize: '48px',
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    margin: 0,
    textShadow: '0 0 30px rgba(255, 255, 255, 0.3)'
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: '20px',
    color: '#b0b0b0',
    textAlign: 'center',
    margin: 0
  };

  const progressContainerStyle: React.CSSProperties = {
    width: '400px',
    height: '6px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '3px',
    overflow: 'hidden',
    position: 'relative',
    marginTop: '8px'
  };

  const progressFillStyle: React.CSSProperties = {
    height: '100%',
    width: '0%',
    background: isComplete
      ? 'linear-gradient(90deg, #10b981, #059669)'
      : 'linear-gradient(90deg, #00d4ff, #3b82f6)',
    borderRadius: '3px',
    boxShadow: isComplete
      ? '0 0 20px rgba(16, 185, 129, 0.6)'
      : '0 0 20px rgba(0, 212, 255, 0.6)',
    transition: 'all 0.3s ease'
  };

  return (
    <div style={containerStyle}>
      <div style={contentStyle}>
        {/* Loading Animation */}
        <div style={loaderContainerStyle}>
          <div ref={loaderRef} style={loaderStyle}>
            <div className="circle" style={circleStyle}></div>
            <div className="circle" style={circleStyle}></div>
            <div className="circle" style={circleStyle}></div>
            <div className="circle" style={circleStyle}></div>
            <div className="circle" style={circleStyle}></div>
            <div className="circle" style={circleStyle}></div>
          </div>
        </div>

        {/* Text Content */}
        <div style={textContainerStyle}>
          <h1 style={headingStyle}>Processing Your Resume</h1>
          <p style={subtitleStyle}>
            {error
              ? `Error: ${error}`
              : isComplete
                ? 'Processing complete! Redirecting to editor...'
                : 'Please wait while we format your resume...'
            }
          </p>

          {/* Progress Bar */}
          <div style={progressContainerStyle}>
            <div className="progress-fill" style={progressFillStyle}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcessingPage;

