from datetime import UTC, datetime, timedelta

from app.services.scheduling import CardState, schedule

NOW = datetime(2026, 10, 14, 9, 0, tzinfo=UTC)
NEW = CardState(
    state="new",
    step=None,
    stability=0,
    difficulty=0,
    due=NOW,
    last_review=None,
    reps=0,
    lapses=0,
)
AGAIN, HARD, GOOD, EASY = 1, 2, 3, 4


def _graduate() -> CardState:
    """Review a new card with Good until it reaches the review state."""
    card, now = NEW, NOW
    while card.state != "review":
        now = card.due
        card = schedule(card, GOOD, now)
    return card


def test_first_review_leaves_new_and_counts_a_rep() -> None:
    card = schedule(NEW, GOOD, NOW)
    assert card.state in {"learning", "review"}
    assert card.reps == 1
    assert card.last_review == NOW
    assert card.due > NOW


def test_easy_schedules_further_than_again() -> None:
    assert schedule(NEW, EASY, NOW).due > schedule(NEW, AGAIN, NOW).due


def _interval(card: CardState) -> timedelta:
    assert card.last_review is not None
    return card.due - card.last_review


def test_intervals_grow_with_good_answers() -> None:
    card = _graduate()
    first_interval = _interval(card)
    second_interval = _interval(schedule(card, GOOD, card.due))
    assert second_interval > first_interval >= timedelta(days=1)


def test_again_in_review_is_a_lapse_and_relearns() -> None:
    card = _graduate()
    lapsed = schedule(card, AGAIN, card.due)
    assert lapsed.state == "relearning"
    assert lapsed.lapses == 1
    assert lapsed.due - card.due < timedelta(days=1)


def test_scheduling_is_deterministic() -> None:
    assert schedule(NEW, GOOD, NOW) == schedule(NEW, GOOD, NOW)
