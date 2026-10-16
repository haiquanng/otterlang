import pytest

from app.config import Settings
from app.services.push_sender import make_sender, vapid_problem
from scripts.generate_vapid_keys import _b64url

PRIVATE = _b64url(bytes(range(1, 33)))
PUBLIC = "BFtAOWn-jSdKXBAfnbTyz98D6cCu0csBjwZq6LwaMcimZDz9hLeLLFMcpEy9AUTmsJV5Qi23ZPXo0-gzjmXo1WY"
SUB = {"endpoint": "https://push.example/device", "keys": {"p256dh": "pk", "auth": "au"}}


def _settings(private: str | None = PRIVATE, subject: str = "mailto:me@example.com") -> Settings:
    return Settings(
        database_url="x", jwt_secret="x" * 32, vapid_private_key=private, vapid_subject=subject
    )


def test_a_bare_email_subject_becomes_a_mailto_link() -> None:
    assert _settings(subject="me@example.com").vapid_subject == "mailto:me@example.com"
    assert _settings(subject=" https://otterlang.app ").vapid_subject == "https://otterlang.app"


def test_good_config_has_no_problem() -> None:
    assert vapid_problem(_settings()) is None


@pytest.mark.parametrize(
    "private",
    [f"VAPID_PRIVATE_KEY={PRIVATE}", PUBLIC, "not-a-key"],
)
def test_unreadable_private_key_is_reported(private: str) -> None:
    problem = vapid_problem(_settings(private=private))
    assert problem is not None and "VAPID_PRIVATE_KEY" in problem


def test_subject_that_is_not_a_link_is_reported() -> None:
    problem = vapid_problem(_settings(subject="otterlang"))
    assert problem is not None and "VAPID_SUBJECT" in problem


def test_bad_config_fails_the_send_instead_of_raising() -> None:
    assert make_sender(_settings(private="not-a-key"))(SUB, {"body": "x"}) == "failed"
