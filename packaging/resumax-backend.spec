# -*- mode: python ; coding: utf-8 -*-

import os
import sys
from pathlib import Path

# Get the backend directory - reference the backend folder from packaging location
backend_dir = Path(__file__).parent.parent / 'backend'

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
        'pypdf',
        'pypdf.pdf',
        
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
        # Exclude essentialpackage - handled separately
        'essentialpackage',
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
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='ResumaxBackend',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,  # Critical: No console window
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=None,
)
