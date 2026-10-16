"""The one way the app reaches an AI provider (Gemini). Optional: with AI off it is never called.

Callers pass a system instruction, a prompt and a JSON schema, and get a dict back or
AiUnavailableError. Swappable in tests through get_ask_json; tests never hit the network.
"""

import json
import ssl
import urllib.request
from collections.abc import Callable
from typing import Annotated, Any

import certifi
from fastapi import Depends

from app.config import Settings, get_settings

GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
# Long enough for a flash model, short enough that a stuck call never feels like a hang.
TIMEOUT_SECONDS = 8
_TLS = ssl.create_default_context(cafile=certifi.where())

AskJson = Callable[[str, str, dict[str, Any]], dict[str, Any]]


class AiUnavailableError(Exception):
    """The provider failed, timed out or answered with something other than the schema."""


def _answer_text(payload: Any) -> str:
    parts = payload["candidates"][0]["content"]["parts"]
    return "".join(part.get("text", "") for part in parts if not part.get("thought"))


def make_ask_json(settings: Settings) -> AskJson:
    def ask_json(system: str, prompt: str, schema: dict[str, Any]) -> dict[str, Any]:
        body = {
            "systemInstruction": {"parts": [{"text": system}]},
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generationConfig": {
                "responseMimeType": "application/json",
                "responseJsonSchema": schema,
                "temperature": 0.3,
            },
        }
        request = urllib.request.Request(  # noqa: S310 - fixed https host only
            GEMINI_URL.format(model=settings.gemini_model),
            data=json.dumps(body).encode(),
            # The key goes in a header, never the URL, so it cannot leak into error messages.
            headers={
                "x-goog-api-key": settings.gemini_api_key or "",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(  # noqa: S310
                request, timeout=TIMEOUT_SECONDS, context=_TLS
            ) as resp:
                result = json.loads(_answer_text(json.load(resp)))
        except (OSError, ValueError, KeyError, IndexError, TypeError) as exc:
            raise AiUnavailableError(type(exc).__name__) from exc
        if not isinstance(result, dict):
            raise AiUnavailableError("answer is not an object")
        return result

    return ask_json


def get_ask_json(settings: Annotated[Settings, Depends(get_settings)]) -> AskJson | None:
    """None when AI is off; callers then answer 404 and the app carries on without it."""
    if not settings.ai_enabled or not settings.gemini_api_key:
        return None
    return make_ask_json(settings)
