from __future__ import annotations

from typing import Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.orm import Session

from ..core.database import get_db

router = APIRouter(prefix="/api/duplicates", tags=["duplicates"])


@router.get("")
def list_duplicate_lab_tests(
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    """Query the PostgreSQL view v_duplicate_lab_tests for repeated tests within 90 days across hospitals."""
    query = text("""
        SELECT 
            v.initial_test_id,
            v.test_name,
            v.initial_date,
            v.patient_id,
            p.full_name AS patient_name,
            v.initial_hospital_id,
            h1.hospital_name AS initial_hospital_name,
            v.duplicate_test_id,
            v.duplicate_date,
            v.duplicate_hospital_id,
            h2.hospital_name AS duplicate_hospital_name,
            v.days_between
        FROM v_duplicate_lab_tests v
        JOIN patient p ON v.patient_id = p.patient_id
        JOIN hospital h1 ON v.initial_hospital_id = h1.hospital_id
        JOIN hospital h2 ON v.duplicate_hospital_id = h2.hospital_id
        ORDER BY v.duplicate_date DESC
        LIMIT :limit
    """)
    rows = db.execute(query, {"limit": limit}).all()
    results = []
    for r in rows:
        results.append({
            "initial_test_id": r.initial_test_id,
            "test_name": r.test_name,
            "initial_date": r.initial_date.isoformat() if r.initial_date else "",
            "patient_id": r.patient_id,
            "patient_name": r.patient_name,
            "initial_hospital_id": r.initial_hospital_id,
            "initial_hospital_name": r.initial_hospital_name,
            "duplicate_test_id": r.duplicate_test_id,
            "duplicate_date": r.duplicate_date.isoformat() if r.duplicate_date else "",
            "duplicate_hospital_id": r.duplicate_hospital_id,
            "duplicate_hospital_name": r.duplicate_hospital_name,
            "days_between": r.days_between,
        })
    return results
