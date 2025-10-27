# Backend Requirements

This document lists all dependencies required for the Resumax backend server. All version numbers represent the **minimum tested versions** (use these versions or higher).

---

## Python Version

- **Python 3.10+** (tested with Python 3.10 and higher)

---

## Python Package Dependencies

### Core Web Framework
```
Flask>=2.3.3
Flask-Cors>=4.0.0
python-dotenv>=1.0.0
```

### AI Provider SDKs
```
anthropic>=0.71.0          # Claude API (Anthropic)
google-generativeai>=0.8.2 # Gemini API (Google)
openai>=2.6.1              # OpenAI API & LM Studio compatibility
lmstudio                   # To Run local models for truely offline experience
```

### Document Processing
```
python-docx>=1.1.0         # Microsoft Word DOCX file handling
pypandoc>=1.15             # Legacy DOC file conversion (requires Pandoc)
PyMuPDF>=1.26.5            # PDF text extraction (import as 'fitz')
pytesseract>=0.3.13        # OCR for scanned PDFs (requires Tesseract)
Pillow>=10.4.0             # Image processing for OCR
```

### Utilities
```
requests>=2.31.0           # HTTP requests
```

---

## Installation Command

Install all Python packages using pip:

```bash
pip install Flask>=2.3.3 Flask-Cors>=4.0.0 python-dotenv>=1.0.0 anthropic>=0.71.0 google-generativeai>=0.8.2 openai>=2.6.1 python-docx>=1.1.0 pypandoc>=1.15 PyMuPDF>=1.26.5 pytesseract>=0.3.13 Pillow>=10.4.0 requests>=2.31.0
```

Or create a `requirements.txt` file with the above packages (one per line) and run:
```bash
pip install -r requirements.txt
```

---

## External System Dependencies

These are **system-level** dependencies that must be installed separately from Python packages.

### 1. Tesseract OCR (Optional but Recommended)

**Purpose**: Extract text from scanned/image-based PDF resumes

**Installation Options**:

**Option A: Using winget (Recommended)**
```bash
winget install --id=UB-Mannheim.TesseractOCR -e
```

**Option B: Manual Installation**
- Download from: https://github.com/UB-Mannheim/tesseract/wiki
- Install to default location: `C:\Program Files\Tesseract-OCR`
- Add to system PATH if not automatically added

**Option C: Bundled Version (For Distribution)**
- The project includes a `essentialpackage/Tesseract-OCR/` folder in the root directory
- Backend will automatically detect and use this bundled version
- Full Tesseract installation is shipped with the application

**Note**: Most text-based resume PDFs work WITHOUT Tesseract. It's only needed for scanned/image PDFs.

**Verification**:
```bash
tesseract --version
```

---

### 2. Pandoc (Optional)

**Purpose**: Convert legacy Microsoft Word `.doc` files to text

**Installation Options**:

**Option A: Using winget**
```bash
winget install --id=JohnMacFarlane.Pandoc -e
```

**Option B: Using Chocolatey**
```bash
choco install pandoc
```

**Option C: Manual Installation**
- Download from: https://pandoc.org/installing.html
- Run the installer and ensure it's added to PATH

**Note**: Only required for `.doc` files. Modern `.docx` files work without Pandoc.

**Verification**:
```bash
pandoc --version
```

---

### 3. LaTeX Distribution (Required for PDF Generation)

**Purpose**: Compile LaTeX code to PDF format

**Installation Options**:

**Option A: Bundled TinyTeX (Recommended for Distribution)**
- The project includes a `essentialpackage/TinyTeX/` folder in the root directory
- This is a minimal LaTeX distribution optimized for resume generation
- Backend automatically detects and uses bundled TinyTeX
- **No manual installation needed if TinyTeX folder exists**

**Option B: System Installation - MiKTeX (Windows)**
- Download from: https://miktex.org/download
- Install with automatic package installation enabled
- Adds `pdflatex` to system PATH automatically

**Option C: System Installation - TeX Live**
- Download from: https://www.tug.org/texlive/
- Full-featured LaTeX distribution (larger download)
- More comprehensive but requires more disk space

**Verification**:
```bash
pdflatex --version
```

**Priority Order** (Backend checks in this order):
1. Bundled `essentialpackage/TinyTeX/bin/windows/pdflatex.exe` (project root)
2. System-installed `pdflatex` in PATH
3. Common installation path: `C:\Program Files\MiKTeX\miktex\bin\x64\pdflatex.exe`

---

## Optional Dependencies

### LM Studio (For Local AI Models)

**Purpose**: Run AI models locally instead of using cloud APIs

**Installation**:
- Download from: https://lmstudio.ai/
- Install and load a model
- Start the local server (default: http://localhost:1234)
- Backend will detect LM Studio automatically when running

**Note**: Not required if using OpenAI, Anthropic, or Gemini cloud APIs.

---

## Troubleshooting

### Issue: "Tesseract not found" error
**Solution**: 
- Install Tesseract using one of the methods above
- Or ensure `essentialpackage/Tesseract-OCR/` folder exists in project root
- Backend will auto-detect bundled version

### Issue: "Pandoc not found" error
**Solution**: 
- Install Pandoc using one of the methods above
- Or avoid uploading legacy `.doc` files (use `.docx` instead)

### Issue: "pdflatex not found" error
**Solution**: 
- Ensure `essentialpackage/TinyTeX/` folder exists in project root (for bundled version)
- Or install MiKTeX/TeX Live system-wide
- Verify with `pdflatex --version`

### Issue: Import errors for Python packages
**Solution**: 
- Ensure you're using Python 3.10 or higher
- Run `pip install --upgrade pip` to update pip
- Install all packages again: `pip install -r requirements.txt`

### Issue: API authentication errors
**Solution**: 
- Verify API keys are correctly set in `.env` file
- Check API key validity with provider's dashboard
- Ensure no extra spaces in API keys

---

## Production Deployment

### For Packaged Electron App:

1. **Bundle TinyTeX**: Include `essentialpackage/TinyTeX/` folder in app distribution
2. **Bundle Tesseract**: Include `essentialpackage/Tesseract-OCR/` folder for OCR support
3. **Python Environment**: Use PyInstaller to bundle Python + packages into executable
4. **Environment Variables**: Store API keys securely (not in version control)

### For Server Deployment:

1. Install Python 3.10+
2. Install all Python packages: `pip install -r requirements.txt`
3. Install system dependencies (Tesseract, Pandoc, LaTeX)
4. Set environment variables in `.env` file
5. Run backend: `python main.py`

---

## Development Setup

**Quick Start**:

```bash
# 1. Install Python packages
pip install -r requirements.txt

# 2. Install system dependencies (Windows)
winget install --id=UB-Mannheim.TesseractOCR -e
winget install --id=JohnMacFarlane.Pandoc -e

# 3. Verify TinyTeX exists (or install MiKTeX)
# Check if essentialpackage/TinyTeX/bin/windows/pdflatex.exe exists in project root

# 4. Create .env file with API keys
# RESUMAX_PROVIDER=OpenAI
# RESUMAX_MODEL=gpt-4.1-2025-04-14
# RESUMAX_API_KEY=sk-...

# 5. Start backend
cd backend
python main.py
```

Server will start on: `http://localhost:54782`

---

## Version History

- **Current Version**: All packages tested and working as of October 2025
- **Minimum Versions**: Listed versions are minimum requirements (higher versions should work)
- **Python**: 3.10+ required for type hints and modern syntax

---

## Notes

- All Python packages use semantic versioning
- External dependencies should be kept updated for security
- Bundled TinyTeX and Tesseract-OCR are included in essentialpackage folder for distribution
- API keys should never be committed to version control
- Backend automatically detects bundled vs. system installations


