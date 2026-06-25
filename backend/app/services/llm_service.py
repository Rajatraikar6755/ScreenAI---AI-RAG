"""
LLM Service — wraps OpenAI API (GitHub Models endpoint).

Handles:
- Text generation with retry logic
- Structured JSON output parsing
- Graceful error handling with fallbacks
"""

import asyncio
import json
import re
from openai import AsyncOpenAI
from app.config import settings
from app.utils.logger import get_logger

logger = get_logger(__name__)


class LLMError(Exception):
    """Raised when the LLM fails to produce a usable response."""


class LLMService:
    """
    Async wrapper around OpenAI for text generation.

    Features:
    - Retry with exponential backoff (up to 3 attempts)
    - JSON extraction from potentially noisy LLM output
    - Temperature tuning per use case
    """

    def __init__(self):
        self.client = AsyncOpenAI(
            base_url="https://models.inference.ai.azure.com",
            api_key=settings.GITHUB_TOKEN,
        )
        self.model_name = settings.OPENAI_MODEL

    async def generate(self, prompt: str, temperature: float = 0.7, max_retries: int = 3) -> str:
        """
        Generate a text response from the LLM.
        """
        for attempt in range(1, max_retries + 1):
            try:
                response = await self.client.chat.completions.create(
                    model=self.model_name,
                    messages=[
                        {"role": "system", "content": "You are a helpful and expert assistant."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=temperature,
                    max_tokens=2048,
                    top_p=0.95,
                )
                return response.choices[0].message.content
            except Exception as e:
                wait = 2 ** attempt
                logger.warning(f"LLM attempt {attempt} failed: {e}. Retrying in {wait}s...")
                if attempt == max_retries:
                    raise LLMError(f"LLM generation failed after {max_retries} attempts: {e}")
                await asyncio.sleep(wait)

        raise LLMError("Unreachable")

    async def generate_json(self, prompt: str, temperature: float = 0.3) -> dict | list:
        """
        Generate and parse a JSON response from the LLM.
        Strips markdown code fences if present.
        """
        raw = await self.generate(prompt, temperature=temperature)
        return self._extract_json(raw)

    def _extract_json(self, text: str) -> dict | list:
        """Extract JSON from LLM output that may contain markdown formatting."""
        # Remove markdown code fences
        text = re.sub(r"```(?:json)?\n?", "", text).strip()
        text = text.rstrip("`").strip()

        # Find the first { or [ and the last } or ]
        start_idx_obj = text.find('{')
        start_idx_arr = text.find('[')
        
        start_idx = -1
        if start_idx_obj != -1 and start_idx_arr != -1:
            start_idx = min(start_idx_obj, start_idx_arr)
        elif start_idx_obj != -1:
            start_idx = start_idx_obj
        elif start_idx_arr != -1:
            start_idx = start_idx_arr
            
        if start_idx != -1:
            # Determine if it's an object or array
            is_obj = text[start_idx] == '{'
            end_char = '}' if is_obj else ']'
            end_idx = text.rfind(end_char)
            
            if end_idx != -1 and end_idx > start_idx:
                text = text[start_idx:end_idx+1]

        try:
            return json.loads(text)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse LLM JSON output: {e}\nRaw: {text[:500]}")
            raise LLMError(f"Invalid JSON from LLM: {e}")


def get_llm_service() -> LLMService:
    """Dependency injection factory."""
    return LLMService()
