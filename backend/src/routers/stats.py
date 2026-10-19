from __future__ import annotations

from typing import Any
from fastapi import APIRouter, Depends
from sqlalchemy import func, select, text
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..models.audit_log import AuditLog
from ..models.consent import Consent
from ..models.doctor import Doctor
from ..models.hospital import Hospital
from ..models.patient import Patient
from ..models.visit import Visit

router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.get("")
def get_platform_stats(db: Session = Depends(get_db)) -> dict[str, Any]:
    """Return platform-wide operational totals from PostgreSQL."""
    patient_count = db.scalar(select(func.count(Patient.patient_id))) or 0
    hospital_count = db.scalar(select(func.count(Hospital.hospital_id))) or 0
    doctor_count = db.scalar(select(func.count(Doctor.doctor_id))) or 0
    visit_count = db.scalar(select(func.count(Visit.visit_id))) or 0
    active_consents = db.scalar(
        select(func.count(Consent.consent_id)).where(Consent.status == "Active")
    ) or 0
    audit_count = db.scalar(select(func.count(AuditLog.log_id))) or 0

    duplicate_count = 0
    try:
        duplicate_count = db.scalar(text("SELECT COUNT(*) FROM v_duplicate_lab_tests")) or 0
    except Exception:
        pass

    return {
        "patients": patient_count,
        "hospitals": hospital_count,
        "doctors": doctor_count,
        "visits": visit_count,
        "activeConsents": active_consents,
        "auditEntries": audit_count,
        "duplicateCount": duplicate_count,
    }
