from app.services.extraction import extract_candidates, lemmatize, split_sentences

TEXT = (
    "Invalidating a cache is notoriously difficult. "
    "Teams invalidate caches when data changes, "
    "and the cache invalidated too late serves stale data.\n"
    "Call getUserById() or set MAX_RETRIES=3 in config.yaml. "
    "Ask Kubernetes, then check https://example.com/docs for the API.\n"
    "The idempotent endpoint is safe to retry."
)


def _lemmas(
    skip_top_n: int = 3000, known: set[str] | None = None, saved: set[str] | None = None
) -> list[str]:
    candidates = extract_candidates(TEXT, skip_top_n, known or set(), saved or set())
    return [c.lemma for c in candidates]


def test_inflections_collapse_to_one_lemma_with_a_count() -> None:
    candidates = extract_candidates(TEXT, skip_top_n=3000, known=set(), saved=set())
    invalidate = [c for c in candidates if c.lemma == "invalidate"]
    assert len(invalidate) == 1
    assert invalidate[0].count == 3
    assert invalidate[0].sentence == "Invalidating a cache is notoriously difficult."


def test_frequent_words_are_skipped_by_threshold() -> None:
    assert "data" not in _lemmas()
    assert "difficult" not in _lemmas()
    assert "notoriously" in _lemmas()


def test_lower_threshold_lets_more_words_through() -> None:
    assert len(_lemmas(skip_top_n=0)) > len(_lemmas(skip_top_n=10_000))


def test_known_and_saved_words_are_excluded() -> None:
    assert "idempotent" not in _lemmas(known={"idempotent"})
    assert "notoriously" not in _lemmas(saved={"notoriously"})


def test_code_urls_acronyms_and_names_are_excluded() -> None:
    lemmas = _lemmas(skip_top_n=0)
    for junk in ("getuserbyid", "max_retries", "yaml", "kubernetes", "https", "api", "config"):
        assert junk not in lemmas


def test_rarest_words_come_first() -> None:
    candidates = extract_candidates(TEXT, skip_top_n=3000, known=set(), saved=set())
    ranks = [c.rank or 10**9 for c in candidates]
    assert ranks == sorted(ranks, reverse=True)


def test_limit_caps_the_result() -> None:
    assert len(extract_candidates(TEXT, skip_top_n=0, known=set(), saved=set(), limit=2)) == 2


def test_lemmatize_prefers_the_common_lemma() -> None:
    assert lemmatize("caches") == "cache"
    assert lemmatize("invalidating") == "invalidate"


def test_split_sentences_on_punctuation_and_newlines() -> None:
    assert split_sentences("One. Two!\nThree?") == ["One.", "Two!", "Three?"]
