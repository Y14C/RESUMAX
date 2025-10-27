import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import LiquidButton from '../components/LiquidButton';
import { parseSections, filterLatex, compileLatex } from '../utils/api';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url,
).toString();

interface SectionMetadata {
  type: 'simple' | 'complex';
  label: string;
  item_count?: number;
}

interface SectionData {
  full_content: string;
  section_header: string;
  has_items: boolean;
  title: string;
  items?: Record<string, string>;
}

interface SectionInfo {
  title: string;
  subsections: string[];
}

interface ParsedData {
  format_id: string;
  latex_blocks: {
    preamble: string;
    sections: Record<string, SectionData>;
    closing: string;
  };
  section_info: SectionInfo[];
  original_latex: string;
}

interface Selections {
  [key: string]: boolean | { enabled: boolean; items: number[] };
}

const SectionSelectorPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { latexCode?: string; templateId?: string; timestamp?: string } | null;

  // State management
  const [originalLatex, setOriginalLatex] = useState<string>('');
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [metadata, setMetadata] = useState<Record<string, SectionMetadata>>({});
  const [selections, setSelections] = useState<Selections>({});
  const [filteredLatex, setFilteredLatex] = useState<string>('');
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);

  // Get subsection titles from parser output
  const getSubsectionTitles = (sectionKey: string): string[] => {
    if (!parsedData?.section_info) return [];
    
    // Find the section in section_info that matches this section key
    const section = parsedData.section_info.find(s => {
      const normalizedTitle = s.title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
      return normalizedTitle === sectionKey;
    });
    
    return section?.subsections || [];
  };

  // Initialize with LaTeX code from navigation state
  useEffect(() => {
    if (state?.latexCode) {
      setOriginalLatex(state.latexCode);
      parseLatexSections(state.latexCode);
    } else {
      // Redirect if no LaTeX code provided
      navigate('/editor');
    }
  }, [state, navigate]);

  // Parse LaTeX sections
  const parseLatexSections = async (latexCode: string) => {
    setIsParsing(true);
    setError(null);
    
    try {
      console.log('[PARSE] Starting LaTeX section parsing...', state?.templateId ? `Template: ${state.templateId}` : '');
      const result = await parseSections(latexCode, state?.templateId);
      
      if (result.success) {
        setParsedData(result.data!.parsedData);
        setMetadata(result.data!.metadata);
        
        // Initialize selections - all sections enabled by default (except header)
        const initialSelections: Selections = {};
        for (const [key, meta] of Object.entries(result.data!.metadata)) {
          const sectionMeta = meta as SectionMetadata;
          // Skip header section (always included, non-selectable)
          if (key === 'header') {
            continue;
          }
          
          if (sectionMeta.type === 'simple') {
            initialSelections[key] = true;
          } else {
            initialSelections[key] = { enabled: true, items: Array.from({ length: sectionMeta.item_count || 0 }, (_, i) => i) };
          }
        }
        setSelections(initialSelections);
        
        console.log('[PARSE] LaTeX sections parsed successfully');
      } else {
        setError(result.error?.message || 'Failed to parse LaTeX sections');
        console.error('[PARSE] Section parsing failed:', result.error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('[PARSE] Section parsing error:', error);
    } finally {
      setIsParsing(false);
    }
  };

  // Filter LaTeX based on selections
  const filterLatexSections = async (newSelections: Selections) => {
    if (!parsedData) return;
    
    setIsFiltering(true);
    setError(null);
    
    try {
      console.log('[FILTER] Starting LaTeX filtering...');
      console.log('[FILTER] Parsed data structure:', {
        format_id: parsedData.format_id,
        sections: Object.keys(parsedData.latex_blocks?.sections || {}),
        hasPreamble: !!parsedData.latex_blocks?.preamble,
        hasClosing: !!parsedData.latex_blocks?.closing
      });
      console.log('[FILTER] Selections:', newSelections);
      const result = await filterLatex(parsedData, newSelections);
      
      if (result.success) {
        setFilteredLatex(result.data!.filteredLatex);
        console.log('[FILTER] LaTeX filtered successfully');
        
        // Compile filtered LaTeX for preview
        await compileFilteredLatex(result.data!.filteredLatex);
      } else {
        setError(result.error?.message || 'Failed to filter LaTeX');
        console.error('[FILTER] LaTeX filtering failed:', result.error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('[FILTER] LaTeX filtering error:', error);
    } finally {
      setIsFiltering(false);
    }
  };

  // Manual compile function for button trigger
  const handleCompile = async () => {
    if (isCompiling || isFiltering) return;
    
    if (!parsedData) {
      setError('No parsed data available');
      return;
    }
    
    await filterLatexSections(selections);
  };

  // Compile filtered LaTeX for preview
  const compileFilteredLatex = async (latexCode: string) => {
    setIsCompiling(true);
    
    try {
      console.log('[COMPILE] Compiling filtered LaTeX for preview...');
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
        
        console.log('[COMPILE] Filtered LaTeX compiled successfully');
      } else {
        setError(result.error?.message || 'Compilation failed');
        console.error('[COMPILE] LaTeX compilation failed:', result.error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('[COMPILE] LaTeX compilation error:', error);
    } finally {
      setIsCompiling(false);
    }
  };

  // Handle section selection change
  const handleSectionChange = (sectionKey: string, enabled: boolean) => {
    const newSelections = { ...selections };
    
    if (metadata[sectionKey].type === 'simple') {
      newSelections[sectionKey] = enabled;
    } else {
      const currentSelection = newSelections[sectionKey] as { enabled: boolean; items: number[] } | undefined;
      newSelections[sectionKey] = { 
        enabled, 
        items: enabled ? (currentSelection?.items ?? []) : [] 
      };
    }
    
    setSelections(newSelections);
    // Removed automatic compilation - user must click compile button
  };

  // Handle item selection change
  const handleItemChange = (sectionKey: string, itemIndex: number, enabled: boolean) => {
    const newSelections = { ...selections };
    const currentSelection = newSelections[sectionKey] as { enabled: boolean; items: number[] } | undefined;
    
    let newItems = [...(currentSelection?.items ?? [])];
    if (enabled) {
      if (!newItems.includes(itemIndex)) {
        newItems.push(itemIndex);
      }
    } else {
      newItems = newItems.filter(i => i !== itemIndex);
    }
    
    newSelections[sectionKey] = { 
      enabled: newItems.length > 0, 
      items: newItems 
    };
    
    setSelections(newSelections);
    // Removed automatic compilation - user must click compile button
  };

  // Reset to original LaTeX
  const handleReset = () => {
    if (originalLatex) {
      parseLatexSections(originalLatex);
    }
  };

  // Download filtered LaTeX code (with current selections)
  const handleDownloadLatex = async () => {
    if (!parsedData) {
      setError('No parsed data available.');
      return;
    }
    
    try {
      console.log('[DOWNLOAD] Generating filtered LaTeX with current selections...');
      
      // Generate filtered LaTeX with current selections
      const result = await filterLatex(parsedData, selections);
      
      if (!result.success) {
        setError(result.error?.message || 'Failed to generate filtered LaTeX');
        console.error('[DOWNLOAD] LaTeX filtering failed:', result.error);
        return;
      }
      
      const latexToDownload = result.data!.filteredLatex;
      
      // Create blob from LaTeX string
      const blob = new Blob([latexToDownload], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const a = document.createElement('a');
      a.href = url;
      a.download = `resume-filtered-${Date.now()}.tex`;
      a.click();
      
      // Clean up
      URL.revokeObjectURL(url);
      
      console.log('[DOWNLOAD] Filtered LaTeX download successful');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('[DOWNLOAD] LaTeX download error:', error);
    }
  };

  // Download original LaTeX code (for comparison)
  const handleDownloadOriginalLatex = () => {
    if (!originalLatex) {
      setError('No original LaTeX available.');
      return;
    }
    
    try {
      console.log('[DOWNLOAD] Downloading original LaTeX code...');
      
      // Create blob from LaTeX string
      const blob = new Blob([originalLatex], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const a = document.createElement('a');
      a.href = url;
      a.download = `resume-original-${Date.now()}.tex`;
      a.click();
      
      // Clean up
      URL.revokeObjectURL(url);
      
      console.log('[DOWNLOAD] Original LaTeX download successful');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('[DOWNLOAD] Original LaTeX download error:', error);
    }
  };

  // Download filtered PDF
  const handleDownloadPDF = async () => {
    if (!filteredLatex) {
      setError('No filtered LaTeX available. Please click Compile first.');
      return;
    }
    
    setIsCompiling(true);
    
    try {
      console.log('[DOWNLOAD] Compiling filtered LaTeX for PDF download...');
      const result = await compileLatex(filteredLatex);
      
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
        a.download = 'resume-filtered.pdf';
        a.click();
        
        // Clean up
        URL.revokeObjectURL(url);
        
        console.log('[DOWNLOAD] Filtered PDF download successful');
      } else {
        setError(result.error?.message || 'Compilation failed');
        console.error('[DOWNLOAD] PDF compilation failed:', result.error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('[DOWNLOAD] PDF compilation error:', error);
    } finally {
      setIsCompiling(false);
    }
  };

  // Navigate to home
  const handleGoHome = () => {
    navigate('/');
  };

  // Cleanup effect for blob URLs
  useEffect(() => {
    return () => {
      if (pdfPreviewUrl && pdfPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(pdfPreviewUrl);
      }
    };
  }, [pdfPreviewUrl]);

  // Styles (matching EditorPage)
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
    background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    margin: 0,
    textShadow: '0 0 30px rgba(168, 85, 247, 0.3)'
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

  const selectorPanelStyle: React.CSSProperties = {
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
    background: '#a855f7'
  };

  const panelContentStyle: React.CSSProperties = {
    flex: 1,
    padding: '24px',
    overflow: 'auto'
  };

  const checkboxContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  };

  const sectionStyle: React.CSSProperties = {
    background: 'rgba(0, 0, 0, 0.5)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '10px',
    padding: '16px',
    color: '#ffffff'
  };

  const sectionHeaderStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
    fontSize: '16px',
    fontWeight: '600'
  };

  const itemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginLeft: '24px',
    marginBottom: '8px',
    fontSize: '14px',
    color: '#e5e7eb'
  };

  const checkboxStyle: React.CSSProperties = {
    width: '16px',
    height: '16px',
    accentColor: '#a855f7'
  };

  const previewContentStyle: React.CSSProperties = {
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
  };

  const loadingStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    color: '#a855f7'
  };

  const errorStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    color: '#ff6b6b',
    textAlign: 'center',
    maxWidth: '400px'
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
      background: rgba(168, 85, 247, 0.3);
      border-radius: 4px;
      transition: background 0.3s ease;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: rgba(168, 85, 247, 0.5);
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;

  return (
    <div style={containerStyle}>
      <style>{scrollbarStyles}</style>

      {/* Header */}
      <div style={headerStyle}>
        <div style={headerContentStyle}>
          <h1 style={titleStyle}>Section Selector</h1>
          
          <div style={buttonContainerStyle}>
            <LiquidButton
              onClick={handleGoHome}
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
              <span>🏠</span>
              Home
            </LiquidButton>

            <LiquidButton
              onClick={handleReset}
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
              <span>🔄</span>
              Reset
            </LiquidButton>

            <LiquidButton
              onClick={handleDownloadLatex}
              color="#8b5cf6"
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
              LaTeX (Filtered)
            </LiquidButton>

            <LiquidButton
              onClick={handleDownloadOriginalLatex}
              color="#6366f1"
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
              LaTeX (Original)
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
              {isCompiling ? 'Generating...' : 'PDF'}
            </LiquidButton>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={contentStyle}>
        {/* Left Panel - Section Selector */}
        <div style={selectorPanelStyle}>
          <div style={panelHeaderStyle}>
            <h2 style={panelTitleStyle}>
              <div style={dotStyle} />
              Select Sections
            </h2>
            <div style={{ width: '80px', height: '33px' }} />
          </div>
          <div style={panelContentStyle}>
            {isParsing ? (
              <div style={loadingStyle}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  border: '3px solid rgba(168, 85, 247, 0.3)',
                  borderTop: '3px solid #a855f7',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                <p style={{ fontSize: '16px', fontWeight: '600' }}>Parsing sections...</p>
              </div>
            ) : error ? (
              <div style={errorStyle}>
                <div style={{ fontSize: '48px' }}>❌</div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>Error</h3>
                <p style={{ fontSize: '14px', lineHeight: '1.5', margin: 0 }}>
                  {error}
                </p>
                <LiquidButton
                  onClick={handleReset}
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
            ) : (
              <div style={checkboxContainerStyle}>
                {/* Sort sections by document order using section_info */}
                {Object.entries(metadata)
                  .filter(([key]) => key !== 'header')
                  .sort((a, b) => {
                    // Get order from section_info
                    const aIndex = parsedData?.section_info.findIndex(s => {
                      const normalizedTitle = s.title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
                      return normalizedTitle === a[0];
                    });
                    const bIndex = parsedData?.section_info.findIndex(s => {
                      const normalizedTitle = s.title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
                      return normalizedTitle === b[0];
                    });
                    
                    // If not found in section_info, put at end
                    const aPos = aIndex === -1 ? 999 : aIndex;
                    const bPos = bIndex === -1 ? 999 : bIndex;
                    
                    return aPos - bPos;
                  })
                  .map(([key, meta]) => (
                  <div key={key} style={sectionStyle} data-magnetic>
                    <div style={sectionHeaderStyle}>
                      <input
                        type="checkbox"
                        checked={meta.type === 'simple' ? (selections[key] as boolean) ?? false : ((selections[key] as { enabled: boolean })?.enabled ?? false)}
                        onChange={(e) => handleSectionChange(key, e.target.checked)}
                        style={checkboxStyle}
                      />
                      <span>{meta.label}</span>
                      {meta.type === 'complex' && selections[key] && (
                        <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                          ({(selections[key] as { items: number[] }).items.length}/{meta.item_count} items)
                        </span>
                      )}
                    </div>
                    
                    {meta.type === 'complex' && parsedData?.latex_blocks?.sections[key]?.items && (
                      <div>
                        {Object.keys(parsedData.latex_blocks.sections[key].items!).map((itemKey, index) => {
                          // Get subsection title from parser output
                          const subsectionTitles = getSubsectionTitles(key);
                          const displayText = subsectionTitles[index] || `Item ${index + 1}`;
                          
                          return (
                            <div key={index} style={itemStyle} data-magnetic>
                              <input
                                type="checkbox"
                                checked={((selections[key] as { items: number[] })?.items ?? []).includes(index)}
                                onChange={(e) => handleItemChange(key, index, e.target.checked)}
                                style={checkboxStyle}
                              />
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span style={{ fontSize: '12px', color: '#ffffff', fontWeight: '500' }}>
                                  {displayText}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - PDF Preview */}
        <div style={previewPanelStyle}>
          <div style={panelHeaderStyle}>
            <h2 style={panelTitleStyle}>
              <div style={{ ...dotStyle, background: '#ec4899' }} />
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
                opacity: isCompiling || isFiltering ? 0.6 : 1,
                pointerEvents: isCompiling || isFiltering ? 'none' : 'auto'
              }}
            >
              <span>{isCompiling || isFiltering ? '⏳' : ''}</span>
              {isCompiling || isFiltering ? 'Compiling...' : 'Compile'}
            </LiquidButton>
          </div>
          <div style={panelContentStyle}>
            <div style={previewContentStyle}>
              {isCompiling || isFiltering ? (
                <div style={loadingStyle}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    border: '3px solid rgba(168, 85, 247, 0.3)',
                    borderTop: '3px solid #a855f7',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  <p style={{ fontSize: '16px', fontWeight: '600' }}>
                    {isFiltering ? 'Filtering sections...' : 'Compiling PDF...'}
                  </p>
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
                         setError('Failed to load PDF');
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
                    Select sections to generate a filtered PDF preview.
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

export default SectionSelectorPage;
