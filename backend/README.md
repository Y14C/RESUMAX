# Resumax Backend Server

A Flask-based REST API server that orchestrates resume processing, manages AI provider configurations, handles file uploads, and coordinates the entire backend workflow for the Resumax Electron application.

## Table of Contents

- [Introduction & Purpose](#introduction--purpose)
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Core Modules](#core-modules)
- [API Endpoints](#api-endpoints)
- [Dependencies](#dependencies)
- [Configuration](#configuration)
- [Usage Instructions](#usage-instructions)
- [Development Guide](#development-guide)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## Introduction & Purpose

The Resumax Backend Server is a Python Flask application that serves as the core processing engine for the Resumax resume formatting application. It provides REST API endpoints for the Electron frontend to interact with AI models, process uploaded resume files, and generate formatted LaTeX resumes.

### Technology Stack

- **Framework**: Flask 2.3.3+ with Flask-CORS
- **AI Integration**: OpenAI, Anthropic Claude, Google Gemini, LM Studio
- **Document Processing**: PyMuPDF, python-docx, pypandoc, pytesseract
- **PDF Generation**: LaTeX compilation with TinyTeX/MiKTeX
- **Environment**: Python 3.10+ with Windows compatibility

### Key Features

- **Multi-Provider AI Support**: Integration with OpenAI, Claude, Gemini, and local LM Studio
- **Document Processing**: Extract text from PDF, DOCX, DOC, and TXT files
- **OCR Capability**: Process scanned PDFs using Tesseract OCR
- **LaTeX Compilation**: Generate professional PDF resumes from LaTeX templates
- **Template Management**: Support for multiple LaTeX resume templates
- **Section Filtering**: Allow users to select which resume sections to include
- **Session Management**: In-memory file storage with automatic cleanup
- **Error Handling**: Comprehensive error handling with detailed logging

## Architecture Overview

```
┌─────────────────┐    HTTP Requests    ┌──────────────────┐
│   Electron      │ ──────────────────► │   Flask Server   │
│   Frontend      │                     │   (main.py)      │
└─────────────────┘                     └──────────────────┘
                                                │
                                                ▼
                                        ┌──────────────────┐
                                        │   Upload Handler │
                                        │ (File Processing)│
                                        └──────────────────┘
                                                │
                                                ▼
                                        ┌──────────────────┐
                                        │   AI Providers   │
                                        │   (Model_API)    │
                                        └──────────────────┘
                                                │
                                                ▼
                                        ┌──────────────────┐
                                        │   Output Handler │
                                        │  (PDF Generation)│
                                        └──────────────────┘
```

### Request Flow

1. **File Upload**: Frontend uploads resume file → Backend stores in memory
2. **Configuration**: User selects AI provider, model, and template
3. **Text Extraction**: Backend extracts text from uploaded file
4. **AI Processing**: Selected AI model formats text using LaTeX template
5. **LaTeX Processing**: Backend preprocesses and compiles LaTeX to PDF
6. **Response**: Backend returns processed LaTeX code and/or PDF

### Module Responsibilities

- **main.py**: Flask server, API endpoints, session management
- **Model_API/**: AI provider integrations and system prompts
- **Upload/**: File upload handling and text extraction
- **Output/**: LaTeX processing, PDF generation, and section management
- **Section_parsers/**: Format-specific LaTeX parsers for section extraction

## Project Structure

```
backend/
├── main.py                    # Flask server and API endpoints
├── REQUIREMENTS.md            # Python dependencies documentation
├── README.md                  # This documentation
├── requirements.txt           # Python package dependencies
├── Model_API/                 # AI provider integrations
│   ├── __init__.py
│   ├── claude.py             # Anthropic Claude API handler
│   ├── gemini.py             # Google Gemini API handler
│   ├── lmstudio.py           # LM Studio local API handler
│   ├── openai.py             # OpenAI API handler
│   └── system-prompt.txt     # AI system prompt template
├── Upload/                    # File upload and text extraction
│   ├── __init__.py
│   ├── upload_handler.py     # Main upload coordinator
│   └── pdf_handler.py        # PDF text extraction and OCR
├── Output/                    # LaTeX processing and PDF generation
│   ├── __init__.py
│   ├── pdfgenerator.py       # LaTeX to PDF compilation
│   ├── latex_preprocessor.py # LaTeX code preprocessing
│   └── section_selector.py   # Section parsing and filtering (lego blocks)
├── Section_parsers/           # Format-specific LaTeX parsers
│   ├── __init__.py
│   ├── ATS-parser.py         # ATS format parser
│   ├── modern-parser.py      # Modern format parser
│   ├── cool-parser.py        # Cool/Anti-CV format parser
│   └── two-coloumn-parser.py # Two-column format parser
├── Latex_formats/            # LaTeX resume templates
│   ├── ATS.tex              # ATS-optimized template
│   ├── Modern.tex           # Modern creative template
│   ├── cool.tex             # Cool/Anti-CV template
│   ├── Two-Coloumn.tex      # Two-column layout template
│   └── *.pdf                # Template preview PDFs
├── logs/                     # AI response logs (auto-generated)
├── temp/                     # Temporary files (auto-cleanup)
└── __init__.py

packaging/                     # Centralized build artifacts
├── dist/
│   └── ResumaxBackend.exe    # PyInstaller backend executable
├── frontend-dist/            # React build output
├── release/                  # Final installer artifacts
│   ├── Resumax Setup.exe     # NSIS installer
│   └── Resumax.exe           # Portable application
├── build.bat                 # Full build orchestration script
└── resumax-backend.spec      # PyInstaller configuration
```

## Core Modules

### Main Server (main.py)

The central Flask application that orchestrates all backend operations.

**Key Features:**
- REST API endpoints for frontend communication
- In-memory file storage with session management
- Configuration management via .env file
- Automatic cleanup of expired sessions and temp files
- Comprehensive error handling and logging

**Core Functions:**
- `load_env_config()`: Load AI provider configuration
- `save_env_config()`: Save configuration to .env file
- `save_file_to_memory()`: Store uploaded files in memory
- `cleanup_expired_sessions()`: Remove expired sessions and temp files

### Model_API Package

Handles integration with various AI providers for resume formatting.

#### claude.py - Anthropic Claude Integration
```python
# Available Models
AVAILABLE_MODELS = [
    "claude-sonnet-4-5-20250929",  # Claude Sonnet 4.5
    "claude-sonnet-4-20250514",     # Claude Sonnet 4
    "claude-haiku-4-20250514"       # Claude Haiku 4.5
]

# Main Functions
def format_resume(api_key, model_name, system_prompt, latex_format, extracted_text):
    # Returns formatted LaTeX code

def test_api_key(api_key, model_name):
    # Tests API key validity with minimal "hi" message
    # Returns (success: bool, message: str)
```

#### gemini.py - Google Gemini Integration
```python
# Available Models
AVAILABLE_MODELS = [
    "gemini-2.5-pro",           # Most advanced reasoning model
    "gemini-2.5-flash",         # Balanced speed and performance
    "gemini-2.5-flash-lite"     # Fastest and most cost-efficient
]

# Main Functions
def format_resume(api_key, model_name, system_prompt, latex_format, extracted_text):
    # Returns formatted LaTeX code

def test_api_key(api_key, model_name):
    # Tests API key validity with minimal "hi" message
    # Returns (success: bool, message: str)
```

#### openai.py - OpenAI Integration
```python
# Available Models
AVAILABLE_MODELS = [
    "gpt-5-2025-08-07",              # GPT-5 - Most advanced
    "gpt-4.1-2025-04-14",            # GPT-4.1 - Smartest non-reasoning
    "o3-2025-04-16"                  # o3 - Advanced reasoning
]

# Main Functions
def format_resume(api_key, model_name, system_prompt, latex_format, extracted_text):
    # Returns formatted LaTeX code

def test_api_key(api_key, model_name):
    # Tests API key validity with minimal "hi" message
    # Returns (success: bool, message: str)
```

#### lmstudio.py - LM Studio Integration
- Supports local AI models via OpenAI-compatible API
- Automatically detects running LM Studio instances
- Dynamic model discovery from local server

```python
# Main Functions
def get_available_models(api_key, base_url):
    # Returns list of available models from running LM Studio

def format_resume(api_key, model_name, system_prompt, latex_format, extracted_text, base_url):
    # Returns formatted LaTeX code

def test_api_key(api_key, model_name, base_url):
    # Tests LM Studio connectivity with minimal "hi" message
    # Returns (success: bool, message: str)
    # Special handling for local connectivity testing
```

### Upload Package

Handles file uploads and text extraction from various document formats.

#### upload_handler.py - Main Upload Coordinator
```python
# Supported Formats
SUPPORTED_FORMATS = [".txt", ".docx", ".doc", ".pdf"]

# Main Function
def extract_text_from_file(file_path: str) -> str:
    # Routes to appropriate extraction method
    # Returns extracted plain text
```

#### pdf_handler.py - PDF Processing
- **Embedded Text Extraction**: Uses PyMuPDF for text-based PDFs
- **OCR Processing**: Uses Tesseract for scanned/image-based PDFs
- **Lazy Loading**: Tesseract only loaded when OCR is needed
- **Path Resolution**: Auto-detects bundled or system Tesseract

### Output Package

Manages LaTeX processing, PDF generation, and section filtering.

#### pdfgenerator.py - LaTeX to PDF Compilation
```python
# Main Functions
def generate_pdf(latex_code: str) -> bytes:
    # Compiles LaTeX to PDF bytes

def check_latex_installation() -> dict:
    # Returns LaTeX installation status
```

**LaTeX Detection Priority:**
1. Bundled TinyTeX in project root
2. System-installed MiKTeX/TeX Live
3. Common installation paths

#### latex_preprocessor.py - LaTeX Code Cleaning
- Removes markdown code blocks
- Fixes Unicode characters
- Escapes special LaTeX characters
- Validates document structure
- Fixes common AI-generated issues

#### section_selector.py - Section Management (Lego Blocks Architecture)

The section selector uses a "lego blocks" approach: parse LaTeX once, split into reusable blocks, then reassemble selected pieces.

**Architecture: Parse → Split → Store → Reassemble**

```python
# Main Functions
def parse_latex_sections(latex_code: str, template_id: str) -> Dict:
    # Parses LaTeX and splits into reusable blocks
    # Returns: latex_blocks, metadata, section_info

def get_section_metadata(parsed_data: Dict) -> Dict:
    # Generates frontend-compatible metadata from blocks
    # Returns: section types, labels, item counts

def generate_filtered_latex(parsed_data: Dict, selections: Dict) -> str:
    # Assembles selected blocks into final LaTeX
    # Returns: Complete LaTeX document with only selected sections
```

**Key Features:**
- **Safe**: No regex manipulation after parsing
- **Simple**: Assembly is just string concatenation
- **Format-agnostic**: Same assembly logic for all formats
- **Pluggable**: Easy to add new format parsers
- **Proper LaTeX Command Inclusion**: Item extraction includes full LaTeX commands (`\textbf{`, `\item`)
- **Document Order Preservation**: Uses `section_info` to maintain original document order
- **Brace Balance Checking**: Validates LaTeX syntax and generates debug files on mismatch
- **Environment Wrapper Detection**: Intelligently handles wrapper environments (multicols, tabular, etc.) vs structural environments (itemize, enumerate)

**Frontend Compatibility:**
- Sends nested data structure: `{format_id, latex_blocks: {...}, section_info: [...], original_latex}`
- Frontend expects and handles nested structure correctly
- Section ordering preserved using `section_info` array

**Environment Wrapper Handling:**
- **Selective Detection**: Only specific environments are treated as "wrappers":
  - `multicols` - Multi-column layouts
  - `tabular` - Tables  
  - `minipage` - Minipages
  - `columns` - Column environments
- **Structural Preservation**: Other environments remain part of section content:
  - `itemize`, `enumerate`, `description` - List environments
  - Any other unlisted environments
- **Smart Reconstruction**: Wrapper environments are only included when items are selected
- **Format Compatibility**: Works across all LaTeX formats (cool, Modern, ATS, Two-Column)

**See Also**: `Section_parsers/` for format-specific parsers

## API Endpoints

### Configuration Endpoints

#### `GET /api/health`
Health check endpoint.
```json
{
  "status": "healthy",
  "message": "Backend server is running",
  "timestamp": 1698326400.123
}
```

#### `POST /api/save-config`
Save AI provider configuration.
```json
// Request
{
  "provider": "OpenAI",
  "model": "gpt-4.1-2025-04-14",
  "apiKey": "sk-..."
}

// Response
{
  "success": true,
  "message": "Configuration saved successfully"
}
```

#### `GET /api/load-config`
Load current configuration.
```json
{
  "success": true,
  "config": {
    "provider": "OpenAI",
    "model": "gpt-4.1-2025-04-14",
    "apiKey": "sk-..."
  },
  "isComplete": true,
  "message": "Configuration is complete"
}
```

#### `POST /api/test-api-key`
Test API key validity by making a real API call.
```json
// Request
{
  "provider": "OpenAI",
  "model": "gpt-4.1-2025-04-14",
  "apiKey": "sk-...",
  "baseUrl": "http://localhost:1234/v1"  // Optional for LM Studio
}

// Response (Success)
{
  "success": true,
  "message": "API key is valid and working with gpt-4.1-2025-04-14"
}

// Response (Error)
{
  "success": false,
  "error": {
    "type": "api_test_error",
    "message": "Invalid API key: Incorrect API key provided",
    "field": "apiKey"
  }
}
```

**Features:**
- **Real API Testing**: Makes actual API call with "hi" message to verify functionality
- **Cost Optimization**: Uses minimal token settings (max_tokens: 10) to reduce costs
- **Provider Support**: Works with OpenAI, Claude, Gemini, and LM Studio
- **Error Handling**: Comprehensive error categorization (auth, rate limit, API errors)
- **LM Studio Support**: Special handling for local connectivity testing

### API Response Format Standards

The backend uses two different response formats depending on how the frontend consumes the endpoint:

#### Direct Response Format (for `apiRequest` wrapper)
Endpoints used with the frontend's `apiRequest` function return data directly without a `success` field:

```json
// Success Response
{
  "rawLatexCode": "\\documentclass{article}...",
  "processedLatexCode": "\\documentclass{article}...",
  "message": "Resume processed successfully"
}

// Error Response (via create_error_response)
{
  "success": false,
  "error": {
    "type": "api_error",
    "message": "Error description"
  }
}
```

**Endpoints using this format:**
- `POST /api/process` - Resume processing
- `POST /api/compile-latex` - PDF compilation
- `POST /api/preprocess-latex` - LaTeX preprocessing
- `POST /api/parse-sections` - Section parsing
- `POST /api/filter-latex` - LaTeX filtering
- `GET /api/providers` - Provider list
- `GET /api/templates` - Template list
- `GET /api/init` - Initialization data

#### Success Field Format (for direct fetch)
Endpoints used with direct `fetch()` calls include a `success` field:

```json
// Success Response
{
  "success": true,
  "config": {...},
  "message": "Operation successful"
}

// Error Response
{
  "success": false,
  "error": {
    "type": "validation_error",
    "message": "Error description",
    "field": "fieldName"
  }
}
```

**Endpoints using this format:**
- `POST /api/save-config` - Configuration saving
- `GET /api/load-config` - Configuration loading

### Provider and Template Endpoints

#### `GET /api/providers`
Get available AI providers and models.
```json
{
  "OpenAI": ["gpt-5-2025-08-07", "gpt-4.1-2025-04-14", "o3-2025-04-16"],
  "Anthropic": ["claude-sonnet-4-5-20250929", "claude-sonnet-4-20250514"],
  "Gemini": ["gemini-2.5-pro", "gemini-2.5-flash"],
  "LM Studio": ["local-model-1", "local-model-2"]
}
```

#### `GET /api/templates`
Get available LaTeX templates.
```json
[
  {
    "id": "ATS",
    "name": "ATS Professional",
    "description": "Clean, ATS-optimized resume template",
    "previewPdf": "ATS.pdf",
    "format": "latex",
    "category": "Professional"
  }
]
```

#### `GET /api/init`
Get both providers and templates in single request.
```json
{
  "providers": { /* provider data */ },
  "templates": [ /* template data */ ]
}
```

### File Processing Endpoints

#### `POST /api/upload`
Upload resume file.
```json
// Request: multipart/form-data with 'file' field

// Response
{
  "success": true,
  "sessionId": "uuid-string",
  "filename": "resume.pdf",
  "size": 1024000
}
```

#### `POST /api/process`
Process resume with AI model.
```json
// Request
{
  "sessionId": "uuid-string",
  "provider": "OpenAI",
  "model": "gpt-4.1-2025-04-14",
  "apiKey": "sk-...",
  "templateId": "ATS"
}

// Response
{
  "rawLatexCode": "\\documentclass{article}...",
  "processedLatexCode": "\\documentclass{article}...",
  "message": "Resume processed successfully"
}
```

### LaTeX Processing Endpoints

#### `POST /api/compile-latex`
Compile LaTeX to PDF.
```json
// Request
{
  "latexCode": "\\documentclass{article}..."
}

// Response
{
  "pdfData": "base64-encoded-pdf",
  "message": "LaTeX compiled successfully"
}
```

#### `POST /api/preprocess-latex`
Preprocess LaTeX code.
```json
// Request
{
  "latexCode": "raw latex code"
}

// Response
{
  "processedLatex": "cleaned latex code",
  "message": "LaTeX preprocessed successfully"
}
```

#### `POST /api/parse-sections`
Parse LaTeX into sections.
```json
// Request
{
  "latexCode": "\\documentclass{article}...",
  "templateId": "ATS"
}

// Response
{
  "parsedData": {
    "format_id": "ATS",
    "latex_blocks": {
      "preamble": "...",
      "sections": { /* section data */ },
      "closing": "..."
    },
    "section_info": [
      {
        "title": "Professional Summary",
        "subsections": ["summary item 1", "summary item 2"]
      },
      {
        "title": "Work Experience", 
        "subsections": ["job 1", "job 2", "job 3"]
      }
    ],
    "original_latex": "\\documentclass{article}..."
  },
  "metadata": { /* section metadata */ },
  "message": "LaTeX sections parsed successfully"
}
```

#### `POST /api/filter-latex`
Generate filtered LaTeX based on selections.
```json
// Request
{
  "parsedData": { /* from parse-sections */ },
  "selections": {
    "education": {"enabled": true, "items": [0, 2]},
    "experience": true,
    "skills": false
  }
}

// Response
{
  "filteredLatex": "filtered latex code",
  "message": "LaTeX filtered successfully"
}
```

### System Endpoints

#### `GET /api/latex-status`
Check LaTeX installation status.
```json
{
  "success": true,
  "latex": {
    "installed": true,
    "version": "pdfTeX 3.141592653-2.6-1.40.22",
    "path": "C:\\TinyTeX\\bin\\windows\\pdflatex.exe",
    "source": "bundled_tinytex",
    "error": null
  }
}
```

## Dependencies

### Python Packages

See [REQUIREMENTS.md](REQUIREMENTS.md) for complete dependency list.

**Core Dependencies:**
```bash
Flask>=2.3.3
Flask-Cors>=4.0.0
python-dotenv>=1.0.0
anthropic>=0.71.0
google-generativeai>=0.8.2
openai>=2.6.1
python-docx>=1.1.0
PyMuPDF>=1.26.5
pytesseract>=0.3.13
Pillow>=10.4.0
```

### System Dependencies

#### Required
- **Python 3.10+**
- **LaTeX Distribution**: TinyTeX (bundled) or MiKTeX/TeX Live

#### Optional
- **Tesseract OCR**: For scanned PDF processing
- **Pandoc**: For legacy .doc file support
- **LM Studio**: For local AI model support

### Installation

#### Windows: Automated Setup (Recommended)

Use our automated setup script for the fastest installation:

1. **Download** `setup-resumax.bat` from the [latest release](https://github.com/y14c/resumax/releases/latest)
2. **Run** the script - it handles everything automatically

#### Manual Installation (All Platforms)

```bash
# Install Python packages
pip install -r requirements.txt

# Install system dependencies (Windows)
winget install --id=UB-Mannheim.TesseractOCR -e
winget install --id=JohnMacFarlane.Pandoc -e

# Verify TinyTeX exists in project root
# Check: TinyTeX/bin/windows/pdflatex.exe
```

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# Resumax Configuration
RESUMAX_PROVIDER=OpenAI
RESUMAX_MODEL=gpt-4.1-2025-04-14
RESUMAX_API_KEY=sk-your-api-key-here
```

### API Key Setup

1. **OpenAI**: Get API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. **Anthropic**: Get API key from [Anthropic Console](https://console.anthropic.com/)
3. **Google**: Get API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
4. **LM Studio**: Use any string (e.g., "lm-studio") for local models

### LaTeX Templates

Templates are stored in `Latex_formats/` directory:
- `ATS.tex` - ATS-optimized professional template
- `Modern.tex` - Modern creative template  
- `Two-Coloumn.tex` - Two-column layout template

Each template includes:
- `.tex` file with LaTeX source
- `.pdf` file with preview

## Usage Instructions

### Packaged Application (End Users)

For end users with the packaged installer:

1. **Install**: Run `Resumax Setup.exe` installer
2. **Launch**: Start Resumax from desktop shortcut or start menu
3. **Configure**: Set up AI provider and API key in the application
4. **Use**: Upload resume, select template, and generate PDF

**No technical setup required** - the packaged app includes:
- Complete Python backend (`ResumaxBackend.exe`)
- All dependencies bundled
- Essential package (Tesseract + TinyTeX)
- Automatic path resolution

### Developer Launcher (Recommended)

The easiest way to start integrated development! Simply run the launcher:

1. **Double-click** `launcher.bat` in the project root
2. **Wait** for all services to start (backend, frontend, Electron)
3. **Start coding** - everything is ready!

The launcher automatically starts the backend server along with the frontend, perfect for integrated development.

### Windows: Automated Setup

For first-time setup, download our automated setup script:

1. **Download** `setup-resumax.bat` from the [latest release](https://github.com/y14c/resumax/releases/latest)
2. **Run** the script - it handles all backend dependencies automatically
3. **Start the server** after script completion

The script automatically:
- ✅ Installs Python 3.10+ and pip
- ✅ Installs all Python dependencies (`pip install -r requirements.txt`)
- ✅ Installs system dependencies (Tesseract-OCR, Pandoc)
- ✅ Verifies LaTeX installation (TinyTeX)
- ✅ Sets up complete backend environment

### Manual Setup (All Platforms)

If you prefer manual installation or are on Linux/Mac:

#### Starting the Server

```bash
cd backend
python main.py
```

Server starts on: `http://localhost:54782`

### Testing Endpoints

```bash
# Health check
curl http://localhost:54782/api/health

# Get providers
curl http://localhost:54782/api/providers

# Get templates
curl http://localhost:54782/api/templates
```

### Integration with Frontend

The backend is designed to work with the Resumax Electron frontend:

1. Frontend makes HTTP requests to backend endpoints
2. Backend processes requests and returns JSON responses
3. CORS is enabled for Electron communication
4. File uploads use multipart/form-data
5. PDF downloads return base64-encoded data

## Development Guide

### Adding New AI Providers

1. Create new file in `Model_API/` directory
2. Implement required functions:
   ```python
   def get_available_models() -> List[str]:
       # Return list of available models
   
   def format_resume(api_key, model_name, system_prompt, latex_format, extracted_text) -> str:
       # Return formatted LaTeX code
   ```
3. Add provider to `get_provider_module()` in `main.py`
4. Update provider list in frontend

### Adding New LaTeX Templates

1. **Create `.tex` file** in `Latex_formats/` directory
2. **Generate preview PDF** for template preview
3. **Add template metadata** to `TEMPLATE_METADATA` in `main.py`:
   ```python
   TEMPLATE_METADATA = {
       'YourTemplate': {
           'name': 'Your Template Name',
           'description': 'Template description',
           'category': 'Professional'
       }
   }
   ```
4. **Create format parser** in `Section_parsers/your-template-parser.py`:
   ```python
   def parse(latex_code: str) -> Dict:
       """Parse your template format and return section structure"""
       return {
           "sections": [
               {"title": "SECTION_NAME", "subsections": ["item1", "item2"]}
           ]
       }
   ```
5. **Update section_selector.py** to include your parser:
   ```python
   FORMAT_PARSER_MAP['YourTemplate'] = your_template_parser
   SECTION_PATTERNS['YourTemplate'] = r'\\yoursection\s*\{\s*{title}\s*\}'
   ```

**Parser Requirements:**
- Must have a `parse(latex_code: str)` function
- Returns dict with `sections` array
- Each section has `title` and `subsections` list
- See existing parsers in `Section_parsers/` for examples

### Error Handling Patterns

```python
# Standard error response format
def create_error_response(error_type: str, message: str, field: Optional[str] = None, status_code: int = 400):
    return jsonify({
        'success': False,
        'error': {
            'type': error_type,
            'message': message,
            'field': field  # Optional
        }
    }), status_code
```

### Logging Conventions

```python
# AI request logging
logger.info(f"[AI REQUEST] Processing resume - Provider: {provider}, Model: {model}")

# AI response logging  
logger.info(f"[AI RESPONSE] Successfully received LaTeX code - Length: {len(latex_code)} characters")

# Error logging
logger.error(f"[AI ERROR] Processing failed for {provider}/{model}: {error_message}")
```

## Production Packaging

### PyInstaller Standalone Executable

The backend is packaged as a standalone Windows executable using PyInstaller:

**Configuration File**: `packaging/resumax-backend.spec`
- Bundles all Python dependencies into single executable
- Includes hidden imports and data files
- Creates `ResumaxBackend.exe` in `packaging/dist/`

**Key Features:**
- **No Python Installation Required**: End users don't need Python
- **Bundled Dependencies**: All packages included in executable
- **Path Resolution**: Automatic detection of production vs development environment
- **File-based Logging**: Production logging writes to files instead of console
- **Process Management**: Electron spawns executable with proper cleanup

### Bundled Dependencies

**Essential Package Structure:**
```
packaging/
├── dist/
│   └── ResumaxBackend/              # PyInstaller folder (onedir mode)
│       ├── ResumaxBackend.exe
│       └── _internal/               # Dependencies
├── release-new/                     # Final installer
│   ├── Resumax Setup 1.0.0.exe     # Windows installer (only file needed for distribution)
│   ├── *.yml, *.yaml, *.blockmap   # Build artifacts (not needed for distribution)
│   └── win-unpacked/                # Unpacked for testing

frontend/
└── dist/                            # React build output (not in packaging/)
```

**Bundled Components:**
- `essentialpackage/TinyTeX/` - LaTeX distribution
- `essentialpackage/Tesseract-OCR/` - OCR support
- `ResumaxBackend/` - Complete Python backend folder (onedir mode)

### Path Resolution

The backend uses working directory-based path resolution for reliable resource location:

```python
import os

# Working directory approach (set by Electron)
working_dir = Path(os.getcwd())
resources_dir = working_dir / "resources"

# Production detection
if resources_dir.exists():
    # Production mode - resources in resources/ folder
    BASE_DIR = resources_dir
    BUNDLED_MODE = True
else:
    # Development mode - resources in project root
    BASE_DIR = working_dir
    BUNDLED_MODE = False
```

**Path Priority:**
1. **Production**: Resources in `resources/` folder (bundled)
2. **Development**: Project root paths
3. **Fallback**: System installation paths

### Production Logging

In production mode, logging writes to files instead of console:

```python
if BUNDLED_MODE:
    # File-based logging for production
    logging.basicConfig(
        filename='resumax.log',
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s'
    )
else:
    # Console logging for development
    logging.basicConfig(level=logging.INFO)
```

## Deployment

### Production Considerations

1. **Security**: Never commit API keys to version control
2. **Environment**: Use production-grade WSGI server (Gunicorn, uWSGI)
3. **Logging**: Configure proper log rotation and monitoring
4. **Resources**: Ensure adequate memory for file storage and LaTeX compilation

### Bundled Dependencies

For distribution, include:
- `essentialpackage/TinyTeX/` folder with LaTeX distribution
- `essentialpackage/Tesseract-OCR/` folder for OCR support
- Python environment with all packages

### Docker Deployment

```dockerfile
FROM python:3.10-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    pandoc \
    && rm -rf /var/lib/apt/lists/*

# Copy application
COPY backend/ /app/backend/
COPY essentialpackage/TinyTeX/ /app/essentialpackage/TinyTeX/
COPY essentialpackage/Tesseract-OCR/ /app/essentialpackage/Tesseract-OCR/

# Install Python packages
WORKDIR /app/backend
RUN pip install -r requirements.txt

# Start server
EXPOSE 54782
CMD ["python", "main.py"]
```

## Troubleshooting

### Common Issues

#### "Tesseract not found" error
**Solution**: 
- Install Tesseract: `winget install --id=UB-Mannheim.TesseractOCR -e`
- Or copy Tesseract to `{project_root}/essentialpackage/Tesseract-OCR/`

#### "pdflatex not found" error
**Solution**:
- Ensure `essentialpackage/TinyTeX/` folder exists in project root
- Or install MiKTeX: Download from https://miktex.org/download

#### "Pandoc not found" error
**Solution**:
- Install Pandoc: `winget install --id=JohnMacFarlane.Pandoc -e`
- Or avoid uploading legacy `.doc` files

#### API authentication errors
**Solution**:
- Verify API keys in `.env` file
- Check API key validity with provider dashboard
- Ensure no extra spaces in API keys

#### AI Response Not Detected in Production
**Issue**: Users get stuck on the AI loading page in production builds.

**Root Cause**: Response format mismatch between backend and frontend:
- Backend was returning `{success: true, data: {...}}`
- Frontend's `apiRequest` wrapper was adding another layer: `{success: true, data: {success: true, data: {...}}}`
- This caused `result.data.rawLatexCode` to return `true` instead of the actual LaTeX code

**Solution**: Updated backend endpoints to return data directly without `success` field:
- `/api/process` - Resume processing
- `/api/compile-latex` - PDF compilation  
- `/api/preprocess-latex` - LaTeX preprocessing
- `/api/parse-sections` - Section parsing
- `/api/filter-latex` - LaTeX filtering

**Fixed Response Format**:
```json
{
  "rawLatexCode": "\\documentclass{article}...",
  "processedLatexCode": "\\documentclass{article}...", 
  "message": "Resume processed successfully"
}
```

#### LaTeX compilation errors
**Solution**:
- Check LaTeX code for syntax errors
- Verify all required packages are available
- Use `latex_preprocessor.py` to clean AI-generated code
- **Brace Mismatch**: Check for unbalanced `{` and `}` characters
  - Debug files are automatically generated in `temp/` directory
  - Compare `filtered_debug.tex` vs `original_debug.tex`
  - Look for missing LaTeX commands in item extraction
- **Section Ordering Issues**: Ensure sections are processed in document order
  - Check `section_info` array maintains original order
  - Verify frontend displays sections in correct sequence
- **Missing LaTeX Commands**: Item extraction should include full commands
  - Look for truncated `\textbf{` or `\item` commands
  - Check item boundaries are properly detected

#### Environment Wrapper Issues
**Solution:**
- **Environment Wrapper Issues**: Check if new wrapper environments need to be added to whitelist
  - Wrapper environments: `multicols`, `tabular`, `minipage`, `columns`
  - Structural environments preserved: `itemize`, `enumerate`, `description`
  - Add new wrapper types to `wrapper_environments` list in `_extract_subsection_items()`
- **Orphaned Environment Tags**: Check for missing opening/closing environment commands
  - Debug files show exact LaTeX structure differences
  - Verify environment detection is working correctly
- **Extra Environment Tags**: Check if structural environments are being treated as wrappers
  - Ensure `itemize`, `enumerate` are not in wrapper whitelist
  - Verify section content structure is preserved

### Debug Mode

Enable debug logging by modifying `main.py`:
```python
logging.basicConfig(level=logging.DEBUG)
```

### Performance Optimization

1. **File Storage**: Monitor memory usage for large files
2. **LaTeX Compilation**: Use bundled TinyTeX for faster startup
3. **AI Requests**: Implement request caching for repeated operations
4. **Session Cleanup**: Adjust `SESSION_TIMEOUT` based on usage patterns

---

For more detailed dependency information, see [REQUIREMENTS.md](REQUIREMENTS.md).

For frontend integration, see the main project README.
