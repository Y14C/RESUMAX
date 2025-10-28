import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import LiquidButton from '../components/LiquidButton';
import { uploadFile } from '../utils/api';
import { 
  getPreloadedProviders, 
  getLoadingError,
  preloadRemainingPdfs
} from '../utils/dataPreloader';
import { saveConfig, loadConfig, testApiKey, UserConfig } from '../utils/configStorage';
const ResumaxUI: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('provider');
  
  // DEBUG: Log when component mounts
  useEffect(() => {
    console.log('[RESUMAX UI] Component mounted and rendering');
  }, []);
  const [showConfiguration, setShowConfiguration] = useState(false);
  const [showUploadPanel, setShowUploadPanel] = useState(false);
  const [tabIndicatorKey, setTabIndicatorKey] = useState(0);
  const [isConfigAnimating, setIsConfigAnimating] = useState(false);
  const [isUploadAnimating, setIsUploadAnimating] = useState(false);
  const [previousTab, setPreviousTab] = useState('provider');
  const [isContentAnimating, setIsContentAnimating] = useState(false);
  // const [hasPrerendered, setHasPrerendered] = useState(false); // DISABLED: Not needed, causes animation cache
  // Configuration states
  const [selectedProvider, setSelectedProvider] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [savedKey, setSavedKey] = useState('');
  // Upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Processing state
  const [isReadyForProcessing, setIsReadyForProcessing] = useState(false);
  // API states
  const [providers, setProviders] = useState<Record<string, string[]>>({});
  const [uploadSessionId, setUploadSessionId] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  // Configuration error state
  const [configError, setConfigError] = useState<string>('');
  // API testing state
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [apiTestMessage, setApiTestMessage] = useState('');
  
  // Accordion state
  const [openAccordionItems, setOpenAccordionItems] = useState<number[]>([]);
  const accordionRef = useRef<HTMLDivElement>(null);
  
  // Refs for click-outside detection
  const configPanelRef = useRef<HTMLDivElement>(null);
  const uploadPanelRef = useRef<HTMLDivElement>(null);
  const configButtonRef = useRef<HTMLButtonElement>(null);
  const uploadButtonRef = useRef<HTMLButtonElement>(null);
  const isButtonClickRef = useRef<boolean>(false);
  
  // Refs for tab measurements
  const tabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const tabContainerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 });
  
  const tabs = [
    { id: 'provider', label: 'Provider' },
    { id: 'model', label: 'Model' },
    { id: 'api', label: 'API' }
  ];

  // Accordion items
  const accordionItems: Array<{ question: string; answer: React.ReactNode }> = [
    {
      question: "Can I just input all my information in an unstructured format?",
      answer: "Yes! Resumax is designed to handle unstructured data. Simply provide your information in any format, and Resumax will intelligently parse and organize it into a professional resume for you."
    },
    {
      question: "How do I get an API key?",
      answer: (
        <span>
          You can get a free Gemini API key from{' '}
          <a 
            href="https://aistudio.google.com/api-keys" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              color: '#3b82f6',
              textDecoration: 'underline',
              cursor: 'none',
              transition: 'opacity 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.7';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            Google AI Studio
          </a>
        </span>
      )
    },
    {
      question: "Is my API key safe? Where is it stored?",
      answer: "Your API key is stored locally on your device and never uploaded to our servers or the cloud. You maintain complete control and can delete it at any time."
    },
    {
      question: "Can I use Resumax without internet?",
      answer: "Yes! Resumax can work with local AI models for completely offline operation. Simply download free models through LM Studio on your computer, and Resumax will utilize them instead of cloud services. Your resume data never leaves your device."
    },
    {
      question: "What resume formats can I upload, and what will I get as output?",
      answer: "Resumax accepts PDF and plain text files. After parsing your information, you can choose from one of 4 professional templates (with more coming soon), and receive your resume as both a downloadable PDF and LaTeX code."
    }
  ];

  const toggleAccordionItem = (index: number) => {
    const wasOpen = openAccordionItems.includes(index);
    
    setOpenAccordionItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );

    // Auto-scroll to FAQ section when accordion is opened (not closed)
    if (!wasOpen) {
      setTimeout(() => {
        if (accordionRef.current) {
          const element = accordionRef.current;
          const rect = element.getBoundingClientRect();
          const windowHeight = window.innerHeight;
          
          // Check if FAQ section is not fully visible
          const isNotFullyVisible = 
            rect.top < 0 || // Too far up
            rect.bottom > windowHeight; // Too far down
          
          if (isNotFullyVisible) {
            element.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
              inline: 'nearest'
            });
          }
        }
      }, 100); // Small delay to allow accordion to expand
    }
  };
  // Load providers from preloaded data (should be ready since AppLoader waited)
  useEffect(() => {
    const loadProviders = () => {
      // Get preloaded providers (should be ready)
      const preloadedProviders = getPreloadedProviders();
      if (preloadedProviders) {
        setProviders(preloadedProviders);
        setError(''); // Clear any previous errors
        console.log('[RESUMAX] Providers loaded from preload cache');
      } else {
        const loadingError = getLoadingError();
        setError(loadingError || 'Failed to load AI providers.');
      }
    };

    loadProviders();
  }, []);

  // Load saved configuration on mount
  useEffect(() => {
    const loadSavedConfig = async () => {
      try {
        const response = await loadConfig();
        if (response.success && response.config) {
          setSelectedProvider(response.config.selectedProvider);
          setSelectedModel(response.config.selectedModel);
          setApiKey(response.config.apiKey);
          setSavedKey(response.config.apiKey);
          console.log('[CONFIG] Saved configuration loaded');
        } else if (response.error) {
          console.warn('[CONFIG] Failed to load configuration:', response.error.message);
        }
      } catch (error) {
        console.error('[CONFIG] Error loading configuration:', error);
      }
    };

    loadSavedConfig();
  }, []);

  // Pre-render tab content when configuration panel opens for the first time
  // DISABLED: Prerendering causes animation caching issues with tab indicator
  // useEffect(() => {
  //   if (showConfiguration && !hasPrerendered) {
  //     // Pre-render all tabs off-screen to eliminate first-switch lag
  //     setHasPrerendered(true);
  //     console.log('[PERFORMANCE] Tab content pre-rendered for smooth switching');
  //   }
  // }, [showConfiguration, hasPrerendered]);

  // Load remaining template PDFs in background after ResumaxUI mounts
  useEffect(() => {
    if (providers && Object.keys(providers).length > 0) {
      // Preload remaining PDFs (the ones not already loaded in critical phase)
      preloadRemainingPdfs().catch(console.error);
    }
  }, [providers]);

  // Calculate indicator position based on active tab
  useEffect(() => {
    const calculateIndicatorPosition = () => {
      const activeTabElement = tabRefs.current[activeTab];
      const container = tabContainerRef.current;
      
      if (!activeTabElement || !container) return;
      
      // Get the bounding rectangles
      const tabRect = activeTabElement.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      
      // Calculate the tab's center position relative to container
      const tabCenterFromContainerLeft = tabRect.left - containerRect.left + (tabRect.width / 2);
      
      // Pink outline width (slightly smaller than tab for visual effect)
      const indicatorWidth = tabRect.width - 12; // 6px padding on each side
      
      // Position the indicator so its center aligns with tab's center
      const indicatorLeft = tabCenterFromContainerLeft - (indicatorWidth / 2);
      
      setIndicatorStyle({ 
        left: indicatorLeft, 
        width: indicatorWidth 
      });
    };
    
    // Calculate on mount and when activeTab changes
    if (showConfiguration) {
      // Small delay to ensure DOM is ready
      requestAnimationFrame(() => {
        calculateIndicatorPosition();
      });
    }
  }, [activeTab, showConfiguration]);

  // File handling
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      setError('');
      setIsLoading(true);
      
      const result = await uploadFile(file);
      
      if (result.success) {
        setUploadSessionId(result.data!.sessionId);
        setIsLoading(false);
        
        // Auto-close upload panel after successful upload
        setTimeout(() => {
          setShowUploadPanel(false);
        }, 300);
      } else {
        setError(result.error?.message || 'Upload failed');
        setSelectedFile(null);
        setIsLoading(false);
      }
    }
  };
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError('');
      setIsLoading(true);
      
      const result = await uploadFile(file);
      
      if (result.success) {
        setUploadSessionId(result.data!.sessionId);
        setIsLoading(false);
        
        // Auto-close upload panel after successful upload
        setTimeout(() => {
          setShowUploadPanel(false);
        }, 300);
      } else {
        setError(result.error?.message || 'Upload failed');
        setSelectedFile(null);
        setIsLoading(false);
      }
    }
  };
  const openFilePicker = () => {
    fileInputRef.current?.click();
  };
  const handleProviderChange = (provider: string) => {
    setSelectedProvider(provider);
    // Don't automatically select a model - let user choose in model tab
    setSelectedModel('');
    // Auto-advance to model tab
    handleTabChange('model');
  };

  const handleModelSelect = (model: string) => {
    setSelectedModel(model);
    // Auto-advance to API tab
    handleTabChange('api');
  };
  const handleTabChange = (tabId: string) => {
    if (tabId === activeTab) return;
    setPreviousTab(activeTab);
    setIsContentAnimating(true);
    setActiveTab(tabId);
    setTabIndicatorKey(prev => prev + 1);
    
    // Reset animation state after animation completes
    setTimeout(() => {
      setIsContentAnimating(false);
    }, 400);
  };
  const handleConfigToggle = () => {
    console.log('handleConfigToggle called, current showConfiguration:', showConfiguration);
    
    if (showConfiguration) {
      // If config is already open, close it immediately (like clicking outside)
      console.log('Closing config panel');
      setShowConfiguration(false);
    } else if (showUploadPanel) {
      // If upload panel is open, close it immediately and open config
      setShowUploadPanel(false);
      setShowConfiguration(true);
      setIsConfigAnimating(true);
      setTimeout(() => {
        setIsConfigAnimating(false);
        scrollPanelIntoView(configPanelRef);
      }, 400);
    } else {
      // Nothing is open, just open config
      console.log('Opening config panel');
      setShowConfiguration(true);
      setIsConfigAnimating(true);
      setTimeout(() => {
        setIsConfigAnimating(false);
        scrollPanelIntoView(configPanelRef);
      }, 400);
    }
  };
  const handleUploadToggle = () => {
    if (showUploadPanel) {
      // If upload is already open, close it immediately (like clicking outside)
      setShowUploadPanel(false);
    } else if (showConfiguration) {
      // If config panel is open, close it immediately and open upload
      setShowConfiguration(false);
      setShowUploadPanel(true);
      setIsUploadAnimating(true);
      setTimeout(() => {
        setIsUploadAnimating(false);
        scrollPanelIntoView(uploadPanelRef);
      }, 400);
    } else {
      // Nothing is open, just open upload
      setShowUploadPanel(true);
      setIsUploadAnimating(true);
      setTimeout(() => {
        setIsUploadAnimating(false);
        scrollPanelIntoView(uploadPanelRef);
      }, 400);
    }
  };

  // Auto-scroll function for panels with viewport leeway check
  const scrollPanelIntoView = (panelRef: React.RefObject<HTMLDivElement>) => {
    if (panelRef.current) {
      const element = panelRef.current;
      const rect = element.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const windowWidth = window.innerWidth;

      // Check if element is significantly out of view (with 150px leeway)
      const leeway = 150;
      const isSignificantlyOutOfView =
        rect.top < leeway || // Too far up
        rect.bottom > windowHeight - leeway || // Too far down
        rect.left < leeway || // Too far left
        rect.right > windowWidth - leeway; // Too far right

      // Also check if element is not well-centered (more than 100px from center)
      const centerY = windowHeight / 2;
      const centerX = windowWidth / 2;
      const isNotWellCentered =
        Math.abs(rect.top + rect.height / 2 - centerY) > 100 || // More than 100px from vertical center
        Math.abs(rect.left + rect.width / 2 - centerX) > 100; // More than 100px from horizontal center

      // Only scroll if significantly out of view OR not well-centered
      if (isSignificantlyOutOfView || isNotWellCentered) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });
      }

      // Focus for accessibility (always focus, regardless of scroll)
      element.focus({ preventScroll: true });
    }
  };

  // Check if ready for processing
  useEffect(() => {
    setIsReadyForProcessing(
      selectedProvider !== '' &&
      selectedModel !== '' &&
      savedKey !== '' &&
      uploadSessionId !== ''
    );
  }, [selectedProvider, selectedModel, savedKey, uploadSessionId]);

  // Click-outside detection
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Skip if click is on either button
      if (
        (configButtonRef.current && configButtonRef.current.contains(target)) ||
        (uploadButtonRef.current && uploadButtonRef.current.contains(target))
      ) {
        console.log('Click is on a button, skipping handler');
        return;
      }
      
      console.log('Click-outside handler firing', { showConfiguration, showUploadPanel, target: (target as any).id || (target as any).className });

      // Check if click is outside configuration panel
      if (
        showConfiguration &&
        configPanelRef.current &&
        !configPanelRef.current.contains(target)
      ) {
        console.log('Closing config panel via click-outside');
        setShowConfiguration(false);
      }

      
      // Check if click is outside upload panel
      if (
        showUploadPanel &&
        uploadPanelRef.current &&
        !uploadPanelRef.current.contains(target)
      ) {
        console.log('Closing upload panel via click-outside');
        setShowUploadPanel(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showConfiguration, showUploadPanel]);
  // Styles
  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    color: '#ffffff',
    zIndex: 10,
    pointerEvents: 'none'
  };
  const contentStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: '0px 40px 100px 40px',
    pointerEvents: 'auto',
    overflow: 'auto'
  };
  const interactiveStyle: React.CSSProperties = {
    pointerEvents: 'auto'
  };
  const gradientTextStyle: React.CSSProperties = {
    fontSize: '96px',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #ec4899 0%, #a855f7 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    marginBottom: '27px',
    textAlign: 'center',
    textShadow: '0 0 30px rgba(236, 72, 153, 0.3)'
  };
  const headlineStyle: React.CSSProperties = {
    fontSize: '72px',
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    marginTop: '-3px',
    marginBottom: '12px',
    textShadow: '0 0 20px rgba(255, 255, 255, 0.1)',
    lineHeight: '1.2'
  };
  const subheadingStyle: React.CSSProperties = {
    fontSize: '26px',
    color: '#b0b0b0',
    textAlign: 'center',
    marginBottom: '16px',
    lineHeight: '1.4'
  };
  const buttonContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '24px',
    marginBottom: '16px',
    justifyContent: 'center',
    flexWrap: 'wrap'
  };
  const buttonStyle: React.CSSProperties = {
    padding: '16px 32px',
    background: '#1a1a1a',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '12px',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'none',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)'
  };
  const uploadButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
    border: '1px solid #3b82f6',
    boxShadow: '0 4px 20px rgba(59, 130, 246, 0.3)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
  };
  const getPanelContainerStyle = (isVisible: boolean, isAnimating: boolean): React.CSSProperties => ({
    width: '100%',
    maxWidth: '1000px',
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translate3d(0, 0, 0) scale(1)' : 'translate3d(0, -60px, 0) scale(0.92)',
    transition: isAnimating ? 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
    marginTop: '16px',
    animation: isAnimating ? (isVisible ? 'slideDown 0.4s cubic-bezier(0.4, 0, 0.2, 1)' : 'slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)') : 'none',
    willChange: 'transform, opacity',
    backfaceVisibility: 'hidden',
    contain: 'layout style paint'
  });
  const panelStyle: React.CSSProperties = {
    background: '#0a0a0a',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.7)',
    position: 'relative',
    padding: '16px'
  };
  const tabContainerStyle: React.CSSProperties = {
    position: 'relative',
    padding: '6px',
    display: 'flex',
    gap: '6px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '14px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    marginBottom: '20px'
  };
  const getTabIndicatorStyle = (): React.CSSProperties => {
    return {
      position: 'absolute',
      height: 'calc(100% - 12px)',
      width: `${indicatorStyle.width}px`,
      transform: `translateX(${indicatorStyle.left}px) translateY(6px)`,
      top: 0,
      left: 0,
      background: 'linear-gradient(135deg, #ec4899, #a855f7)',
      borderRadius: '10px',
      border: '1px solid rgba(236, 72, 153, 0.8)',
      transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
      pointerEvents: 'none',
      boxShadow: '0 0 25px rgba(236, 72, 153, 0.5), inset 0 2px 8px rgba(255, 255, 255, 0.1)',
      animation: tabIndicatorKey > 0 ? 'tabPulse 0.6s ease-out' : 'none'
    };
  };
  const tabButtonStyle = (isActive: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '14px 20px',
    fontSize: '15px',
    fontWeight: '600',
    background: 'transparent',
    border: 'none',
    borderRadius: '10px',
    color: isActive ? '#ffffff' : '#9ca3af',
    cursor: 'none',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    zIndex: 2,
    textShadow: isActive ? '0 0 8px rgba(236, 72, 153, 0.6)' : 'none'
  });
  const contentAreaStyle: React.CSSProperties = {
    padding: '24px',
    minHeight: '200px'
  };
  const getSlideInAnimation = (): string => {
    const tabOrder = ['provider', 'model', 'api'];
    const currentIndex = tabOrder.indexOf(activeTab);
    const previousIndex = tabOrder.indexOf(previousTab);
    if (currentIndex > previousIndex) {
      return 'slideInFromRight 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards';
    } else {
      return 'slideInFromLeft 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards';
    }
  };
  const getSlideOutAnimation = (): string => {
    const tabOrder = ['provider', 'model', 'api'];
    const currentIndex = tabOrder.indexOf(activeTab);
    const previousIndex = tabOrder.indexOf(previousTab);
    if (currentIndex > previousIndex) {
      return 'slideOutToLeft 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards';
    } else {
      return 'slideOutToRight 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards';
    }
  };
  const renderTabContent = (tabId: string) => {
    switch (tabId) {
      case 'provider':
        return (
          <div style={{ textAlign: 'center' }}>
            <div style={sectionTitleStyle}>
              <div style={dotStyle} />
              <h3 style={titleTextStyle}>Step 1: Select Provider</h3>
            </div>
            <p style={subtitleStyle}>Choose your AI service provider</p>
            
            {Object.keys(providers).length === 0 ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 20px',
                color: '#9ca3af'
              }}>
                <div style={{ fontSize: '24px', marginBottom: '12px' }}>⚠️</div>
                <p style={{ fontSize: '16px', marginBottom: '8px' }}>No providers available</p>
                <p style={{ fontSize: '14px', color: '#6b7280' }}>Please check your connection</p>
              </div>
            ) : (
              <>
                <div style={gridStyle}>
                  {Object.keys(providers).map((provider) => (
                    <button
                      key={provider}
                      onClick={() => handleProviderChange(provider)}
                      style={optionButtonStyle(selectedProvider === provider)}
                      data-magnetic
                      onMouseEnter={(e) => {
                        if (selectedProvider !== provider) {
                          e.currentTarget.style.borderColor = 'rgba(236, 72, 153, 0.5)';
                          e.currentTarget.style.boxShadow = 'inset 0 0 8px rgba(236, 72, 153, 0.1)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedProvider !== provider) {
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                          e.currentTarget.style.boxShadow = 'none';
                        }
                      }}
                    >
                      <p style={{ fontWeight: '600', marginBottom: '4px' }}>{provider}</p>
                      <p style={{ fontSize: '12px', color: '#9ca3af' }}>
                        {providers[provider]?.length || 0} models
                      </p>
                    </button>
                  ))}
                </div>
                <div style={{ marginTop: '12px', fontSize: '14px', color: '#9ca3af' }}>
                  Selected: <span style={{ color: '#ffffff', fontWeight: '600' }}>{selectedProvider || 'None selected'}</span>
                </div>
              </>
            )}
          </div>
        );
      case 'model':
        return (
          <div style={{ textAlign: 'center' }}>
            <div style={sectionTitleStyle}>
              <div style={dotStyle} />
              <h3 style={titleTextStyle}>Step 2: Choose Model</h3>
            </div>
            <p style={subtitleStyle}>Select the AI model for conversion</p>
            <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {!selectedProvider ? (
                <div style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: '#6b7280',
                  fontSize: '16px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}>
                  Please select a provider first to see available models.
                </div>
              ) : (
                (providers[selectedProvider] || []).map((model) => (
                <button
                  key={model}
                  onClick={() => handleModelSelect(model)}
                  style={{
                    ...optionButtonStyle(selectedModel === model),
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                  data-magnetic
                  onMouseEnter={(e) => {
                    if (selectedModel !== model) {
                      e.currentTarget.style.borderColor = 'rgba(236, 72, 153, 0.5)';
                      e.currentTarget.style.boxShadow = 'inset 0 0 8px rgba(236, 72, 153, 0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedModel !== model) {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  <div>
                    <p style={{ fontWeight: '600', marginBottom: '4px' }}>{model}</p>
                    <p style={{ fontSize: '12px', color: '#9ca3af' }}>Optimized for resume conversion</p>
                  </div>
                  {selectedModel === model && (
                    <span style={{ color: '#ec4899', fontWeight: '600' }}>✓</span>
                  )}
                </button>
                ))
              )}
            </div>
            <div style={{ marginTop: '12px', fontSize: '14px', color: '#9ca3af' }}>
              Selected: <span style={{ color: '#ffffff', fontWeight: '600' }}>{selectedModel || 'None selected'}</span>
            </div>
          </div>
        );
      case 'api':
        return (
            <div style={{ textAlign: 'center' }}>
            <div style={sectionTitleStyle}>
              <div style={dotStyle} />
              <h3 style={titleTextStyle}>Step 3: API Configuration</h3>
            </div>
            <p style={subtitleStyle}>Enter your API credentials</p>

            {/* Configuration Summary */}
            {(selectedProvider || selectedModel) && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '20px',
                textAlign: 'left',
              }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#ffffff',
                  marginBottom: '8px',
                }}>
                  Current Configuration:
                </div>
                <div style={{ fontSize: '13px', color: '#9ca3af', lineHeight: '1.5' }}>
                  Provider: <span style={{ color: '#ffffff' }}>{selectedProvider || 'Not selected'}</span><br />
                  Model: <span style={{ color: '#ffffff' }}>{selectedModel || 'Not selected'}</span>
                </div>
              </div>
            )}
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              <input
                type="password"
                placeholder="Enter API Key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                style={inputStyle}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(236, 72, 153, 0.5)';
                  e.currentTarget.style.boxShadow = 'inset 0 0 8px rgba(236, 72, 153, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
              <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            
                            // Validate that provider and model are selected
                            if (!selectedProvider || !selectedModel) {
                              setConfigError('Please select a provider and model before saving API key');
                              return;
                            }
                            
                            if (!apiKey.trim()) {
                              setConfigError('Please enter an API key');
                              return;
                            }
                            
                            setConfigError(''); // Clear any previous errors
                            setApiTestMessage(''); // Clear any previous test messages
                            
                            try {
                              const config: UserConfig = {
                                selectedProvider,
                                selectedModel,
                                apiKey: apiKey.trim()
                              };
                              
                              // Test API key first
                              setIsTestingApi(true);
                              setApiTestMessage('Testing API key...');
                              
                              const testResponse = await testApiKey(config);
                              
                              if (!testResponse.success) {
                                setIsTestingApi(false);
                                setApiTestMessage('');
                                setConfigError(testResponse.error?.message || 'API key test failed');
                                return;
                              }
                              
                              // API test successful, now save config
                              setApiTestMessage('API key valid! Saving configuration...');
                              const response = await saveConfig(config);
                              
                              setIsTestingApi(false);
                              setApiTestMessage('');
                              
                              if (response.success) {
                                setSavedKey(apiKey);
                                setApiKey('');
                                setApiTestMessage('Configuration saved successfully!');
                                // Auto-close config menu after saving
                                setTimeout(() => {
                                  handleConfigToggle();
                                  setApiTestMessage('');
                                }, 2000);
                              } else {
                                setConfigError(response.error?.message || 'Failed to save configuration');
                              }
                            } catch (error) {
                              setIsTestingApi(false);
                              setApiTestMessage('');
                              console.error('[CONFIG] Error saving configuration:', error);
                              setConfigError('Failed to save configuration');
                            }
                          }}
                          style={{
                            ...buttonStyle,
                            flex: 1,
                            padding: '12px 24px',
                            background: isTestingApi ? 'rgba(236, 72, 153, 0.2)' : 'transparent',
                            border: '1px solid rgba(236, 72, 153, 0.5)',
                            color: isTestingApi ? '#ec4899' : '#ec4899',
                            opacity: isTestingApi ? 0.7 : 1,
                            cursor: isTestingApi ? 'not-allowed' : 'pointer'
                          }}
                          disabled={isTestingApi}
                          data-magnetic
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(236, 72, 153, 0.1)';
                            e.currentTarget.style.boxShadow = 'inset 0 0 8px rgba(236, 72, 153, 0.2)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          {isTestingApi ? 'Testing...' : 'Save Key'}
                        </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSavedKey('');
                    setApiKey('');
                  }}
                  style={{
                    ...buttonStyle,
                    flex: 1,
                    padding: '12px 24px',
                    background: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.15)'
                  }}
                  data-magnetic
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(236, 72, 153, 0.5)';
                    e.currentTarget.style.boxShadow = 'inset 0 0 8px rgba(236, 72, 153, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  Clear
                </button>
              </div>
              <div style={{ marginTop: '12px', fontSize: '14px', color: '#9ca3af' }}>
                {savedKey ? (
                  <>
                    API key saved — <span style={{ color: '#ffffff', fontWeight: '600' }}>
                      {savedKey.slice(0, 4)}••••
                    </span>
                  </>
                ) : (
                  'No API key saved'
                )}
              </div>
              {configError && (
                <div style={{ 
                  marginTop: '12px', 
                  padding: '8px 12px', 
                  backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                  border: '1px solid rgba(239, 68, 68, 0.3)', 
                  borderRadius: '6px', 
                  fontSize: '14px', 
                  color: '#fca5a5' 
                }}>
                  {configError}
                </div>
              )}
              {apiTestMessage && (
                <div style={{ 
                  marginTop: '12px', 
                  padding: '8px 12px', 
                  backgroundColor: isTestingApi ? 'rgba(59, 130, 246, 0.1)' : 'rgba(34, 197, 94, 0.1)', 
                  border: isTestingApi ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(34, 197, 94, 0.3)', 
                  borderRadius: '6px', 
                  fontSize: '14px', 
                  color: isTestingApi ? '#93c5fd' : '#86efac' 
                }}>
                  {apiTestMessage}
                </div>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };
  const sectionTitleStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    marginBottom: '4px'
  };
  const dotStyle: React.CSSProperties = {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#ec4899'
  };
  const titleTextStyle: React.CSSProperties = {
    fontSize: '24px',
    fontWeight: '600',
    color: '#ffffff'
  };
  const subtitleStyle: React.CSSProperties = {
    color: '#6b7280',
    marginBottom: '16px',
    textAlign: 'center'
  };
  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px',
    maxWidth: '800px',
    margin: '0 auto'
  };
  const optionButtonStyle = (isSelected: boolean): React.CSSProperties => ({
    padding: '10px 12px',
    background: isSelected ? '#1a1a1a' : '#0f0f0f',
    border: `1px solid ${isSelected ? '#ec4899' : 'rgba(255, 255, 255, 0.15)'}`,
    borderRadius: '8px',
    color: '#ffffff',
    cursor: 'none',
    transition: 'all 0.3s ease',
    textAlign: 'left',
    boxShadow: isSelected ? 'inset 0 0 15px rgba(236, 72, 153, 0.2)' : 'none'
  });
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    background: '#0f0f0f',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '15px',
    marginBottom: '12px',
    outline: 'none',
    cursor: 'none',
    transition: 'border-color 0.3s ease'
  };
  const dropZoneStyle: React.CSSProperties = {
    position: 'relative',
    border: `2px dashed ${isDragOver ? '#3b82f6' : 'rgba(255, 255, 255, 0.2)'}`,
    borderRadius: '12px',
    padding: '32px',
    marginBottom: '16px',
    cursor: 'none',
    transition: 'all 0.3s ease',
    background: isDragOver ? '#0f0f0f' : '#0a0a0a',
    transform: isDragOver ? 'scale(1.02)' : 'scale(1)',
    boxShadow: isDragOver ? '0 0 30px rgba(59, 130, 246, 0.3)' : 'none'
  };
  const footerStyle: React.CSSProperties = {
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    padding: '8px 20px',
    pointerEvents: 'auto'
  };
  const footerContentStyle: React.CSSProperties = {
    maxWidth: '100%',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '24px'
  };
  // Add CSS animations
  const tabPulseKeyframes = `
    @keyframes tabPulse {
      0% {
        transform: translateX(${indicatorStyle.left}px) translateY(6px) scale(1);
        box-shadow: 0 0 25px rgba(236, 72, 153, 0.5), inset 0 2px 8px rgba(255, 255, 255, 0.1);
        filter: brightness(1);
      }
      50% {
        transform: translateX(${indicatorStyle.left}px) translateY(6px) scale(1.05);
        box-shadow: 0 0 40px rgba(236, 72, 153, 0.9), inset 0 2px 12px rgba(255, 255, 255, 0.25);
        filter: brightness(1.15);
      }
      100% {
        transform: translateX(${indicatorStyle.left}px) translateY(6px) scale(1);
        box-shadow: 0 0 25px rgba(236, 72, 153, 0.5), inset 0 2px 8px rgba(255, 255, 255, 0.1);
        filter: brightness(1);
      }
    }
    @keyframes slideDown {
      0% {
        opacity: 0;
        transform: translate3d(0, -20px, 0) scale(0.98);
      }
      100% {
        opacity: 1;
        transform: translate3d(0, 0, 0) scale(1);
      }
    }
    @keyframes slideUp {
      0% {
        opacity: 1;
        transform: translate3d(0, 0, 0) scale(1);
      }
      100% {
        opacity: 0;
        transform: translate3d(0, -60px, 0) scale(0.92);
      }
    }
    @keyframes slideInFromRight {
      0% {
        opacity: 0;
        transform: translate3d(40px, 0, 0) scale(0.95);
        filter: blur(4px);
      }
      60% {
        opacity: 0.8;
        filter: blur(1px);
      }
      100% {
        opacity: 1;
        transform: translate3d(0, 0, 0) scale(1);
        filter: blur(0px);
      }
    }
    @keyframes slideInFromLeft {
      0% {
        opacity: 0;
        transform: translate3d(-40px, 0, 0) scale(0.95);
        filter: blur(4px);
      }
      60% {
        opacity: 0.8;
        filter: blur(1px);
      }
      100% {
        opacity: 1;
        transform: translate3d(0, 0, 0) scale(1);
        filter: blur(0px);
      }
    }
    @keyframes slideOutToLeft {
      0% {
        opacity: 1;
        transform: translate3d(0, 0, 0) scale(1);
        filter: blur(0px);
      }
      40% {
        opacity: 0.5;
        filter: blur(1px);
      }
      100% {
        opacity: 0;
        transform: translate3d(-40px, 0, 0) scale(0.95);
        filter: blur(4px);
      }
    }
    @keyframes slideOutToRight {
      0% {
        opacity: 1;
        transform: translate3d(0, 0, 0) scale(1);
        filter: blur(0px);
      }
      40% {
        opacity: 0.5;
        filter: blur(1px);
      }
      100% {
        opacity: 0;
        transform: translate3d(40px, 0, 0) scale(0.95);
        filter: blur(4px);
      }
    }
    /* Custom Scrollbar Styles - Hidden */
    ::-webkit-scrollbar {
      width: 0px;
      height: 0px;
    }
    ::-webkit-scrollbar-track {
      background: transparent;
    }
    ::-webkit-scrollbar-thumb {
      background: transparent;
      border: none;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: transparent;
    }
    /* Firefox Scrollbar - Hidden */
    * {
      scrollbar-color: transparent transparent;
      scrollbar-width: none;
    }
  `;
  return (
    <div style={containerStyle}>
      <style>{tabPulseKeyframes}</style>
      <div style={contentStyle}>
        {/* Hero Section */}
        <div style={interactiveStyle}>
          <h1 style={gradientTextStyle}>Resumax</h1>
        </div>

        {/* Badge - moved below app name */}
        <div style={{
          marginBottom: '0px',
          textAlign: 'center'
        }}>
          <span style={{
            display: 'inline-block',
            padding: '5px 15px',
            background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1), rgba(168, 85, 247, 0.1))',
            border: '1px solid rgba(236, 72, 153, 0.3)',
            borderRadius: '25px',
            fontSize: '15px',
            fontWeight: '500',
            color: '#ec4899',
            textShadow: '0 0 10px rgba(236, 72, 153, 0.3)'
          }}>
            ✨ ATS-Optimized Resumes
          </span>
        </div>

        <h2 style={headlineStyle}>
          Convert Any Resume to{' '}
          <span style={{
            background: 'linear-gradient(135deg, #ec4899 0%, #a855f7 50%, #06b6d4 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontWeight: '700'
          }}>
            ATS-Optimized Formats
          </span>{' '}
          Instantly
        </h2>
        
        <p style={subheadingStyle}>
          Upload your resume, pick the template you want, choose the output format (PDF or LaTeX),<br />
          and get your ATS-ready resume in one click.
        </p>
        {/* Error Display */}
        {error && (
          <div style={{
            ...buttonContainerStyle,
            ...interactiveStyle,
            marginBottom: '16px'
          }}>
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              padding: '12px 16px',
              color: '#fca5a5',
              fontSize: '14px',
              textAlign: 'center',
              maxWidth: '800px'
            }}>
              <div style={{ marginBottom: '8px' }}>{error}</div>
              {error.includes('Backend server is not running') && (
                <button
                  onClick={() => window.location.reload()}
                  style={{
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid rgba(239, 68, 68, 0.5)',
                    borderRadius: '4px',
                    color: '#fca5a5',
                    padding: '6px 12px',
                    fontSize: '12px',
                    cursor: 'none',
                    marginTop: '8px'
                  }}
                  data-magnetic
                >
                  Retry Connection
                </button>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ ...buttonContainerStyle, ...interactiveStyle }}>
          <LiquidButton
            ref={configButtonRef}
            onClick={() => {
              isButtonClickRef.current = true;
              handleConfigToggle();
              setTimeout(() => {
                isButtonClickRef.current = false;
              }, 50);
            }}
            color="#a855f7"
            className="config-button"
            style={{
              padding: '16px 32px',
              fontSize: '16px',
              fontWeight: '600'
            }}
          >
            Configuration
          </LiquidButton>
          <LiquidButton
            ref={uploadButtonRef}
            onClick={() => {
              isButtonClickRef.current = true;
              handleUploadToggle();
              setTimeout(() => {
                isButtonClickRef.current = false;
              }, 50);
            }}
            color="#06b6d4"
            style={{
              padding: '16px 32px',
              fontSize: '16px',
              fontWeight: '600'
            }}
          >
            Submit Resume
          </LiquidButton>
        </div>

        {/* Start Processing Button - Only shows when both config and file are ready */}
        {isReadyForProcessing && (
          <div style={{ ...buttonContainerStyle, ...interactiveStyle }}>
            <LiquidButton
              onClick={async () => {
                try {
                  // Validate configuration before proceeding
                  const response = await loadConfig();
                  
                  if (!response.success || !response.isComplete) {
                    setConfigError('Configuration incomplete. Please configure provider, model, and API key in settings');
                    return;
                  }
                  
                  // Clear any previous errors
                  setConfigError('');
                  
                  // Save current configuration to ensure it's up to date
                  const config: UserConfig = {
                    selectedProvider,
                    selectedModel,
                    apiKey: savedKey
                  };
                  
                  const saveResponse = await saveConfig(config);
                  
                  if (!saveResponse.success) {
                    setConfigError(saveResponse.error?.message || 'Failed to save configuration');
                    return;
                  }
                  
                  navigate('/templates', {
                    state: {
                      selectedProvider,
                      selectedModel,
                      apiKey: savedKey,
                      uploadSessionId,
                      selectedTemplate: null
                    }
                  });
                } catch (error) {
                  console.error('[CONFIG] Error validating configuration:', error);
                  setConfigError('Failed to validate configuration');
                }
              }}
              color="#059669"
              style={{
                width: '100%',
                maxWidth: '800px',
                padding: '16px 32px',
                fontSize: '18px',
                fontWeight: '600'
              }}
            >
              Start Processing Resume
            </LiquidButton>
          </div>
        )}

        {/* Configuration Error Display for Start Processing */}
        {configError && isReadyForProcessing && (
          <div style={{ 
            marginTop: '16px', 
            padding: '12px 16px', 
            backgroundColor: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid rgba(239, 68, 68, 0.3)', 
            borderRadius: '8px', 
            fontSize: '14px', 
            color: '#fca5a5',
            textAlign: 'center',
            maxWidth: '800px',
            width: '100%'
          }}>
            {configError}
          </div>
        )}

        {/* Configuration Panel */}
        {showConfiguration && (
          <div
            ref={configPanelRef}
            style={{
              ...getPanelContainerStyle(showConfiguration, isConfigAnimating),
              ...interactiveStyle
            }}
          >
            <div style={panelStyle}>
              {/* Tabs */}
              <div ref={tabContainerRef} style={tabContainerStyle}>
                <div key="tab-indicator" style={getTabIndicatorStyle()} />
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    ref={(el) => (tabRefs.current[tab.id] = el)}
                    onClick={() => handleTabChange(tab.id)}
                    style={tabButtonStyle(activeTab === tab.id)}
                    data-magnetic
                    onMouseEnter={(e) => {
                      if (activeTab !== tab.id) {
                        e.currentTarget.style.color = '#ffffff';
                        e.currentTarget.style.textShadow = '0 0 4px rgba(236, 72, 153, 0.4)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeTab !== tab.id) {
                        e.currentTarget.style.color = '#9ca3af';
                        e.currentTarget.style.textShadow = 'none';
                      }
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              {/* Content Area */}
              <div style={{ 
                ...contentAreaStyle, 
                position: 'relative', 
                overflow: 'hidden',
                willChange: 'transform, opacity, filter',
                transform: 'translate3d(0, 0, 0)',
                contain: 'layout style paint'
              }}>
                {/* Previous tab content (slides out during transition) */}
                {isContentAnimating && previousTab !== activeTab && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '24px',
                      left: '24px',
                      right: '24px',
                      animation: getSlideOutAnimation(),
                      pointerEvents: 'none',
                      zIndex: 1,
                      willChange: 'transform, opacity, filter',
                      transform: 'translate3d(0, 0, 0)',
                      backfaceVisibility: 'hidden',
                      WebkitFontSmoothing: 'antialiased',
                      contain: 'layout style paint'
                    }}
                  >
                    {renderTabContent(previousTab)}
                  </div>
                )}
                {/* Current tab content (slides in during transition) */}
                <div
                  style={{
                    position: 'relative',
                    zIndex: 2,
                    animation: isContentAnimating ? getSlideInAnimation() : 'none',
                    willChange: 'transform, opacity, filter',
                    transform: 'translate3d(0, 0, 0)',
                    backfaceVisibility: 'hidden',
                    WebkitFontSmoothing: 'antialiased',
                    contain: 'layout style paint'
                  }}
                >
                  {renderTabContent(activeTab)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upload Panel */}
        {showUploadPanel && (
          <div
            ref={uploadPanelRef}
            style={{
              ...getPanelContainerStyle(showUploadPanel, isUploadAnimating),
              ...interactiveStyle
            }}
          >
            <div style={panelStyle}>
              <div style={contentAreaStyle}>
                <div style={{ textAlign: 'center' }}>
                  <div style={sectionTitleStyle}>
                    <div style={{ ...dotStyle, background: '#3b82f6' }} />
                    <h3 style={titleTextStyle}>Upload Resume</h3>
                  </div>
                  <p style={subtitleStyle}>
                    Drag and drop your resume file or choose from your computer
                  </p>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={openFilePicker}
                    style={dropZoneStyle}
                    data-magnetic
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileSelect}
                      style={{ display: 'none' }}
                      accept=".pdf,.doc,.docx,.txt"
                    />
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '48px', marginBottom: '12px' }}>
                        {isLoading ? '⏳' : '📄'}
                      </div>
                      <p style={{ fontSize: '18px', color: '#d1d5db', marginBottom: '6px' }}>
                        {isLoading 
                          ? 'Uploading...' 
                          : selectedFile 
                            ? selectedFile.name 
                            : 'Drop your resume here'}
                      </p>
                      <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '12px' }}>
                        {isLoading 
                          ? 'Please wait while we process your file'
                          : selectedFile 
                            ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` 
                            : 'or click to browse'}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openFilePicker();
                        }}
                        style={{
                          ...uploadButtonStyle,
                          padding: '10px 20px'
                        }}
                        data-magnetic
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.05)';
                          e.currentTarget.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.5)';
                        }}
                      >
                        Choose from system
                      </button>
                    </div>
                  </div>
                  {selectedFile && (
                    <div style={{ fontSize: '14px', color: '#9ca3af' }}>
                      <span style={{ color: '#10b981' }}>✓</span> File selected:{' '}
                      <span style={{ color: '#ffffff', fontWeight: '600' }}>{selectedFile.name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FAQ Accordion */}
        <div 
          ref={accordionRef}
          style={{
            ...interactiveStyle,
            width: '100%',
            maxWidth: '800px',
            marginTop: '48px',
            marginBottom: '32px'
          }}
        >
          <h3 style={{
            fontSize: '32px',
            fontWeight: '600',
            background: 'linear-gradient(135deg, #ec4899 0%, #a855f7 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textAlign: 'center',
            marginBottom: '24px'
          }}>
            Frequently Asked Questions
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {accordionItems.map((item, index) => (
              <div
                key={index}
                style={{
                  background: '#0a0a0a',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease'
                }}
              >
                <button
                  onClick={() => toggleAccordionItem(index)}
                  style={{
                    width: '100%',
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    textAlign: 'left',
                    background: 'transparent',
                    border: 'none',
                    color: '#ffffff',
                    cursor: 'none',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <span style={{
                    fontSize: '17px',
                    fontWeight: '500',
                    color: '#ffffff'
                  }}>
                    {item.question}
                  </span>
                  <ChevronDown
                    style={{
                      width: '24px',
                      height: '24px',
                      color: '#ffffff',
                      transition: 'transform 0.3s ease',
                      transform: openAccordionItems.includes(index) ? 'rotate(180deg)' : 'rotate(0deg)',
                      flexShrink: 0,
                      marginLeft: '16px'
                    }}
                  />
                </button>
                <div
                  style={{
                    maxHeight: openAccordionItems.includes(index) ? '500px' : '0',
                    overflow: 'hidden',
                    transition: 'max-height 0.3s ease-in-out'
                  }}
                >
                  <div style={{
                    padding: '0 24px 20px 24px',
                    fontSize: '16px',
                    lineHeight: '1.6',
                    color: '#ffffff'
                  }}>
                    {item.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Footer */}
      <footer style={footerStyle}>
        <div style={footerContentStyle}>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>
            © 2025 <span style={{ color: '#ffffff', fontWeight: '600' }}>Resumax</span> • 
            Created by <span style={{ color: '#ec4899' }}> YC14</span>
          </p>
          <a
            href="https://github.com/y14c/resumax"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '14px',
              color: '#6b7280',
              textDecoration: 'none',
              cursor: 'none',
              transition: 'color 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#6b7280';
            }}
          >
            GitHub Repository
          </a>
        </div>
      </footer>
    </div>
  );
};
export default ResumaxUI;