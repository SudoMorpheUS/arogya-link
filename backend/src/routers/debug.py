"""DEBUG ONLY — run raw SQL and get JSON back. Disabled unless ``DEBUG=true``.

``POST /debug/sql`` with body ``{"sql": "SELECT * FROM patient LIMIT 5"}``.
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from ..core import config
from ..core.debug import run_sql

router = APIRouter(prefix="/debug", tags=["debug"])


class SqlRequest(BaseModel):
    sql: str = Field(min_length=1, description="Single SQL statement to execute")
    params: dict[str, Any] = Field(default_factory=dict)
    max_rows: int = Field(default=1000, ge=1, le=5000)


class SqlResponse(BaseModel):
    columns: list[str] | None = None
    rows: list[dict[str, Any]] | None = None
    row_count: int | None = None
    truncated: bool = False
    message: str | None = None


def _ensure_debug() -> None:
    if not config.DEBUG:
        raise HTTPException(status_code=404, detail="Debug endpoints are disabled")


@router.post("/sql", response_model=SqlResponse)
def execute_sql(body: SqlRequest, _debug: None = Depends(_ensure_debug)) -> dict:
    try:
        return run_sql(body.sql, body.params, body.max_rows)
    except Exception as exc:  # surface DB errors as 400, never a traceback
        raise HTTPException(status_code=400, detail=f"SQL error: {exc}") from exc
