from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from app.config import Settings
from app.db import Pool
from app.main import app
from app.services.push_sender import SendResult, get_sender
from scripts.generate_vapid_keys import _b64url
from tests.integration.helpers import signup

SECRET = "reminder-secret-for-tests"
SUB = {"endpoint": "https://push.example/device-1", "keys": {"p256dh": "pk", "auth": "au"}}


class FakeSender:
    def __init__(self) -> None:
        self.sent: list[tuple[str, str]] = []
        self.result: SendResult = "sent"

    def __call__(self, subscription: dict[str, object], message: dict[str, str]) -> SendResult:
        self.sent.append((str(subscription["endpoint"]), message["body"]))
        return self.result


@pytest.fixture
def sender(client: TestClient, settings: Settings) -> Iterator[FakeSender]:
    settings.vapid_public_key = "public-key"
    settings.vapid_private_key = _b64url(bytes(range(1, 33)))
    settings.reminder_secret = SECRET
    fake = FakeSender()
    app.dependency_overrides[get_sender] = lambda: fake
    yield fake


def _learner_with_a_due_card(
    client: TestClient, email: str = "otter@example.com", subscription: dict[str, object] = SUB
) -> dict[str, str]:
    auth = signup(client, email)
    client.post("/items", json={"term": "resilient", "definition": "Recovers."}, headers=auth)
    client.put("/push/subscription", json=subscription, headers=auth)
    # Hour 0 in UTC: the reminder is always owed once per day.
    client.patch(
        "/me", json={"reminder_enabled": True, "reminder_hour": 0, "timezone": "UTC"}, headers=auth
    )
    return auth


def _run(client: TestClient, secret: str | None = SECRET) -> dict[str, int]:
    headers = {"X-Reminder-Secret": secret} if secret else {}
    response = client.post("/push/run", headers=headers)
    assert response.status_code == 200, response.text
    data: dict[str, int] = response.json()
    return data


def test_reminder_is_sent_once_per_day(client: TestClient, sender: FakeSender) -> None:
    _learner_with_a_due_card(client)
    assert _run(client) == {"reminded": 1, "sent": 1, "expired": 0, "failed": 0}
    assert sender.sent == [(SUB["endpoint"], "1 card is waiting. A few minutes keeps them fresh.")]
    assert _run(client) == {"reminded": 0, "sent": 0, "expired": 0, "failed": 0}


def test_expired_subscription_is_removed(
    client: TestClient, sender: FakeSender, pool: Pool
) -> None:
    _learner_with_a_due_card(client)
    sender.result = "expired"
    assert _run(client)["expired"] == 1
    with pool.connection() as conn:
        left = conn.execute("select count(*) as n from push_subscriptions").fetchone()
    assert left == {"n": 0}


def test_no_reminder_when_nothing_is_due_or_turned_off(
    client: TestClient, sender: FakeSender
) -> None:
    auth = signup(client)
    client.put("/push/subscription", json=SUB, headers=auth)
    client.patch("/me", json={"reminder_enabled": True, "reminder_hour": 0}, headers=auth)
    assert _run(client)["reminded"] == 0  # nothing due

    other = _learner_with_a_due_card(
        client, "other@example.com", {**SUB, "endpoint": "https://push.example/device-2"}
    )
    client.patch("/me", json={"reminder_enabled": False}, headers=other)
    assert _run(client)["reminded"] == 0
    assert sender.sent == []


def test_run_needs_the_secret(client: TestClient, sender: FakeSender) -> None:
    assert client.post("/push/run").status_code == 403
    assert client.post("/push/run", headers={"X-Reminder-Secret": "nope"}).status_code == 403


def test_unconfigured_server_hides_reminders(client: TestClient) -> None:
    auth = signup(client)
    assert client.get("/push/public-key", headers=auth).status_code == 404
    assert client.post("/push/run", headers={"X-Reminder-Secret": SECRET}).status_code == 404


def test_subscribe_unsubscribe_and_settings(client: TestClient, sender: FakeSender) -> None:
    auth = signup(client)
    assert client.get("/push/public-key").json() == {"key": "public-key"}
    assert client.put("/push/subscription", json=SUB, headers=auth).status_code == 204
    remove = {"endpoint": SUB["endpoint"]}
    assert client.post("/push/subscription/remove", json=remove, headers=auth).status_code == 204

    me = client.patch(
        "/me",
        json={"reminder_enabled": True, "reminder_hour": 8, "timezone": "Asia/Ho_Chi_Minh"},
        headers=auth,
    ).json()
    assert (me["reminder_enabled"], me["reminder_hour"], me["timezone"]) == (
        True,
        8,
        "Asia/Ho_Chi_Minh",
    )
    assert client.patch("/me", json={"timezone": "Nowhere/Land"}, headers=auth).status_code == 422
    assert client.patch("/me", json={"reminder_hour": 24}, headers=auth).status_code == 422


def test_failed_send_is_retried_on_the_next_run(client: TestClient, sender: FakeSender) -> None:
    _learner_with_a_due_card(client)
    sender.result = "failed"
    assert _run(client) == {"reminded": 0, "sent": 0, "expired": 0, "failed": 1}
    sender.result = "sent"
    assert _run(client) == {"reminded": 1, "sent": 1, "expired": 0, "failed": 0}


def test_test_notification_goes_to_own_devices_now(client: TestClient, sender: FakeSender) -> None:
    auth = signup(client)
    client.put("/push/subscription", json=SUB, headers=auth)
    response = client.post("/push/test", headers=auth)
    assert response.json() == {"sent": 1, "expired": 0, "failed": 0}
    assert sender.sent == [(SUB["endpoint"], "Reminders work on this device.")]
    assert client.post("/push/test").status_code == 401


def test_misconfigured_vapid_answers_503_with_the_setting(
    client: TestClient, sender: FakeSender, settings: Settings
) -> None:
    auth = signup(client)
    settings.vapid_private_key = "VAPID_PRIVATE_KEY=oops"
    response = client.post("/push/test", headers=auth)
    assert response.status_code == 503
    assert "VAPID_PRIVATE_KEY" in response.json()["detail"]
    assert client.post("/push/run", headers={"X-Reminder-Secret": SECRET}).status_code == 503
