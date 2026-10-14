import io
import json
import ssl
import urllib.error
import urllib.request
from email.message import Message
from typing import Any

import pytest

from app.services import dictionary
from app.services.dictionary import DictionaryUnavailableError, fetch_entry

WIKTIONARY_OK = {
    "en": [{"partOfSpeech": "Verb", "definitions": [{"definition": "To make invalid."}]}]
}
FREE_DICT_OK = [{"meanings": [{"partOfSpeech": "verb", "definitions": [{"definition": "Void."}]}]}]


def _http_error(code: int) -> urllib.error.HTTPError:
    return urllib.error.HTTPError("https://x", code, "error", Message(), io.BytesIO(b""))


class _Response(io.BytesIO):
    def __enter__(self) -> "_Response":
        return self

    def __exit__(self, *_: object) -> None:
        self.close()


def _fake_network(
    monkeypatch: pytest.MonkeyPatch, wiktionary: Any, free_dictionary: Any
) -> list[urllib.request.Request]:
    """Each source is either a JSON-able payload or an exception to raise."""
    calls: list[urllib.request.Request] = []

    def fake(request: urllib.request.Request, timeout: float, context: ssl.SSLContext) -> Any:
        assert context.verify_mode == ssl.CERT_REQUIRED
        calls.append(request)
        outcome = wiktionary if "wiktionary" in request.full_url else free_dictionary
        if isinstance(outcome, Exception):
            raise outcome
        return _Response(json.dumps(outcome).encode())

    monkeypatch.setattr(dictionary.urllib.request, "urlopen", fake)
    return calls


def test_wiktionary_answer_is_used_without_calling_the_fallback(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    calls = _fake_network(monkeypatch, WIKTIONARY_OK, AssertionError("not called"))
    entry = fetch_entry("invalidate")
    assert entry is not None and entry.definition == "To make invalid."
    assert len(calls) == 1
    assert (calls[0].get_header("User-agent") or "").startswith("OtterLang/")


def test_falls_back_when_wiktionary_is_down(monkeypatch: pytest.MonkeyPatch) -> None:
    _fake_network(monkeypatch, TimeoutError("timed out"), FREE_DICT_OK)
    entry = fetch_entry("invalidate")
    assert entry is not None and entry.definition == "Void."


def test_unknown_everywhere_is_a_cacheable_miss(monkeypatch: pytest.MonkeyPatch) -> None:
    _fake_network(monkeypatch, _http_error(404), _http_error(404))
    assert fetch_entry("flibbertigibbet") is None


@pytest.mark.parametrize(
    ("wiktionary", "free_dictionary"),
    [
        (urllib.error.URLError(ssl.SSLCertVerificationError("verify failed")), _http_error(404)),
        (_http_error(404), TimeoutError("timed out")),
        (_http_error(503), _http_error(503)),
    ],
)
def test_not_found_plus_an_outage_raises_instead_of_caching_a_miss(
    monkeypatch: pytest.MonkeyPatch, wiktionary: Exception, free_dictionary: Exception
) -> None:
    _fake_network(monkeypatch, wiktionary, free_dictionary)
    with pytest.raises(DictionaryUnavailableError):
        fetch_entry("invalidate")
