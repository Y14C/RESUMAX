r"""
Modern LaTeX Parser for Resumax Application

This module parses LaTeX resume code and extracts hierarchical JSON structure 
for the "Modern" template format.

INPUT FORMAT:
    LaTeX code containing \section{SECTION} patterns for main sections
    and \textbf{...} patterns that serve as subsection headers

OUTPUT FORMAT:
    Dictionary with sections array containing title and subsections:
    {
        "sections": [
            {
                "title": "SECTION NAME",
                "subsections": ["subsection1", "subsection2", ...]
            }
        ]
    }

PARSING STRATEGY:
    Two-stage approach with deduplication:
    1. Stage 1: Parse known sections from hardcoded Modern template list
    2. Stage 2: Parse any additional custom sections following same format
    3. Deduplication prevents double detection of sections
    4. Orphaned subsections placed in "Unlabeled" section
"""

import re
from typing import Dict, List, Set, Tuple


# Hardcoded known sections from Modern template
KNOWN_SECTIONS = [
    "Professional Summary",
    "Education",
    "Work Experience",
    "Technical Skills",
    "Projects",
    "Certifications",
    "Languages",
    "Achievements"
]


def extract_section_titles(text: str) -> List[Tuple[str, int]]:
    r"""
    Extract sections from \section{SECTION_NAME} patterns.
    
    Internal function - not called from outside this module.
    
    Args:
        text: LaTeX code string
        
    Returns:
        List of tuples (section_name, position_in_document)
    """
    results = []
    pattern = r'\\section\s*\{'
    
    for match in re.finditer(pattern, text):
        start_pos = match.end()
        
        # Handle nested braces by counting
        brace_count = 1
        i = start_pos
        content = ""
        
        while i < len(text) and brace_count > 0:
            char = text[i]
            if char == '{':
                brace_count += 1
                content += char
            elif char == '}':
                brace_count -= 1
                if brace_count > 0:
                    content += char
            else:
                content += char
            i += 1
        
        if content:
            results.append((content.strip(), match.start()))
    
    return results


def extract_textbf_subsections(text: str, start_pos: int, end_pos: int) -> List[str]:
    r"""
    Extract subsections from \textbf{...} patterns within a range.
    
    Only extracts bold text that appears to be headers (not within itemize).
    
    Internal function - not called from outside this module.
    
    Args:
        text: LaTeX code string
        start_pos: Start position to search from
        end_pos: End position to search to
        
    Returns:
        List of subsection text content
    """
    subsections = []
    section_text = text[start_pos:end_pos]
    
    # Pattern to match \textbf{...}
    pattern = r'\\textbf\s*\{'
    
    for match in re.finditer(pattern, section_text):
        content_start = match.end()
        
        # Handle nested braces by counting
        brace_count = 1
        i = content_start
        content = ""
        
        while i < len(section_text) and brace_count > 0:
            char = section_text[i]
            if char == '{':
                brace_count += 1
                content += char
            elif char == '}':
                brace_count -= 1
                if brace_count > 0:
                    content += char
            else:
                content += char
            i += 1
        
        if content:
            # Clean up the content
            content = content.strip()
            
            # Filter out bold text that's likely inside itemize items
            # Headers typically appear before itemize environments or on their own lines
            # Check context before the \textbf
            context_start = max(0, match.start() - 50)
            context = section_text[context_start:match.start()]
            
            # Skip if this bold text appears right after \item
            if not re.search(r'\\item\s*$', context):
                # This is likely a header, not itemize content
                subsections.append(content)
    
    return subsections


def parse_latex(latex_code: str) -> Dict:
    """
    Parse LaTeX resume code and extract hierarchical structure.
    
    Internal function - not called from outside this module.
    
    Uses two-stage approach:
    1. Stage 1: Parse known sections from hardcoded list
    2. Stage 2: Parse additional sections (with deduplication)
    
    Args:
        latex_code: LaTeX code string
        
    Returns:
        Dictionary with sections array containing title and subsections
    """
    if not latex_code or not latex_code.strip():
        return {"sections": []}
    
    # Extract all sections
    all_sections_raw = extract_section_titles(latex_code)
    
    if not all_sections_raw:
        return {"sections": []}
    
    # Sort sections by position to maintain document order
    all_sections_raw.sort(key=lambda x: x[1])
    
    # STAGE 1: Parse known sections
    stage1_sections = []
    detected_titles = set()
    
    # Filter to only known sections
    known_sections_found = [(title, pos) for title, pos in all_sections_raw 
                            if title in KNOWN_SECTIONS]
    
    for i, (section_title, section_pos) in enumerate(known_sections_found):
        # Determine the range for this section's content
        # Use ALL sections (not just known) to determine boundaries
        all_sections_sorted = sorted(all_sections_raw, key=lambda x: x[1])
        section_idx_in_all = next(idx for idx, (t, p) in enumerate(all_sections_sorted) if p == section_pos)
        next_section_pos = (all_sections_sorted[section_idx_in_all + 1][1] 
                           if section_idx_in_all + 1 < len(all_sections_sorted) 
                           else len(latex_code))
        
        # Special handling for sections that typically have no subsections
        if section_title in ["Professional Summary", "Achievements"]:
            # These sections typically don't have \textbf headers as subsections
            section_subsections = []
        else:
            # Extract subsections from \textbf{...} patterns
            section_subsections = extract_textbf_subsections(latex_code, section_pos, next_section_pos)
        
        stage1_sections.append({
            "title": section_title,
            "subsections": section_subsections
        })
        
        detected_titles.add(section_title)
    
    # STAGE 2: Parse additional sections (Helper - catches new sections)
    stage2_sections = []
    
    # Filter to only NEW sections (not in known list)
    new_sections = [(title, pos) for title, pos in all_sections_raw 
                    if title not in detected_titles]
    
    for i, (section_title, section_pos) in enumerate(new_sections):
        # Determine the range for this section's content
        all_sections_sorted = sorted(all_sections_raw, key=lambda x: x[1])
        section_idx_in_all = next(idx for idx, (t, p) in enumerate(all_sections_sorted) if p == section_pos)
        next_section_pos = (all_sections_sorted[section_idx_in_all + 1][1] 
                           if section_idx_in_all + 1 < len(all_sections_sorted) 
                           else len(latex_code))
        
        # Extract subsections from \textbf{...} patterns
        section_subsections = extract_textbf_subsections(latex_code, section_pos, next_section_pos)
        
        stage2_sections.append({
            "title": section_title,
            "subsections": section_subsections
        })
    
    # Combine both stages and sort by document order
    all_sections = stage1_sections + stage2_sections
    section_order = {title: pos for title, pos in all_sections_raw}
    all_sections.sort(key=lambda s: section_order.get(s["title"], float('inf')))
    
    # Handle orphaned subsections (bold text before first section)
    if all_sections_raw:
        first_section_pos = min(pos for _, pos in all_sections_raw)
        
        # Check for orphaned bold text
        orphaned_subsections = extract_textbf_subsections(latex_code, 0, first_section_pos)
        
        if orphaned_subsections:
            unlabeled_section = {
                "title": "Unlabeled",
                "subsections": orphaned_subsections
            }
            all_sections = [unlabeled_section] + all_sections
    
    return {"sections": all_sections}


# Main entry point for external use
def parse(latex_code: str) -> Dict:
    """
    Main entry point to parse LaTeX code for Modern template.
    
    CALLED BY: External modules requiring Modern template parsing
    
    RECEIVES FROM caller:
        - latex_code: LaTeX code string containing \\section{SECTION} 
                      and \\textbf{...} patterns for headers
    
    RETURNS TO caller:
        Dictionary with hierarchical structure:
        {
            "sections": [
                {
                    "title": "SECTION NAME",
                    "subsections": ["subsection1", "subsection2", ...]
                },
                ...
            ]
        }
    
    This function uses a two-stage parsing approach:
    - Stage 1: Parses known sections from the hardcoded Modern template list
    - Stage 2: Parses any additional custom sections that follow the same format
    - Deduplication ensures no section is detected twice
    - Orphaned subsections (before any section) are placed in "Unlabeled" section
    
    Example:
        >>> latex = r'\\section{Education}\\n\\textbf{B.S. Computer Science}'
        >>> result = parse(latex)
        >>> print(result)
        {'sections': [{'title': 'Education', 'subsections': ['B.S. Computer Science']}]}
    """
    return parse_latex(latex_code)

