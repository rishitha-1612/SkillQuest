from __future__ import annotations

import hashlib
import hmac
import secrets
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any

from backend.services.auth_db import get_connection


SESSION_TTL_DAYS = 14
PBKDF2_ITERATIONS = 120_000


@dataclass
class AuthUser:
    id: int
    email: str
    username: str
    full_name: str
    created_at: str


@dataclass
class AuthSession:
    token: str
    expires_at: str
    user: AuthUser


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def _normalize_username(username: str) -> str:
    return username.strip()


def _hash_password(password: str, salt: str) -> str:
    return hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        bytes.fromhex(salt),
        PBKDF2_ITERATIONS,
    ).hex()


def _build_user(row: Any) -> AuthUser:
    return AuthUser(
        id=row["id"],
        email=row["email"],
        username=row["username"],
        full_name=row["full_name"],
        created_at=row["created_at"],
    )


def _session_token_hash(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_user(*, email: str, username: str, full_name: str, password: str) -> AuthUser:
    email = _normalize_email(email)
    username = _normalize_username(username)
    full_name = full_name.strip()
    salt = secrets.token_hex(16)
    password_hash = _hash_password(password, salt)
    timestamp = utc_now().isoformat()

    with get_connection() as connection:
        existing = connection.execute(
            "SELECT id FROM users WHERE email = ? OR username = ?",
            (email, username),
        ).fetchone()
        if existing:
            raise ValueError("An account with that email or username already exists.")

        cursor = connection.execute(
            """
            INSERT INTO users (email, username, full_name, password_hash, password_salt, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (email, username, full_name, password_hash, salt, timestamp, timestamp),
        )
        user_id = cursor.lastrowid
        row = connection.execute(
            "SELECT id, email, username, full_name, created_at FROM users WHERE id = ?",
            (user_id,),
        ).fetchone()

    return _build_user(row)


def authenticate_user(*, login: str, password: str) -> AuthUser | None:
    normalized_login = login.strip().lower()
    with get_connection() as connection:
        row = connection.execute(
            """
            SELECT id, email, username, full_name, password_hash, password_salt, created_at
            FROM users
            WHERE email = ? OR lower(username) = ?
            """,
            (normalized_login, normalized_login),
        ).fetchone()

    if row is None:
        return None

    computed_hash = _hash_password(password, row["password_salt"])
    if not hmac.compare_digest(computed_hash, row["password_hash"]):
        return None

    return AuthUser(
        id=row["id"],
        email=row["email"],
        username=row["username"],
        full_name=row["full_name"],
        created_at=row["created_at"],
    )


def create_session(user: AuthUser) -> AuthSession:
    token = secrets.token_urlsafe(32)
    token_hash = _session_token_hash(token)
    created_at = utc_now()
    expires_at = created_at + timedelta(days=SESSION_TTL_DAYS)
    timestamp = created_at.isoformat()
    expires_at_iso = expires_at.isoformat()

    with get_connection() as connection:
        connection.execute(
            """
            INSERT INTO sessions (user_id, token_hash, created_at, expires_at, last_seen_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (user.id, token_hash, timestamp, expires_at_iso, timestamp),
        )

    return AuthSession(token=token, expires_at=expires_at_iso, user=user)


def get_user_by_token(token: str) -> AuthUser | None:
    if not token:
        return None

    token_hash = _session_token_hash(token)
    now_iso = utc_now().isoformat()

    with get_connection() as connection:
        row = connection.execute(
            """
            SELECT users.id, users.email, users.username, users.full_name, users.created_at, sessions.id AS session_id
            FROM sessions
            JOIN users ON users.id = sessions.user_id
            WHERE sessions.token_hash = ? AND sessions.expires_at > ?
            """,
            (token_hash, now_iso),
        ).fetchone()

        if row is None:
            connection.execute("DELETE FROM sessions WHERE token_hash = ?", (token_hash,))
            return None

        connection.execute(
            "UPDATE sessions SET last_seen_at = ? WHERE id = ?",
            (now_iso, row["session_id"]),
        )

    return AuthUser(
        id=row["id"],
        email=row["email"],
        username=row["username"],
        full_name=row["full_name"],
        created_at=row["created_at"],
    )


def delete_session(token: str) -> None:
    if not token:
        return

    with get_connection() as connection:
        connection.execute("DELETE FROM sessions WHERE token_hash = ?", (_session_token_hash(token),))


def prune_expired_sessions() -> None:
    with get_connection() as connection:
        connection.execute("DELETE FROM sessions WHERE expires_at <= ?", (utc_now().isoformat(),))
