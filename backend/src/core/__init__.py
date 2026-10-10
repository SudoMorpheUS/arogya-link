"""Core package: config, DB connection, shared backend logic."""

from .config import DATABASE_URL, DEBUG

__all__ = ["DATABASE_URL", "DEBUG"]
