import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import LiquidButton from '../components/LiquidButton';
import { compileLatex, preprocessLatex } from '../utils/api';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url,
).toString();

const EditorPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { 
    rawLatexCode?: string;
    processedLatexCode?: string | null;
    latexCode?: string; // Legacy support
    templateId?: string; 
    timestamp?: string;
  } | null;

  const [latexCode, setLatexCode] = useState(`\\documentclass[a4paper,10pt]{article}
\\usepackage[utf8]{inputenc}
\\usepackage{geometry}
\\geometry{a4paper, margin=1in}

\\begin{document}

\\section*{John Doe}
\\textbf{Email:} john.doe@email.com \\\\
\\textbf{Phone:} +1 (555) 123-4567

\\section*{Experience}
\\textbf{Software Engineer} - Tech Company \\\\
\\textit{2020 - Present}
\\begin{itemize}
  \\item Developed web applications using React and Node.js
  \\item Collaborated with cross-functional teams
  \\item Improved performance by 40\\%
\\end{itemize}

\\section*{Education}
\\textbf{Bachelor of Science in Computer Science} \\\\
University Name, 2016 - 2020

\\section*{Skills}
JavaScript, TypeScript, React, Node.js, Python, SQL

\\end{document}`);

  // Toggle state for raw/processed LaTeX
  const [rawLatexCode, setRawLatexCode] = useState<string>('');
  const [processedLatexCode, setProcessedLatexCode] = useState<string | null>(null);
  const [isShowingRaw, setIsShowingRaw] = useState<boolean>(true);
  const [isPreprocessing, setIsPreprocessing] = useState(false);

  // PDF preview state
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [compilationError, setCompilationError] = useState<string | null>(null);
  const [lastCompiledCode, setLastCompiledCode] = useState<string>('');
  const [numPages, setNumPages] = useState<number>(0);

  // Initialize LaTeX code from navigation state or use default
  useEffect(() => {
    // Check for new format (raw/processed)
    if (state?.rawLatexCode) {
      setRawLatexCode(state.rawLatexCode);
      setProcessedLatexCode(state.processedLatexCode || null);
      setLatexCode(state.rawLatexCode); // Show raw initially
      setIsShowingRaw(true);
    } 
    // Legacy support for old format
    else if (state?.latexCode) {
      setRawLatexCode(state.latexCode);
      setLatexCode(state.latexCode);
      setIsShowingRaw(true);
    }
  }, [state]);

  const handleDownloadLatex = () => {
    const blob = new Blob([latexCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resume.tex';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCompile = async () => {
    if (isCompiling) return;
    
    setIsCompiling(true);
    setCompilationError(null);
    
    try {
      console.log('[COMPILE] Starting LaTeX compilation...');
      const result = await compileLatex(latexCode);
      
      if (result.success) {
        // Convert base64 to data URL to avoid CSP issues
        const pdfData = result.data!.pdfData;
        const dataUrl = `data:application/pdf;base64,${pdfData}`;
        
        // Clean up old URL
        if (pdfPreviewUrl && pdfPreviewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(pdfPreviewUrl);
        }
        
        setPdfPreviewUrl(dataUrl);
        setLastCompiledCode(latexCode);
        
        console.log('[COMPILE] LaTeX compilation successful');
      } else {
        setCompilationError(result.error?.message || 'Compilation failed');
        console.error('[COMPILE] LaTeX compilation failed:', result.error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setCompilationError(errorMessage);
      console.error('[COMPILE] LaTeX compilation error:', error);
    } finally {
      setIsCompiling(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (isCompiling) return;
    
    // If we have a compiled PDF and the code hasn't changed, use it
    if (pdfPreviewUrl && lastCompiledCode === latexCode) {
      const a = document.createElement('a');
      a.href = pdfPreviewUrl;
      a.download = 'resume.pdf';
      a.click();
      return;
    }
    
    // Otherwise, compile first then download
    setIsCompiling(true);
    setCompilationError(null);
    
    try {
      console.log('[DOWNLOAD] Compiling LaTeX for PDF download...');
      const result = await compileLatex(latexCode);
      
      if (result.success) {
        // Convert base64 to blob and download
        const pdfData = result.data!.pdfData;
        const binaryString = atob(pdfData);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'resume.pdf';
        a.click();
        
        // Clean up
        URL.revokeObjectURL(url);
        
        console.log('[DOWNLOAD] PDF download successful');
      } else {
        setCompilationError(result.error?.message || 'Compilation failed');
        console.error('[DOWNLOAD] PDF compilation failed:', result.error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setCompilationError(errorMessage);
      console.error('[DOWNLOAD] PDF compilation error:', error);
    } finally {
      setIsCompiling(false);
    }
  };

  const handleSectionSelector = () => {
    navigate('/section-selector', {
      state: {
        latexCode: latexCode,
        templateId: state?.templateId,
        timestamp: new Date().toISOString()
      }
    });
  };

  const handleToggleFormatting = async () => {
    if (isShowingRaw) {
      // Switch to processed version
      if (processedLatexCode) {
        // Use cached processed version
        console.log('[TOGGLE] Switching to cached processed LaTeX');
        setLatexCode(processedLatexCode);
        setIsShowingRaw(false);
      } else {
        // No cached version (user edited raw code) - call preprocessing API
        console.log('[TOGGLE] No cached version, calling preprocessing API...');
        setIsPreprocessing(true);
        setCompilationError(null);
        
        try {
          const result = await preprocessLatex(latexCode);
          
          if (result.success) {
            setProcessedLatexCode(result.data!.processedLatex);
            setLatexCode(result.data!.processedLatex);
            setIsShowingRaw(false);
            console.log('[TOGGLE] LaTeX preprocessing successful');
          } else {
            setCompilationError(result.error?.message || 'Preprocessing failed');
            console.error('[TOGGLE] LaTeX preprocessing failed:', result.error);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          setCompilationError(errorMessage);
          console.error('[TOGGLE] LaTeX preprocessing error:', error);
        } finally {
          setIsPreprocessing(false);
        }
      }
    } else {
      // Switch back to raw
      console.log('[TOGGLE] Switching to raw LaTeX');
      setLatexCode(rawLatexCode);
      setIsShowingRaw(true);
    }
  };


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

  const editorPanelStyle: React.CSSProperties = {
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
    flexShrink: 0,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
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

  const panelContentStyle: React.CSSProperties = {
    flex: 1,
    padding: '24px',
    overflow: 'auto'
  };

  const editorPanelContentStyle: React.CSSProperties = {
    ...panelContentStyle,
    overflow: 'hidden'
  };

  const previewPanelContentStyle: React.CSSProperties = {
    ...panelContentStyle,
    overflow: 'hidden'
  };

  const textareaStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    background: 'rgba(0, 0, 0, 0.5)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '10px',
    color: '#ffffff',
    fontSize: '14px',
    fontFamily: "'Courier New', monospace",
    padding: '20px',
    resize: 'none',
    outline: 'none',
    cursor: 'none',
    lineHeight: '1.6',
    boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.5)',
    boxSizing: 'border-box'
  };


  // Scrollbar styles and animations
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
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;

  // Cleanup effect for blob URLs
  useEffect(() => {
    return () => {
      if (pdfPreviewUrl && pdfPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(pdfPreviewUrl);
      }
    };
  }, [pdfPreviewUrl]);

  return (
    <div style={containerStyle}>
      <style>{scrollbarStyles}</style>

      {/* Header */}
      <div style={headerStyle}>
        <div style={headerContentStyle}>
          <h1 style={titleStyle}>Resume Editor</h1>
          
          <div style={buttonContainerStyle}>
            <LiquidButton
              onClick={handleDownloadLatex}
              color="#06b6d4"
              style={{
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>📄</span>
              Download LaTeX
            </LiquidButton>

            <LiquidButton
              onClick={handleToggleFormatting}
              color="#f59e0b"
              style={{
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: isPreprocessing ? 0.6 : 1,
                pointerEvents: isPreprocessing ? 'none' : 'auto'
              }}
            >
              <span>{isPreprocessing ? '⏳' : (isShowingRaw ? '🔧' : '📝')}</span>
              {isPreprocessing ? 'Processing...' : (isShowingRaw ? 'Fix Formatting' : 'Show Raw')}
            </LiquidButton>

            <LiquidButton
              onClick={handleSectionSelector}
              color="#a855f7"
              style={{
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>📋</span>
              Section Selector
            </LiquidButton>

            <LiquidButton
              onClick={handleDownloadPDF}
              color="#ec4899"
              style={{
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: isCompiling ? 0.6 : 1,
                pointerEvents: isCompiling ? 'none' : 'auto'
              }}
            >
              <span>{isCompiling ? '⏳' : '📥'}</span>
              {isCompiling ? 'Generating...' : 'Download PDF'}
            </LiquidButton>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={contentStyle}>
        {/* Left Panel - LaTeX Editor */}
        <div style={editorPanelStyle}>
          <div style={panelHeaderStyle}>
            <h2 style={panelTitleStyle}>
              <div style={dotStyle} />
              LaTeX Code
            </h2>
            <div style={{ width: '80px', height: '33px' }} />
          </div>
          <div style={editorPanelContentStyle}>
            <textarea
              value={latexCode}
              onChange={(e) => {
                const newValue = e.target.value;
                setLatexCode(newValue);
                // Update the raw/processed code based on current view
                if (isShowingRaw) {
                  setRawLatexCode(newValue);
                  // Clear processed cache if user edits raw code
                  setProcessedLatexCode(null);
                }
              }}
              style={textareaStyle}
              spellCheck={false}
              placeholder="Enter your LaTeX code here..."
            />
          </div>
        </div>

        {/* Right Panel - Live Preview */}
        <div style={previewPanelStyle}>
          <div style={panelHeaderStyle}>
            <h2 style={panelTitleStyle}>
              <div style={{ ...dotStyle, background: '#a855f7' }} />
              Live Preview
            </h2>
            <LiquidButton
              onClick={handleCompile}
              color="#10b981"
              style={{
                padding: '8px 16px',
                fontSize: '12px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                opacity: isCompiling ? 0.6 : 1,
                pointerEvents: isCompiling ? 'none' : 'auto'
              }}
            >
              <span>{isCompiling ? '⏳' : ''}</span>
              {isCompiling ? 'Compiling...' : 'Compile'}
            </LiquidButton>
          </div>
          <div style={previewPanelContentStyle}>
            <div style={{
              width: '100%',
              height: '100%',
              background: 'rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              padding: '20px',
              overflow: 'auto',
              boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.5)',
              boxSizing: 'border-box',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {isCompiling ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '16px',
                  color: '#00d4ff'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    border: '3px solid rgba(0, 212, 255, 0.3)',
                    borderTop: '3px solid #00d4ff',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  <p style={{ fontSize: '16px', fontWeight: '600' }}>Compiling PDF...</p>
                </div>
              ) : compilationError ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '16px',
                  color: '#ff6b6b',
                  textAlign: 'center',
                  maxWidth: '400px'
                }}>
                  <div style={{ fontSize: '48px' }}>❌</div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>Compilation Error</h3>
                  <p style={{ fontSize: '14px', lineHeight: '1.5', margin: 0 }}>
                    {compilationError}
                  </p>
                  <LiquidButton
                    onClick={handleCompile}
                    color="#ff6b6b"
                    style={{
                      padding: '8px 16px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}
                  >
                    Try Again
                  </LiquidButton>
                </div>
              ) : pdfPreviewUrl ? (
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
                  <div style={{ width: '100%', height: '100%' }}>
                    <Document
                      file={pdfPreviewUrl}
                      onLoadSuccess={({ numPages }) => {
                        setNumPages(numPages);
                      }}
                      onLoadError={(error) => {
                        console.error('PDF load error:', error);
                        setCompilationError('Failed to load PDF');
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
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '16px',
                  color: '#9ca3af',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '48px' }}>📄</div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>PDF Preview</h3>
                  <p style={{ fontSize: '14px', lineHeight: '1.5', margin: 0 }}>
                    Click the <strong>Compile</strong> button to generate a PDF preview of your LaTeX code.
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

export default EditorPage;

