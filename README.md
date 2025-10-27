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

## Quick Start

### Windows Users: Automated Setup

For first-time setup, download our automated setup script:

1. **Download** `setup-resumax.bat` from the [latest release](https://github.com/your-username/resumax/releases/latest)
2. **Run** the script (double-click or run from command prompt)
3. **Follow** the interactive prompts

The script will automatically:
- ✅ Install Git, Python 3.10+, and Node.js 18+ (if not present)
- ✅ Clone the repository
- ✅ Install all Python and Node.js dependencies
- ✅ Verify Tesseract-OCR and TinyTeX availability
- ✅ Set up your complete development environment

> No manual downloads needed - the script handles everything!

### Developer Launcher (Recommended)

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

## Documentation

| Document | Description |
|----------|-------------|
| [📚 Development Guide](DEVELOPMENT.md) | Complete setup, development workflow, and contributing guide |
| [🖥️ Frontend Docs](frontend/README.md) | React components, architecture, and frontend development |
| [⚙️ Backend Docs](backend/README.md) | API endpoints, AI providers, and backend architecture |
| [📋 Requirements](frontend/REQUIREMENTS.md) | Frontend dependencies and system requirements |
| [🐍 Python Dependencies](backend/REQUIREMENTS.md) | Backend dependencies and system requirements |

## Architecture

```
┌─────────────────┐    HTTP API    ┌─────────────────┐
│   Electron      │ ──────────────► │   Flask Server  │
│   (React UI)    │                 │   (Python API)  │
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
         │                          │ (TinyTeX/MiKTeX)│
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

- 🐛 **Bug Reports**: [Create an issue](https://github.com/your-username/resumax/issues)
- 💬 **Questions**: [Discussion forum](https://github.com/your-username/resumax/discussions)
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

**Ready to transform your resume?** [Get started now!](#-quick-start)

Made with ❤️ by the Resumax team

</div>
