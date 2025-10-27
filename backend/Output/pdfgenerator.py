"""
PDF Generator for Resumax Application

This module handles LaTeX to PDF compilation using pdflatex.

PARAMETERS RECEIVED FROM main.py:
    - latex_code: str - Complete LaTeX document code
    - output_filename: str (optional) - Desired PDF filename (default: "resume.pdf")

RETURNS TO main.py:
    - pdf_bytes: bytes - Compiled PDF file as binary data

PURPOSE:
    - Compiles LaTeX code to PDF format
    - Can compile base code from latex_handler OR filtered code from section_selector
    - Auto-detects and uses bundled TinyTeX (preferred) or system LaTeX installation

LATEX DETECTION:
    - Priority 1: Bundled TinyTeX (essentialpackage/TinyTeX/bin/windows/pdflatex.exe)
    - Priority 2: System-installed LaTeX distribution (MiKTeX or TeX Live)
    - No manual installation required if TinyTeX is bundled

ERROR HANDLING:
    - All compilation errors, missing LaTeX installation, syntax errors are raised as exceptions
    - No fallback logic provided - errors propagate to main.py for handling

REQUIREMENTS:
    - TinyTeX bundled in essentialpackage folder (included in distribution)
    - OR system-installed pdflatex in PATH (Windows: MiKTeX or TeX Live)
"""

import subprocess
import tempfile
import shutil
import os
from pathlib import Path
from typing import Optional, Tuple


def _get_project_root() -> Path:
    """Get the project root directory (2 levels up from this file)"""
    return Path(__file__).parent.parent.parent


def _get_tinytex_path() -> Optional[Path]:
    """
    Check if TinyTeX is bundled with the project.
    
    RETURNS:
        - Path to pdflatex.exe in TinyTeX if found, None otherwise
    """
    project_root = _get_project_root()
    tinytex_pdflatex = project_root / "essentialpackage" / "TinyTeX" / "bin" / "windows" / "pdflatex.exe"
    
    if tinytex_pdflatex.exists():
        return tinytex_pdflatex
    
    return None


def _get_pdflatex_command() -> Tuple[str, Optional[dict]]:
    """
    Get the pdflatex command and environment variables to use.
    Prioritizes bundled TinyTeX over system installation.
    
    RETURNS:
        - Tuple of (pdflatex_path, env_dict)
        - pdflatex_path: str - Full path to pdflatex or just "pdflatex"
        - env_dict: Optional[dict] - Environment variables to set, or None for system default
    """
    # First check for bundled TinyTeX
    tinytex_path = _get_tinytex_path()
    
    if tinytex_path:
        # Set up environment for TinyTeX
        project_root = _get_project_root()
        tinytex_root = project_root / "essentialpackage" / "TinyTeX"
        
        env = os.environ.copy()
        # Add TinyTeX bin directory to PATH
        tinytex_bin = str(tinytex_root / "bin" / "windows")
        env['PATH'] = f"{tinytex_bin};{env.get('PATH', '')}"
        
        # Set TEXMFROOT for TinyTeX
        env['TEXMFROOT'] = str(tinytex_root)
        
        return (str(tinytex_path), env)
    
    # Fall back to system pdflatex
    return ("pdflatex", None)


def generate_pdf(latex_code: str, output_filename: str = "resume.pdf") -> bytes:
    """
    Main function to compile LaTeX code to PDF.
    
    CALLED BY: main.py when user requests PDF download
    
    RECEIVES FROM main.py:
        - latex_code: Complete LaTeX document as string
        - output_filename: Desired PDF filename (optional, default: "resume.pdf")
    
    RETURNS TO main.py:
        - PDF file as bytes (binary data for download)
    
    RAISES:
        - RuntimeError: If pdflatex is not installed or not in PATH
        - Exception: For LaTeX compilation errors or file system errors
    """
    # Verify pdflatex is installed
    _verify_pdflatex_installed()
    
    # Validate LaTeX code
    if not latex_code or not latex_code.strip():
        raise ValueError("LaTeX code cannot be empty")
    
    # Create temporary directory for compilation
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        
        # Write LaTeX code to .tex file
        tex_file = temp_path / "resume.tex"
        tex_file.write_text(latex_code, encoding='utf-8')
        
        # Compile LaTeX to PDF
        try:
            _compile_latex(tex_file, temp_path)
        except Exception as e:
            # Try to extract meaningful error from log file
            log_file = temp_path / "resume.log"
            if log_file.exists():
                error_details = _parse_latex_errors(log_file)
                if error_details:
                    raise Exception(f"LaTeX compilation failed:\n{error_details}") from e
            raise Exception(f"LaTeX compilation failed: {str(e)}") from e
        
        # Read generated PDF
        pdf_file = temp_path / "resume.pdf"
        if not pdf_file.exists():
            raise Exception("PDF file was not generated. Check LaTeX code for errors.")
        
        pdf_bytes = pdf_file.read_bytes()
    
    # Temporary directory is automatically cleaned up here
    return pdf_bytes


def save_pdf_to_file(latex_code: str, output_path: str) -> Path:
    """
    Compiles LaTeX and saves PDF to specified file path.
    
    CALLED BY: main.py when saving PDF to specific location
    
    RECEIVES FROM main.py:
        - latex_code: Complete LaTeX document as string
        - output_path: Full path where PDF should be saved
    
    RETURNS TO main.py:
        - Path object pointing to saved PDF file
    
    RAISES:
        - Exception: For compilation or file system errors
    """
    # Generate PDF bytes
    pdf_bytes = generate_pdf(latex_code)
    
    # Convert output path to Path object
    output_file = Path(output_path)
    
    # Ensure parent directory exists
    output_file.parent.mkdir(parents=True, exist_ok=True)
    
    # Write PDF to file
    output_file.write_bytes(pdf_bytes)
    
    return output_file


def _verify_pdflatex_installed() -> None:
    """
    Verifies pdflatex is installed (bundled TinyTeX or system).
    Internal function - not called from outside this module.
    
    RAISES:
        - RuntimeError: If pdflatex is not found
    """
    pdflatex_cmd, env = _get_pdflatex_command()
    
    try:
        result = subprocess.run(
            [pdflatex_cmd, "--version"],
            capture_output=True,
            text=True,
            timeout=5,
            env=env,
            creationflags=subprocess.CREATE_NO_WINDOW if hasattr(subprocess, 'CREATE_NO_WINDOW') else 0
        )
        
        if result.returncode != 0:
            raise RuntimeError("pdflatex command failed")
        
        # Log which LaTeX distribution is being used
        if _get_tinytex_path():
            print(f"Using bundled TinyTeX: {pdflatex_cmd}")
        else:
            print("Using system-installed LaTeX distribution")
            
    except FileNotFoundError:
        raise RuntimeError(
            "pdflatex is not found.\n"
            "Bundled TinyTeX not detected and no system LaTeX installation found.\n"
            "Please ensure essentialpackage/TinyTeX folder exists, or install:\n"
            "  - MiKTeX: https://miktex.org/download\n"
            "  - TeX Live: https://www.tug.org/texlive/"
        )
    except Exception as e:
        raise RuntimeError(f"Failed to verify pdflatex installation: {str(e)}")


def _compile_latex(tex_file: Path, working_dir: Path) -> None:
    """
    Compiles LaTeX file to PDF using pdflatex (TinyTeX or system).
    Internal function - not called from outside this module.
    
    PARAMETERS:
        - tex_file: Path to .tex file
        - working_dir: Working directory for compilation (temp directory)
    
    Runs pdflatex twice to resolve references and ensure proper compilation.
    """
    # Get the appropriate pdflatex command and environment
    pdflatex_cmd, env = _get_pdflatex_command()
    
    # pdflatex command with options for non-interactive mode
    # Use relative paths to avoid issues with spaces in Windows usernames
    tex_filename = tex_file.name  # Just the filename, not full path
    command = [
        pdflatex_cmd,
        "-interaction=nonstopmode",  # Don't stop for errors
        "-halt-on-error",  # Stop after first error
        "-output-directory", str(working_dir),
        tex_filename  # Use relative filename only
    ]
    
    # First compilation pass
    try:
        result = subprocess.run(
            command,
            cwd=str(working_dir),
            capture_output=True,
            text=True,
            timeout=30,
            env=env,
            creationflags=subprocess.CREATE_NO_WINDOW if hasattr(subprocess, 'CREATE_NO_WINDOW') else 0
        )
        
        if result.returncode != 0:
            raise Exception(f"pdflatex first pass failed with return code {result.returncode}")
    
    except subprocess.TimeoutExpired:
        raise Exception("LaTeX compilation timed out (exceeded 30 seconds)")
    
    # Second compilation pass (for references, TOC, etc.)
    try:
        result = subprocess.run(
            command,
            cwd=str(working_dir),
            capture_output=True,
            text=True,
            timeout=30,
            env=env,
            creationflags=subprocess.CREATE_NO_WINDOW if hasattr(subprocess, 'CREATE_NO_WINDOW') else 0
        )
        
        if result.returncode != 0:
            raise Exception(f"pdflatex second pass failed with return code {result.returncode}")
    
    except subprocess.TimeoutExpired:
        raise Exception("LaTeX compilation timed out on second pass")


def _parse_latex_errors(log_file: Path) -> Optional[str]:
    """
    Parses LaTeX .log file to extract meaningful error messages.
    Internal function - not called from outside this module.
    
    PARAMETERS:
        - log_file: Path to .log file generated by pdflatex
    
    RETURNS:
        - Error message string, or None if no clear errors found
    """
    try:
        log_content = log_file.read_text(encoding='utf-8', errors='ignore')
        
        # Look for common error patterns
        error_lines = []
        
        # Pattern 1: Lines starting with "! "
        for line in log_content.split('\n'):
            if line.startswith('! '):
                error_lines.append(line[2:])  # Remove "! " prefix
        
        # Pattern 2: "Error:" messages
        if 'Error:' in log_content:
            for line in log_content.split('\n'):
                if 'Error:' in line:
                    error_lines.append(line.strip())
        
        # Pattern 3: Missing packages
        if 'File' in log_content and 'not found' in log_content:
            for line in log_content.split('\n'):
                if 'not found' in line.lower():
                    error_lines.append(line.strip())
        
        # Pattern 4: Document class and font size errors (specific to our issue)
        if 'normalsize' in log_content or 'font size command' in log_content:
            for line in log_content.split('\n'):
                if 'normalsize' in line or 'font size command' in line:
                    error_lines.append(line.strip())
        
        # Pattern 5: Document class errors
        if 'documentclass' in log_content.lower():
            for line in log_content.split('\n'):
                if 'documentclass' in line.lower() and ('error' in line.lower() or '!' in line):
                    error_lines.append(line.strip())
        
        if error_lines:
            # Return first few errors (up to 5)
            return '\n'.join(error_lines[:5])
        
        return None
    
    except Exception:
        return None


def check_latex_installation() -> dict:
    """
    Checks LaTeX installation status and returns diagnostic information.
    
    CALLED BY: main.py for system diagnostics or setup verification
    
    RETURNS TO main.py:
        - Dictionary with installation status:
            {
                "installed": bool,
                "version": str or None,
                "path": str or None,
                "source": str or None ("bundled_tinytex" or "system"),
                "error": str or None
            }
    """
    pdflatex_cmd, env = _get_pdflatex_command()
    is_tinytex = _get_tinytex_path() is not None
    
    try:
        result = subprocess.run(
            [pdflatex_cmd, "--version"],
            capture_output=True,
            text=True,
            timeout=5,
            env=env,
            creationflags=subprocess.CREATE_NO_WINDOW if hasattr(subprocess, 'CREATE_NO_WINDOW') else 0
        )
        
        if result.returncode == 0:
            # Extract version from output (first line usually contains version)
            version_line = result.stdout.split('\n')[0] if result.stdout else "Unknown version"
            
            return {
                "installed": True,
                "version": version_line,
                "path": pdflatex_cmd,
                "source": "bundled_tinytex" if is_tinytex else "system",
                "error": None
            }
        else:
            return {
                "installed": False,
                "version": None,
                "path": None,
                "source": None,
                "error": "pdflatex command returned error code"
            }
    
    except FileNotFoundError:
        return {
            "installed": False,
            "version": None,
            "path": None,
            "source": None,
            "error": "pdflatex not found (no TinyTeX or system installation)"
        }
    
    except Exception as e:
        return {
            "installed": False,
            "version": None,
            "path": None,
            "source": None,
            "error": str(e)
        }

