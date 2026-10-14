from app.rate_limit import RateLimiter


def test_blocks_after_limit_within_window() -> None:
    limiter = RateLimiter(limit=2, window_seconds=60)
    assert limiter.allow("k", now=0)
    assert limiter.allow("k", now=1)
    assert not limiter.allow("k", now=2)


def test_allows_again_after_window_passes() -> None:
    limiter = RateLimiter(limit=1, window_seconds=60)
    assert limiter.allow("k", now=0)
    assert not limiter.allow("k", now=30)
    assert limiter.allow("k", now=60)


def test_keys_are_independent() -> None:
    limiter = RateLimiter(limit=1, window_seconds=60)
    assert limiter.allow("a", now=0)
    assert limiter.allow("b", now=0)
