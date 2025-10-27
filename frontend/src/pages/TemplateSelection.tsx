import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import TemplateList from '../components/TemplateList';
import LiquidButton from '../components/LiquidButton';
import { Template, TemplateSelectionState } from '../types/template';
import { 
  getPreloadedTemplates, 
  getLoadingError,
  getPreloadedTemplatePdf,
  startTemplatePdfPreloading
} from '../utils/dataPreloader';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url,
).toString();

const TemplateSelection: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as TemplateSelectionState | null;

  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [error, setError] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);

  // Redirect if no state (user didn't come from main page)
  useEffect(() => {
    if (!state) {
      navigate('/');
    }
  }, [state, navigate]);

  // Load templates from preloaded data (should be ready since AppLoader waited)
  useEffect(() => {
    const loadTemplates = () => {
      // Get preloaded templates (should be ready)
      const preloadedTemplates = getPreloadedTemplates();
      if (preloadedTemplates) {
        setTemplates(preloadedTemplates);
        setError(''); // Clear any previous errors
        console.log('[TEMPLATES] Templates loaded from preload cache');
        
        // Start PDF preloading now that we're on the template selection page
        startTemplatePdfPreloading().catch(console.error);
      } else {
        const loadingError = getLoadingError();
        setError(loadingError || 'Failed to load templates.');
      }
    };

    loadTemplates();
  }, []);

  useEffect(() => {
    if (templates.length > 0 && !selectedTemplate) {
      setSelectedTemplate(templates[0]);
    }
  }, [templates, selectedTemplate]);

  // Generate preview URL from preloaded PDF blob when template changes
  useEffect(() => {
    // Clean up previous preview URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    if (selectedTemplate) {
      const pdfBlob = getPreloadedTemplatePdf(selectedTemplate.id);
      if (pdfBlob) {
        // Convert blob to data URL to avoid CSP issues
        const reader = new FileReader();
        reader.onload = () => {
          setPreviewUrl(reader.result as string);
          console.log(`[PREVIEW] PDF preview data URL created for template: ${selectedTemplate.id}`);
        };
        reader.readAsDataURL(pdfBlob);
      } else {
        setPreviewUrl(null);
        console.log(`[PREVIEW] No PDF available for template: ${selectedTemplate.id}`);
      }
    } else {
      setPreviewUrl(null);
    }

    // Cleanup function
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [selectedTemplate]);

  const handleContinue = () => {
    if (selectedTemplate && state) {
      // Navigate to processing page with template and configuration data
      navigate('/processing', {
        state: {
          ...state,
          selectedTemplate
        }
      });
    }
  };

  if (!state) {
    return null; // Will redirect in useEffect
  }

  // Styles
  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    color: '#ffffff',
    zIndex: 10,
    pointerEvents: 'none',
    overflow: 'hidden'
  };

  const headerStyle: React.CSSProperties = {
    borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
    padding: '20px 40px',
    pointerEvents: 'auto',
    background: 'rgba(0, 0, 0, 0.3)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    flexShrink: 0
  };

  const headerContentStyle: React.CSSProperties = {
    maxWidth: '100%',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '24px'
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '32px',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #ec4899 0%, #a855f7 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    margin: 0,
    textShadow: '0 0 30px rgba(236, 72, 153, 0.3)'
  };

  const buttonContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
    alignItems: 'center'
  };


  const contentStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: '0',
    pointerEvents: 'auto',
    overflow: 'hidden'
  };

  const leftPanelStyle: React.CSSProperties = {
    width: '50%',
    display: 'flex',
    flexDirection: 'column',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRight: '1px solid rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)'
  };

  const previewPanelStyle: React.CSSProperties = {
    width: '50%',
    display: 'flex',
    flexDirection: 'column',
    background: 'rgba(0, 0, 0, 0.2)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)'
  };

  const panelHeaderStyle: React.CSSProperties = {
    padding: '20px 24px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    flexShrink: 0
  };

  const panelTitleStyle: React.CSSProperties = {
    fontSize: '20px',
    fontWeight: '600',
    color: '#ffffff',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  };

  const dotStyle: React.CSSProperties = {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#ec4899'
  };

  const leftPanelContentStyle: React.CSSProperties = {
    flex: 1,
    padding: '24px',
    overflow: 'hidden'
  };

  const previewPanelContentStyle: React.CSSProperties = {
    flex: 1,
    padding: '24px',
    overflow: 'hidden'
  };

  const scrollContainerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    background: 'rgba(0, 0, 0, 0.5)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '10px',
    padding: '20px',
    overflow: 'auto',
    boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.5)',
    boxSizing: 'border-box'
  };

  // Scrollbar styles
  const scrollbarStyles = `
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    ::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 4px;
    }
    ::-webkit-scrollbar-thumb {
      background: rgba(236, 72, 153, 0.3);
      border-radius: 4px;
      transition: background 0.3s ease;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: rgba(236, 72, 153, 0.5);
    }
  `;

  return (
    <div style={containerStyle}>
      <style>{scrollbarStyles}</style>

      {/* Header */}
      <div style={headerStyle}>
        <div style={headerContentStyle}>
          <h1 style={titleStyle}>Choose Template</h1>
          
          <div style={buttonContainerStyle}>
            <LiquidButton
              onClick={handleContinue}
              disabled={!selectedTemplate}
              color="#ec4899"
              style={{
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: selectedTemplate ? 1 : 0.5,
                pointerEvents: selectedTemplate ? 'auto' : 'none'
              }}
            >
              <span>→</span>
              Continue
            </LiquidButton>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={contentStyle}>
        {/* Left Panel - Template List */}
        <div style={leftPanelStyle}>
          <div style={panelHeaderStyle}>
            <h2 style={panelTitleStyle}>
              <div style={dotStyle} />
              Templates
            </h2>
          </div>
          <div style={leftPanelContentStyle}>
            <div style={scrollContainerStyle}>
              {templates.length === 0 ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '200px',
                  color: '#9ca3af'
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '12px' }}>⚠️</div>
                  <p>No templates available</p>
                </div>
              ) : error ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '200px',
                  color: '#fca5a5',
                  textAlign: 'center',
                  padding: '20px'
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '12px' }}>⚠️</div>
                  <p>{error}</p>
                </div>
              ) : (
                <TemplateList
                  templates={templates}
                  selectedTemplate={selectedTemplate}
                  onTemplateSelect={setSelectedTemplate}
                />
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Live Preview */}
        <div style={previewPanelStyle}>
          <div style={panelHeaderStyle}>
            <h2 style={panelTitleStyle}>
              <div style={{ ...dotStyle, background: '#a855f7' }} />
              Live Preview
            </h2>
          </div>
          <div style={previewPanelContentStyle}>
            <div style={{
              width: '100%',
              height: '100%',
              background: 'rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              overflow: 'hidden',
              boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.5)',
              boxSizing: 'border-box',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {previewUrl ? (
                 <div style={{ 
                   width: '100%', 
                   height: '100%', 
                   display: 'flex', 
                   flexDirection: 'column',
                   alignItems: 'center',
                   overflow: 'auto',
                   overflowX: 'hidden',
                   overflowY: 'auto'
                 }}>
                  <Document
                    file={previewUrl}
                    onLoadSuccess={({ numPages }) => {
                      setNumPages(numPages);
                    }}
                    onLoadError={(error) => {
                      console.error('PDF load error:', error);
                      setError('Failed to load PDF preview');
                    }}
                    loading={
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        height: '200px',
                        color: '#ffffff'
                      }}>
                        Loading PDF...
                      </div>
                    }
                    error={
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        height: '200px',
                        color: '#ff6b6b'
                      }}>
                        Failed to load PDF
                      </div>
                    }
                  >
                    {Array.from({ length: numPages }, (_, index) => (
                      <div key={index + 1} style={{ marginBottom: '20px' }}>
                        <div style={{ 
                          width: '95%',
                          height: 'auto',
                          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                          borderRadius: '8px',
                          margin: '0 auto',
                          display: 'block'
                        }}>
                          <Page
                            pageNumber={index + 1}
                            scale={1.0}
                          />
                        </div>
                        {index < numPages - 1 && (
                          <div style={{
                            height: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '10px 0'
                          }}>
                            <div style={{
                              width: '60px',
                              height: '2px',
                              backgroundColor: 'rgba(168, 85, 247, 0.3)',
                              borderRadius: '1px'
                            }} />
                            <span style={{
                              margin: '0 15px',
                              fontSize: '12px',
                              color: '#9ca3af',
                              fontWeight: '500'
                            }}>
                              Page {index + 2}
                            </span>
                            <div style={{
                              width: '60px',
                              height: '2px',
                              backgroundColor: 'rgba(168, 85, 247, 0.3)',
                              borderRadius: '1px'
                            }} />
                          </div>
                        )}
                      </div>
                    ))}
                  </Document>
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#9ca3af',
                  padding: '40px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
                  <p style={{ fontSize: '16px', fontWeight: '500' }}>
                    {selectedTemplate ? 'Loading preview...' : 'Select a template to preview'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateSelection;
