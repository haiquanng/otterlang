import time
from collections import deque


class RateLimiter:
    """Sliding-window limiter kept in memory.

    Good enough for one Render instance; state resets on restart, which is acceptable
    for slowing down password guessing.
    """

    def __init__(self, limit: int, window_seconds: float) -> None:
        self._limit = limit
        self._window = window_seconds
        self._hits: dict[str, deque[float]] = {}

    def allow(self, key: str, now: float | None = None) -> bool:
        current = time.monotonic() if now is None else now
        hits = self._hits.setdefault(key, deque())
        while hits and current - hits[0] >= self._window:
            hits.popleft()
        if len(hits) >= self._limit:
            return False
        hits.append(current)
        return True

    def clear(self) -> None:
        self._hits.clear()
