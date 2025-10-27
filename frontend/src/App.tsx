import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RippleBackground from './components/RippleBackground';
import CustomCursor from './components/CustomCursor';
import ErrorBoundary from './components/ErrorBoundary';
import AppLoader from './components/AppLoader';
import ResumaxUI from './pages/ResumaxUI';
import TemplateSelection from './pages/TemplateSelection';
import ProcessingPage from './pages/ProcessingPage';
import EditorPage from './pages/EditorPage';
import SectionSelectorPage from './pages/SectionSelectorPage';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppLoader>
        <Router>
          <div
            style={{
              position: 'relative',
              width: '100%',
              minHeight: '100vh',
              margin: 0,
              padding: 0,
              backgroundColor: '#000',
              boxSizing: 'border-box',
              overflow: 'hidden'
            }}
          >
            <RippleBackground />
            <Routes>
              <Route path="/" element={<ResumaxUI />} />
              <Route path="/templates" element={<TemplateSelection />} />
              <Route path="/processing" element={<ProcessingPage />} />
              <Route path="/editor" element={<EditorPage />} />
              <Route path="/section-selector" element={<SectionSelectorPage />} />
            </Routes>
            <CustomCursor />
          </div>
        </Router>
      </AppLoader>
    </ErrorBoundary>
  );
};

export default App;

