"""Debug-only raw SQL execution.

Used by ``POST /debug/sql``. Never expose this when ``DEBUG`` is false —
the router refuses to even register / rejects requests in that case.
"""

from __future__ import annotations

from typing import Any

from fastapi.encoders import jsonable_encoder
from sqlalchemy import text

from .database import SessionLocal


def run_sql(sql: str, params: dict[str, Any] | None = None, max_rows: int = 1000) -> dict:
    """Execute one raw SQL statement and return JSON-serializable data.

    - Statements returning rows (SELECT/WITH/...) -> ``columns`` + ``rows``.
    - Other statements (INSERT/UPDATE/DELETE/...) are committed and return
      ``row_count``.
    """
    cleaned = (sql or "").strip()
    if not cleaned:
        raise ValueError("sql must not be empty")
    if max_rows < 1:
        raise ValueError("max_rows must be >= 1")

    with SessionLocal() as db:
        result = db.execute(text(cleaned), params or {})
        if result.returns_rows:
            columns = list(result.keys())
            batch = result.mappings().fetchmany(max_rows + 1)
            truncated = len(batch) > max_rows
            rows = jsonable_encoder(batch[:max_rows])
            return {
                "columns": columns,
                "rows": rows,
                "row_count": len(rows),
                "truncated": truncated,
                "message": None,
            }
        db.commit()
        return {
            "columns": None,
            "rows": None,
            "row_count": result.rowcount,
            "truncated": False,
            "message": "statement executed and committed",
        }
