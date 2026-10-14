from app.services.grading import BLANK, cloze, grade, suggest_rating


def test_accepts_lemma_surface_and_inflections_case_insensitively() -> None:
    for answer in ("invalidate", "Invalidating", " INVALIDATED ", "invalidates"):
        assert grade(answer, "invalidate", "Invalidating", 5000).correct


def test_wrong_answer_and_one_typo() -> None:
    wrong = grade("cache", "invalidate", None, 5000)
    assert not wrong.correct and not wrong.close and wrong.suggested_rating == 1
    typo = grade("invalidte", "invalidate", None, 5000)
    assert not typo.correct and typo.close and typo.suggested_rating == 2


def test_short_words_get_no_typo_allowance() -> None:
    assert not grade("cahe", "cache", None, 1000).close


def test_phrases_compare_whole_and_ignore_extra_spaces() -> None:
    assert grade("reduce   latency", "reduce latency", None, 3000).correct


def test_rating_suggestion_uses_speed() -> None:
    assert suggest_rating(True, False, 2000) == 4
    assert suggest_rating(True, False, 8000) == 3
    assert suggest_rating(True, False, 30000) == 2
    assert suggest_rating(True, False, None) == 3


def test_cloze_blanks_the_form_used_in_the_sentence() -> None:
    sentence = "Invalidating a cache is hard; teams invalidate caches often."
    assert (
        cloze(sentence, "invalidate", "Invalidating")
        == f"{BLANK} a cache is hard; teams {BLANK} caches often."
    )


def test_cloze_does_not_touch_other_words_and_reports_missing() -> None:
    assert cloze("A cacheable cache.", "cache", "cache") == f"A cacheable {BLANK}."
    assert cloze("Nothing here.", "cache", None) is None
