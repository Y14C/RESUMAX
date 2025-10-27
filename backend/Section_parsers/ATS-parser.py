r"""
ATS LaTeX Parser for Resumax Application

This module parses LaTeX resume code and extracts hierarchical JSON structure 
for the ATS template format.

INPUT FORMAT:
    LaTeX code containing \textbf{\large SECTION} patterns for main sections
    and \textbf{SUBSECTION} patterns for subsections

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
    1. Stage 1: Parse known sections from hardcoded ATS template list
    2. Stage 2: Parse any additional custom sections following same format
    3. Deduplication prevents double detection of sections
    4. Orphaned subsections placed in "Unlabeled" section
"""

import re
from typing import Dict, List, Set, Tuple


# Hardcoded known sections from ATS template
KNOWN_SECTIONS = [
    "PROFESSIONAL SUMMARY",
    "EDUCATION",
    "WORK EXPERIENCE",
    "TECHNICAL SKILLS",
    "PROJECTS",
    "ADDITIONAL EXPERIENCE",
    "HONORS AND AWARDS",
    "ELECTIVE COURSES",
    "POSITIONS OF RESPONSIBILITY",
    "EXTRACURRICULAR ACTIVITIES"
]


def extract_textbf_content(text: str, pattern: str) -> List[Tuple[str, int]]:
    r"""
    Extract content from \textbf{...} or \textbf{\large ...} patterns.
    
    Internal function - not called from outside this module.
    
    Args:
        text: LaTeX code string
        pattern: Regex pattern to match
        
    Returns:
        List of tuples (extracted_text, position_in_document)
    """
    results = []
    
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


def parse_stage1(latex_code: str) -> Tuple[List[Dict], Set[str]]:
    """
    Stage 1: Parse known sections from ATS template.
    
    Internal function - not called from outside this module.
    
    Args:
        latex_code: LaTeX code string
        
    Returns:
        Tuple of (sections_list, detected_section_titles_set)
    """
    sections = []
    detected_titles = set()
    
    # Extract all main sections (with \large)
    section_pattern = r'\\textbf\s*\{\s*\\large\s+'
    all_sections = extract_textbf_content(latex_code, section_pattern)
    
    # Extract all subsections (without \large)
    subsection_pattern = r'\\textbf\s*\{'
    all_subsections = extract_textbf_content(latex_code, subsection_pattern)
    
    # Filter subsections to exclude those that are actually sections
    section_positions = {pos for _, pos in all_sections}
    subsections_only = [(content, pos) for content, pos in all_subsections 
                        if pos not in section_positions]
    
    # Filter to only known sections
    known_sections_found = [(title, pos) for title, pos in all_sections 
                            if title in KNOWN_SECTIONS]
    
    # Sort by position to maintain document order
    known_sections_found.sort(key=lambda x: x[1])
    
    # Build hierarchy: assign subsections to sections
    for i, (section_title, section_pos) in enumerate(known_sections_found):
        # Determine the range for this section's subsections
        next_section_pos = known_sections_found[i + 1][1] if i + 1 < len(known_sections_found) else len(latex_code)
        
        # Find subsections between this section and the next
        section_subsections = [
            content for content, pos in subsections_only 
            if section_pos < pos < next_section_pos
        ]
        
        sections.append({
            "title": section_title,
            "subsections": section_subsections
        })
        
        detected_titles.add(section_title)
    
    return sections, detected_titles


def parse_stage2(latex_code: str, detected_titles: Set[str]) -> List[Dict]:
    """
    Stage 2: Parse additional sections not caught in Stage 1.
    
    Internal function - not called from outside this module.
    
    Args:
        latex_code: LaTeX code string
        detected_titles: Set of section titles already detected in Stage 1
        
    Returns:
        List of additional sections
    """
    additional_sections = []
    
    # Extract all main sections (with \large)
    section_pattern = r'\\textbf\s*\{\s*\\large\s+'
    all_sections = extract_textbf_content(latex_code, section_pattern)
    
    # Extract all subsections (without \large)
    subsection_pattern = r'\\textbf\s*\{'
    all_subsections = extract_textbf_content(latex_code, subsection_pattern)
    
    # Filter subsections to exclude those that are actually sections
    section_positions = {pos for _, pos in all_sections}
    subsections_only = [(content, pos) for content, pos in all_subsections 
                        if pos not in section_positions]
    
    # Filter to only NEW sections (deduplication)
    new_sections = [(title, pos) for title, pos in all_sections 
                    if title not in detected_titles]
    
    # Sort by position to maintain document order
    new_sections.sort(key=lambda x: x[1])
    
    # Build hierarchy for new sections
    for i, (section_title, section_pos) in enumerate(new_sections):
        # Determine the range for this section's subsections
        next_section_pos = new_sections[i + 1][1] if i + 1 < len(new_sections) else len(latex_code)
        
        # Find subsections between this section and the next
        section_subsections = [
            content for content, pos in subsections_only 
            if section_pos < pos < next_section_pos
        ]
        
        additional_sections.append({
            "title": section_title,
            "subsections": section_subsections
        })
    
    return additional_sections


def handle_orphaned_subsections(latex_code: str, all_sections: List[Dict]) -> List[Dict]:
    """
    Handle orphaned subsections (subsections before any section).
    
    Internal function - not called from outside this module.
    
    Args:
        latex_code: LaTeX code string
        all_sections: List of all detected sections
        
    Returns:
        List with potential "Unlabeled" section prepended
    """
    # Extract all main sections to find the position of the first one
    section_pattern = r'\\textbf\s*\{\s*\\large\s+'
    main_sections = extract_textbf_content(latex_code, section_pattern)
    
    if not main_sections:
        return all_sections
    
    first_section_pos = min(pos for _, pos in main_sections)
    
    # Extract all subsections
    subsection_pattern = r'\\textbf\s*\{'
    all_subsections = extract_textbf_content(latex_code, subsection_pattern)
    
    # Filter subsections to exclude those that are actually sections
    section_positions = {pos for _, pos in main_sections}
    subsections_only = [(content, pos) for content, pos in all_subsections 
                        if pos not in section_positions]
    
    # Find orphaned subsections (before first section)
    orphaned = [content for content, pos in subsections_only if pos < first_section_pos]
    
    if orphaned:
        unlabeled_section = {
            "title": "Unlabeled",
            "subsections": orphaned
        }
        return [unlabeled_section] + all_sections
    
    return all_sections


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
    
    # Get all sections and subsections for both stages to use
    section_pattern = r'\\textbf\s*\{\s*\\large\s+'
    all_sections_raw = extract_textbf_content(latex_code, section_pattern)
    
    subsection_pattern = r'\\textbf\s*\{'
    all_subsections_raw = extract_textbf_content(latex_code, subsection_pattern)
    
    # Filter subsections to exclude those that are actually sections
    section_positions = {pos for _, pos in all_sections_raw}
    subsections_only = [(content, pos) for content, pos in all_subsections_raw 
                        if pos not in section_positions]
    
    # STAGE 1: Parse known sections
    stage1_sections = []
    detected_titles = set()
    
    # Filter to only known sections
    known_sections_found = [(title, pos) for title, pos in all_sections_raw 
                            if title in KNOWN_SECTIONS]
    known_sections_found.sort(key=lambda x: x[1])
    
    for i, (section_title, section_pos) in enumerate(known_sections_found):
        # Determine the range for this section's subsections
        # Use ALL sections (not just known) to determine boundaries
        all_sections_sorted = sorted(all_sections_raw, key=lambda x: x[1])
        section_idx_in_all = next(idx for idx, (t, p) in enumerate(all_sections_sorted) if p == section_pos)
        next_section_pos = (all_sections_sorted[section_idx_in_all + 1][1] 
                           if section_idx_in_all + 1 < len(all_sections_sorted) 
                           else len(latex_code))
        
        # Find subsections between this section and the next
        section_subsections = [
            content for content, pos in subsections_only 
            if section_pos < pos < next_section_pos
        ]
        
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
    new_sections.sort(key=lambda x: x[1])
    
    for i, (section_title, section_pos) in enumerate(new_sections):
        # Determine the range for this section's subsections
        all_sections_sorted = sorted(all_sections_raw, key=lambda x: x[1])
        section_idx_in_all = next(idx for idx, (t, p) in enumerate(all_sections_sorted) if p == section_pos)
        next_section_pos = (all_sections_sorted[section_idx_in_all + 1][1] 
                           if section_idx_in_all + 1 < len(all_sections_sorted) 
                           else len(latex_code))
        
        # Find subsections between this section and the next
        section_subsections = [
            content for content, pos in subsections_only 
            if section_pos < pos < next_section_pos
        ]
        
        stage2_sections.append({
            "title": section_title,
            "subsections": section_subsections
        })
    
    # Combine both stages and sort by document order
    all_sections = stage1_sections + stage2_sections
    section_order = {title: pos for title, pos in all_sections_raw}
    all_sections.sort(key=lambda s: section_order.get(s["title"], float('inf')))
    
    # Handle orphaned subsections
    all_sections = handle_orphaned_subsections(latex_code, all_sections)
    
    return {"sections": all_sections}


# Main entry point for external use
def parse(latex_code: str) -> Dict:
    """
    Main entry point to parse LaTeX code for ATS template.
    
    CALLED BY: External modules requiring ATS template parsing
    
    RECEIVES FROM caller:
        - latex_code: LaTeX code string containing \\textbf{\\large SECTION} 
                      and \\textbf{SUBSECTION} patterns
    
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
    - Stage 1: Parses known sections from the hardcoded ATS template list
    - Stage 2: Parses any additional custom sections that follow the same format
    - Deduplication ensures no section is detected twice
    - Orphaned subsections (before any section) are placed in "Unlabeled" section
    
    Example:
        >>> latex = r'\\textbf{\\large EDUCATION}\\n\\textbf{B.S. Computer Science}'
        >>> result = parse(latex)
        >>> print(result)
        {'sections': [{'title': 'EDUCATION', 'subsections': ['B.S. Computer Science']}]}
    """
    return parse_latex(latex_code)

