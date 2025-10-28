# -*- mode: python ; coding: utf-8 -*-

import os
import sys
from pathlib import Path

# Get the backend directory - reference the backend folder from packaging location
# SPECPATH is automatically provided by PyInstaller (points to directory containing this spec file)
spec_dir = Path(SPECPATH)  # This is the packaging/ directory
project_root = spec_dir.parent  # This is the resumax/ directory
backend_dir = project_root / 'backend'

# Set output directory to packaging/dist (relative to project root)
dist_dir = spec_dir / 'dist'

block_cipher = None

a = Analysis(
    ['../backend/main.py'],
    pathex=[str(backend_dir)],
    binaries=[],
    datas=[
        # Include LaTeX templates
        ('../backend/Latex_formats', 'Latex_formats'),
        # Include system prompt
        ('../backend/Model_API/system-prompt.txt', 'Model_API'),
        # Include Section parsers
        ('../backend/Section_parsers', 'Section_parsers'),
        # Note: essentialpackage is NOT bundled in exe - it's external in resources/essentialpackage/
        # Handled by electron-builder's extraResources configuration
    ],
    hiddenimports=[
        # Flask and web framework
        'flask',
        'flask_cors',
        'werkzeug',
        'werkzeug.serving',
        'werkzeug.utils',
        
        # AI Provider modules
        'anthropic',
        'google.generativeai',
        'openai',
        
        # File processing
        'PIL',
        'PIL.Image',
        'pytesseract',
        'docx',
        'docx.shared',
        'docx.enum.text',
        'fitz',
        'pymupdf',
        
        # System and utilities
        'dotenv',
        'pathlib',
        'uuid',
        'threading',
        'time',
        'base64',
        'io',
        'logging',
        'logging.handlers',
        'sys',
        'os',
        're',
        'json',
        'subprocess',
        'shutil',
        
        # Backend modules
        'Model_API',
        'Model_API.claude',
        'Model_API.gemini', 
        'Model_API.lmstudio',
        'Model_API.openai',
        'Upload',
        'Upload.pdf_handler',
        'Upload.upload_handler',
        'Output',
        'Output.pdfgenerator',
        'Output.latex_preprocessor',
        'Output.section_selector',
        'Section_parsers',
        'Section_parsers.ATS_parser',
        'Section_parsers.cool_parser',
        'Section_parsers.modern_parser',
        'Section_parsers.two_coloumn_parser',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        # Exclude development tools
        'pytest',
        'pytest_*',
        'test',
        'tests',
        # Exclude unnecessary modules
        'tkinter',
        'matplotlib',
        'numpy',
        'scipy',
        'pandas',
        'jupyter',
        'notebook',
    ],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,  # KEY CHANGE: Don't bundle everything in exe (onedir mode)
    name='ResumaxBackend',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,  # No console window
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=None,
)

# COLLECT creates folder structure with all dependencies (onedir mode)
coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='ResumaxBackend',
    distpath=str(dist_dir),  # Explicitly set output directory
)
