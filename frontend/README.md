# Resumax Frontend Application

A modern Electron-based desktop application built with React and TypeScript that provides an intuitive user interface for resume processing, template selection, and LaTeX editing. The frontend communicates with the Python backend to orchestrate AI-powered resume formatting and PDF generation.

## Table of Contents

- [Introduction & Purpose](#introduction--purpose)
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Core Modules](#core-modules)
- [Integration Points](#integration-points)
- [Dependencies](#dependencies)
- [Configuration](#configuration)
- [Usage Instructions](#usage-instructions)
- [Development Guide](#development-guide)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## Introduction & Purpose

The Resumax Frontend is an Electron desktop application that provides a modern, responsive user interface for the Resumax resume formatting system. Built with React and TypeScript, it offers a seamless experience for uploading resumes, selecting templates, configuring AI providers, and managing the entire resume processing workflow.

### Technology Stack

- **Desktop Framework**: Electron 38.4.0+ with Node.js integration
- **UI Framework**: React 18.3.1+ with TypeScript 5.6.3+
- **Build Tool**: Vite 7.1.12+ for fast development and optimized builds
- **Routing**: React Router DOM 6.30.1+ (HashRouter for Electron file:// protocol compatibility)
- **PDF Rendering**: PDF.js 5.4.296+ with React PDF wrapper
- **Animation**: Anime.js 3.2.2+ for smooth UI transitions
- **Platform**: Windows 10/11 (x64) with NSIS installer

### Key Features

- **Modern UI/UX**: Dark theme with animated backgrounds and liquid buttons
- **Template Selection**: Live PDF preview with interactive template picker
- **AI Configuration**: Multi-provider support (OpenAI, Claude, Gemini, LM Studio)
- **File Upload**: Drag-and-drop resume upload with progress tracking
- **Live Editing**: Real-time LaTeX editor with instant PDF compilation
- **Section Management**: Interactive resume section filtering and customization
- **Error Handling**: Comprehensive error boundaries and user feedback
- **Performance**: Optimized data preloading and progressive loading
- **Accessibility**: Keyboard navigation and screen reader support
- **LaTeX Export**: Download filtered or original LaTeX for debugging and customization
- **Document Order Preservation**: Sections displayed and compiled in original document order
- **Subsection Titles**: Display clean subsection titles from parser output

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Electron Main Process                        │
│                    (electron.cjs)                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  Window Mgmt    │  │  Backend Life   │  │  App Lifecycle  │ │
│  │  - Create Window│  │  - Start Python │  │  - Event Handlers│ │
│  │  - Menu Control │  │  - Process Mgmt │  │  - Cleanup      │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ IPC Communication
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Electron Renderer Process                      │
│                    (React Application)                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  React Router   │  │  Component Tree │  │  State Mgmt     │ │
│  │  - Page Routing │  │  - UI Components│  │  - Local State  │ │
│  │  - Navigation   │  │  - Layout       │  │  - Location State│ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  API Client     │  │  Data Preloader │  │  Utilities      │ │
│  │  - HTTP Requests│  │  - Progressive  │  │  - Config Store │ │
│  │  - Error Handle │  │  - Caching      │  │  - Animations   │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ HTTP Requests
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Python Backend Server                        │
│                    (Flask API)                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  AI Providers   │  │  File Processing│  │  PDF Generation │ │
│  │  - OpenAI       │  │  - Text Extract │  │  - LaTeX Compile│ │
│  │  - Claude       │  │  - OCR Support  │  │  - Template Mgmt│ │
│  │  - Gemini       │  │  - Format Support│  │  - Section Parse│ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Process Model

1. **Main Process**: Manages application lifecycle, creates windows, and spawns Python backend
2. **Renderer Process**: Runs React application with full DOM access and Node.js APIs
3. **Backend Process**: Python Flask server handles AI processing and file operations
4. **IPC Communication**: Secure context bridge for main-renderer communication

### Component Hierarchy

```
App (Root)
├── ErrorBoundary
├── AppLoader
└── Router
    ├── ResumaxUI (Landing Page)
    │   ├── RippleBackground
    │   ├── CustomCursor
    │   ├── LiquidButton (Configuration)
    │   ├── LiquidButton (Upload)
    │   └── Configuration Panel
    │       ├── Provider Selection
    │       ├── Model Selection
    │       └── API Key Input
    ├── TemplateSelection
    │   ├── TemplateList
    │   └── TemplatePreview (PDF.js)
    ├── ProcessingPage
    │   └── Progress Tracking
    ├── EditorPage
    │   └── LaTeX Editor
    └── SectionSelectorPage
        └── Section Filters
```

## Project Structure

```
frontend/
├── public/                     # Static assets and Electron files
│   ├── electron.cjs           # Electron main process
│   ├── preload.js             # Secure context bridge
│   └── icon.ico               # Application icon
├── src/                       # Source code
│   ├── components/            # Reusable UI components
│   │   ├── AppLoader.tsx      # Loading screen with data preloading
│   │   ├── CustomCursor.tsx   # Custom cursor implementation
│   │   ├── ErrorBoundary.tsx  # React error boundary
│   │   ├── LiquidButton.tsx   # Animated button component
│   │   ├── RippleBackground.tsx # WebGL animated background
│   │   ├── TemplateList.tsx   # Template grid display
│   │   └── TemplatePreview.tsx # PDF preview renderer
│   ├── pages/                 # Application pages/routes
│   │   ├── EditorPage.tsx     # LaTeX editor with live compilation
│   │   ├── ProcessingPage.tsx # AI processing with progress tracking
│   │   ├── ResumaxUI.tsx      # Main landing page
│   │   ├── SectionSelectorPage.tsx # Resume section filtering
│   │   └── TemplateSelection.tsx # Template picker with preview
│   ├── styles/                # Styled components and CSS
│   │   ├── CustomCursor.styles.ts
│   │   └── RippleBackground.styles.ts
│   ├── types/                 # TypeScript type definitions
│   │   └── template.ts        # Template and state interfaces
│   ├── utils/                 # Utility functions and services
│   │   ├── api.ts             # Backend HTTP client
│   │   ├── configStorage.ts   # Configuration persistence
│   │   ├── dataPreloader.ts   # Progressive data loading
│   │   └── rippleEngine.ts    # Canvas animation engine
│   ├── App.tsx                # Root React component
│   └── main.tsx               # Application entry point
├── node_modules/              # Dependencies
├── package.json               # Project configuration and scripts
├── tsconfig.json              # TypeScript configuration
├── tsconfig.node.json         # TypeScript config for Node.js
├── vite.config.ts             # Vite build configuration
├── index.html                 # HTML entry point
└── README.md                  # This documentation

packaging/                      # Centralized build artifacts
├── dist/
│   └── ResumaxBackend/        # PyInstaller backend folder (onedir mode)
│       ├── ResumaxBackend.exe
│       └── _internal/         # Dependencies
├── release-new/               # Final installer artifacts
│   ├── Resumax Setup 1.0.0.exe # Windows installer (only file needed)
│   ├── *.yml, *.yaml, *.blockmap # Build artifacts (not needed for distribution)
│   └── win-unpacked/          # Unpacked for testing
├── build.bat                  # Full build orchestration script
└── resumax-backend.spec       # PyInstaller configuration

frontend/
└── dist/                      # React build output (not in packaging/)
```

## Core Modules

### Main Application (App.tsx)

The root React component that sets up routing, error boundaries, and global layout.

**Key Features:**
- React Router setup with all application routes
- Error boundary for graceful error handling
- App loader for initial data preloading
- Global layout with animated background and custom cursor
- HashRouter for Electron file:// protocol compatibility

**Core Structure:**
```typescript
<ErrorBoundary>
  <AppLoader>
    <Router> {/* HashRouter for Electron file:// protocol */}
      <RippleBackground />
      <Routes>
        <Route path="/" element={<ResumaxUI />} />
        <Route path="/templates" element={<TemplateSelection />} />
        <Route path="/processing" element={<ProcessingPage />} />
        <Route path="/editor" element={<EditorPage />} />
        <Route path="/section-selector" element={<SectionSelectorPage />} />
      </Routes>
      <CustomCursor />
    </Router>
  </AppLoader>
</ErrorBoundary>
```

**Routing Implementation:**
- Uses `HashRouter` instead of `BrowserRouter` for Electron compatibility
- `BrowserRouter` requires a web server and fails with `file://` protocol
- `HashRouter` uses URL hashes (`#/templates`) which work with local files
- All routes accessible via hash-based navigation

### Pages Package

#### ResumaxUI.tsx - Main Landing Page

The primary application interface with configuration and file upload capabilities.

**Key Features:**
- AI provider and model selection with tabbed interface
- **API Key Validation**: Real-time testing before saving configuration
- File upload with drag-and-drop support
- **FAQ Accordion**: Interactive FAQ section with expand/collapse animations
- Configuration validation and error handling
- Animated UI transitions and feedback

**State Management:**
- Provider/model selection state
- API key management with backend persistence
- **API Testing State**: Loading states and validation feedback
- File upload session tracking
- Configuration panel visibility control
- Accordion state for FAQ expand/collapse

**Configuration Flow:**
1. Provider Selection → Model Selection → API Key Input
2. **API Key Validation**: Tests key with real API call before saving
3. Auto-advance between tabs on selection
4. Configuration validation before processing
5. Persistent storage via backend API

**FAQ Accordion:**
- Interactive FAQ section with expand/collapse animations
- Multi-layered glow effects on open items (matching custom cursor style)
- Smooth height transitions for content reveal
- Chevron icon rotation animation
- Questions about API keys, offline usage, and supported formats

#### TemplateSelection.tsx - Template Picker

Interactive template selection with live PDF preview.

**Key Features:**
- Template grid with metadata display
- Live PDF preview using PDF.js
- Template selection with visual feedback
- Progressive PDF loading optimization
- Responsive layout with scrollable panels

**Preview System:**
- PDF.js integration for high-quality rendering
- Multi-page PDF support with page separators
- Error handling for failed PDF loads
- Memory management for large PDFs

#### ProcessingPage.tsx - AI Processing

Real-time processing status and progress tracking.

**Key Features:**
- Progress indicators for AI processing stages
- Real-time status updates from backend
- Error handling and retry mechanisms
- Processing time estimation
- Automatic navigation on completion

#### EditorPage.tsx - LaTeX Editor

Live LaTeX editing with instant PDF compilation.

**Key Features:**
- Syntax-highlighted LaTeX editor
- Live PDF preview with compilation
- Error display and debugging
- Auto-save functionality
- Export options (PDF, LaTeX source)

#### SectionSelectorPage.tsx - Section Management

Interactive resume section filtering and customization using the backend's "lego blocks" architecture.

**Key Features:**
- Section parsing from LaTeX code (via `/api/parse-sections`)
- Interactive section toggles (simple and complex sections)
- Item-level selection for complex sections
- Preview of filtered content
- Real-time LaTeX reassembly (via `/api/filter-latex`)
- PDF compilation of filtered results
- **LaTeX Download**: Download filtered LaTeX with current selections
- **Original LaTeX Download**: Download original LaTeX for comparison
- **Document Order Display**: Sections shown in original document order
- **Subsection Titles**: Display clean subsection titles from parser output

**Section Types:**
- **Simple**: Sections without items (enable/disable entire section)
- **Complex**: Sections with multiple items (select individual items)

**Data Structure Compatibility:**
- Handles nested backend data: `{format_id, latex_blocks: {...}, section_info: [...], original_latex}`
- Uses `section_info` array for document order preservation
- Accesses subsection titles directly from parser output

**Backend Integration:**
- Receives parsed blocks and metadata from `section_selector.py`
- Sends selections for LaTeX reassembly
- Uses "lego blocks" approach for safe, predictable filtering
- Maintains section order using `section_info` array

### Components Package

#### RippleBackground.tsx - Animated Background

WebGL-powered animated background using Canvas API.

**Key Features:**
- Particle-based ripple effects
- Mouse interaction for dynamic ripples
- Performance-optimized rendering
- Configurable animation parameters
- Memory-efficient cleanup

**Animation Engine:**
```typescript
const params: Params = {
  speed: 1.0,
  maxRipples: 150,
  expansionSpeed: 105,
  maxRadius: 140,
  fadeSpeed: 0.8,
  minAlpha: 0.02,
  maxAlpha: 0.9
};
```

#### CustomCursor.tsx - Custom Cursor

Custom cursor implementation with hover effects.

**Key Features:**
- Smooth cursor following animation
- Hover state detection and styling
- Performance-optimized tracking
- Cross-browser compatibility
- Accessibility considerations

#### LiquidButton.tsx - Animated Button

Advanced button component with liquid animation effects.

**Key Features:**
- Liquid ripple animation on click
- Hover state transitions
- Disabled state handling
- Customizable colors and sizes
- Performance-optimized rendering

#### TemplateList.tsx - Template Grid

Template selection interface with metadata display.

**Key Features:**
- Responsive grid layout
- Template metadata display
- Selection state management
- Hover effects and animations
- Accessibility support

#### TemplatePreview.tsx - PDF Renderer

PDF preview component using React PDF.

**Key Features:**
- Multi-page PDF rendering
- Zoom and scroll controls
- Error handling and loading states
- Memory management
- Print functionality

### Utilities Package

#### api.ts - Backend HTTP Client

Comprehensive API client with error handling and timeout management.

**Key Features:**
- Generic request function with timeout support
- Automatic error handling and categorization
- Request/response type safety
- Retry mechanisms for failed requests
- Progress tracking for uploads

**API Endpoints:**
```typescript
// File Operations
uploadFile(file: File): Promise<ApiResponse<UploadResult>>
processResume(params: ProcessParams): Promise<ApiResponse<ProcessResult>>

// Configuration
getInitData(): Promise<ApiResponse<InitData>>
getProviders(): Promise<ApiResponse<Providers>>
getTemplates(): Promise<ApiResponse<Templates[]>>

// LaTeX Processing
compileLatex(code: string): Promise<ApiResponse<CompileResult>>
preprocessLatex(code: string): Promise<ApiResponse<PreprocessResult>>

// Section Management (Lego Blocks Architecture)
parseSections(code: string, templateId?: string): Promise<ApiResponse<ParseResult>>
  // Parses LaTeX into blocks, returns nested structure:
  // {format_id, latex_blocks: {preamble, sections, closing}, section_info: [...], original_latex}
  // Uses format-specific parsers from Section_parsers/
  // section_info preserves document order for frontend display
  
filterLatex(parsedData: any, selections: any): Promise<ApiResponse<FilterResult>>
  // Assembles selected blocks into final LaTeX
  // Simple string concatenation (no regex manipulation)
  // Maintains document order using section_info array

// System
checkServerHealth(): Promise<boolean>
```

#### configStorage.ts - Configuration Management

Configuration persistence via backend API integration with API key validation.

**Key Features:**
- Backend API integration for configuration storage
- **API Key Validation**: Real-time testing of API keys before saving
- Type-safe configuration interface
- Error handling and validation
- Automatic configuration loading on startup
- Secure API key storage

**Configuration Interface:**
```typescript
interface UserConfig {
  selectedProvider: string;
  selectedModel: string;
  apiKey: string;
}

interface ConfigResponse {
  success: boolean;
  config?: UserConfig;
  isComplete?: boolean;
  message?: string;
  error?: ApiError;
}
```

**API Key Validation:**
```typescript
export async function testApiKey(config: UserConfig): Promise<ConfigResponse> {
  // Tests API key validity by making real API call
  // Returns standardized success/error response
  // Handles all provider-specific errors
}
```

#### dataPreloader.ts - Progressive Data Loading

Optimized data preloading system for improved performance.

**Key Features:**
- Lazy initialization to prevent blocking
- Progressive loading (critical data first)
- Request batching for efficiency
- Template PDF preloading
- Error handling and fallbacks

**Loading Strategy:**
1. **Critical Data**: Providers and templates (single API call)
2. **Secondary Data**: Template preview URLs (no network)
3. **Background Loading**: Template PDFs (on-demand)

#### rippleEngine.ts - Animation Engine

High-performance Canvas animation engine for background effects.

**Key Features:**
- WebGL-accelerated rendering
- Particle system with physics simulation
- Mouse interaction handling
- Memory management and cleanup
- Configurable animation parameters

## Integration Points

### Backend API Communication

The frontend communicates with the Python backend through HTTP REST API calls.

**Base Configuration:**
```typescript
const API_BASE_URL = 'http://localhost:54782';
const REQUEST_TIMEOUT = 30000; // 30 seconds
```

**Request Flow:**
1. **Health Check**: Verify backend availability
2. **Data Loading**: Fetch providers and templates
3. **Configuration**: Save/load user settings
4. **File Upload**: Upload resume files with progress tracking
5. **Processing**: Submit AI processing requests
6. **LaTeX Operations**: Compile, preprocess, and filter LaTeX code

### API Response Handling

The frontend uses two different patterns for handling API responses:

#### `apiRequest` Wrapper (Most Endpoints)
Used for most API calls with automatic error handling and response wrapping:

```typescript
// Backend returns data directly
{
  "rawLatexCode": "\\documentclass{article}...",
  "processedLatexCode": "\\documentclass{article}...",
  "message": "Resume processed successfully"
}

// Frontend wraps it as
{
  success: true,
  data: {
    "rawLatexCode": "\\documentclass{article}...",
    "processedLatexCode": "\\documentclass{article}...",
    "message": "Resume processed successfully"
  }
}
```

**Endpoints using `apiRequest`:**
- `processResume()` - AI resume processing
- `compileLatex()` - PDF compilation
- `preprocessLatex()` - LaTeX preprocessing
- `parseSections()` - Section parsing
- `filterLatex()` - LaTeX filtering
- `getProviders()` - Provider list
- `getTemplates()` - Template list
- `getInitData()` - Initialization data

#### Direct Fetch (Configuration Endpoints)
Used for configuration endpoints that return `success` field:

```typescript
// Backend returns with success field
{
  "success": true,
  "config": {...},
  "message": "Configuration saved successfully"
}

// Frontend uses directly
const result = await response.json();
if (result.success) { /* handle success */ }
```

**Endpoints using direct fetch:**
- `saveConfig()` - Configuration saving
- `loadConfig()` - Configuration loading

### React Router Navigation

Client-side routing with state passing between pages.

**Route Structure:**
```typescript
/ → ResumaxUI (Landing)
/templates → TemplateSelection (Template Picker)
/processing → ProcessingPage (AI Processing)
/editor → EditorPage (LaTeX Editor)
/section-selector → SectionSelectorPage (Section Management)
```

**State Passing:**
- Location state for configuration data
- Template selection persistence
- Processing results and session data
- Error state propagation

### Electron Integration

Desktop application features and system integration.

**Main Process Features:**
- Window management and lifecycle
- Python backend process spawning
- Application menu and shortcuts
- File system access for uploads
- System tray integration

**Renderer Process Features:**
- React application rendering
- DOM manipulation and events
- HTTP requests to backend
- File drag-and-drop handling
- Keyboard shortcuts and accessibility

## Dependencies

### Runtime Dependencies

**Core Framework:**
```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-router-dom": "^6.30.1"
}
```

**PDF Processing:**
```json
{
  "pdfjs-dist": "^5.4.296",
  "react-pdf": "^10.2.0"
}
```

**Animation and UI:**
```json
{
  "animejs": "^3.2.2",
  "lucide-react": "^0.548.0"
}
```

### Development Dependencies

**TypeScript Tooling:**
```json
{
  "typescript": "^5.6.3",
  "@types/react": "^18.3.12",
  "@types/react-dom": "^18.3.1",
  "@types/animejs": "^3.1.13"
}
```

**Build System:**
```json
{
  "vite": "^7.1.12",
  "@vitejs/plugin-react": "^4.3.3"
}
```

**Electron Development:**
```json
{
  "electron": "^38.4.0",
  "electron-builder": "^25.1.8",
  "concurrently": "^9.1.0",
  "wait-on": "^8.0.1"
}
```

### System Requirements

- **Node.js**: v18.x LTS or v20.x LTS (recommended: v20.x)
- **npm**: v9.x or v10.x
- **Operating System**: Windows 10/11 (x64)
- **RAM**: 4GB minimum, 8GB recommended
- **Disk Space**: 500MB for dependencies + 2GB for build artifacts

## Configuration

### Vite Configuration (vite.config.ts)

Development server and build optimization settings.

```typescript
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',  // Frontend build output
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    strictPort: true,
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Security-Policy': "connect-src 'self' http://localhost:54782 blob: data:; img-src 'self' data: blob:;"
    },
  },
});
```

### TypeScript Configuration

**tsconfig.json** - Main TypeScript configuration:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

**tsconfig.node.json** - Node.js TypeScript configuration:
```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

### Electron Builder Configuration

Windows packaging and distribution settings.

```json
{
  "build": {
    "appId": "com.resumax.app",
    "productName": "Resumax",
    "directories": {
      "output": "../packaging/release"  // Centralized release output
    },
    "win": {
      "target": [
        {
          "target": "nsis",
          "arch": ["x64"]
        },
        {
          "target": "portable",
          "arch": ["x64"]
        }
      ],
      "icon": "public/icon.ico"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true
    },
    "files": [
      "dist/**/*",  // Frontend build output
      "public/electron.cjs",
      "public/icon.ico",
      "package.json"
    ],
    "extraResources": [
      {
        "from": "../packaging/dist/ResumaxBackend/",  // PyInstaller folder (onedir mode)
        "to": "backend/"
      },
      {
        "from": "../backend/Latex_formats",
        "to": "backend/Latex_formats"
      },
      {
        "from": "../essentialpackage",
        "to": "essentialpackage"
      }
    ],
    "asarUnpack": [
      "**/*.{node,dll}",
      "dist/**/*"  // Unpack frontend files for Electron file:// protocol
    ]
  }
}
```

### Production vs Development Environment

The frontend automatically detects and adapts to different environments:

**Development Mode**:
- Vite dev server on `http://localhost:5173`
- Hot reload and fast refresh
- Backend spawns Python process (`python main.py`)
- Console logging and debugging

**Production Mode**:
- Static files served from `frontend/dist/` (unpacked from app.asar)
- Electron spawns backend from `resources/backend/ResumaxBackend.exe`
- File-based logging
- Optimized bundle with minification

**Environment Detection**:
```typescript
// In electron.cjs
const isDev = process.env.NODE_ENV === 'development';

if (isDev) {
  // Development: spawn Python process
  backendProcess = spawn('python', ['main.py'], {
    cwd: path.join(__dirname, '../../backend')
  });
} else {
  // Production: spawn backend from onedir structure
  const backendExe = path.join(process.resourcesPath, 'backend', 'ResumaxBackend.exe');
  backendProcess = spawn(backendExe, [], {
    cwd: path.dirname(process.resourcesPath)
  });
}
```

## Usage Instructions

### Development Setup

#### Developer Launcher (Recommended)

The easiest way to start full-stack development! Simply run the launcher:

1. **Double-click** `launcher.bat` in the project root
2. **Wait** for all services to start (backend, frontend, Electron)
3. **Start coding** - everything is ready!

The launcher automatically starts both frontend and backend services, perfect for full-stack development.

#### Windows: Automated Setup

For first-time setup, download our automated setup script:

1. **Download** `setup-resumax.bat` from the [latest release](https://github.com/y14c/resumax/releases/latest)
2. **Run** the script - it handles all frontend dependencies automatically
3. **Start development** after script completion

The script automatically:
- ✅ Installs Node.js 18+ and npm
- ✅ Installs all frontend dependencies (`npm install`)
- ✅ Verifies installation and setup

#### Manual Setup (All Platforms)

If you prefer manual installation or are on Linux/Mac:

1. **Prerequisites Installation:**
```bash
# Install Node.js LTS from https://nodejs.org/
node --version  # Should be v18+ or v20+
npm --version   # Should be v9+ or v10+
```

2. **Project Setup:**
```bash
cd frontend
npm install
```

3. **Development Server:**
```bash
# Start Vite dev server (http://localhost:5173)
npm run dev

# Start Electron in development mode
npm run electron:dev
```

### Build Process

1. **Frontend Build:**
```bash
# Build React application to frontend/dist/
npm run build
# Output: frontend/dist/
```

2. **Backend Build:**
```bash
# Build PyInstaller folder (onedir mode)
pyinstaller packaging/resumax-backend.spec
# Output: packaging/dist/ResumaxBackend/ (folder with executable and dependencies)
```

3. **Electron Package:**
```bash
# Build and package Electron app
npm run electron:build
# Output: packaging/release-new/
```

4. **Full Build:**
```bash
# Orchestrate complete build process
packaging/build.bat
# Creates: packaging/release-new/Resumax Setup 1.0.0.exe
```

### Available Scripts

```json
{
  "dev": "vite",
  "build": "tsc && vite build",
  "preview": "vite preview",
  "electron:dev": "concurrently \"npm run dev\" \"wait-on http://localhost:5173 && electron .\"",
  "electron:build": "npm run build && electron-builder --win"
}
```

### Application Workflow

1. **Start Application**: Launch Electron app
2. **Configure AI**: Select provider, model, and enter API key
3. **API Key Validation**: System tests API key with real API call before saving
4. **Upload Resume**: Drag-and-drop or browse for resume file
5. **Select Template**: Choose from available LaTeX templates
6. **Process Resume**: AI converts resume to LaTeX format
7. **Edit Content**: Use LaTeX editor for fine-tuning
8. **Filter Sections**: Select which sections to include
9. **Export Results**: Download PDF or LaTeX source

### API Key Validation Feature

**Overview**: Real-time API key validation ensures users can only save working API keys.

**User Experience**:
1. User enters API key and clicks "Save Key"
2. Button shows "Testing..." state with loading indicator
3. System makes real API call with "hi" message
4. Shows validation feedback (success/error message)
5. Only saves configuration if API key is valid
6. Blocks saving if validation fails with clear error message

**Technical Implementation**:
- **Backend**: `/api/test-api-key` endpoint with provider-specific testing
- **Frontend**: `testApiKey()` utility function with error handling
- **UI**: Loading states, visual feedback, and error display
- **Cost Optimization**: Minimal token usage (max_tokens: 10)
- **Provider Support**: Works with OpenAI, Claude, Gemini, and LM Studio

## Development Guide

### Adding New Pages

1. **Create Page Component:**
```typescript
// src/pages/NewPage.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const NewPage: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div>
      {/* Page content */}
    </div>
  );
};

export default NewPage;
```

2. **Add Route:**
```typescript
// src/App.tsx
import NewPage from './pages/NewPage';

// Add to Routes
<Route path="/new-page" element={<NewPage />} />
```

3. **Add Navigation:**
```typescript
// Navigate to new page
navigate('/new-page', { state: { data: 'value' } });
```

### Adding New Components

1. **Create Component:**
```typescript
// src/components/NewComponent.tsx
import React from 'react';

interface NewComponentProps {
  title: string;
  onClick: () => void;
}

const NewComponent: React.FC<NewComponentProps> = ({ title, onClick }) => {
  return (
    <button onClick={onClick}>
      {title}
    </button>
  );
};

export default NewComponent;
```

2. **Add to Component Library:**
```typescript
// Export from components/index.ts
export { default as NewComponent } from './NewComponent';
```

### Adding API Endpoints

1. **Add to API Client:**
```typescript
// src/utils/api.ts
export async function newApiCall(params: NewParams): Promise<ApiResponse<NewResult>> {
  return apiRequest<NewResult>('/api/new-endpoint', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}
```

2. **Add Type Definitions:**
```typescript
// src/types/api.ts
interface NewParams {
  param1: string;
  param2: number;
}

interface NewResult {
  result: string;
  success: boolean;
}
```

### Styling Guidelines

1. **Use Inline Styles for Dynamic Styling:**
```typescript
const dynamicStyle: React.CSSProperties = {
  color: isActive ? '#ec4899' : '#9ca3af',
  transform: isHovered ? 'scale(1.05)' : 'scale(1)',
  transition: 'all 0.3s ease'
};
```

2. **Use Styled Components for Complex Styles:**
```typescript
// src/styles/Component.styles.ts
export const containerStyle: React.CSSProperties = {
  position: 'relative',
  width: '100%',
  height: '100vh',
  display: 'flex',
  flexDirection: 'column'
};
```

3. **Follow Design System:**
- Primary Color: `#ec4899` (Pink)
- Secondary Color: `#a855f7` (Purple)
- Accent Color: `#06b6d4` (Cyan)
- Background: `#000000` (Black)
- Text: `#ffffff` (White)
- Muted Text: `#9ca3af` (Gray)

### Error Handling Patterns

1. **Component Error Boundaries:**
```typescript
<ErrorBoundary fallback={<ErrorFallback />}>
  <ComponentThatMightError />
</ErrorBoundary>
```

2. **API Error Handling:**
```typescript
const result = await apiCall();
if (!result.success) {
  setError(result.error?.message || 'Unknown error');
  return;
}
```

3. **Async Error Handling:**
```typescript
try {
  await asyncOperation();
} catch (error) {
  console.error('Operation failed:', error);
  setError('Operation failed');
}
```

## Deployment

### Windows Packaging

The application is packaged for Windows using Electron Builder with NSIS installer.

**Build Artifacts:**
- `Resumax Setup.exe` - NSIS installer
- `Resumax.exe` - Portable application
- Desktop shortcut (created automatically)
- Start menu entry (created automatically)

**App.asar Structure:**
Electron Builder creates an `app.asar` archive for the application, but frontend files must be unpacked for `file://` protocol access:

```
resources/
├── app.asar                      # Compressed application files
│   └── public/electron.cjs      # Main process script
├── app.asar.unpacked/           # Unpacked files (configured via asarUnpack)
│   └── dist/                    # Frontend build output
│       ├── index.html           # Must be unpacked for loadFile()
│       └── assets/              # JS, CSS, images
├── backend/                      # Backend onedir folder
│   ├── ResumaxBackend.exe
│   └── _internal/               # Python dependencies
└── essentialpackage/            # TinyTeX and Tesseract
```

**Why Unpack Frontend Files:**
- Electron's `loadFile()` cannot read files inside `app.asar` archives
- `asarUnpack: ["dist/**/*"]` extracts frontend to `app.asar.unpacked/`
- `electron.cjs` loads from unpacked location in production

**Installation Features:**
- Custom installation directory selection
- Desktop and start menu shortcuts
- Uninstaller included
- Windows 10/11 compatibility

### Distribution

1. **Build for Production:**
```bash
npm run electron:build
```

2. **Test Installation:**
- Run `Resumax Setup.exe` on target machine
- Verify all features work correctly
- Test uninstallation process

3. **Code Signing (Optional):**
```json
{
  "build": {
    "win": {
      "certificateFile": "path/to/certificate.p12",
      "certificatePassword": "password"
    }
  }
}
```

### Backend Integration

The frontend includes the PyInstaller backend executable as an extra resource:

```json
{
  "extraResources": [
    {
      "from": "../packaging/dist/ResumaxBackend/",
      "to": "backend/"
    },
    {
      "from": "../backend/Latex_formats",
      "to": "backend/Latex_formats"
    },
    {
      "from": "../essentialpackage",
      "to": "essentialpackage"
    }
  ],
  "asarUnpack": [
    "**/*.{node,dll}",
    "dist/**/*"
  ]
}
```

**Backend Requirements:**
- **Production**: `ResumaxBackend/` folder with executable and dependencies (onedir mode)
- **Development**: Python 3.10+ with all dependencies installed
- **Bundled Dependencies**: Essential package includes Tesseract OCR and TinyTeX
- **Path Resolution**: Working directory-based detection of bundled vs system dependencies

**Process Management:**
- **Development**: Electron spawns `python main.py`
- **Production**: Electron spawns `resources/backend/ResumaxBackend.exe`
- **Cleanup**: Proper SIGTERM/SIGKILL handling with timeout
- **Exit Handling**: Uses `process.exit(0)` for clean termination

## Troubleshooting

### Common Issues

#### "Module not found" errors
**Solution:**
- Ensure all dependencies are installed: `npm install`
- Check import paths are correct
- Verify TypeScript configuration

#### "Backend server is not running" error
**Solution:**
- Check if Python backend is running on port 54782
- Verify backend dependencies are installed
- Check Windows Firewall settings

#### PDF preview not loading
**Solution:**
- Ensure PDF.js worker is properly configured
- Check browser console for errors
- Verify template PDF files exist in backend

#### Electron build fails
**Solution:**
- Ensure all dependencies are installed
- Check Windows Defender/antivirus isn't blocking
- Increase Node.js memory limit: `node --max-old-space-size=4096`

#### AI Response Not Detected (Production Issue)
**Issue**: Users get stuck on the AI loading page in production builds.

**Root Cause**: Response format mismatch between backend and frontend:
- Backend was returning `{success: true, data: {...}}`
- Frontend's `apiRequest` wrapper was adding another layer: `{success: true, data: {success: true, data: {...}}}`
- This caused `result.data.rawLatexCode` to return `true` instead of the actual LaTeX code

**Solution**: Backend endpoints now return data directly without `success` field:
```typescript
// Before (caused double-wrapping)
{
  success: true,
  data: {
    success: true,  // This was the problem!
    rawLatexCode: "actual latex code"
  }
}

// After (fixed)
{
  success: true,
  data: {
    rawLatexCode: "actual latex code"  // Correct!
  }
}
```

**Fixed Endpoints:**
- `/api/process` - Resume processing
- `/api/compile-latex` - PDF compilation
- `/api/preprocess-latex` - LaTeX preprocessing
- `/api/parse-sections` - Section parsing
- `/api/filter-latex` - LaTeX filtering

#### TypeScript compilation errors
**Solution:**
- Check `tsconfig.json` configuration
- Ensure all type definitions are installed
- Verify import/export statements

### Performance Issues

#### Slow application startup
**Solution:**
- Check data preloading configuration
- Optimize component rendering
- Reduce initial bundle size

#### Memory leaks
**Solution:**
- Ensure proper cleanup in useEffect
- Remove event listeners on unmount
- Clear intervals and timeouts

#### PDF rendering performance
**Solution:**
- Reduce PDF scale for large documents
- Implement virtual scrolling for many pages
- Use progressive loading

### Debug Mode

1. **Enable Developer Tools:**
```typescript
// In electron.cjs
mainWindow.webContents.openDevTools();
```

2. **Enable Debug Logging:**
```typescript
// In components
console.log('[DEBUG] Component state:', state);
```

3. **Network Debugging:**
- Use Chrome DevTools Network tab
- Check API request/response details
- Verify CORS settings

### Environment Variables

```bash
# Development
NODE_ENV=development
ELECTRON_IS_DEV=true

# Production
NODE_ENV=production
ELECTRON_IS_DEV=false
```

### Log Files

- **Electron Logs**: Check console output in DevTools
- **Backend Logs**: Check Python console output
- **System Logs**: Windows Event Viewer for system issues

---

For more detailed backend integration information, see the [Backend README](../backend/README.md).

For system requirements and installation, see [REQUIREMENTS.md](REQUIREMENTS.md).
