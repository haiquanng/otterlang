"""Sending one Web Push message. Swappable in tests; never called without VAPID keys."""

import json
import logging
from collections.abc import Callable
from typing import Literal

from pywebpush import WebPushException, webpush

from app.config import Settings, get_settings

SendResult = Literal["sent", "expired", "failed"]
Send = Callable[[dict[str, object], dict[str, str]], SendResult]

GONE = {404, 410}
log = logging.getLogger(__name__)


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
        return "sent"

    return send


def get_sender() -> Send:
    return make_sender(get_settings())
