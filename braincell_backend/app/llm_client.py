"""Multi-provider LLM client wrapper for BrainCell backend."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import httpx

DEFAULT_TIMEOUT = 20.0
MAX_RETRIES = 2


@dataclass(slots=True)
class LLMResponse:
    content: str
    usage: dict[str, Any]


class GoogleAIClient:
    """Google AI Studio (Gemini) client."""
    
    def __init__(self, api_key: str, model: str, *, timeout: float = DEFAULT_TIMEOUT) -> None:
        self._api_key = api_key
        self._model = model
        self._timeout = timeout
        self._base_url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
        self._client = httpx.AsyncClient(timeout=self._timeout)

    async def complete(self, prompt: str, *, modality: str) -> LLMResponse:
        url = f"{self._base_url}?key={self._api_key}"
        
        payload = {
            "contents": [{
                "parts": [{
                    "text": f"{self._system_prompt(modality)}\n\n{prompt}"
                }]
            }],
            "generationConfig": {
                "temperature": 0.7,
                "topK": 40,
                "topP": 0.95,
                "maxOutputTokens": 2048,
                "responseMimeType": "application/json"
            }
        }

        last_error: Exception | None = None
        for _attempt in range(MAX_RETRIES + 1):
            try:
                response = await self._client.post(url, json=payload)
                try:
                    response.raise_for_status()
                except httpx.HTTPStatusError as http_err:  # include body for diagnostics
                    body = response.text
                    raise httpx.HTTPStatusError(f"{http_err} | body={body}", request=http_err.request, response=http_err.response) from http_err
                data = response.json()
                
                # Extract content from Gemini response
                content = data["candidates"][0]["content"]["parts"][0]["text"]
                
                # Extract usage info
                usage = {
                    "prompt_tokens": data.get("usageMetadata", {}).get("promptTokenCount", 0),
                    "completion_tokens": data.get("usageMetadata", {}).get("candidatesTokenCount", 0),
                    "total_tokens": data.get("usageMetadata", {}).get("totalTokenCount", 0),
                    "model": self._model
                }
                
                return LLMResponse(content=content, usage=usage)
            except Exception as exc:  # noqa: BLE001
                last_error = exc
        raise RuntimeError("Google AI completion failed") from last_error

    async def aclose(self) -> None:
        await self._client.aclose()

    async def __aenter__(self) -> GoogleAIClient:
        return self

    async def __aexit__(self, exc_type, exc, tb) -> None:  # noqa: ANN001
        await self.aclose()

    def _system_prompt(self, modality: str) -> str:
        return (
            "You are BrainCell, a multimodal learning assistant. "
            "Always respond with a JSON object containing: "
            "`responseType`, `content`, and `knowledgeGraphDelta`. "
            f"Preferred modality: {modality}."
        )


class OpenRouterClient:
    """OpenRouter client (legacy fallback)."""
    
    def __init__(self, api_key: str, model: str, *, timeout: float = DEFAULT_TIMEOUT) -> None:
        self._api_key = api_key
        self._model = model
        self._timeout = timeout
        self._base_url = "https://openrouter.ai/api/v1"
        self._client = httpx.AsyncClient(
            base_url=self._base_url,
            timeout=self._timeout,
            headers={
                "Authorization": f"Bearer {self._api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://braincell-demo.local",
                "X-Title": "BrainCell Learning Assistant",
            },
        )

    async def complete(self, prompt: str, *, modality: str) -> LLMResponse:
        payload = {
            "model": self._model,
            "messages": [
                {"role": "system", "content": self._system_prompt(modality)},
                {"role": "user", "content": prompt},
            ],
            "response_format": {"type": "json_object"},
        }

        last_error: Exception | None = None
        for _attempt in range(MAX_RETRIES + 1):
            try:
                response = await self._client.post("/chat/completions", json=payload)
                response.raise_for_status()
                data = response.json()
                message = data["choices"][0]["message"]["content"]
                return LLMResponse(content=message, usage=data.get("usage", {}))
            except Exception as exc:  # noqa: BLE001
                last_error = exc
        raise RuntimeError("OpenRouter completion failed") from last_error

    async def aclose(self) -> None:
        await self._client.aclose()

    async def __aenter__(self) -> OpenRouterClient:
        return self

    async def __aexit__(self, exc_type, exc, tb) -> None:  # noqa: ANN001
        await self.aclose()

    def _system_prompt(self, modality: str) -> str:
        return (
            "You are BrainCell, a multimodal learning assistant. "
            "Always respond with a JSON object containing: "
            "`responseType`, `content`, and `knowledgeGraphDelta`. "
            f"Preferred modality: {modality}."
        )
