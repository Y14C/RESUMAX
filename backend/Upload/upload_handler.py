"""
Upload Handler for Resumax Application

This module handles file upload processing and text extraction from various document formats.

PARAMETERS RECEIVED FROM main.py:
    - file_path: str - Absolute or relative path to the uploaded document

RETURNS TO main.py:
    - extracted_text: str - Plain text content extracted from the document

SUPPORTED FORMATS:
    - .txt: Plain text files
    - .docx: Microsoft Word (Office Open XML)
    - .doc: Microsoft Word (Legacy format)
    - .pdf: PDF documents (delegated to pdf_handler.py)

ERROR HANDLING:
    - All file errors, unsupported formats, extraction failures are raised as exceptions
    - No fallback logic provided - errors propagate to main.py for handling
"""

from pathlib import Path
from typing import List
import docx
import pypandoc

# Import PDF handler for delegation
from .pdf_handler import extract_text_from_pdf


# Supported file extensions
SUPPORTED_FORMATS = [".txt", ".docx", ".doc", ".pdf"]


def get_supported_formats() -> List[str]:
    """
    Returns list of supported file formats for user selection.
    
    CALLED BY: main.py during file upload validation
    RETURNS TO: main.py for display in UI or validation
    """
    return SUPPORTED_FORMATS


def extract_text_from_file(file_path: str) -> str:
    """
    Main function to extract plain text from uploaded document.
    
    CALLED BY: main.py after user uploads file
    
    RECEIVES FROM main.py:
        - file_path: Path to uploaded document (absolute or relative)
    
    RETURNS TO main.py:
        - Extracted plain text content as string
    
    RAISES:
        - FileNotFoundError: If file doesn't exist
        - ValueError: If file format is not supported
        - Exception: For any extraction errors
    """
    # Convert to Path object for Windows compatibility
    path = Path(file_path)
    
    # Validate file exists
    if not path.exists():
        raise FileNotFoundError(f"File not found: {file_path}")
    
    if not path.is_file():
        raise ValueError(f"Path is not a file: {file_path}")
    
    # Validate and get file extension
    file_extension = _validate_file_format(path)
    
    # Route to appropriate extraction method based on format
    try:
        if file_extension == ".txt":
            return _extract_from_txt(path)
        
        elif file_extension == ".docx":
            return _extract_from_docx(path)
        
        elif file_extension == ".doc":
            return _extract_from_doc(path)
        
        elif file_extension == ".pdf":
            # Delegate to PDF handler
            return extract_text_from_pdf(str(path))
        
        else:
            # Should never reach here due to validation, but safety check
            raise ValueError(f"Unsupported format: {file_extension}")
    
    except Exception as e:
        # Re-raise with context if not already a custom exception
        if isinstance(e, (FileNotFoundError, ValueError)):
            raise
        raise Exception(f"Failed to extract text from {path.name}: {str(e)}") from e


def _validate_file_format(path: Path) -> str:
    """
    Validates file format is supported.
    Internal function - not called from outside this module.
    
    RETURNS:
        - file_extension: str - Lowercase file extension (e.g., '.pdf')
    
    RAISES:
        - ValueError: If file extension is not supported
    """
    file_extension = path.suffix.lower()
    
    if file_extension not in SUPPORTED_FORMATS:
        raise ValueError(
            f"Unsupported file format: {file_extension}. "
            f"Supported formats: {', '.join(SUPPORTED_FORMATS)}"
        )
    
    return file_extension


def _extract_from_txt(path: Path) -> str:
    """
    Extracts text from plain text files.
    Internal function - not called from outside this module.
    
    Handles multiple encodings for Windows compatibility:
    - Tries UTF-8 first (standard)
    - Falls back to cp1252 (Windows default)
    """
    # Try UTF-8 first
    try:
        with open(path, 'r', encoding='utf-8') as f:
            text = f.read()
    except UnicodeDecodeError:
        # Fallback to Windows encoding
        try:
            with open(path, 'r', encoding='cp1252') as f:
                text = f.read()
        except Exception as e:
            raise Exception(f"Failed to read text file with UTF-8 or cp1252 encoding: {str(e)}") from e
    
    # Validate extracted content
    if not text or len(text.strip()) == 0:
        raise Exception("Text file is empty or contains only whitespace")
    
    return text.strip()


def _extract_from_docx(path: Path) -> str:
    """
    Extracts text from .docx files (Office Open XML format).
    Internal function - not called from outside this module.
    
    Uses python-docx library to parse document structure and extract text.
    """
    try:
        doc = docx.Document(path)
        
        # Extract text from all paragraphs
        paragraphs = [para.text for para in doc.paragraphs]
        text = '\n'.join(paragraphs)
        
        # Validate extracted content
        if not text or len(text.strip()) == 0:
            raise Exception("DOCX file contains no text content")
        
        return text.strip()
    
    except Exception as e:
        if isinstance(e, Exception) and "contains no text content" in str(e):
            raise
        raise Exception(f"Failed to extract text from DOCX file: {str(e)}") from e


def _extract_from_doc(path: Path) -> str:
    """
    Extracts text from .doc files (Legacy Word format).
    Internal function - not called from outside this module.
    
    Uses pypandoc to convert .doc to plain text.
    Requires pandoc to be installed on the system.
    """
    try:
        # Convert .doc to plain text using pypandoc
        text = pypandoc.convert_file(
            str(path),
            'plain',
            format='doc'
        )
        
        # Validate extracted content
        if not text or len(text.strip()) == 0:
            raise Exception("DOC file contains no text content")
        
        return text.strip()
    
    except RuntimeError as e:
        # pypandoc raises RuntimeError if pandoc is not installed
        if "pandoc" in str(e).lower():
            raise Exception(
                "Pandoc is not installed. Please install pandoc to process .doc files. "
                "Download from: https://pandoc.org/installing.html"
            ) from e
        raise Exception(f"Failed to extract text from DOC file: {str(e)}") from e
    
    except Exception as e:
        raise Exception(f"Failed to extract text from DOC file: {str(e)}") from e

