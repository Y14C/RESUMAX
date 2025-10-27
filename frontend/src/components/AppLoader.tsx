import React, { useState, useEffect } from 'react';
import { 
  getLoadingError,
  waitForCriticalData,
  preloadAllData
} from '../utils/dataPreloader';

interface AppLoaderProps {
  children: React.ReactNode;
}

const AppLoader: React.FC<AppLoaderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    const loadApp = async () => {
      try {
        console.log('[APP LOADER] Starting app preload...');
        
        // Wait only for critical data (providers + templates) - much faster!
        await waitForCriticalData();
        
        // Check if there were any errors during preload
        const loadingError = getLoadingError();
        if (loadingError) {
          setError(loadingError);
          setIsLoading(false);
          return;
        }
        
        // Show UI immediately after critical data loads
        setLoadingProgress(100);
        setTimeout(() => {
          setIsLoading(false);
          console.log('[APP LOADER] App ready! (Critical data loaded)');
        }, 100);
        
        // Load remaining data (PDFs, etc.) in background
        preloadAllData().catch(console.error);
        
      } catch (error) {
        console.error('[APP LOADER] Failed to load app:', error);
        setError('Failed to initialize application. Please restart the app.');
        setIsLoading(false);
      }
    };

    loadApp();
  }, []);

  if (isLoading) {
    return <LoadingScreen progress={loadingProgress} />;
  }

  if (error) {
    return <ErrorScreen error={error} />;
  }

  return <>{children}</>;
};

const LoadingScreen: React.FC<{ progress: number }> = ({ progress }) => {
  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    zIndex: 9999,
    fontFamily: 'system-ui, -apple-system, sans-serif'
  };

  const logoStyle: React.CSSProperties = {
    fontSize: '72px',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #ec4899 0%, #a855f7 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    marginBottom: '20px',
    textShadow: '0 0 30px rgba(236, 72, 153, 0.3)',
    animation: 'logoPulse 2s ease-in-out infinite'
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: '24px',
    color: '#b0b0b0',
    marginBottom: '40px',
    textAlign: 'center'
  };

  const progressContainerStyle: React.CSSProperties = {
    width: '400px',
    height: '6px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '3px',
    overflow: 'hidden',
    marginBottom: '20px'
  };

  const progressFillStyle: React.CSSProperties = {
    height: '100%',
    width: `${progress}%`,
    background: 'linear-gradient(90deg, #00d4ff, #3b82f6)',
    borderRadius: '3px',
    boxShadow: '0 0 20px rgba(0, 212, 255, 0.6)',
    transition: 'width 0.3s ease'
  };

  const statusStyle: React.CSSProperties = {
    fontSize: '16px',
    color: '#9ca3af',
    textAlign: 'center'
  };

  const getStatusText = (progress: number): string => {
    if (progress < 20) return 'Initializing...';
    if (progress < 40) return 'Loading data...';
    if (progress < 60) return 'Preparing interface...';
    if (progress < 80) return 'Almost ready...';
    if (progress < 95) return 'Finalizing...';
    return 'Ready!';
  };

  return (
    <div style={containerStyle}>
      <style>{`
        @keyframes logoPulse {
          0%, 100% {
            transform: scale(1);
            filter: brightness(1);
          }
          50% {
            transform: scale(1.05);
            filter: brightness(1.2);
          }
        }
      `}</style>
      <h1 style={logoStyle}>Resumax</h1>
      
      <div style={progressContainerStyle}>
        <div style={progressFillStyle}></div>
      </div>
      
      <p style={statusStyle}>{getStatusText(progress)}</p>
    </div>
  );
};

const ErrorScreen: React.FC<{ error: string }> = ({ error }) => {
  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    zIndex: 9999,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    padding: '40px'
  };

  const logoStyle: React.CSSProperties = {
    fontSize: '48px',
    fontWeight: 'bold',
    color: '#ef4444',
    marginBottom: '20px'
  };

  const errorStyle: React.CSSProperties = {
    fontSize: '18px',
    color: '#fca5a5',
    textAlign: 'center',
    marginBottom: '30px',
    maxWidth: '600px',
    lineHeight: '1.5'
  };

  const buttonStyle: React.CSSProperties = {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
    border: 'none',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'none',
    transition: 'all 0.3s ease'
  };

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div style={containerStyle}>
      <div style={logoStyle}>⚠️</div>
      <h1 style={{ fontSize: '32px', marginBottom: '20px', color: '#ffffff' }}>
        Failed to Load
      </h1>
      <p style={errorStyle}>{error}</p>
      <button style={buttonStyle} onClick={handleRetry} data-magnetic>
        Retry
      </button>
    </div>
  );
};

export default AppLoader;
