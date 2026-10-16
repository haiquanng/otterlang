"""Sending one Web Push message. Swappable in tests; never called without VAPID keys."""

import json
import logging
from collections.abc import Callable
from typing import Literal

from py_vapid import Vapid, VapidException
from pywebpush import WebPushException, webpush

from app.config import Settings, get_settings

SendResult = Literal["sent", "expired", "failed"]
Send = Callable[[dict[str, object], dict[str, str]], SendResult]

GONE = {404, 410}
log = logging.getLogger(__name__)


def vapid_problem(settings: Settings) -> str | None:
    """What is wrong with the VAPID settings, in words fit for the owner; None if usable."""
    if not settings.vapid_subject.startswith(("mailto:", "https://")):
        return "VAPID_SUBJECT must be a mailto: or https:// link"
    try:
        Vapid.from_string(private_key=settings.vapid_private_key or "")
    except (ValueError, TypeError, VapidException):
        return "VAPID_PRIVATE_KEY is not a valid key (paste only the value after the = sign)"
    return None


def make_sender(settings: Settings) -> Send:
    def send(subscription: dict[str, object], message: dict[str, str]) -> SendResult:
        try:
            webpush(
                subscription_info=subscription,
                data=json.dumps(message),
                vapid_private_key=settings.vapid_private_key,
                vapid_claims={"sub": settings.vapid_subject},
                timeout=10,
            )
        except WebPushException as exc:
            status = getattr(exc.response, "status_code", None)
            # 404/410: the browser dropped this subscription; the caller deletes it.
            if status in GONE:
                return "expired"
            # Status only: the endpoint and keys identify a device and stay out of logs.
            log.warning("web push failed with status %s", status)
            return "failed"
        except (ValueError, TypeError, VapidException) as exc:
            # Bad VAPID settings; the message names the setting, never the key itself.
            log.error("web push not sent: %s", vapid_problem(settings) or type(exc).__name__)
            return "failed"
        return "sent"

    return send


def get_sender() -> Send:
    return make_sender(get_settings())
