"""
Section Selector Module - Lego Blocks Approach

This module acts as a router/orchestrator that:
1. Routes LaTeX parsing to format-specific parsers
2. Splits parsed LaTeX into reusable "blocks" (lego pieces)
3. Generates metadata for frontend section selection UI
4. Assembles selected blocks back into complete LaTeX

Architecture: Parse → Split → Store → Reassemble
"""

import re
import logging
from typing import Dict, List, Any, Optional, Tuple
from pathlib import Path

# Import format-specific parsers
import sys
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir / 'Section_parsers'))

try:
    from Section_parsers import ATS_parser, modern_parser, cool_parser, two_coloumn_parser
except ImportError:
    # Fallback for different import paths
    import importlib.util
    
    def load_parser(parser_name: str):
        """Dynamically load parser module"""
        parser_path = backend_dir / 'Section_parsers' / f'{parser_name}.py'
        spec = importlib.util.spec_from_file_location(parser_name, parser_path)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        return module
    
    ATS_parser = load_parser('ATS-parser')
    modern_parser = load_parser('modern-parser')
    cool_parser = load_parser('cool-parser')
    two_coloumn_parser = load_parser('two-coloumn-parser')

# Configure logging
logger = logging.getLogger(__name__)

# Format to parser mapping
FORMAT_PARSER_MAP = {
    'ATS': ATS_parser,
    'Modern': modern_parser,
    'cool': cool_parser,
    'Two-Coloumn': two_coloumn_parser
}

# Format-specific section marker patterns
# {title} placeholder will be replaced with actual section title
SECTION_PATTERNS = {
    'ATS': r'\\textbf\s*\{\s*\\large\s+{title}\s*\}',
    'Modern': r'\\section\s*\{\s*{title}\s*\}',
    'Two-Coloumn': r'\\section\s*\{\s*{title}\s*\}',
    'cool': r'\\NewPart\s*\{\s*{title}\s*\}'
}


def parse_latex_sections(latex_code: str, template_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Main entry point: Parse LaTeX into structured blocks for section selection.
    
    Args:
        latex_code: Complete LaTeX document as string
        template_id: Format identifier ('ATS', 'Modern', 'cool', 'Two-Coloumn')
    
    Returns:
        Dictionary containing:
        - format_id: Template format used
        - latex_blocks: Structured blocks (preamble, sections, closing)
        - section_info: Original parser output
        - original_latex: Full original LaTeX for reference
    
    Raises:
        ValueError: If template_id is unknown or invalid
        Exception: If parsing fails
    """
    try:
        # Validate inputs
        if not latex_code or not latex_code.strip():
            raise ValueError("LaTeX code cannot be empty")
        
        # Determine format
        format_id = template_id or _detect_format(latex_code)
        
        if format_id not in FORMAT_PARSER_MAP:
            raise ValueError(f"Unknown format_id: {format_id}. Available formats: {list(FORMAT_PARSER_MAP.keys())}")
        
        logger.info(f"[PARSE] Parsing LaTeX with format: {format_id}")
        
        # Get appropriate parser
        parser = FORMAT_PARSER_MAP[format_id]
        
        # Parse LaTeX to get structure
        parser_output = parser.parse(latex_code)
        
        if not parser_output or 'sections' not in parser_output:
            raise Exception(f"Parser returned invalid output for format {format_id}")
        
        logger.info(f"[PARSE] Parser found {len(parser_output['sections'])} sections")
        
        # Split LaTeX into reusable blocks
        latex_blocks = _split_latex_into_blocks(latex_code, parser_output, format_id)
        
        # Construct complete parsed data
        parsed_data = {
            'format_id': format_id,
            'latex_blocks': latex_blocks,
            'section_info': parser_output['sections'],
            'original_latex': latex_code
        }
        
        logger.info(f"[PARSE] Successfully split LaTeX into {len(latex_blocks.get('sections', {}))} section blocks")
        
        return parsed_data
        
    except ValueError as e:
        logger.error(f"[PARSE ERROR] Validation error: {e}")
        raise
    except Exception as e:
        logger.error(f"[PARSE ERROR] Failed to parse LaTeX: {e}")
        raise Exception(f"Failed to parse LaTeX sections: {str(e)}")


def _detect_format(latex_code: str) -> str:
    """
    Auto-detect LaTeX format based on section markers.
    
    Args:
        latex_code: LaTeX document string
    
    Returns:
        Format identifier string
    """
    # Check for format-specific patterns
    if re.search(r'\\textbf\s*\{\s*\\large\s+[A-Z]', latex_code):
        return 'ATS'
    elif re.search(r'\\NewPart\s*\{', latex_code):
        return 'cool'
    elif re.search(r'\\section\s*\{', latex_code):
        # Default to Modern if both use \section
        return 'Modern'
    
    # Fallback
    logger.warning("[PARSE] Could not detect format, defaulting to ATS")
    return 'ATS'


def _split_latex_into_blocks(latex_code: str, parser_output: Dict, format_id: str) -> Dict[str, Any]:
    """
    Split LaTeX into reusable blocks based on parser output.
    
    Args:
        latex_code: Complete LaTeX document
        parser_output: Parser's section structure
        format_id: Format identifier
    
    Returns:
        Dictionary with preamble, sections (with items), and closing
    """
    sections_data = parser_output.get('sections', [])
    
    if not sections_data:
        # No sections found, return entire document as preamble
        return {
            'preamble': latex_code,
            'sections': {},
            'closing': ''
        }
    
    # Get section pattern template for this format
    pattern_template = SECTION_PATTERNS.get(format_id, '')
    
    # Find positions of all sections
    section_positions = []
    for section in sections_data:
        title = section['title']
        # Build regex for this specific section
        pattern = pattern_template.replace('{title}', re.escape(title))
        
        match = re.search(pattern, latex_code, re.IGNORECASE)
        if match:
            section_positions.append({
                'title': title,
                'start': match.start(),
                'end': match.end(),
                'subsections': section.get('subsections', [])
            })
    
    # Sort by position
    section_positions.sort(key=lambda x: x['start'])
    
    if not section_positions:
        logger.warning(f"[SPLIT] No section markers found for format {format_id}")
        return {
            'preamble': latex_code,
            'sections': {},
            'closing': ''
        }
    
    # Extract preamble (everything before first section)
    first_section_start = section_positions[0]['start']
    preamble = latex_code[:first_section_start].rstrip()
    
    # Extract sections
    sections_dict = {}
    
    for i, section_pos in enumerate(section_positions):
        # Determine where this section ends
        if i + 1 < len(section_positions):
            section_end = section_positions[i + 1]['start']
        else:
            # Last section goes to end of document
            section_end = len(latex_code)
        
        # Extract full section content
        section_content = latex_code[section_pos['start']:section_end]
        
        # Extract section header (first line/marker)
        header_end = section_pos['end'] - section_pos['start']
        # Extend to include newlines after header
        while header_end < len(section_content) and section_content[header_end] in '\n\\':
            header_end += 1
            if section_content[header_end-1] == '\\' and header_end < len(section_content):
                if section_content[header_end] == '\\':
                    header_end += 1
                    break
        
        section_header = section_content[:header_end]
        
        # Generate section key (normalized title)
        section_key = _normalize_section_key(section_pos['title'])
        
        # Check if section has subsections
        subsections = section_pos['subsections']
        has_items = len(subsections) > 0
        
        sections_dict[section_key] = {
            'full_content': section_content,
            'section_header': section_header,
            'has_items': has_items,
            'title': section_pos['title']
        }
        
        # If has subsections, split into items
        if has_items:
            items, environment_wrapper = _extract_subsection_items(section_content, subsections)
            sections_dict[section_key]['items'] = items
            if environment_wrapper:
                sections_dict[section_key]['environment_wrapper'] = environment_wrapper
        else:
            sections_dict[section_key]['items'] = {}
    
    # Extract closing (check last section for \end{document})
    last_section_content = list(sections_dict.values())[-1]['full_content'] if sections_dict else ''
    
    # Find \end{document} in last section
    end_doc_match = re.search(r'\\end\s*\{\s*document\s*\}', last_section_content)
    
    if end_doc_match:
        # Split last section and closing
        last_key = list(sections_dict.keys())[-1]
        split_pos = end_doc_match.start()
        
        # Update last section to not include closing
        sections_dict[last_key]['full_content'] = last_section_content[:split_pos].rstrip()
        
        # Extract closing
        closing = last_section_content[split_pos:]
    else:
        # Check if closing is after all sections
        last_section_end = section_positions[-1]['start'] + len(last_section_content)
        if last_section_end < len(latex_code):
            closing = latex_code[last_section_end:]
        else:
            closing = '\n\\end{document}'
    
    return {
        'preamble': preamble,
        'sections': sections_dict,
        'closing': closing
    }


def _extract_subsection_items(section_content: str, subsections: List[str]) -> Tuple[Dict[str, str], dict]:
    """
    Extract individual subsection items from section content.
    Also detects and stores environment wrappers (like \begin{multicols}...\end{multicols}).
    
    Args:
        section_content: Full section LaTeX block
        subsections: List of subsection titles/text from parser
    
    Returns:
        Dictionary mapping item_0, item_1, etc. to LaTeX blocks, plus environment_wrapper info
    """
    if not subsections:
        return {}
    
    items = {}
    environment_wrapper = None
    
    # First, detect if there's an environment wrapper around the items
    # Look for \begin{env} after section header and before first item
    # Only consider special wrapper environments, NOT itemize/enumerate which are part of the structure
    wrapper_environments = ['multicols', 'tabular', 'minipage', 'columns']  # Known wrapper environments
    
    env_pattern = r'\\begin\{([^}]+)\}(?:\{[^}]*\})?'
    env_match = re.search(env_pattern, section_content)
    
    if env_match:
        env_name = env_match.group(1)
        
        # Only treat as wrapper if it's in the known wrapper environments list
        if env_name in wrapper_environments:
            env_start = env_match.start()
            env_open_command = env_match.group(0)
            
            # Find matching \end{env_name}
            end_pattern = rf'\\end\{{{re.escape(env_name)}\}}'
            end_match = re.search(end_pattern, section_content)
            
            if end_match:
                env_end = end_match.end()
                env_close_command = end_match.group(0)
                
                # Store environment wrapper info
                environment_wrapper = {
                    'name': env_name,
                    'open_command': env_open_command,
                    'close_command': env_close_command,
                    'start_pos': env_start,
                    'end_pos': env_end
                }
                
                logger.info(f"[SPLIT] Detected environment wrapper: {env_name} ({env_open_command} ... {env_close_command})")
    
    # Strategy: Find each subsection text and look backward for LaTeX command
    for i, subsection_text in enumerate(subsections):
        # Clean subsection text for searching (remove extra whitespace)
        search_text = ' '.join(subsection_text.split())
        
        # Find position in section content
        # Use flexible regex to handle whitespace variations
        pattern = re.escape(search_text).replace(r'\ ', r'\s+')
        match = re.search(pattern, section_content, re.IGNORECASE)
        
        if not match:
            # Try just first few words if full text not found
            first_words = ' '.join(search_text.split()[:3])
            pattern = re.escape(first_words).replace(r'\ ', r'\s+')
            match = re.search(pattern, section_content, re.IGNORECASE)
        
        if match:
            text_start = match.start()
            
            # Look backward from text_start to find the LaTeX command that wraps it
            # Common patterns: \textbf{TEXT}, \item TEXT, etc.
            item_start = text_start
            
            # Search backward for \textbf{ or \item or newline
            lookback_limit = max(0, text_start - 50)  # Look back up to 50 chars
            lookback_content = section_content[lookback_limit:text_start]
            
            # Find the last occurrence of common LaTeX commands
            last_textbf = lookback_content.rfind('\\textbf{')
            last_item = lookback_content.rfind('\\item')
            last_newline = lookback_content.rfind('\n')
            
            # Take the closest command to our text
            if last_textbf != -1 and (last_newline == -1 or last_textbf > last_newline):
                # Found \textbf{ before the text, include it
                item_start = lookback_limit + last_textbf
            elif last_item != -1 and (last_newline == -1 or last_item > last_newline):
                # Found \item before the text, include it
                item_start = lookback_limit + last_item
            elif last_newline != -1:
                # Start from after the newline
                item_start = lookback_limit + last_newline + 1
            
            # Find where this item ends (start of next item or end of section)
            if i + 1 < len(subsections):
                # Find next subsection
                next_text = ' '.join(subsections[i + 1].split())
                next_pattern = re.escape(next_text).replace(r'\ ', r'\s+')
                # Search from current match end
                search_start = match.end()
                next_match = re.search(next_pattern, section_content[search_start:], re.IGNORECASE)
                
                if next_match:
                    # Look backward from next match to find its LaTeX command
                    next_text_pos = search_start + next_match.start()
                    next_lookback_limit = max(item_start, next_text_pos - 50)
                    next_lookback = section_content[next_lookback_limit:next_text_pos]
                    
                    next_last_textbf = next_lookback.rfind('\\textbf{')
                    next_last_item = next_lookback.rfind('\\item')
                    next_last_newline = next_lookback.rfind('\n')
                    
                    if next_last_textbf != -1 and (next_last_newline == -1 or next_last_textbf > next_last_newline):
                        item_end = next_lookback_limit + next_last_textbf
                    elif next_last_item != -1 and (next_last_newline == -1 or next_last_item > next_last_newline):
                        item_end = next_lookback_limit + next_last_item
                    else:
                        item_end = next_text_pos
                else:
                    item_end = len(section_content)
            else:
                # Last item goes to end of section
                item_end = len(section_content)
            
            # Extract item content
            item_content = section_content[item_start:item_end]
            
            # For non-last items, add blank line for proper spacing between items
            # Strip trailing whitespace but add back blank line
            if i + 1 < len(subsections):
                # Add blank line after item (double newline) for visual separation
                item_content = item_content.rstrip() + '\n\n'
            else:
                # Last item - strip trailing whitespace
                item_content = item_content.rstrip()
            
            items[f'item_{i}'] = item_content
        else:
            logger.warning(f"[SPLIT] Could not find subsection in content: {subsection_text[:50]}...")
    
    return items, environment_wrapper


def _normalize_section_key(title: str) -> str:
    """
    Normalize section title to use as dictionary key.
    
    Args:
        title: Section title from parser
    
    Returns:
        Normalized key string (lowercase, underscores)
    """
    # Convert to lowercase and replace spaces/special chars with underscores
    key = re.sub(r'[^a-z0-9]+', '_', title.lower())
    # Remove leading/trailing underscores
    key = key.strip('_')
    return key


def get_section_metadata(parsed_data: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
    """
    Generate frontend-compatible metadata from parsed data.
    
    Args:
        parsed_data: Output from parse_latex_sections()
    
    Returns:
        Dictionary mapping section keys to metadata:
        {
            'section_key': {
                'type': 'simple' | 'complex',
                'label': 'Human Readable Label',
                'item_count': 3  # Only for complex sections
            }
        }
    """
    try:
        latex_blocks = parsed_data.get('latex_blocks', {})
        sections = latex_blocks.get('sections', {})
        
        metadata = {}
        
        # Add header metadata (always included, non-selectable)
        metadata['header'] = {
            'type': 'simple',
            'label': 'Header',
            'item_count': 0
        }
        
        # Process each section
        for section_key, section_data in sections.items():
            has_items = section_data.get('has_items', False)
            items = section_data.get('items', {})
            
            # Generate human-readable label from title
            label = section_data.get('title', section_key.replace('_', ' ').title())
            
            if has_items and items:
                # Complex section (has selectable items)
                metadata[section_key] = {
                    'type': 'complex',
                    'label': label,
                    'item_count': len(items)
                }
            else:
                # Simple section (no items, select entire section)
                metadata[section_key] = {
                    'type': 'simple',
                    'label': label
                }
        
        logger.info(f"[METADATA] Generated metadata for {len(metadata)} sections")
        
        return metadata
        
    except Exception as e:
        logger.error(f"[METADATA ERROR] Failed to generate metadata: {e}")
        raise Exception(f"Failed to generate section metadata: {str(e)}")


def generate_filtered_latex(parsed_data: Dict[str, Any], selections: Dict[str, Any]) -> str:
    """
    Assemble final LaTeX from selected blocks (lego pieces).
    
    Args:
        parsed_data: Output from parse_latex_sections()
        selections: User selections from frontend:
            {
                'section_key': True,  # Simple section (enabled/disabled)
                'section_key': {      # Complex section
                    'enabled': True,
                    'items': [0, 2, 3]  # Selected item indices
                }
            }
    
    Returns:
        Complete LaTeX document with only selected sections/items
    """
    try:
        latex_blocks = parsed_data.get('latex_blocks', {})
        
        if not latex_blocks:
            raise ValueError("Invalid parsed_data: missing latex_blocks")
        
        logger.info(f"[FILTER] Generating filtered LaTeX - Selections: {selections}")
        logger.info(f"[FILTER] Available sections: {list(latex_blocks.get('sections', {}).keys())}")
        
        # Save original LaTeX for comparison
        original_latex = parsed_data.get('original_latex', '')
        if original_latex:
            original_braces_open = original_latex.count('{')
            original_braces_close = original_latex.count('}')
            logger.info(f"[FILTER] Original LaTeX braces - Open: {original_braces_open}, Close: {original_braces_close}, Diff: {original_braces_open - original_braces_close}")
        
        # Start with preamble (always included)
        latex_parts = [latex_blocks.get('preamble', '')]
        logger.info(f"[FILTER] Added preamble ({len(latex_parts[0])} chars)")
        
        # Process each section in document order (not dict order)
        sections = latex_blocks.get('sections', {})
        section_info = parsed_data.get('section_info', [])
        
        # Create ordered list of section keys based on section_info
        ordered_keys = []
        for section in section_info:
            section_key = _normalize_section_key(section['title'])
            if section_key in sections:
                ordered_keys.append(section_key)
        
        logger.info(f"[FILTER] Processing sections in document order: {ordered_keys}")
        
        for section_key in ordered_keys:
            section_data = sections[section_key]
            # Check if this section is selected
            selection = selections.get(section_key)
            
            logger.info(f"[FILTER] Processing section '{section_key}' - Selection: {selection}")
            
            if selection is None:
                # Section not in selections, skip
                logger.debug(f"[FILTER] Section '{section_key}' not in selections, skipping")
                continue
            
            # Handle simple sections (boolean)
            if isinstance(selection, bool):
                if selection:
                    # Include entire section
                    content = section_data.get('full_content', '')
                    logger.info(f"[FILTER] Adding simple section '{section_key}' ({len(content)} chars)")
                    latex_parts.append(content)
                continue
            
            # Handle complex sections (dict with enabled + items)
            if isinstance(selection, dict):
                enabled = selection.get('enabled', False)
                selected_items = selection.get('items', [])
                
                logger.info(f"[FILTER] Complex section '{section_key}' - enabled: {enabled}, items: {selected_items}")
                
                if not enabled:
                    continue
                
                # Add section header
                header = section_data.get('section_header', '')
                logger.info(f"[FILTER] Adding section header for '{section_key}' ({len(header)} chars)")
                latex_parts.append(header)
                
                # Check for environment wrapper
                environment_wrapper = section_data.get('environment_wrapper')
                if environment_wrapper and selected_items:
                    # Add environment opening command
                    env_open = environment_wrapper['open_command']
                    logger.info(f"[FILTER] Adding environment opening '{env_open}' for '{section_key}'")
                    latex_parts.append(env_open)
                
                # Add selected items
                items = section_data.get('items', {})
                logger.info(f"[FILTER] Available items in '{section_key}': {list(items.keys())}")
                for item_idx in selected_items:
                    item_key = f'item_{item_idx}'
                    if item_key in items:
                        item_content = items[item_key]
                        logger.info(f"[FILTER] Adding item '{item_key}' from '{section_key}' ({len(item_content)} chars)")
                        latex_parts.append(item_content)
                    else:
                        logger.warning(f"[FILTER] Item '{item_key}' not found in section '{section_key}'")
                
                # Add environment closing command if wrapper exists and items were added
                if environment_wrapper and selected_items:
                    env_close = environment_wrapper['close_command']
                    logger.info(f"[FILTER] Adding environment closing '{env_close}' for '{section_key}'")
                    latex_parts.append(env_close)
        
        # Add closing (always included)
        closing = latex_blocks.get('closing', '')
        logger.info(f"[FILTER] Adding closing ({len(closing)} chars)")
        latex_parts.append(closing)
        
        # Concatenate all parts
        filtered_latex = '\n'.join(part for part in latex_parts if part)
        
        # Check brace balance for debugging
        open_braces = filtered_latex.count('{')
        close_braces = filtered_latex.count('}')
        logger.info(f"[FILTER] Generated filtered LaTeX ({len(filtered_latex)} characters)")
        logger.info(f"[FILTER] Brace count - Open: {open_braces}, Close: {close_braces}, Diff: {open_braces - close_braces}")
        
        if open_braces != close_braces:
            logger.warning(f"[FILTER] Brace mismatch detected! This will cause compilation errors.")
            
            # Save filtered and original latex to temp files for debugging
            import os
            temp_dir = Path(__file__).parent.parent / 'temp'
            temp_dir.mkdir(exist_ok=True)
            
            # Save filtered
            debug_file = temp_dir / 'filtered_debug.tex'
            with open(debug_file, 'w', encoding='utf-8') as f:
                f.write(filtered_latex)
            logger.info(f"[FILTER] Saved filtered LaTeX to {debug_file}")
            
            # Save original for comparison
            if original_latex:
                original_file = temp_dir / 'original_debug.tex'
                with open(original_file, 'w', encoding='utf-8') as f:
                    f.write(original_latex)
                logger.info(f"[FILTER] Saved original LaTeX to {original_file}")
        
        return filtered_latex
        
    except Exception as e:
        logger.error(f"[FILTER ERROR] Failed to generate filtered LaTeX: {e}")
        raise Exception(f"Failed to filter LaTeX sections: {str(e)}")

