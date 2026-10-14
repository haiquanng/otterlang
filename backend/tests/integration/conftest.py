import os
from collections.abc import Iterator

import psycopg
import pytest
from fastapi.testclient import TestClient

from app.config import Settings, get_settings
from app.db import Pool, create_pool, get_conn
from app.main import app
from app.routers import auth
from scripts.migrate import apply_migrations

TEST_DATABASE_URL = os.environ.get("TEST_DATABASE_URL")

# Never fall back to DATABASE_URL: that may be the real Supabase database.
if not TEST_DATABASE_URL:
    pytest.skip("TEST_DATABASE_URL not set", allow_module_level=True)


@pytest.fixture(scope="session")
def pool() -> Iterator[Pool]:
    assert TEST_DATABASE_URL
    with psycopg.connect(TEST_DATABASE_URL, autocommit=True) as conn:
        conn.execute("drop schema public cascade")
        conn.execute("create schema public")
    with psycopg.connect(TEST_DATABASE_URL) as conn:
        apply_migrations(conn)
    test_pool = create_pool(TEST_DATABASE_URL)
    test_pool.open(wait=True)
    yield test_pool
    test_pool.close()


@pytest.fixture
def settings() -> Settings:
    return Settings(
        database_url=TEST_DATABASE_URL or "",
        jwt_secret="integration-secret-integration-secret",
        signup_enabled=True,
        cookie_secure=False,
    )


@pytest.fixture
def client(pool: Pool, settings: Settings) -> Iterator[TestClient]:
    with pool.connection() as conn:
        conn.execute("truncate users, dictionary_entries cascade")
    for limiter in (auth.login_limiter_ip, auth.login_limiter_email, auth.signup_limiter_ip):
        limiter.clear()

    def test_conn() -> Iterator[psycopg.Connection[psycopg.rows.DictRow]]:
        with pool.connection() as conn:
            yield conn

    app.dependency_overrides[get_conn] = test_conn
    app.dependency_overrides[get_settings] = lambda: settings
    # No `with`: the app's lifespan would open a pool against DATABASE_URL.
    yield TestClient(app)
    app.dependency_overrides.clear()
