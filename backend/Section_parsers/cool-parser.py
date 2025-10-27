r"""
Cool LaTeX Parser for Resumax Application

This module parses LaTeX resume code and extracts hierarchical JSON structure 
for the "cool" Anti-CV template format.

INPUT FORMAT:
    LaTeX code containing \NewPart{SECTION} patterns for main sections
    and \item[...] patterns or \SkillsEntry{}{} commands for subsections

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
    1. Stage 1: Parse known sections from hardcoded cool template list
    2. Stage 2: Parse any additional custom sections following same format
    3. Deduplication prevents double detection of sections
    4. Orphaned subsections placed in "Unlabeled" section
"""

import re
from typing import Dict, List, Set, Tuple


# Hardcoded known sections from cool template
KNOWN_SECTIONS = [
    "Key",
    "Education",
    "Work Experiance",  # Note: typo in original template
    "Skills",
    "Achievements and Interests"
]


def extract_newpart_sections(text: str) -> List[Tuple[str, int]]:
    r"""
    Extract sections from \NewPart{SECTION_NAME} patterns.
    
    Internal function - not called from outside this module.
    
    Args:
        text: LaTeX code string
        
    Returns:
        List of tuples (section_name, position_in_document)
    """
    results = []
    pattern = r'\\NewPart\s*\{'
    
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


def extract_item_subsections(text: str, start_pos: int, end_pos: int) -> List[str]:
    r"""
    Extract subsections from \item[...] patterns within a range.
    
    Internal function - not called from outside this module.
    
    Args:
        text: LaTeX code string
        start_pos: Start position to search from
        end_pos: End position to search to
        
    Returns:
        List of subsection text content
    """
    subsections = []
    
    # Pattern to match \item[...] followed by content
    # Matches: \item[anything] followed by text until next \item, \end{itemize}, or \NewPart
    pattern = r'\\item\s*\[[^\]]*\]\s*'
    
    section_text = text[start_pos:end_pos]
    
    for match in re.finditer(pattern, section_text):
        content_start = match.end()
        
        # Find the end of this item's content
        # Look for next \item, \end{itemize}, or end of section
        next_item = re.search(r'\\item\s*\[', section_text[content_start:])
        end_itemize = re.search(r'\\end\s*\{itemize\}', section_text[content_start:])
        new_part = re.search(r'\\NewPart\s*\{', section_text[content_start:])
        
        # Find the nearest boundary
        boundaries = []
        if next_item:
            boundaries.append(next_item.start())
        if end_itemize:
            boundaries.append(end_itemize.start())
        if new_part:
            boundaries.append(new_part.start())
        
        if boundaries:
            content_end = min(boundaries)
        else:
            content_end = len(section_text) - content_start
        
        content = section_text[content_start:content_start + content_end].strip()
        
        # Clean up whitespace and newlines
        content = re.sub(r'\s+', ' ', content)
        
        if content:
            subsections.append(content)
    
    return subsections


def extract_skills_entries(text: str, start_pos: int, end_pos: int) -> List[str]:
    r"""
    Extract skills from \SkillsEntry{Category}{Description} patterns.
    
    Internal function - not called from outside this module.
    
    Args:
        text: LaTeX code string
        start_pos: Start position to search from
        end_pos: End position to search to
        
    Returns:
        List of formatted skills as "Category: Description"
    """
    skills = []
    section_text = text[start_pos:end_pos]
    
    # Pattern to match \SkillsEntry{Category}{Description}
    pattern = r'\\SkillsEntry\s*\{([^}]+)\}\s*\{([^}]+)\}'
    
    for match in re.finditer(pattern, section_text):
        category = match.group(1).strip()
        description = match.group(2).strip()
        
        # Format as "Category: Description"
        skills.append(f"{category}: {description}")
    
    return skills


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
    all_sections_raw = extract_newpart_sections(latex_code)
    
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
        
        # Special handling for Skills section
        if section_title == "Skills":
            section_subsections = extract_skills_entries(latex_code, section_pos, next_section_pos)
        else:
            # Extract subsections from \item[...] patterns
            section_subsections = extract_item_subsections(latex_code, section_pos, next_section_pos)
        
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
        
        # Extract subsections from \item[...] patterns
        section_subsections = extract_item_subsections(latex_code, section_pos, next_section_pos)
        
        stage2_sections.append({
            "title": section_title,
            "subsections": section_subsections
        })
    
    # Combine both stages and sort by document order
    all_sections = stage1_sections + stage2_sections
    section_order = {title: pos for title, pos in all_sections_raw}
    all_sections.sort(key=lambda s: section_order.get(s["title"], float('inf')))
    
    # Handle orphaned subsections (items before first section)
    if all_sections_raw:
        first_section_pos = min(pos for _, pos in all_sections_raw)
        
        # Check for orphaned items
        orphaned_items = extract_item_subsections(latex_code, 0, first_section_pos)
        
        if orphaned_items:
            unlabeled_section = {
                "title": "Unlabeled",
                "subsections": orphaned_items
            }
            all_sections = [unlabeled_section] + all_sections
    
    return {"sections": all_sections}


# Main entry point for external use
def parse(latex_code: str) -> Dict:
    """
    Main entry point to parse LaTeX code for cool Anti-CV template.
    
    CALLED BY: External modules requiring cool template parsing
    
    RECEIVES FROM caller:
        - latex_code: LaTeX code string containing \\NewPart{SECTION} 
                      and \\item[...] or \\SkillsEntry{}{} patterns
    
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
    - Stage 1: Parses known sections from the hardcoded cool template list
    - Stage 2: Parses any additional custom sections that follow the same format
    - Deduplication ensures no section is detected twice
    - Orphaned subsections (before any section) are placed in "Unlabeled" section
    
    Example:
        >>> latex = r'\\NewPart{Key}\\n\\begin{itemize}\\n\\item[x] Test\\n\\end{itemize}'
        >>> result = parse(latex)
        >>> print(result)
        {'sections': [{'title': 'Key', 'subsections': ['Test']}]}
    """
    return parse_latex(latex_code)

