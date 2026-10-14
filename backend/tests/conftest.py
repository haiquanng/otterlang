import os

# Settings are read at import time; tests must never need a real .env.
os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost:5432/test")
os.environ.setdefault("JWT_SECRET", "test-secret-test-secret-test-secret-123")
