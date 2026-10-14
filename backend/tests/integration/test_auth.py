from fastapi.testclient import TestClient

from app.config import Settings
from app.routers.auth import REFRESH_COOKIE

EMAIL = "otter@example.com"
PASSWORD = "river-stones-42"


def _signup(client: TestClient, email: str = EMAIL) -> str:
    response = client.post("/auth/signup", json={"email": email, "password": PASSWORD})
    assert response.status_code == 201, response.text
    token: str = response.json()["access_token"]
    return token


def _auth(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def test_signup_disabled_returns_403(client: TestClient, settings: Settings) -> None:
    settings.signup_enabled = False
    response = client.post("/auth/signup", json={"email": EMAIL, "password": PASSWORD})
    assert response.status_code == 403


def test_signup_returns_token_and_sets_refresh_cookie(client: TestClient) -> None:
    response = client.post("/auth/signup", json={"email": EMAIL, "password": PASSWORD})
    assert response.status_code == 201
    assert response.json()["user"]["email"] == EMAIL
    cookie = response.headers["set-cookie"]
    assert REFRESH_COOKIE in cookie
    assert "HttpOnly" in cookie
    assert "Path=/auth" in cookie


def test_duplicate_email_is_rejected_case_insensitively(client: TestClient) -> None:
    _signup(client)
    response = client.post("/auth/signup", json={"email": EMAIL.upper(), "password": PASSWORD})
    assert response.status_code == 409


def test_login_with_wrong_password_fails(client: TestClient) -> None:
    _signup(client)
    response = client.post("/auth/login", json={"email": EMAIL, "password": "nope-nope"})
    assert response.status_code == 401


def test_login_with_unknown_email_fails_the_same_way(client: TestClient) -> None:
    response = client.post("/auth/login", json={"email": EMAIL, "password": PASSWORD})
    assert response.status_code == 401
    assert response.json()["detail"] == "Wrong email or password"


def test_login_then_me(client: TestClient) -> None:
    _signup(client)
    response = client.post("/auth/login", json={"email": EMAIL, "password": PASSWORD})
    assert response.status_code == 200
    me = client.get("/me", headers=_auth(response.json()["access_token"]))
    assert me.status_code == 200
    assert me.json()["email"] == EMAIL


def test_me_requires_a_valid_token(client: TestClient) -> None:
    assert client.get("/me").status_code == 401
    assert client.get("/me", headers=_auth("garbage")).status_code == 401


def test_refresh_rotates_and_old_token_is_rejected(client: TestClient) -> None:
    _signup(client)
    old = client.cookies[REFRESH_COOKIE]
    first = client.post("/auth/refresh")
    assert first.status_code == 200
    assert client.cookies[REFRESH_COOKIE] != old

    client.cookies.set(REFRESH_COOKIE, old, path="/auth")
    assert client.post("/auth/refresh").status_code == 401


def test_reusing_a_rotated_token_revokes_the_new_one_too(client: TestClient) -> None:
    _signup(client)
    old = client.cookies[REFRESH_COOKIE]
    client.post("/auth/refresh")
    new = client.cookies[REFRESH_COOKIE]

    client.cookies.set(REFRESH_COOKIE, old, path="/auth")
    client.post("/auth/refresh")
    client.cookies.set(REFRESH_COOKIE, new, path="/auth")
    assert client.post("/auth/refresh").status_code == 401


def test_logout_revokes_the_refresh_token(client: TestClient) -> None:
    _signup(client)
    token = client.cookies[REFRESH_COOKIE]
    assert client.post("/auth/logout").status_code == 204
    client.cookies.set(REFRESH_COOKIE, token, path="/auth")
    assert client.post("/auth/refresh").status_code == 401


def test_patch_me_updates_only_given_fields(client: TestClient) -> None:
    token = _signup(client)
    response = client.patch("/me", json={"skip_top_n": 5000}, headers=_auth(token))
    assert response.status_code == 200
    assert response.json()["skip_top_n"] == 5000
    response = client.patch("/me", json={"display_name": "Otter"}, headers=_auth(token))
    assert response.json() == {**response.json(), "display_name": "Otter", "skip_top_n": 5000}


def test_login_is_rate_limited(client: TestClient) -> None:
    _signup(client)
    codes = [
        client.post("/auth/login", json={"email": EMAIL, "password": "wrong-one"}).status_code
        for _ in range(11)
    ]
    assert codes[-1] == 429
