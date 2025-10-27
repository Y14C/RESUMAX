"""
Upload package for Resumax Application

Handles file upload processing and text extraction from various document formats.
"""

from .upload_handler import extract_text_from_file, get_supported_formats
from .pdf_handler import extract_text_from_pdf

__all__ = [
    'extract_text_from_file',
    'get_supported_formats',
    'extract_text_from_pdf'
]

