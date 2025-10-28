"""
Resumax Backend Server

Flask REST API server that orchestrates resume processing, manages AI provider 
configurations, handles file uploads, serves template metadata, and coordinates 
the entire backend workflow for the Electron app.

Communication: HTTP requests from React frontend to http://localhost:54782
"""

import os
import sys
import uuid
import logging
import logging.handlers
import threading
import time
import base64
import signal
import atexit
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
import io

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from dotenv import load_dotenv

# Add backend directory to Python path for imports
backend_dir = Path(__file__).parent
project_root = backend_dir.parent
sys.path.insert(0, str(backend_dir))

# Load environment variables from .env file
env_path = project_root / '.env'
load_dotenv(env_path)

# Import provider modules
from Model_API import claude, gemini, lmstudio, openai
from Upload import upload_handler
from Output import pdfgenerator
from Output import section_selector

# Environment Configuration Utilities
def load_env_config() -> Dict[str, str]:
    """Load configuration from .env file"""
    config = {
        'provider': os.getenv('RESUMAX_PROVIDER', ''),
        'model': os.getenv('RESUMAX_MODEL', ''),
        'apiKey': os.getenv('RESUMAX_API_KEY', '')
    }
    logger.info(f"[CONFIG] Loaded configuration from .env: provider={config['provider']}, model={config['model']}")
    return config

def save_env_config(provider: str, model: str, api_key: str) -> Tuple[bool, str]:
    """Save configuration to .env file with validation"""
    try:
        # Validate inputs
        if not provider or not model or not api_key:
            missing = []
            if not provider:
                missing.append('provider')
            if not model:
                missing.append('model')
            if not api_key:
                missing.append('api_key')
            return False, f"Missing required fields: {', '.join(missing)}"
        
        # Create .env content
        env_content = f"""# Resumax Configuration
RESUMAX_PROVIDER={provider}
RESUMAX_MODEL={model}
RESUMAX_API_KEY={api_key}
"""
        
        # Write to .env file
        with open(env_path, 'w', encoding='utf-8') as f:
            f.write(env_content)
        
        # Reload environment variables
        load_dotenv(env_path, override=True)
        
        logger.info(f"[CONFIG] Configuration saved to .env: provider={provider}, model={model}")
        return True, "Configuration saved successfully"
        
    except Exception as e:
        error_msg = f"Failed to save configuration: {str(e)}"
        logger.error(f"[CONFIG] {error_msg}")
        return False, error_msg

def validate_config_complete(config: Dict[str, str]) -> Tuple[bool, str]:
    """Validate that configuration is complete"""
    missing = []
    if not config.get('provider'):
        missing.append('provider')
    if not config.get('model'):
        missing.append('model')
    if not config.get('apiKey'):
        missing.append('api_key')
    
    if missing:
        return False, f"Configuration incomplete. Missing: {', '.join(missing)}"
    
    return True, "Configuration is complete"

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for Electron communication

# Configure logging with enhanced format for AI requests
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger(__name__)

# Set up colored logging for better visibility
class ColoredFormatter(logging.Formatter):
    """Custom formatter to add colors to log levels"""
    
    COLORS = {
        'DEBUG': '\033[36m',    # Cyan
        'INFO': '\033[32m',     # Green
        'WARNING': '\033[33m',  # Yellow
        'ERROR': '\033[31m',    # Red
        'CRITICAL': '\033[35m', # Magenta
    }
    RESET = '\033[0m'
    
    def format(self, record):
        # Add color to levelname
        if record.levelname in self.COLORS:
            record.levelname = f"{self.COLORS[record.levelname]}{record.levelname}{self.RESET}"
        
        # Add special formatting for AI logs
        if '[AI REQUEST]' in record.getMessage():
            record.msg = f"\n>> {record.msg}"
        elif '[AI RESPONSE]' in record.getMessage():
            record.msg = f"\n<< {record.msg}"
        elif '[AI ERROR]' in record.getMessage():
            record.msg = f"\n!! {record.msg}"
        
        return super().format(record)

# Configure logging based on environment
def setup_logging():
    """Setup logging configuration for development vs production"""
    global logger
    
    # Get root logger and clear existing handlers
    root_logger = logging.getLogger()
    root_logger.handlers.clear()
    
    if getattr(sys, 'frozen', False):
        # Production mode: Log to file
        # Create logs directory in installation root
        exe_dir = Path(sys.executable).parent
        install_root = exe_dir.parent.parent
        logs_dir = install_root / "logs"
        logs_dir.mkdir(exist_ok=True)
        
        log_file = logs_dir / "resumax-backend.log"
        
        # File handler with rotation
        file_handler = logging.handlers.RotatingFileHandler(
            log_file, 
            maxBytes=10*1024*1024,  # 10MB
            backupCount=5
        )
        file_handler.setFormatter(logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        ))
        
        root_logger.addHandler(file_handler)
        root_logger.setLevel(logging.INFO)
        
        logger.info("Production logging initialized - writing to file")
        
    else:
        # Development mode: Colored console output
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(ColoredFormatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            datefmt='%H:%M:%S'
        ))
        
        root_logger.addHandler(console_handler)
        root_logger.setLevel(logging.INFO)
        
        logger.info("Development logging initialized - colored console output")

# Initialize logging
setup_logging()

# Global in-memory file storage with timestamps
file_storage: Dict[str, Dict[str, Any]] = {}

# Session timeout in seconds (1 hour)
SESSION_TIMEOUT = 3600

# Global flag for graceful shutdown
shutdown_requested = False

def signal_handler(signum, frame):
    """Handle termination signals gracefully"""
    global shutdown_requested
    logger.info(f"Received signal {signum}, initiating graceful shutdown...")
    shutdown_requested = True
    
    # Give Flask time to finish current requests
    time.sleep(1)
    
    # Force exit if still running
    logger.info("Forcing exit...")
    sys.exit(0)

def cleanup_on_exit():
    """Cleanup function called on exit"""
    logger.info("Cleaning up on exit...")
    # Clean up any temporary files
    temp_dir = backend_dir / 'temp'
    if temp_dir.exists():
        for file in temp_dir.glob('*'):
            try:
                file.unlink()
            except:
                pass

# Register signal handlers
signal.signal(signal.SIGTERM, signal_handler)
signal.signal(signal.SIGINT, signal_handler)
if hasattr(signal, 'SIGBREAK'):  # Windows
    signal.signal(signal.SIGBREAK, signal_handler)

# Register cleanup function
atexit.register(cleanup_on_exit)

# Template metadata mapping
TEMPLATE_METADATA = {
    'ATS': {
        'name': 'ATS Professional',
        'description': 'Clean, ATS-optimized resume template designed for maximum compatibility with applicant tracking systems. Features clear sections and professional formatting.',
        'category': 'Professional'
    },
    'Modern': {
        'name': 'Modern Creative',
        'description': 'Contemporary design with visual elements and modern typography. Perfect for creative professionals and tech roles.',
        'category': 'Creative'
    },
    'Two-Coloumn': {
        'name': 'Two Column Layout',
        'description': 'Efficient two-column layout maximizing space utilization. Ideal for experienced professionals with extensive backgrounds.',
        'category': 'Professional'
    }
}

# Cached system prompt and templates
_system_prompt_cache: Optional[str] = None
_template_cache: Dict[str, str] = {}


def load_system_prompt() -> str:
    """Load and cache system prompt from Model_API/system-prompt.txt"""
    global _system_prompt_cache
    
    if _system_prompt_cache is None:
        prompt_path = backend_dir / 'Model_API' / 'system-prompt.txt'
        try:
            with open(prompt_path, 'r', encoding='utf-8') as f:
                _system_prompt_cache = f.read()
            logger.info(f"System prompt loaded successfully ({len(_system_prompt_cache)} characters)")
        except Exception as e:
            logger.error(f"Failed to load system prompt: {e}")
            raise Exception(f"Failed to load system prompt: {e}")
    
    return _system_prompt_cache


def load_latex_template(template_id: str) -> str:
    """Load and cache LaTeX template from Latex_formats directory"""
    global _template_cache
    
    # Check cache first
    if template_id in _template_cache:
        logger.info(f"LaTeX template loaded from cache: {template_id}")
        return _template_cache[template_id]
    
    template_path = backend_dir / 'Latex_formats' / f'{template_id}.tex'
    
    if not template_path.exists():
        raise FileNotFoundError(f"Template not found: {template_id}")
    
    try:
        with open(template_path, 'r', encoding='utf-8') as f:
            template_content = f.read()
        
        # Cache the template
        _template_cache[template_id] = template_content
        logger.info(f"LaTeX template loaded and cached: {template_id} ({len(template_content)} characters)")
        return template_content
    except Exception as e:
        logger.error(f"Failed to load template {template_id}: {e}")
        raise Exception(f"Failed to load template {template_id}: {e}")


def get_provider_module(provider_name: str):
    """Map provider name to module"""
    provider_map = {
        'OpenAI': openai,
        'Anthropic': claude,
        'Gemini': gemini,
        'LM Studio': lmstudio
    }
    
    if provider_name not in provider_map:
        raise ValueError(f"Unknown provider: {provider_name}")
    
    return provider_map[provider_name]


def save_file_to_memory(file, session_id: str) -> None:
    """Store file in memory with metadata and timestamp"""
    file_bytes = file.read()
    file_storage[session_id] = {
        'filename': file.filename,
        'content_type': file.content_type,
        'size': len(file_bytes),
        'data': file_bytes,
        'timestamp': time.time()
    }
    logger.info(f"File saved to memory: {file.filename} ({len(file_bytes)} bytes)")


def get_file_from_memory(session_id: str) -> Dict[str, Any]:
    """Retrieve file from memory"""
    if session_id not in file_storage:
        raise KeyError(f"Session not found: {session_id}")
    
    return file_storage[session_id]


def cleanup_expired_sessions():
    """Remove expired sessions and temporary files"""
    current_time = time.time()
    expired_sessions = []
    
    for session_id, file_data in file_storage.items():
        if current_time - file_data.get('timestamp', 0) > SESSION_TIMEOUT:
            expired_sessions.append(session_id)
    
    for session_id in expired_sessions:
        del file_storage[session_id]
        logger.info(f"Cleaned up expired session: {session_id}")
    
    # Clean up temporary files
    temp_dir = backend_dir / 'temp'
    if temp_dir.exists():
        for temp_file in temp_dir.glob('*'):
            if temp_file.is_file():
                try:
                    # Check if file is older than 1 hour
                    if current_time - temp_file.stat().st_mtime > SESSION_TIMEOUT:
                        temp_file.unlink()
                        logger.info(f"Cleaned up temporary file: {temp_file.name}")
                except Exception as e:
                    logger.warning(f"Failed to clean up temp file {temp_file.name}: {e}")


def cleanup_worker():
    """Background worker to clean up expired sessions and temp files"""
    while True:
        try:
            cleanup_expired_sessions()
            time.sleep(300)  # Run cleanup every 5 minutes
        except Exception as e:
            logger.error(f"Error in cleanup worker: {e}")
            time.sleep(60)  # Wait 1 minute before retrying


def create_error_response(error_type: str, message: str, field: Optional[str] = None, status_code: int = 400):
    """Create standardized error response"""
    error_data = {
        'success': False,
        'error': {
            'type': error_type,
            'message': message
        }
    }
    
    if field:
        error_data['error']['field'] = field
    
    return jsonify(error_data), status_code


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'Backend server is running',
        'timestamp': time.time()
    })


@app.route('/api/save-config', methods=['POST'])
def save_config():
    """Save configuration to .env file"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['provider', 'model', 'apiKey']
        for field in required_fields:
            if field not in data or not data[field]:
                return create_error_response('validation_error', f'Missing required field: {field}', field=field)
        
        provider = data['provider']
        model = data['model']
        api_key = data['apiKey']
        
        # Save to .env file
        success, message = save_env_config(provider, model, api_key)
        
        if success:
            return jsonify({
                'success': True,
                'message': message
            })
        else:
            return create_error_response('config_error', message, status_code=400)
            
    except Exception as e:
        logger.error(f"Error in save-config endpoint: {e}")
        return create_error_response('api_error', f"Configuration save request failed: {str(e)}", status_code=500)


@app.route('/api/load-config', methods=['GET'])
def load_config():
    """Load configuration from .env file"""
    try:
        config = load_env_config()
        is_complete, message = validate_config_complete(config)
        
        return jsonify({
            'success': True,
            'config': config,
            'isComplete': is_complete,
            'message': message
        })
        
    except Exception as e:
        logger.error(f"Error in load-config endpoint: {e}")
        return create_error_response('api_error', f"Configuration load request failed: {str(e)}", status_code=500)


@app.route('/api/latex-status', methods=['GET'])
def latex_status():
    """Check LaTeX installation status"""
    try:
        status = pdfgenerator.check_latex_installation()
        logger.info(f"LaTeX status check: {status['source']} - {status['version']}")
        return jsonify({
            'success': True,
            'latex': status
        })
    except Exception as e:
        logger.error(f"Error checking LaTeX status: {e}")
        return create_error_response('system_error', f"Failed to check LaTeX status: {str(e)}", status_code=500)


@app.route('/api/providers', methods=['GET'])
def get_providers():
    """Return list of all available AI providers with their models"""
    try:
        providers = {}
        
        # Get models from each provider
        providers['OpenAI'] = openai.get_available_models()
        providers['Anthropic'] = claude.get_available_models()
        providers['Gemini'] = gemini.get_available_models()
        
        # LM Studio models (may fail if not running)
        try:
            providers['LM Studio'] = lmstudio.get_available_models()
        except Exception as e:
            logger.warning(f"LM Studio not available: {e}")
            providers['LM Studio'] = []
        
        logger.info("Providers endpoint called successfully")
        return jsonify(providers)
        
    except Exception as e:
        logger.error(f"Error in providers endpoint: {e}")
        return create_error_response('api_error', f"Failed to fetch providers: {str(e)}", status_code=500)


@app.route('/api/init', methods=['GET'])
def get_init_data():
    """Return both providers and templates in a single request for faster app initialization"""
    try:
        # Get providers data
        providers = {}
        providers['OpenAI'] = openai.get_available_models()
        providers['Anthropic'] = claude.get_available_models()
        providers['Gemini'] = gemini.get_available_models()
        
        # LM Studio models (may fail if not running)
        try:
            providers['LM Studio'] = lmstudio.get_available_models()
        except Exception as e:
            logger.warning(f"LM Studio not available: {e}")
            providers['LM Studio'] = []
        
        # Get templates data
        templates_dir = backend_dir / 'Latex_formats'
        templates = []
        
        # Scan for .tex files
        for tex_file in templates_dir.glob('*.tex'):
            template_id = tex_file.stem
            
            # Get metadata or use defaults
            metadata = TEMPLATE_METADATA.get(template_id, {
                'name': f'{template_id} Template',
                'description': f'Professional resume template: {template_id}',
                'category': 'Professional'
            })
            
            template = {
                'id': template_id,
                'name': metadata['name'],
                'description': metadata['description'],
                'previewPdf': f'{template_id}.pdf',
                'format': 'latex',
                'category': metadata['category']
            }
            
            templates.append(template)
        
        init_data = {
            'providers': providers,
            'templates': templates
        }
        
        logger.info(f"Init endpoint called successfully: {len(providers)} providers, {len(templates)} templates")
        return jsonify(init_data)
        
    except Exception as e:
        logger.error(f"Error in init endpoint: {e}")
        return create_error_response('api_error', f"Failed to fetch initialization data: {str(e)}", status_code=500)


@app.route('/api/templates', methods=['GET'])
def get_templates():
    """Return list of all available LaTeX templates with metadata"""
    try:
        templates_dir = backend_dir / 'Latex_formats'
        templates = []
        
        # Scan for .tex files
        for tex_file in templates_dir.glob('*.tex'):
            template_id = tex_file.stem
            
            # Get metadata or use defaults
            metadata = TEMPLATE_METADATA.get(template_id, {
                'name': f'{template_id} Template',
                'description': f'Professional resume template: {template_id}',
                'category': 'Professional'
            })
            
            template = {
                'id': template_id,
                'name': metadata['name'],
                'description': metadata['description'],
                'previewPdf': f'{template_id}.pdf',
                'format': 'latex',
                'category': metadata['category']
            }
            
            templates.append(template)
        
        logger.info(f"Templates endpoint called successfully: {len(templates)} templates found")
        return jsonify(templates)
        
    except Exception as e:
        logger.error(f"Error in templates endpoint: {e}")
        return create_error_response('api_error', f"Failed to fetch templates: {str(e)}", status_code=500)


@app.route('/api/templates/<template_id>/preview', methods=['GET'])
def get_template_preview(template_id: str):
    """Serve PDF preview for selected template"""
    try:
        preview_path = backend_dir / 'Latex_formats' / f'{template_id}.pdf'
        
        if not preview_path.exists():
            logger.warning(f"Preview PDF not found: {template_id}.pdf")
            return create_error_response('file_error', f"Preview PDF not found for template: {template_id}", status_code=404)
        
        return send_file(
            str(preview_path),
            mimetype='application/pdf',
            as_attachment=False
        )
        
    except Exception as e:
        logger.error(f"Error serving template preview {template_id}: {e}")
        return create_error_response('file_error', f"Failed to serve preview: {str(e)}", status_code=500)


@app.route('/api/upload', methods=['POST'])
def upload_file():
    """Receive uploaded resume file and store in memory"""
    try:
        if 'file' not in request.files:
            return create_error_response('validation_error', 'No file provided', field='file')
        
        file = request.files['file']
        
        if file.filename == '':
            return create_error_response('validation_error', 'No file selected', field='file')
        
        # Validate file type
        allowed_extensions = {'.pdf', '.docx', '.doc', '.txt'}
        file_ext = Path(file.filename).suffix.lower()
        
        if file_ext not in allowed_extensions:
            return create_error_response(
                'validation_error', 
                'Unsupported file type. Please upload .pdf, .docx, .doc, or .txt files',
                field='file'
            )
        
        # Validate file size (20MB max)
        file.seek(0, 2)  # Seek to end
        file_size = file.tell()
        file.seek(0)  # Reset to beginning
        
        if file_size > 20 * 1024 * 1024:  # 20MB
            return create_error_response(
                'validation_error',
                'File size exceeds 20MB limit. Please upload a smaller file',
                field='file'
            )
        
        # Generate session ID and save file
        session_id = str(uuid.uuid4())
        save_file_to_memory(file, session_id)
        
        logger.info(f"File uploaded successfully: {file.filename} (session: {session_id})")
        return jsonify({
            'success': True,
            'sessionId': session_id,
            'filename': file.filename,
            'size': file_size
        })
        
    except Exception as e:
        logger.error(f"Error in upload endpoint: {e}")
        return create_error_response('file_error', f"Upload failed: {str(e)}", status_code=500)


@app.route('/api/compile-latex', methods=['POST'])
def compile_latex():
    """Compile LaTeX code to PDF and return as base64"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data or 'latexCode' not in data:
            return create_error_response('validation_error', 'Missing latexCode field', field='latexCode')
        
        latex_code = data['latexCode']
        
        if not latex_code or not latex_code.strip():
            return create_error_response('validation_error', 'LaTeX code cannot be empty', field='latexCode')
        
        # Log compilation request
        logger.info(f"[COMPILE] LaTeX compilation requested - Code length: {len(latex_code)} characters")
        
        # Track compilation time
        compile_start_time = time.time()
        
        try:
            # Generate PDF using pdfgenerator
            pdf_bytes = pdfgenerator.generate_pdf(latex_code)
            
            # Convert PDF bytes to base64
            pdf_base64 = base64.b64encode(pdf_bytes).decode('utf-8')
            
            compile_duration = time.time() - compile_start_time
            logger.info(f"[COMPILE] LaTeX compilation successful - PDF size: {len(pdf_bytes)} bytes - Duration: {compile_duration:.2f}s")
            
            return jsonify({
                'success': True,
                'pdfData': pdf_base64,
                'message': 'LaTeX compiled successfully'
            })
            
        except Exception as e:
            compile_duration = time.time() - compile_start_time
            error_message = str(e)
            
            # Check for specific error types
            if 'pdflatex is not installed' in error_message:
                logger.error(f"[COMPILE ERROR] pdflatex not installed - Duration: {compile_duration:.2f}s")
                return create_error_response('system_error', 
                    'LaTeX is not installed. Please install MiKTeX or TeX Live and ensure pdflatex is in your system PATH.', 
                    status_code=503)
            elif 'LaTeX compilation failed' in error_message:
                logger.error(f"[COMPILE ERROR] LaTeX compilation failed: {error_message} - Duration: {compile_duration:.2f}s")
                return create_error_response('compilation_error', error_message, status_code=422)
            else:
                logger.error(f"[COMPILE ERROR] Unexpected error: {error_message} - Duration: {compile_duration:.2f}s")
                return create_error_response('compilation_error', f'Compilation failed: {error_message}', status_code=500)
        
    except Exception as e:
        logger.error(f"Error in compile-latex endpoint: {e}")
        return create_error_response('api_error', f"Compilation request failed: {str(e)}", status_code=500)


@app.route('/api/preprocess-latex', methods=['POST'])
def preprocess_latex_endpoint():
    """Preprocess raw LaTeX code to fix common issues"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data or 'latexCode' not in data:
            return create_error_response('validation_error', 'Missing latexCode field', field='latexCode')
        
        latex_code = data['latexCode']
        
        if not latex_code or not latex_code.strip():
            return create_error_response('validation_error', 'LaTeX code cannot be empty', field='latexCode')
        
        # Log preprocessing request
        logger.info(f"[PREPROCESS] LaTeX preprocessing requested - Code length: {len(latex_code)} characters")
        
        # Track preprocessing time
        preprocess_start_time = time.time()
        
        try:
            # Preprocess LaTeX using latex_preprocessor
            from Output.latex_preprocessor import preprocess_latex
            processed_latex = preprocess_latex(latex_code)
            
            preprocess_duration = time.time() - preprocess_start_time
            logger.info(f"[PREPROCESS] LaTeX preprocessing successful - Processed length: {len(processed_latex)} characters - Duration: {preprocess_duration:.2f}s")
            
            return jsonify({
                'success': True,
                'processedLatex': processed_latex,
                'message': 'LaTeX preprocessed successfully'
            })
            
        except Exception as e:
            preprocess_duration = time.time() - preprocess_start_time
            error_message = str(e)
            logger.error(f"[PREPROCESS ERROR] LaTeX preprocessing failed: {error_message} - Duration: {preprocess_duration:.2f}s")
            return create_error_response('preprocessing_error', f'Preprocessing failed: {error_message}', status_code=422)
        
    except Exception as e:
        logger.error(f"Error in preprocess-latex endpoint: {e}")
        return create_error_response('api_error', f"Preprocessing request failed: {str(e)}", status_code=500)


@app.route('/api/parse-sections', methods=['POST'])
def parse_sections():
    """Parse LaTeX code into structured sections and metadata"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data or 'latexCode' not in data:
            return create_error_response('validation_error', 'Missing latexCode field', field='latexCode')
        
        latex_code = data['latexCode']
        template_id = data.get('templateId')  # Optional template identifier
        
        if not latex_code or not latex_code.strip():
            return create_error_response('validation_error', 'LaTeX code cannot be empty', field='latexCode')
        
        # Log parsing request
        logger.info(f"[PARSE] Section parsing requested - Code length: {len(latex_code)} characters, Template: {template_id or 'auto-detect'}")
        
        try:
            # Parse LaTeX into sections with optional template hint
            parsed_data = section_selector.parse_latex_sections(latex_code, template_id)
            
            # Generate metadata for frontend
            metadata = section_selector.get_section_metadata(parsed_data)
            
            logger.info(f"[PARSE] Section parsing successful - Found {len(metadata)} sections")
            
            return jsonify({
                'success': True,
                'parsedData': parsed_data,
                'metadata': metadata,
                'message': 'LaTeX sections parsed successfully'
            })
            
        except Exception as e:
            error_message = str(e)
            logger.error(f"[PARSE ERROR] Section parsing failed: {error_message}")
            return create_error_response('parsing_error', f'Failed to parse LaTeX sections: {error_message}', status_code=422)
        
    except Exception as e:
        logger.error(f"Error in parse-sections endpoint: {e}")
        return create_error_response('api_error', f"Section parsing request failed: {str(e)}", status_code=500)


@app.route('/api/filter-latex', methods=['POST'])
def filter_latex():
    """Generate filtered LaTeX based on user selections"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['parsedData', 'selections']
        for field in required_fields:
            if field not in data:
                return create_error_response('validation_error', f'Missing required field: {field}', field=field)
        
        parsed_data = data['parsedData']
        selections = data['selections']
        
        # Log filtering request
        logger.info(f"[FILTER] LaTeX filtering requested - {len(selections)} section selections")
        logger.info(f"[FILTER] Parsed data keys: {list(parsed_data.keys())}")
        logger.info(f"[FILTER] Latex_blocks keys: {list(parsed_data.get('latex_blocks', {}).keys())}")
        logger.info(f"[FILTER] Sections in latex_blocks: {list(parsed_data.get('latex_blocks', {}).get('sections', {}).keys())}")
        logger.info(f"[FILTER] Selections: {selections}")
        
        try:
            # Generate filtered LaTeX
            filtered_latex = section_selector.generate_filtered_latex(parsed_data, selections)
            
            logger.info(f"[FILTER] LaTeX filtering successful - Filtered code length: {len(filtered_latex)} characters")
            
            return jsonify({
                'success': True,
                'filteredLatex': filtered_latex,
                'message': 'LaTeX filtered successfully'
            })
            
        except Exception as e:
            error_message = str(e)
            logger.error(f"[FILTER ERROR] LaTeX filtering failed: {error_message}")
            return create_error_response('filtering_error', f'Failed to filter LaTeX: {error_message}', status_code=422)
        
    except Exception as e:
        logger.error(f"Error in filter-latex endpoint: {e}")
        return create_error_response('api_error', f"LaTeX filtering request failed: {str(e)}", status_code=500)


@app.route('/api/process', methods=['POST'])
def process_resume():
    """Process resume with selected template and AI model"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['sessionId', 'provider', 'model', 'apiKey', 'templateId']
        for field in required_fields:
            if field not in data or not data[field]:
                return create_error_response('validation_error', f'Missing required field: {field}', field=field)
        
        session_id = data['sessionId']
        provider = data['provider']
        model = data['model']
        api_key = data['apiKey']
        template_id = data['templateId']
        
        # Validate configuration completeness
        config = {'provider': provider, 'model': model, 'apiKey': api_key}
        is_complete, validation_message = validate_config_complete(config)
        if not is_complete:
            return create_error_response('config_error', validation_message, status_code=400)
        
        # Retrieve file from memory
        try:
            file_data = get_file_from_memory(session_id)
        except KeyError:
            return create_error_response('validation_error', 'Session expired or invalid', field='sessionId')
        
        # Track total processing time
        total_start_time = time.time()
        
        # Log AI request initiation with detailed info
        logger.info(f"[AI REQUEST] Processing resume - Provider: {provider}, Model: {model}, Template: {template_id}, Session: {session_id[:8]}..., File: {file_data['filename']} ({file_data['size']} bytes)")
        
        # Create temporary file for upload_handler
        temp_file_path = backend_dir / 'temp' / f'{session_id}_{file_data["filename"]}'
        temp_file_path.parent.mkdir(exist_ok=True)
        
        with open(temp_file_path, 'wb') as f:
            f.write(file_data['data'])
        
        try:
            # Extract text from file
            logger.info(f"Extracting text from: {file_data['filename']}")
            extracted_text = upload_handler.extract_text_from_file(str(temp_file_path))
            logger.info(f"[AI REQUEST] Text extraction completed - {len(extracted_text)} characters extracted from resume")
            
            # Load system prompt and template
            system_prompt = load_system_prompt()
            latex_template = load_latex_template(template_id)
            
            # Get provider module and format resume
            provider_module = get_provider_module(provider)
            logger.info(f"[AI REQUEST] Calling {provider} API with model {model}")
            
            # Track AI request timing
            ai_start_time = time.time()
            latex_code = provider_module.format_resume(
                api_key=api_key,
                model_name=model,
                system_prompt=system_prompt,
                latex_format=latex_template,
                extracted_text=extracted_text
            )
            ai_duration = time.time() - ai_start_time
            
            # Log successful AI response with timing
            logger.info(f"[AI RESPONSE] Successfully received LaTeX code from {provider}/{model} - Length: {len(latex_code)} characters - Duration: {ai_duration:.2f}s")
            
            # Save AI response to log file for debugging
            try:
                from datetime import datetime
                logs_dir = Path(__file__).parent / "logs"
                logs_dir.mkdir(exist_ok=True)
                
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                log_filename = f"ai_response_{timestamp}.tex"
                log_file_path = logs_dir / log_filename
                
                with open(log_file_path, 'w', encoding='utf-8') as f:
                    f.write(latex_code)
                
                logger.info(f"[AI LOG] Saved AI response to: {log_file_path}")
                
            except Exception as log_error:
                logger.warning(f"[AI LOG WARNING] Failed to save AI response log: {log_error}")
            
            # Store raw AI response
            raw_latex_code = latex_code
            
            # Preprocess the AI-generated LaTeX code
            processed_latex_code = None
            try:
                from Output.latex_preprocessor import preprocess_latex
                processed_latex_code = preprocess_latex(latex_code)
                logger.info(f"[PREPROCESS] LaTeX preprocessing completed successfully - Length: {len(processed_latex_code)} characters")
            except Exception as e:
                logger.warning(f"[PREPROCESS WARNING] LaTeX preprocessing failed: {e} - Will return raw response")
                # Continue without processed version if preprocessing fails
            
            # Additional validation for document class issues (on raw code)
            if r'\documentclass' not in raw_latex_code:
                logger.error("[VALIDATION ERROR] No document class found in LaTeX code")
                raise Exception("LaTeX code is missing document class declaration")
            
            # Check for malformed document class
            import re
            docclass_match = re.search(r'\\documentclass(?:\[[^\]]*\])?\{[^}]+\}', raw_latex_code)
            if not docclass_match:
                logger.error("[VALIDATION ERROR] Malformed document class in LaTeX code")
                raise Exception("LaTeX code has malformed document class declaration")
            
            # Clean up temporary file
            temp_file_path.unlink()
            
            # Log final success summary
            total_duration = time.time() - total_start_time
            logger.info(f"[AI RESPONSE] Resume processing completed successfully - Total time: {total_duration:.2f}s")
            logger.info("Resume processed successfully")
            return jsonify({
                'success': True,
                'rawLatexCode': raw_latex_code,
                'processedLatexCode': processed_latex_code,
                'message': 'Resume processed successfully'
            })
            
        except Exception as e:
            # Clean up temporary file on error
            if temp_file_path.exists():
                temp_file_path.unlink()
            raise e
        
    except ValueError as e:
        logger.error(f"Validation error in process endpoint: {e}")
        return create_error_response('validation_error', str(e), status_code=400)
    
    except Exception as e:
        logger.error(f"Error in process endpoint: {e}")
        error_message = str(e)
        
        # Check for specific error types
        if 'Authentication Error' in error_message:
            logger.error(f"[AI ERROR] Authentication failed for {provider}/{model}: {error_message}")
            return create_error_response('api_error', error_message, field='apiKey', status_code=401)
        elif 'Rate Limit Error' in error_message:
            logger.error(f"[AI ERROR] Rate limit exceeded for {provider}/{model}: {error_message}")
            return create_error_response('api_error', error_message, status_code=429)
        else:
            logger.error(f"[AI ERROR] Processing failed for {provider}/{model}: {error_message}")
            return create_error_response('processing_error', error_message, status_code=500)


@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return create_error_response('api_error', 'Endpoint not found', status_code=404)


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return create_error_response('api_error', 'Internal server error', status_code=500)


if __name__ == '__main__':
    # Create temp directory if it doesn't exist
    temp_dir = backend_dir / 'temp'
    temp_dir.mkdir(exist_ok=True)
    
    # Start cleanup worker thread
    cleanup_thread = threading.Thread(target=cleanup_worker, daemon=True)
    cleanup_thread.start()
    logger.info("Started cleanup worker thread")
    
    # Print startup banner
    print("\n" + "="*80)
    print("RESUMAX BACKEND SERVER STARTING")
    print("="*80)
    print(f"Backend directory: {backend_dir}")
    print(f"Server URL: http://localhost:54782")
    print(f"AI Request logging: ENABLED")
    print("="*80)
    print("Watch this terminal for AI request/response logs")
    print("="*80 + "\n")
    
    logger.info("Starting Resumax Backend Server...")
    logger.info(f"Backend directory: {backend_dir}")
    logger.info("Server will run on http://localhost:54782")
    
    try:
        app.run(
            host='localhost',
            port=54782,
            debug=False,  # Set to False for production
            threaded=True,
            use_reloader=False  # Disable reloader to prevent multiple processes
        )
    except KeyboardInterrupt:
        logger.info("Received keyboard interrupt, shutting down...")
    except Exception as e:
        logger.error(f"Server error: {e}")
    finally:
        logger.info("Server shutdown complete")
