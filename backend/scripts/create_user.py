"""Create an account directly, for use while public sign-up is disabled.

Run from backend/: python -m scripts.create_user you@example.com --name "Your Name"
The password is prompted, never passed on the command line (it would land in shell history).
"""

import argparse
import getpass
import sys

import psycopg
from psycopg.rows import dict_row

from app.config import get_settings
from app.repositories import users
from app.security.passwords import hash_password
from app.services.auth import normalize_email

MIN_PASSWORD_LENGTH = 8


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("email")
    parser.add_argument("--name", default=None)
    args = parser.parse_args()

    password = getpass.getpass("Password: ")
    if len(password) < MIN_PASSWORD_LENGTH:
        sys.exit(f"Password must be at least {MIN_PASSWORD_LENGTH} characters.")
    if password != getpass.getpass("Repeat password: "):
        sys.exit("Passwords do not match.")

    with psycopg.connect(get_settings().database_url, row_factory=dict_row) as conn:
        user = users.create(conn, normalize_email(args.email), hash_password(password), args.name)
    if user is None:
        sys.exit("That email already has an account.")
    print(f"Created {user.email} ({user.id})")


if __name__ == "__main__":
    main()
