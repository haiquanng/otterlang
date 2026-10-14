from app.security.passwords import hash_password, needs_rehash, verify_password


def test_hash_is_argon2id_and_verifies() -> None:
    hashed = hash_password("correct horse")
    assert hashed.startswith("$argon2id$")
    assert verify_password(hashed, "correct horse")


def test_wrong_password_fails() -> None:
    assert not verify_password(hash_password("correct horse"), "wrong horse")


def test_missing_hash_never_verifies() -> None:
    assert not verify_password(None, "not-a-real-password")


def test_garbage_hash_fails_instead_of_raising() -> None:
    assert not verify_password("not-a-hash", "anything")


def test_fresh_hash_needs_no_rehash() -> None:
    assert not needs_rehash(hash_password("correct horse"))
