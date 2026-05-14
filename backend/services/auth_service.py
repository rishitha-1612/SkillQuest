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
LOGIN_RATE_LIMIT = 5
LOGIN_RATE_WINDOW_MINUTES = 15
SIGNUP_RATE_LIMIT = 5
SIGNUP_RATE_WINDOW_MINUTES = 60


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


def _coerce_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    return datetime.fromisoformat(value)


def _sanitize_rate_key(value: str) -> str:
    cleaned = value.strip().lower()
    return cleaned or "unknown"


def get_rate_limit_retry_after(*, scope: str, rate_key: str) -> int:
    now = utc_now()
    safe_key = _sanitize_rate_key(rate_key)

    with get_connection() as connection:
        row = connection.execute(
            """
            SELECT blocked_until
            FROM auth_rate_limits
            WHERE scope = ? AND rate_key = ?
            """,
            (scope, safe_key),
        ).fetchone()

        if row is None:
            return 0

        blocked_until = _coerce_datetime(row["blocked_until"])
        if blocked_until is None or blocked_until <= now:
            connection.execute(
                "DELETE FROM auth_rate_limits WHERE scope = ? AND rate_key = ?",
                (scope, safe_key),
            )
            return 0

        return max(1, int((blocked_until - now).total_seconds()))


def register_rate_limit_failure(*, scope: str, rate_key: str, limit: int, window_minutes: int) -> int:
    now = utc_now()
    window = timedelta(minutes=window_minutes)
    safe_key = _sanitize_rate_key(rate_key)

    with get_connection() as connection:
        row = connection.execute(
            """
            SELECT failures, first_failure_at, blocked_until
            FROM auth_rate_limits
            WHERE scope = ? AND rate_key = ?
            """,
            (scope, safe_key),
        ).fetchone()

        failures = 0
        first_failure_at = now
        blocked_until = None

        if row is not None:
            blocked_until = _coerce_datetime(row["blocked_until"])
            if blocked_until and blocked_until > now:
                return max(1, int((blocked_until - now).total_seconds()))

            first_failure_at = _coerce_datetime(row["first_failure_at"]) or now
            if now - first_failure_at >= window:
                failures = 0
                first_failure_at = now
            else:
                failures = row["failures"]

        failures += 1
        next_blocked_until = (now + window).isoformat() if failures >= limit else None

        connection.execute(
            """
            INSERT INTO auth_rate_limits (scope, rate_key, failures, first_failure_at, blocked_until)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(scope, rate_key) DO UPDATE SET
                failures = excluded.failures,
                first_failure_at = excluded.first_failure_at,
                blocked_until = excluded.blocked_until
            """,
            (scope, safe_key, failures, first_failure_at.isoformat(), next_blocked_until),
        )

    if next_blocked_until:
        return max(1, int((datetime.fromisoformat(next_blocked_until) - now).total_seconds()))
    return 0


def clear_rate_limit(*, scope: str, rate_key: str) -> None:
    safe_key = _sanitize_rate_key(rate_key)
    with get_connection() as connection:
        connection.execute(
            "DELETE FROM auth_rate_limits WHERE scope = ? AND rate_key = ?",
            (scope, safe_key),
        )


def create_user(*, email: str, username: str, full_name: str, password: str) -> AuthUser:
    email = _normalize_email(email)
    username = _normalize_username(username)
    username_lookup = username.lower()
    full_name = full_name.strip()
    salt = secrets.token_hex(16)
    password_hash = _hash_password(password, salt)
    timestamp = utc_now().isoformat()

    with get_connection() as connection:
        existing = connection.execute(
            "SELECT id FROM users WHERE email = ? OR lower(username) = ?",
            (email, username_lookup),
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
