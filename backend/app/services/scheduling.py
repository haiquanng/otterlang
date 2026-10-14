"""FSRS scheduling as a pure function over our card columns (py-fsrs does the maths)."""

from dataclasses import dataclass, replace
from datetime import datetime

from fsrs import Card, Rating, Scheduler, State

# No fuzzing: the same answer always gives the same next date, which keeps tests exact
# and is fine for a personal deck.
_scheduler = Scheduler(enable_fuzzing=False)

_TO_FSRS = {"learning": State.Learning, "review": State.Review, "relearning": State.Relearning}
_FROM_FSRS = {value: key for key, value in _TO_FSRS.items()}


@dataclass(frozen=True)
class CardState:
    state: str  # new | learning | review | relearning
    step: int | None
    stability: float
    difficulty: float
    due: datetime
    last_review: datetime | None
    reps: int
    lapses: int


def schedule(card: CardState, rating: int, now: datetime) -> CardState:
    """Apply one review. `rating` is 1 Again, 2 Hard, 3 Good, 4 Easy."""
    if card.state == "new":
        fsrs_card = Card(due=now)
    else:
        fsrs_card = Card(
            state=_TO_FSRS[card.state],
            step=card.step,
            stability=card.stability,
            difficulty=card.difficulty,
            due=card.due,
            last_review=card.last_review,
        )
    updated, _ = _scheduler.review_card(fsrs_card, Rating(rating), review_datetime=now)
    lapsed = card.state == "review" and rating == Rating.Again
    return replace(
        card,
        state=_FROM_FSRS[updated.state],
        step=updated.step,
        stability=float(updated.stability or 0),
        difficulty=float(updated.difficulty or 0),
        due=updated.due,
        last_review=now,
        reps=card.reps + 1,
        lapses=card.lapses + (1 if lapsed else 0),
    )
