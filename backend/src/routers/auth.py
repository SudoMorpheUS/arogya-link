from __future__ import annotations

from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select, text
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..models.audit_log import AuditLog
from ..models.consent import Consent
from ..models.doctor import Doctor
from ..models.hospital import Hospital
from ..models.patient import Patient
from ..models.visit import Visit

router = APIRouter(prefix="/api/auth", tags=["auth"])

# In-memory admin store or admins table
ADMINS: list[dict[str, str]] = [
    {"email": "admin@arogyalink.in", "name": "System Administrator"},
]


@router.get("/lookup")
def lookup_user(
    email: str = Query(...),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Look up a user's role across admin, doctor, and patient entities."""
    clean_email = email.strip().lower()

    # 1. Check Admin
    for a in ADMINS:
        if a["email"].lower() == clean_email:
            return {"role": "admin", "id": None, "name": a["name"], "email": a["email"]}

    # 2. Check Doctor (by exact email, license, or prefix)
    doc = db.scalar(select(Doctor).where(func.lower(Doctor.email) == clean_email))
    if not doc:
        doc = db.scalar(
            select(Doctor).where(
                func.lower(Doctor.license_number).like(f"%{clean_email.split('@')[0]}%")
            )
        )
    if not doc and "@" in clean_email:
        # Check doctors with name/email pattern
        doc = db.scalar(
            select(Doctor)
            .where(func.lower(Doctor.full_name).like(f"%{clean_email.split('@')[0].replace('.', ' ')}%"))
            .order_by(Doctor.doctor_id.asc())
        )
    if doc:
        return {
            "role": "doctor",
            "id": doc.doctor_id,
            "name": doc.full_name,
            "email": clean_email,
            "hospital_id": doc.hospital_id,
            "specialization": doc.specialization,
        }

    # 3. Check Patient (by exact email)
    pat = db.scalar(select(Patient).where(func.lower(Patient.email) == clean_email))
    if pat:
        return {
            "role": "patient",
            "id": pat.patient_id,
            "name": pat.full_name,
            "email": pat.email,
        }

    # Unknown - defaults to patient
    return {"role": "patient", "id": None, "name": clean_email.split("@")[0], "email": clean_email}


@router.post("/register-admin")
def register_admin(payload: dict[str, Any]):
    """Register an administrator."""
    email = str(payload.get("email", "")).strip().lower()
    name = str(payload.get("name", "Administrator")).strip()
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    if not any(a["email"].lower() == email for a in ADMINS):
        ADMINS.append({"email": email, "name": name})
    return {"status": "ok", "email": email, "name": name}
