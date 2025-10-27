r"""
Section Parsers Package

This package contains format-specific LaTeX parsers for resume section extraction.

Each parser module exposes a parse() function that extracts section structure
from LaTeX code for a specific template format.

Available parsers:
- ATS_parser: Parses ATS format (\textbf{\large SECTION})
- modern_parser: Parses Modern format (\section{Section})
- cool_parser: Parses Cool/Anti-CV format (\NewPart{Section})
- two_coloumn_parser: Parses Two-Column format (\section{Section})
"""

# Note: Parsers are loaded dynamically by section_selector.py
# because module names contain hyphens (not valid Python identifiers)

__all__ = []  # Parsers imported dynamically, not exposed at package level
__version__ = '1.0.0'

