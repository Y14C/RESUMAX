# Resumax Development Guide

A quick-start guide for developers and contributors to the Resumax resume formatting application.

## 🚀 Project Overview

Resumax is an Electron-based desktop application that uses AI to convert resume files into professionally formatted LaTeX documents. The application consists of:

- **Frontend**: React + TypeScript + Electron desktop app
- **Backend**: Python Flask API server
- **AI Integration**: OpenAI, Claude, Gemini, and LM Studio support
- **Document Processing**: PDF, DOCX, DOC, and TXT file support
- **Output**: LaTeX compilation to PDF with multiple templates

### Architecture Overview

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

## ⚡ Quick Start

### Windows: Automated Setup Script

For first-time setup, download our automated setup script:

1. **Download** `setup-resumax.bat` from the [latest release](https://github.com/y14c/resumax/releases/latest)
2. **Run** the script (double-click or run from command prompt)
3. **Follow** the interactive prompts

The script automatically handles:
- ✅ **Prerequisites**: Installs Git, Python 3.10+, and Node.js 18+ (if not present)
- ✅ **Repository**: Clones the repository or uses existing folder
- ✅ **Dependencies**: Installs all Python and Node.js packages
- ✅ **System Tools**: Installs Tesseract-OCR and Pandoc via winget
- ✅ **Verification**: Validates all installations and dependencies
- ✅ **Environment**: Sets up complete development environment

> **Time to setup**: ~5-10 minutes vs 30+ minutes manual setup

**After running the script, use the launcher:**
```bash
# Simply double-click launcher.bat or run:
launcher.bat
```
### Developer Launcher (Recommended)

The fastest way to start development! Simply run the launcher:

1. **Double-click** `launcher.bat` in the project root
2. **Wait** for all services to start (backend, frontend, Electron)
3. **Start coding** - everything is ready!

The launcher automatically:
- ✅ Starts Python Flask backend on port 54782
- ✅ Starts Vite dev server on port 5173
- ✅ Launches Electron app in development mode
- ✅ Handles process cleanup when you close the app

> Perfect for developers working on the codebase!

### Manual Setup (All Platforms)

If you prefer manual installation or are on Linux/Mac:

#### Prerequisites

- **Node.js**: v18+ or v20+ LTS
- **Python**: 3.10+
- **Git**: For version control

#### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd resumax

# Install frontend dependencies
cd frontend
npm install
cd ..

# Install backend dependencies
pip install -r backend/requirements.txt
```

#### 2. System Dependencies (Windows)

```bash
# Install required system tools
winget install --id=UB-Mannheim.TesseractOCR -e
winget install --id=JohnMacFarlane.Pandoc -e

# LaTeX is bundled in essentialpackage/TinyTeX/ (no installation needed)
```

#### 3. Start Development Servers

```bash
# Terminal 1: Start backend
cd backend
python main.py

# Terminal 2: Start frontend dev server
cd frontend
npm run dev

# Terminal 3: Start Electron app
cd frontend
npm run electron:dev
```

**That's it!** The app should be running at `http://localhost:5173` with the backend on `http://localhost:54782`.

## 🏗️ Project Structure

```
resumax/
├── frontend/                 # React + Electron frontend
│   ├── src/                 # React source code
│   ├── public/              # Electron main process
│   ├── package.json         # Frontend dependencies
│   └── README.md            # Detailed frontend docs
├── backend/                 # Python Flask API
│   ├── main.py             # Flask server
│   ├── Model_API/          # AI provider integrations
│   ├── Upload/             # File processing
│   ├── Output/             # LaTeX processing (lego blocks)
│   ├── Section_parsers/    # Format-specific LaTeX parsers
│   ├── Latex_formats/      # Resume templates
│   └── README.md           # Detailed backend docs
├── essentialpackage/        # Bundled dependencies
│   ├── TinyTeX/           # LaTeX distribution
│   └── Tesseract-OCR/     # OCR engine
└── DEVELOPMENT.md          # This file
```

**For detailed documentation:**
- Frontend architecture → [`frontend/README.md`](frontend/README.md)
- Backend API docs → [`backend/README.md`](backend/README.md)
- Dependencies → [`frontend/REQUIREMENTS.md`](frontend/REQUIREMENTS.md) & [`backend/REQUIREMENTS.md`](backend/REQUIREMENTS.md)

## 🔄 Development Workflow

### Common Tasks

**Start development (easiest):**
```bash
# Use the launcher for full development environment
launcher.bat
```

**Start development (manual control):**
```bash
# Backend
cd backend && python main.py

# Frontend (Vite dev server)
cd frontend && npm run dev

# Electron app
cd frontend && npm run electron:dev
```

**Build for production:**
```bash
# Build React app
cd frontend && npm run build

# Package Electron app
cd frontend && npm run electron:build
```

**Test the application:**
```bash
# Test backend API
curl http://localhost:54782/api/health

# Test frontend
cd frontend && npm test
```

### Key Development Concepts

1. **File Upload**: Users upload resume files (PDF, DOCX, DOC, TXT)
2. **AI Processing**: Selected AI model formats content using LaTeX templates
3. **Template Selection**: Choose from ATS, Modern, cool, or Two-Column layouts
4. **Section Filtering**: "Lego blocks" architecture - parse, split, select, reassemble
5. **LaTeX Compilation**: Convert LaTeX code to PDF using TinyTeX

### Section Filtering Architecture

The application uses a "lego blocks" approach for section management:

1. **Parse**: Format-specific parsers extract section structure
2. **Split**: LaTeX is split into reusable blocks (preamble, sections, items, closing)
3. **Select**: Users choose which blocks to include
4. **Reassemble**: Selected blocks are concatenated into final LaTeX

**Technical Implementation:**
- **Item Extraction**: Looks backward up to 50 chars for LaTeX commands (`\textbf{`, `\item`)
- **Boundary Detection**: Finds proper boundaries between items using newline patterns
- **Spacing Preservation**: Adds `\n\n` after non-last items for proper visual spacing
- **Document Order**: Uses `section_info` array to preserve original document order
- **Brace Balance**: Validates LaTeX syntax and generates debug files on mismatch

**Benefits:**
- **Safe**: No regex manipulation after parsing
- **Predictable**: Same selections always produce same output
- **Flexible**: Item-level selection within sections
- **Format-agnostic**: Same assembly logic for all formats
- **Order Preserved**: Sections maintain original document order
- **Debug Ready**: Automatic debug file generation for troubleshooting

## 🛠️ Contributing Guide

### Adding New AI Providers

1. **Create provider module** in `backend/Model_API/`:
```python
# backend/Model_API/your_provider.py
def get_available_models() -> List[str]:
    return ["model1", "model2"]

def format_resume(api_key, model_name, system_prompt, latex_format, extracted_text) -> str:
    # Your implementation
    return formatted_latex
```

2. **Update backend** in `backend/main.py`:
```python
# Add to get_provider_module() function
elif provider == "YourProvider":
    from Model_API.your_provider import get_available_models, format_resume
```

3. **Frontend automatically discovers** new providers via API

### Adding New Templates

1. **Create LaTeX template** in `backend/Latex_formats/`:
```latex
% YourTemplate.tex
\documentclass[11pt,a4paper]{article}
% Your template content
\begin{document}
% Template structure
\end{document}
```

2. **Add metadata** in `backend/main.py`:
```python
TEMPLATE_METADATA = {
    'YourTemplate': {
        'name': 'Your Template Name',
        'description': 'Template description',
        'category': 'Professional'
    }
}
```

3. **Create preview PDF** (optional): Place `YourTemplate.pdf` in `backend/Latex_formats/`

### Adding New File Formats

1. **Update upload handler** in `backend/Upload/upload_handler.py`:
```python
SUPPORTED_FORMATS = [".txt", ".docx", ".doc", ".pdf", ".yourformat"]

def _extract_from_yourformat(path: Path) -> str:
    # Your extraction logic
    return extracted_text
```

2. **Update validation** in `backend/main.py`:
```python
allowed_extensions = {'.pdf', '.docx', '.doc', '.txt', '.yourformat'}
```

### Adding New LaTeX Format Parsers

The `Section_parsers/` folder contains format-specific parsers for extracting section structure from LaTeX documents.

**Parser Interface:**
```python
# Section_parsers/your-format-parser.py
def parse(latex_code: str) -> Dict:
    """
    Parse LaTeX code for your format
    
    Returns:
        {
            "sections": [
                {
                    "title": "SECTION_NAME",
                    "subsections": ["item1", "item2", ...]
                }
            ]
        }
    """
    # Your parsing logic here
    return {"sections": sections_list}
```

**Integration Steps:**

1. **Create parser file** in `backend/Section_parsers/`:
```python
# your-format-parser.py
import re
from typing import Dict, List

def parse(latex_code: str) -> Dict:
    # Extract sections using format-specific patterns
    sections = []
    
    # Example: Find \mysection{TITLE} patterns
    pattern = r'\\mysection\s*\{([^}]+)\}'
    for match in re.finditer(pattern, latex_code):
        title = match.group(1)
        # Extract subsections...
        sections.append({
            "title": title,
            "subsections": subsections_list
        })
    
    return {"sections": sections}
```

2. **Update section_selector.py**:
```python
# Add to imports
your_format_parser = load_parser('your-format-parser')

# Add to FORMAT_PARSER_MAP
FORMAT_PARSER_MAP['YourFormat'] = your_format_parser

# Add section pattern
SECTION_PATTERNS['YourFormat'] = r'\\mysection\s*\{\s*{title}\s*\}' 
```

3. **Test your parser**:
```python
# backend/test_your_parser.py
from Section_parsers import your_format_parser

latex = "\\mysection{Education}..."
result = your_format_parser.parse(latex)
print(result)  # Should show sections structure
```

**Important Requirements:**
- **Document Order**: Parsers must return sections in original document order
- **Section Info**: The `section_info` array preserves order for frontend/backend
- **Subsection Titles**: Provide clean, readable subsection titles for frontend display
- **Consistent Structure**: All parsers must follow the same return format

**See Also:**
- Existing parsers: `ATS-parser.py`, `modern-parser.py`, `cool-parser.py`, `two-coloumn-parser.py`
- Documentation: `backend/Output/SECTION_SELECTOR_README.md`

## 🐛 Common Issues & Quick Fixes

### Automated Setup Script Issues

**"Script fails to download dependencies"**
- Ensure you have internet connection
- Check Windows Package Manager (winget) is available
- Run script as Administrator if needed
- Check `setup-log.txt` for detailed error messages

**"Python/Node.js installation fails"**
- Verify system meets minimum requirements (Windows 10+)
- Check available disk space (2GB+ recommended)
- Try running script in Command Prompt instead of PowerShell
- Check Windows Defender/antivirus isn't blocking installations

**"Repository clone fails"**
- Check internet connection
- Verify GitHub repository URL is accessible
- Ensure no existing `resumax` folder conflicts
- Try running script from a different directory

**"Script verification fails"**
- Check `setup-log.txt` for specific error details
- Verify all prerequisites were installed correctly
- Try manual verification: `python --version`, `node --version`
- Re-run script if some steps failed

### Backend Issues

**"Tesseract not found"**
```bash
# Install Tesseract
winget install --id=UB-Mannheim.TesseractOCR -e
```

**"pdflatex not found"**
- Check if `essentialpackage/TinyTeX/bin/windows/pdflatex.exe` exists
- If not, install MiKTeX: Download from https://miktex.org/download

**"Module not found" errors**
```bash
# Reinstall Python packages
pip install -r backend/requirements.txt
```

### Frontend Issues

**"Module not found" errors**
```bash
# Reinstall Node packages
cd frontend && npm install
```

**Electron build fails**
```bash
# Clear cache and rebuild
cd frontend && npm run clean && npm install && npm run electron:build
```

**Backend connection errors**
- Ensure backend is running on `http://localhost:54782`
- Check Windows Firewall settings
- Verify CORS configuration

### General Issues

**Memory issues during build**
```bash
# Increase Node.js memory limit
node --max-old-space-size=4096 npm run electron:build
```

**API key errors**
- Check `.env` file in backend directory
- Verify API keys are valid and have no extra spaces
- Test API keys with provider dashboards

## 📚 Resources & Detailed Documentation

### Frontend Documentation
- **Complete Guide**: [`frontend/README.md`](frontend/README.md)
- **Dependencies**: [`frontend/REQUIREMENTS.md`](frontend/REQUIREMENTS.md)
- **Components**: See `frontend/src/components/`
- **Pages**: See `frontend/src/pages/`

### Backend Documentation
- **Complete Guide**: [`backend/README.md`](backend/README.md)
- **Dependencies**: [`backend/REQUIREMENTS.md`](backend/REQUIREMENTS.md)
- **API Endpoints**: See `backend/README.md#api-endpoints`
- **AI Providers**: See `backend/Model_API/`

### External Resources
- [Flask Documentation](https://flask.palletsprojects.com/)
- [React Documentation](https://reactjs.org/docs/)
- [Electron Documentation](https://www.electronjs.org/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [LaTeX Documentation](https://www.latex-project.org/help/documentation/)

## 🚀 Next Steps

1. **Explore the codebase**: Start with `frontend/src/App.tsx` and `backend/main.py`
2. **Read detailed docs**: Check the README files in frontend and backend folders
3. **Try the workflow**: Upload a resume, select a template, and process it
4. **Pick an issue**: Look for "good first issue" labels in the repository
5. **Ask questions**: Check existing issues or create a new one

---

**Happy coding!** 🎉

For detailed troubleshooting, architecture explanations, and complete API documentation, refer to the README files in the `frontend/` and `backend/` directories.