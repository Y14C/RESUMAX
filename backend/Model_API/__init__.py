"""
Model API package for Resumax Application

Handles interactions with various AI model providers for resume formatting.

Each module has its own payload structure and API integration:
- claude.py: Anthropic Claude API
- gemini.py: Google Gemini API
- lmstudio.py: LM Studio Local API (OpenAI-compatible)
- openai.py: OpenAI API
"""

from . import claude
from . import gemini
from . import lmstudio
from . import openai

__all__ = ['claude', 'gemini', 'lmstudio', 'openai']

