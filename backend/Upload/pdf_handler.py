"""
PDF Handler for Resumax Application

This module handles PDF text extraction using both embedded text and OCR for images.

PARAMETERS RECEIVED FROM upload_handler.py:
    - file_path: str - Absolute or relative path to the PDF document

RETURNS TO upload_handler.py:
    - extracted_text: str - Plain text content extracted from PDF

EXTRACTION STRATEGY:
    - Page-by-page processing to avoid duplication
    - For each page:
        * Extract embedded text first
        * If substantial text exists (>50 chars), use embedded text only
        * If minimal/no text, extract images and run OCR
    - Combine text from all pages

TESSERACT OCR (LAZY LOADING):
    - Tesseract is only verified/loaded when OCR is actually needed
    - Most text-based resume PDFs work WITHOUT Tesseract installed
    - Path resolution priority:
        1. {project_root}/essentialpackage/Tesseract-OCR/tesseract.exe (for shipping with app)
        2. C:\Program Files\Tesseract-OCR\tesseract.exe (system install)
        3. System PATH

LANGUAGE SUPPORT:
    - English only (Tesseract OCR configured for eng)

ERROR HANDLING:
    - All PDF errors, OCR failures, corrupted files are raised as exceptions
    - No fallback logic provided - errors propagate to upload_handler.py for handling
"""

from pathlib import Path
from typing import List, Optional
import fitz  # PyMuPDF
import pytesseract
from PIL import Image
import io


# Configuration constants
MIN_TEXT_THRESHOLD = 50  # Minimum characters to consider page has substantial text
TESSERACT_LANG = 'eng'  # English language only
IMAGE_DPI = 300  # DPI for page-to-image conversion if needed

# Tesseract path cache
_tesseract_path_cache: Optional[str] = None
_tesseract_verified: bool = False


def extract_text_from_pdf(file_path: str) -> str:
    """
    Main function to extract text from PDF using embedded text and OCR.
    
    CALLED BY: upload_handler.py when processing PDF files
    
    RECEIVES FROM upload_handler.py:
        - file_path: Path to PDF document (absolute or relative)
    
    RETURNS TO upload_handler.py:
        - Extracted plain text content as string
    
    RAISES:
        - FileNotFoundError: If PDF file doesn't exist
        - RuntimeError: If Tesseract OCR is not installed
        - Exception: For PDF corruption or extraction errors
    """
    # Convert to Path object for Windows compatibility
    pdf_path = Path(file_path)
    
    # Validate file exists
    if not pdf_path.exists():
        raise FileNotFoundError(f"PDF file not found: {file_path}")
    
    # Open PDF document
    # NOTE: Tesseract verification is now lazy - only checked when OCR is actually needed
    try:
        pdf_document = fitz.open(str(pdf_path))
    except Exception as e:
        raise Exception(f"Failed to open PDF file (possibly corrupted): {str(e)}") from e
    
    # Process each page
    all_text = []
    
    try:
        for page_num in range(len(pdf_document)):
            page = pdf_document[page_num]
            
            # Extract embedded text from page
            embedded_text = _extract_embedded_text_from_page(page)
            
            # Decide whether to use embedded text or OCR
            if len(embedded_text.strip()) >= MIN_TEXT_THRESHOLD:
                # Page has substantial embedded text, use it
                all_text.append(embedded_text)
            else:
                # Page has minimal/no text, extract via OCR
                ocr_text = _extract_text_via_ocr_from_page(page)
                
                # Combine any minimal embedded text with OCR text
                combined = f"{embedded_text}\n{ocr_text}".strip()
                all_text.append(combined)
        
        pdf_document.close()
        
    except Exception as e:
        pdf_document.close()
        raise Exception(f"Error during PDF text extraction: {str(e)}") from e
    
    # Combine all pages
    final_text = '\n\n'.join(all_text).strip()
    
    # Validate extracted content
    if not final_text or len(final_text.strip()) == 0:
        raise Exception("PDF contains no extractable text or images with text")
    
    return final_text


def _locate_tesseract() -> Optional[str]:
    """
    Locates Tesseract executable with priority order:
    1. Project-local Tesseract-OCR/ directory (for shipping with app)
    2. Common Windows installation path
    3. System PATH (default pytesseract behavior)
    
    Internal function - not called from outside this module.
    
    RETURNS:
        - Path to tesseract.exe if found, None if should use system PATH
    """
    global _tesseract_path_cache
    
    # Return cached path if already found
    if _tesseract_path_cache is not None:
        return _tesseract_path_cache
    
    # Get project root directory - handle both dev and production environments
    if getattr(sys, 'frozen', False):
        # Running as PyInstaller bundle
        exe_dir = Path(sys.executable).parent
        project_root = exe_dir.parent.parent  # Go up to installation root
    else:
        # Running as script (development)
        current_file = Path(__file__)
        project_root = current_file.parent.parent.parent
    
    # Priority 1: Local Tesseract-OCR in project directory (for shipping)
    local_tesseract = project_root / "essentialpackage" / "Tesseract-OCR" / "tesseract.exe"
    if local_tesseract.exists():
        _tesseract_path_cache = str(local_tesseract)
        return _tesseract_path_cache
    
    # Priority 2: Common Windows installation path
    system_tesseract = Path(r"C:\Program Files\Tesseract-OCR\tesseract.exe")
    if system_tesseract.exists():
        _tesseract_path_cache = str(system_tesseract)
        return _tesseract_path_cache
    
    # Priority 3: Use system PATH (don't cache, let pytesseract handle it)
    return None


def _verify_and_configure_tesseract() -> None:
    """
    Verifies Tesseract OCR is available and configures pytesseract to use it.
    Called lazily only when OCR is actually needed for a PDF.
    
    Internal function - not called from outside this module.
    
    RAISES:
        - RuntimeError: If Tesseract is not found or not working
    """
    global _tesseract_verified
    
    # Skip if already verified in this session
    if _tesseract_verified:
        return
    
    # Locate and configure Tesseract
    tesseract_path = _locate_tesseract()
    if tesseract_path:
        pytesseract.pytesseract.tesseract_cmd = tesseract_path
    
    # Verify Tesseract is working
    try:
        pytesseract.get_tesseract_version()
        _tesseract_verified = True
    except pytesseract.TesseractNotFoundError:
        raise RuntimeError(
            "This PDF requires OCR processing, but Tesseract OCR is not installed.\n\n"
            "INSTALLATION OPTIONS:\n"
            "1. System installation (recommended for development):\n"
            "   - Run: winget install --id=UB-Mannheim.TesseractOCR -e\n"
            "   - Or download from: https://github.com/UB-Mannheim/tesseract/wiki\n\n"
            "2. Local installation (for shipping with app):\n"
            "   - Copy Tesseract to: {project_root}/essentialpackage/Tesseract-OCR/\n"
            "   - Ensure tesseract.exe and tessdata/ folder are present\n\n"
            "Note: Most text-based resume PDFs don't require OCR and will work without Tesseract."
        )


def _extract_embedded_text_from_page(page) -> str:
    """
    Extracts embedded text from a single PDF page.
    Internal function - not called from outside this module.
    
    PARAMETERS:
        - page: fitz.Page object
    
    RETURNS:
        - Embedded text as string (empty string if no text)
    """
    try:
        text = page.get_text("text")
        return text.strip()
    except Exception as e:
        # If text extraction fails, return empty string to trigger OCR
        return ""


def _extract_text_via_ocr_from_page(page) -> str:
    """
    Extracts text from a PDF page using OCR on rendered page image.
    Internal function - not called from outside this module.
    
    PARAMETERS:
        - page: fitz.Page object
    
    RETURNS:
        - OCR extracted text as string
    
    PROCESS:
        1. Verify Tesseract is available (lazy check)
        2. Render page to high-resolution image
        3. Convert to PIL Image
        4. Run Tesseract OCR
    
    RAISES:
        - RuntimeError: If Tesseract is not installed (propagates from verification)
    """
    # Lazy verification: only check for Tesseract when OCR is actually needed
    _verify_and_configure_tesseract()
    
    try:
        # Render page to pixmap (image) at high resolution
        # zoom=2 means 2x scaling for better OCR accuracy
        mat = fitz.Matrix(2.0, 2.0)
        pix = page.get_pixmap(matrix=mat)
        
        # Convert pixmap to PIL Image
        img_data = pix.tobytes("png")
        image = Image.open(io.BytesIO(img_data))
        
        # Run OCR on image
        ocr_text = pytesseract.image_to_string(
            image,
            lang=TESSERACT_LANG,
            config='--psm 6'  # Assume uniform block of text
        )
        
        return ocr_text.strip()
    
    except RuntimeError:
        # Re-raise Tesseract verification errors
        raise
    except Exception as e:
        # If OCR fails for this page, return empty string
        # Don't fail entire extraction for one page
        return ""


def _extract_images_from_page(page) -> List[Image.Image]:
    """
    Extracts all images from a single PDF page.
    Internal function - not called from outside this module.
    
    NOTE: This function is available for future use but not currently used
    in the main extraction flow. The current approach renders entire pages
    to images for OCR, which is more reliable for resumes.
    
    PARAMETERS:
        - page: fitz.Page object
    
    RETURNS:
        - List of PIL Image objects
    """
    images = []
    
    try:
        # Get list of images on page
        image_list = page.get_images(full=True)
        
        for img_index, img_info in enumerate(image_list):
            xref = img_info[0]  # Image reference number
            
            # Extract image
            base_image = page.parent.extract_image(xref)
            image_bytes = base_image["image"]
            
            # Convert to PIL Image
            image = Image.open(io.BytesIO(image_bytes))
            images.append(image)
    
    except Exception as e:
        # If image extraction fails, return what we have
        pass
    
    return images


def _ocr_image(image: Image.Image) -> str:
    """
    Performs OCR on a single PIL Image.
    Internal function - not called from outside this module.
    
    NOTE: This function is available for future use but not currently used
    in the main extraction flow.
    
    PARAMETERS:
        - image: PIL Image object
    
    RETURNS:
        - OCR extracted text as string
    """
    try:
        text = pytesseract.image_to_string(
            image,
            lang=TESSERACT_LANG,
            config='--psm 6'
        )
        return text.strip()
    except Exception as e:
        return ""

