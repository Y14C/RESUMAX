# Frontend Requirements

## System Requirements

### Node.js and npm
- **Node.js**: v18.x LTS or v20.x LTS (recommended: v20.x)
- **npm**: v9.x or v10.x (comes bundled with Node.js)
- **Package Manager**: npm (default) or yarn/pnpm

### Operating System
- **Primary**: Windows 10/11 (x64)
- **Architecture**: x64 (64-bit)
- **Minimum RAM**: 4GB (8GB recommended)
- **Disk Space**: 500MB for dependencies + 2GB for build artifacts

### Build Tools
- **Visual Studio Build Tools** (for native modules compilation)
- **Windows SDK** (for Electron native modules)
- **Git** (for version control and dependency management)

## Runtime Dependencies

### Core Framework
- **React**: ^18.3.1 - UI framework
- **React DOM**: ^18.3.1 - React rendering for web

### PDF Processing
- **pdfjs-dist**: ^5.4.296 - PDF.js library for PDF rendering
- **react-pdf**: ^10.2.0 - React wrapper for PDF.js

### UI and Navigation
- **react-router-dom**: ^6.30.1 - Client-side routing
- **animejs**: ^3.2.2 - Animation library
- **lucide-react**: ^0.548.0 - Icon library for UI components

## Development Dependencies

### TypeScript Tooling
- **TypeScript**: ^5.6.3 - TypeScript compiler
- **@types/react**: ^18.3.12 - React TypeScript definitions
- **@types/react-dom**: ^18.3.1 - React DOM TypeScript definitions
- **@types/animejs**: ^3.1.13 - Anime.js TypeScript definitions

### Build System
- **Vite**: ^7.1.12 - Fast build tool and dev server
- **@vitejs/plugin-react**: ^4.3.3 - Vite React plugin

### Electron Development
- **Electron**: ^38.4.0 - Desktop app framework
- **electron-builder**: ^25.1.8 - Electron app packaging
- **concurrently**: ^9.1.0 - Run multiple commands simultaneously
- **wait-on**: ^8.0.1 - Wait for resources to be available

## Build Scripts and Packaging

### Electron Builder Configuration

The application uses electron-builder for Windows packaging with centralized build outputs:

```json
{
  "build": {
    "directories": {
      "output": "../packaging/release"
    },
    "files": [
      "../packaging/frontend-dist/**/*",
      "public/electron.cjs",
      "public/icon.ico",
      "package.json"
    ],
    "extraResources": [
      {
        "from": "../packaging/dist/ResumaxBackend.exe",
        "to": "ResumaxBackend.exe"
      },
      {
        "from": "../essentialpackage",
        "to": "essentialpackage"
      }
    ]
  }
}
```

### Available Build Scripts

```json
{
  "dev": "vite",
  "build": "tsc && vite build",
  "preview": "vite preview",
  "electron:dev": "concurrently \"npm run dev\" \"wait-on http://localhost:5173 && electron .\"",
  "electron:build": "npm run build && electron-builder --win"
}
```

### Build Artifacts

**Centralized Build Structure:**
```
packaging/
├── dist/
│   └── ResumaxBackend/        # PyInstaller backend folder (onedir mode)
│       ├── ResumaxBackend.exe
│       └── _internal/         # Dependencies
├── release-new/               # Final installer artifacts
│   ├── Resumax Setup 1.0.0.exe # Windows installer (only file needed for distribution)
│   ├── *.yml, *.yaml, *.blockmap # Build artifacts (not needed for distribution)
│   └── win-unpacked/          # Unpacked for testing
├── build.bat                  # Full build orchestration script
└── resumax-backend.spec       # PyInstaller configuration

frontend/
└── dist/                      # React build output (not in packaging/)
```

**Build Process:**
1. **Frontend Build**: `npm run build` → `frontend/dist/`
2. **Backend Build**: `pyinstaller packaging/resumax-backend.spec` → `packaging/dist/ResumaxBackend/` (onedir mode)
3. **Electron Package**: `npm run electron:build` → `packaging/release-new/`
4. **Full Build**: `packaging/build.bat` → Complete installer

## Windows Compatibility Notes

### Electron Builder Configuration
- **Target Platforms**: Windows x64 (NSIS installer + Portable)
- **Installer**: NSIS (Nullsoft Scriptable Install System)
- **Icon Format**: .ico (Windows icon format)
- **Output Directory**: `release/`

### Path Handling
- Use `pathlib.Path` for cross-platform path operations
- Handle Windows-specific path separators (`\` vs `/`)
- Support both relative and absolute paths

### Build Artifacts
- **NSIS Installer**: `packaging/release/Resumax Setup.exe`
- **Portable App**: `packaging/release/Resumax.exe`
- **Desktop Shortcut**: Created automatically
- **Start Menu Entry**: Created automatically
- **Centralized Output**: All build artifacts in `packaging/` folder

## Setup Instructions

### 1. Prerequisites Installation
```bash
# Install Node.js LTS from https://nodejs.org/
# Verify installation
node --version
npm --version
```

### 2. Project Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Verify installation
npm list --depth=0
```

### 3. Development Server
```bash
# Start Vite dev server
npm run dev

# Start Electron in development mode
npm run electron:dev
```

### 4. Build Process
```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### 5. Electron Packaging
```bash
# Build and package Electron app
npm run electron:build

# Output will be in 'release/' directory
```

## Troubleshooting

### Common Issues
1. **Native Module Compilation**: Ensure Visual Studio Build Tools are installed
2. **Path Issues**: Use forward slashes in import paths
3. **Electron Build**: Check Windows Defender/antivirus isn't blocking the build
4. **Memory Issues**: Increase Node.js memory limit if needed: `node --max-old-space-size=4096`

### Environment Variables
- `NODE_ENV`: Set to 'development' or 'production'
- `ELECTRON_IS_DEV`: Automatically set by Electron
- `VITE_*`: Vite-specific environment variables

## File Structure
```
frontend/
├── src/                    # Source code
├── public/                 # Static assets
├── node_modules/           # Dependencies
├── package.json            # Project configuration
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite configuration
└── REQUIREMENTS.md         # This file

packaging/                  # Centralized build artifacts
├── dist/
│   └── ResumaxBackend.exe  # PyInstaller backend executable
├── frontend-dist/          # React build output
├── release/                # Final installer artifacts
│   ├── Resumax Setup.exe   # NSIS installer
│   └── Resumax.exe         # Portable application
├── build.bat               # Full build orchestration script
└── resumax-backend.spec    # PyInstaller configuration
```

## Version Compatibility
- **Electron**: Compatible with Node.js v18+ and v20+
- **React**: Requires React 18+ for concurrent features
- **TypeScript**: Requires TypeScript 5.0+ for latest features
- **Vite**: Requires Node.js v18+ for optimal performance
