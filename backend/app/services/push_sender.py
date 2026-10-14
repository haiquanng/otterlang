"""Sending one Web Push message. Swappable in tests; never called without VAPID keys."""

import json
from collections.abc import Callable
from typing import Literal

from pywebpush import WebPushException, webpush

from app.config import Settings, get_settings

SendResult = Literal["sent", "expired", "failed"]
Send = Callable[[dict[str, object], dict[str, str]], SendResult]

GONE = {404, 410}


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
            return "expired" if status in GONE else "failed"
        return "sent"

    return send


def get_sender() -> Send:
    return make_sender(get_settings())
