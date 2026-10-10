"""Aarogya-Link backend package."""

from .core.database import Base, SessionLocal, engine, get_db

__all__ = ["Base", "SessionLocal", "engine", "get_db"]


def main() -> None:
    print("Hello from backend!")
