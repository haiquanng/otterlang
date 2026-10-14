from app.services.sentence_check import check_sentence


def test_a_good_sentence_passes() -> None:
    feedback = check_sentence("We invalidate the cache after every deploy.", "invalidate")
    assert feedback.ok
    assert feedback.issues == []
    assert feedback.suggested_rating == 3


def test_any_inflection_counts() -> None:
    assert check_sentence("Invalidating stale data takes care.", "invalidate").uses_word
    assert check_sentence("The cache was invalidated last night.", "invalidate").uses_word


def test_missing_word_is_rated_again() -> None:
    feedback = check_sentence("We clear the cache after every deploy.", "invalidate")
    assert not feedback.uses_word
    assert feedback.issues == ["missing_word"]
    assert feedback.suggested_rating == 1


def test_style_issues_are_listed_and_rated_hard() -> None:
    feedback = check_sentence("we invalidate it", "invalidate")
    assert feedback.uses_word
    assert feedback.issues == ["too_short", "no_capital", "no_end_punctuation"]
    assert feedback.suggested_rating == 2


def test_phrases_must_appear_whole() -> None:
    assert check_sentence(
        "Caching helps us Reduce   Latency for users.", "reduce latency"
    ).uses_word
    assert not check_sentence("We reduce costs and latency drops.", "reduce latency").uses_word


def test_word_inside_another_word_does_not_count() -> None:
    assert not check_sentence("Our cacheable responses are fast today.", "cache").uses_word
