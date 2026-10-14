from scripts.library_sources import clean_wikipedia_extract, is_public_http_url, trim_to_paragraphs

EXTRACT = """Caching stores data so future requests are faster.
It is used everywhere.

== History ==
Early computers used small caches.

=== Hardware ===
CPUs have several cache levels.

== See also ==
Memoization

== References ==
Smith 2001."""


def test_wikipedia_extract_keeps_prose_and_drops_reference_sections() -> None:
    cleaned = clean_wikipedia_extract(EXTRACT)
    assert cleaned == (
        "Caching stores data so future requests are faster.\n\n"
        "It is used everywhere.\n\n"
        "Early computers used small caches.\n\n"
        "CPUs have several cache levels."
    )


def test_trim_keeps_whole_paragraphs_only() -> None:
    text = "First paragraph here.\nSecond paragraph is longer than the limit allows."
    assert trim_to_paragraphs(text, max_chars=30) == "First paragraph here."
    assert trim_to_paragraphs("One very long paragraph", max_chars=5) == "One very long paragraph"


def test_url_guard_allows_public_https() -> None:
    assert is_public_http_url("https://example.com/post", resolve=lambda _: ["93.184.216.34"])


def test_url_guard_blocks_private_loopback_and_odd_schemes() -> None:
    for address in ("127.0.0.1", "10.0.0.5", "192.168.1.1", "169.254.169.254", "::1"):
        assert not is_public_http_url("http://internal.test/", resolve=lambda _, a=address: [a])
    assert not is_public_http_url("file:///etc/passwd", resolve=lambda _: ["93.184.216.34"])
    assert not is_public_http_url("ftp://example.com/", resolve=lambda _: ["93.184.216.34"])


def test_url_guard_blocks_hosts_with_any_private_address() -> None:
    mixed = lambda _: ["93.184.216.34", "10.0.0.1"]  # noqa: E731
    assert not is_public_http_url("https://rebind.example/", resolve=mixed)
