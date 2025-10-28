# Resumax

<div align="center">

**AI-Powered Resume Builder**

Transform any resume into ATS-optimized LaTeX documents using cutting-edge AI

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![Node.js 18+](https://img.shields.io/badge/node.js-18+-green.svg)](https://nodejs.org/)
[![Electron](https://img.shields.io/badge/Electron-38.4.0+-blue.svg)](https://www.electronjs.org/)

[Documentation](#-documentation) • [Quick Start](#-quick-start) • [Contributing](#-contributing) • [Support](#-support)

</div>

## What is Resumax?

Resumax is a modern desktop application that uses AI to automatically convert resume files (PDF, DOCX, DOC, TXT) into professionally formatted LaTeX documents. **Fully offline capable** with local AI models, Resumax ensures your sensitive resume data never leaves your computer. Whether you're a job seeker needing ATS-optimized resumes or a professional wanting consistent formatting, Resumax streamlines the entire process with intelligent AI processing and beautiful templates.

## Why Resumax?

- **🔒 Privacy-First**: **100% offline processing** with local AI models - your data never leaves your computer
- **🎯 ATS Optimization**: Automatically formats resumes for Applicant Tracking Systems
- **🤖 AI-Powered**: Choose from cloud APIs (OpenAI, Claude, Gemini) or **fully local models** via LM Studio
- **📄 Multi-Format Support**: Handles PDF, DOCX, DOC, and TXT files seamlessly
- **🎨 Professional Templates**: Choose from ATS, Modern, or Two-Column LaTeX templates
- **⚡ Real-time Preview**: See your formatted resume instantly
- **🔧 Customizable**: Fine-tune sections and formatting to your needs
- **💻 Desktop App**: Native Windows application with Electron

## Key Features

- **🔒 Complete Privacy**: Process resumes entirely offline with local AI models
- **Multi-AI Support**: OpenAI GPT, Anthropic Claude, Google Gemini, **LM Studio (Local)**
- **Smart Text Extraction**: OCR support for scanned PDFs
- **Live LaTeX Editor**: Real-time editing with instant compilation
- **Template Gallery**: Multiple professional resume templates
- **Smart Section Filtering**: Lego blocks architecture with proper LaTeX command preservation
- **Document Order Preservation**: Sections displayed and compiled in original document order
- **LaTeX Export**: Download filtered or original LaTeX for debugging and customization
- **Item-Level Selection**: Choose individual items within sections (education, experience, projects)
- **PDF Generation**: High-quality PDF output with LaTeX compilation
- **Session Management**: Secure file handling with automatic cleanup
- **Error Handling**: Comprehensive error recovery and user feedback

### Section Selector — One resume, tailored for every job

Build a single master resume and create the right version for each application in seconds.

- **Choose what to show**: Turn entire sections or individual entries on/off (work experience, projects, education, skills).
- **Target any role**: Quickly tailor for different positions (e.g., Data Scientist vs. Frontend Engineer) without rewriting.
- **Stay organized**: Keep everything in one place—no more duplicate files or messy copies.
- **Export instantly**: Generate a clean, job‑ready PDF with only the most relevant highlights.

How it helps you:
1. Upload your resume once.
2. Select what’s relevant for this job, hide the rest.
3. Download a focused, ATS‑friendly PDF and apply.

---

## Smart Resume Customization

**Your complete work history (just an example):**

- Site Engineer — UrbanWorks Construction
- Project Engineer — BuildSense (Digital Twins & Analytics)
- Machine Learning Engineer — VisionEdge AI
- Frontend Engineer — PixelCraft Labs

---

### For a Civil Engineering application

**Select relevant experiences:**
- ✅ Site Engineer — UrbanWorks Construction
- ✅ Project Engineer — BuildSense (Digital Twins & Analytics)
- ⬜ Machine Learning Engineer — VisionEdge AI
- ⬜ Frontend Engineer — PixelCraft Labs

**Your resume shows:**
1. Project Engineer — BuildSense (Digital Twins & Analytics)
2. Site Engineer — UrbanWorks Construction

---

### For an AI/ML application

**Select relevant experiences:**
- ⬜ Site Engineer — UrbanWorks Construction
- ✅ Project Engineer — BuildSense (Digital Twins & Analytics)
- ✅ Machine Learning Engineer — VisionEdge AI
- ✅ Frontend Engineer — PixelCraft Labs

**Your resume shows:**
1. Machine Learning Engineer — VisionEdge AI
2. Project Engineer — BuildSense (Digital Twins & Analytics)
3. Frontend Engineer — PixelCraft Labs

---

## Quick Preview

```
┌─────────────────┐    Select Format    ┌─────────────────┐
│   Upload Resume │ ──────────────────► │  Choose Template│
│   (PDF/DOCX)    │                     │  (ATS/Modern)   │
└─────────────────┘                     └─────────────────┘
         │                                       │
         │                                       ▼
         │                              ┌─────────────────┐
         │                              │  AI Processing  │
         │                              │  (Local/Cloud)  │
         │                              └─────────────────┘
         │                                       │
         └───────────────────────────────────────▼
                                        ┌─────────────────┐
                                        │  Generate PDF   │
                                        │  (LaTeX)        │
                                        └─────────────────┘
```

## Recent Updates

### API Key Validation Feature ✅

**New**: Real-time API key validation before saving configuration.

**Features**:
- **Real API Testing**: Makes actual API calls with "hi" message to verify keys work
- **Cost Optimization**: Uses minimal token settings (max_tokens: 10) to reduce costs
- **Provider Support**: Works with all four providers (OpenAI, Claude, Gemini, LM Studio)
- **User Experience**: Clear visual feedback, loading states, and error messages
- **Error Handling**: Comprehensive error handling for all failure scenarios
- **LM Studio Support**: Special handling for local LM Studio connectivity testing

**Implementation**:
- Backend: Added `test_api_key()` functions to all provider modules
- Backend: Added `/api/test-api-key` POST endpoint
- Frontend: Added `testApiKey()` utility function
- Frontend: Updated UI to validate API keys before saving configuration

**User Flow**:
1. User enters API key and clicks "Save Key"
2. System tests API key with real API call
3. Shows validation feedback (success/error message)
4. Only saves configuration if API key is valid
5. Blocks saving if validation fails with clear error message

### Production Fix: AI Response Detection Issue ✅

**Fixed**: Users getting stuck on AI loading page in production builds.

**Root Cause**: Response format mismatch between backend and frontend causing double-wrapping of API responses.

**Solution**: Updated backend endpoints to return data directly without `success` field, allowing frontend's `apiRequest` wrapper to handle success/error wrapping properly.

**Affected Endpoints:**
- `/api/process` - Resume processing
- `/api/compile-latex` - PDF compilation
- `/api/preprocess-latex` - LaTeX preprocessing
- `/api/parse-sections` - Section parsing
- `/api/filter-latex` - LaTeX filtering

This fix ensures AI responses are properly detected and users can proceed from the processing page to the section selector.

## Quick Start

### End Users: Production Installation

For end users, download and install the standalone Resumax installer:

1. **Download** `Resumax Setup.exe` from the [latest release](https://github.com/Y14C/RESUMAX/releases/latest)
2. **Run** the installer and follow the setup wizard
3. **Launch** Resumax from desktop shortcut or start menu

The installer includes:
- ✅ Complete Resumax application (no Python/Node.js installation required)
- ✅ Bundled backend folder (ResumaxBackend/)
- ✅ Essential dependencies (Tesseract OCR + TinyTeX)
- ✅ Desktop and start menu shortcuts
- ✅ Automatic uninstaller

> **No technical setup required** - just download, install, and run!

### Developers: Development Setup

For developers working on the codebase:

#### Automated Setup (Recommended)

1. **Download** `setup-resumax.bat` from the [setup](https://github.com/Y14C/RESUMAX/releases/tag/v1.0.0)
2. **Run** the script (double-click or run from command prompt)
3. **Follow** the interactive prompts

The script will automatically:
- ✅ Install Git, Python 3.10+, and Node.js 18+ (if not present)
- ✅ Clone the repository
- ✅ Install all Python and Node.js dependencies
- ✅ Verify Tesseract-OCR and TinyTeX availability
- ✅ Set up your complete development environment

#### Developer Launcher

The easiest way to start development! Simply run the launcher:

1. **Double-click** `launcher.bat` in the project root
2. **Wait** for all services to start (backend, frontend, Electron)
3. **Start coding** - everything is ready!

The launcher automatically:
- ✅ Starts Python Flask backend on port 54782
- ✅ Starts Vite dev server on port 5173
- ✅ Launches Electron app in development mode
- ✅ Handles process cleanup when you close the app

> Perfect for developers working on the codebase!

### Alternative: Manual Setup

For Linux/Mac users or manual installation preference:

```bash
# 1. Clone the repository
git clone <repository-url>
cd resumax

# 2. Install dependencies
pip install -r backend/requirements.txt
cd frontend && npm install && cd ..

# 3. Start the application
cd backend && python main.py &
cd frontend && npm run electron:dev
```

**That's it!** The app will launch and guide you through the process.

> 📖 **Need detailed setup?** See our [Development Guide](DEVELOPMENT.md) for comprehensive installation instructions.

## Technology Stack

- **Frontend**: React + TypeScript + Electron
- **Backend**: Python Flask + REST API
- **AI Integration**: OpenAI, Anthropic, Google, **LM Studio (Local)**
- **Privacy**: **100% offline processing** with local AI models
- **Document Processing**: PyMuPDF, python-docx, Tesseract OCR
- **PDF Generation**: LaTeX (TinyTeX/MiKTeX)
- **Build Tools**: Vite, Electron Builder
- **Packaging**: PyInstaller (backend), Electron Builder (frontend)

## Production Packaging

Resumax is packaged as a standalone Windows installer with all dependencies bundled:

### Centralized Build Structure

All packaging artifacts are consolidated in the `packaging/` folder:

```
packaging/
├── dist/
│   └── ResumaxBackend/              # PyInstaller backend folder (onedir mode)
│       ├── ResumaxBackend.exe
│       └── _internal/               # Dependencies
├── release-new/                     # Final installer artifacts
│   ├── Resumax Setup 1.0.0.exe     # Windows installer (only file needed for distribution)
│   ├── *.yml, *.yaml, *.blockmap   # Build artifacts (not needed for distribution)
│   └── win-unpacked/                # Unpacked for testing
├── build.bat                        # Full build orchestration script
└── resumax-backend.spec            # PyInstaller configuration

frontend/
└── dist/                            # React build output (not in packaging/)
```

### Production Features

- **Standalone Backend**: PyInstaller creates `ResumaxBackend/` folder with executable and dependencies (onedir mode)
- **No Python Required**: End users don't need Python installation
- **Bundled Dependencies**: Essential package includes Tesseract OCR and TinyTeX
- **File-based Logging**: Production logging writes to files instead of console
- **Working Directory Paths**: Backend uses `os.getcwd()` for reliable path resolution
- **Process Management**: Electron spawns backend executable with proper cleanup
- **HashRouter**: Frontend uses HashRouter for Electron file:// protocol compatibility

### Build Process

1. **Backend Build**: PyInstaller creates `ResumaxBackend/` folder (onedir mode)
2. **Frontend Build**: Vite builds React application to `frontend/dist/`
3. **Electron Package**: Electron Builder creates Windows installer
4. **Dependency Bundling**: Essential package and backend folder included
5. **App.asar Unpacking**: Frontend files unpacked to `app.asar.unpacked/dist/`

For detailed build instructions, see the [Development Guide](DEVELOPMENT.md).

## Documentation

| Document | Description |
|----------|-------------|
| [📚 Development Guide](DEVELOPMENT.md) | Complete setup, development workflow, and contributing guide |
| [🖥️ Frontend Docs](frontend/README.md) | React components, architecture, and frontend development |
| [⚙️ Backend Docs](backend/README.md) | API endpoints, AI providers, and backend architecture |
| [📋 Requirements](frontend/REQUIREMENTS.md) | Frontend dependencies and system requirements |
| [🐍 Python Dependencies](backend/REQUIREMENTS.md) | Backend dependencies and system requirements |
| [📦 Production Packaging](#production-packaging) | Standalone installer with bundled dependencies |

## Architecture

```
┌─────────────────┐    HTTP API    ┌─────────────────┐
│   Electron      │ ──────────────► │   Flask Server  │
│   (React UI)    │                 │ (PyInstaller    │
│                 │                 │  Executable)    │
└─────────────────┘                 └─────────────────┘
         │                                   │
         │                                   ▼
         │                          ┌─────────────────┐
         │                          │   AI Providers  │
         │                          │ (OpenAI/Claude/ │
         │                          │  Gemini/LM)     │
         │                          └─────────────────┘
         │                                   │
         │                                   ▼
         │                          ┌─────────────────┐
         │                          │  LaTeX Engine   │
         │                          │ (Bundled TinyTeX│
         │                          │  + Tesseract)   │
         └──────────────────────────┴─────────────────┘
```

## Contributing

We welcome contributions! Whether you want to:

- 🐛 Fix bugs
- ✨ Add new features
- 📝 Improve documentation
- 🎨 Enhance UI/UX
- 🤖 Add new AI providers
- 📄 Create new templates

**Getting Started:**
1. Read our [Development Guide](DEVELOPMENT.md)
2. Fork the repository
3. Create a feature branch
4. Make your changes
5. Submit a pull request

## Support

- 🐛 **Bug Reports**: [Create an issue](https://github.com/y14c/resumax/issues)
- 💬 **Questions**: [Discussion forum](https://github.com/y14c/resumax/discussions)
- 📖 **Documentation**: Check the [Development Guide](DEVELOPMENT.md)
- 🔧 **Troubleshooting**: See [Backend Docs](backend/README.md#troubleshooting)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

We extend our gratitude to the following open-source projects that make Resumax possible:

### Core Dependencies
- **Tesseract OCR**: Open-source OCR engine for extracting text from scanned PDFs
  - Repository: [github.com/tesseract-ocr/tesseract](https://github.com/tesseract-ocr/tesseract)
  - License: [Apache License 2.0](https://github.com/tesseract-ocr/tesseract/blob/main/LICENSE)
- **TinyTeX**: Lightweight LaTeX distribution for PDF compilation
  - Repository: [github.com/rstudio/tinytex](https://github.com/rstudio/tinytex)
  - Website: [yihui.org/tinytex](https://yihui.org/tinytex/)
  - Based on: TeX Live (multiple open-source licenses)

### Technology Stack
- Built with ❤️ using React, TypeScript, Python, and Electron
- AI integration powered by OpenAI, Anthropic, Google, and LM Studio
- LaTeX templates for professional document formatting
- Open source community for inspiration and support

---

<div align="center">

**Ready to transform your resume?** [Get started now!](#quick-start)

Made with ❤️ by the Resumax team

</div>
