from __future__ import annotations

import random
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, text
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..models.doctor import Doctor
from ..models.hospital import Hospital
from ..models.schemas import DoctorCreate, DoctorRead

router = APIRouter(prefix="/api/doctors", tags=["doctors"])


@router.get("/{doctor_id}/accessible-patients")
def get_accessible_patients(doctor_id: str, db: Session = Depends(get_db)) -> list[str]:
    """Return list of patient_ids that this doctor has active consent to access (directly or via hospital)."""
    sql = text("""
        SELECT DISTINCT c.patient_id
        FROM consent c
        JOIN doctor d ON d.doctor_id = :did
        WHERE c.status = 'Active'
          AND c.start_date <= (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::date
          AND (c.end_date IS NULL OR c.end_date >= (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::date)
          AND (c.doctor_id = :did OR c.hospital_id = d.hospital_id)
    """)
    rows = db.execute(sql, {"did": doctor_id}).scalars().all()
    return list(rows)


@router.get("")
def list_doctors(
    hospital_id: str | None = None,
    q: str | None = None,
    limit: int = Query(default=1000, ge=1, le=5000),
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    """List doctors, optionally filtered by hospital or search query."""
    stmt = (
        select(Doctor, Hospital.hospital_name)
        .join(Hospital, Doctor.hospital_id == Hospital.hospital_id)
        .order_by(Doctor.full_name)
    )
    if hospital_id:
        norm_hosp = hospital_id
        if norm_hosp == "HSP-01": norm_hosp = "HSP1001"
        elif norm_hosp == "HSP-02": norm_hosp = "HSP1002"
        elif norm_hosp == "HSP-03": norm_hosp = "HSP1005"
        stmt = stmt.where(Doctor.hospital_id == norm_hosp)
    if q:
        term = f"%{q.strip()}%"
        stmt = stmt.where(
            (Doctor.full_name.ilike(term)) |
            (Doctor.doctor_id.ilike(term)) |
            (Doctor.specialization.ilike(term)) |
            (Hospital.hospital_name.ilike(term))
        )
    stmt = stmt.limit(limit)

    rows = db.execute(stmt).all()
    results = []
    for doc, hosp_name in rows:
        results.append({
            "doctor_id": doc.doctor_id,
            "hospital_id": doc.hospital_id,
            "hospital_name": hosp_name,
            "full_name": doc.full_name,
            "specialization": doc.specialization,
            "license_number": doc.license_number,
            "email": doc.email,
            "contact_number": doc.contact_number,
        })
    return results


@router.get("/{doctor_id}")
def get_doctor(doctor_id: str, db: Session = Depends(get_db)) -> dict[str, Any]:
    """Get doctor details by ID."""
    stmt = (
        select(Doctor, Hospital.hospital_name)
        .join(Hospital, Doctor.hospital_id == Hospital.hospital_id)
        .where(Doctor.doctor_id == doctor_id)
    )
    row = db.execute(stmt).first()
    if not row:
        raise HTTPException(status_code=404, detail="Doctor not found")
    doc, hosp_name = row
    return {
        "doctor_id": doc.doctor_id,
        "hospital_id": doc.hospital_id,
        "hospital_name": hosp_name,
        "full_name": doc.full_name,
        "specialization": doc.specialization,
        "license_number": doc.license_number,
        "email": doc.email,
        "contact_number": doc.contact_number,
    }


@router.post("", response_model=DoctorRead, status_code=201)
def create_doctor(payload: DoctorCreate, db: Session = Depends(get_db)):
    """Register a new doctor into PostgreSQL."""
    hosp_id = payload.hospital_id
    if hosp_id == "HSP-01":
        hosp_id = "HSP1001"
    elif hosp_id == "HSP-02":
        hosp_id = "HSP1002"
    elif hosp_id == "HSP-03":
        hosp_id = "HSP1005"

    # Verify hospital exists
    hospital = db.scalar(select(Hospital).where(Hospital.hospital_id == hosp_id))
    if not hospital:
        # Fallback to first hospital if unknown
        first_hosp = db.scalar(select(Hospital).limit(1))
        hosp_id = first_hosp.hospital_id if first_hosp else "HSP1001"

    doc_id = payload.doctor_id
    if not doc_id:
        max_num = db.scalar(
            text("SELECT COALESCE(MAX(SUBSTRING(doctor_id FROM '[0-9]+')::integer), 1000) FROM doctor")
        ) or 1000
        doc_id = f"DOC-{max_num + 1}"
    else:
        existing = db.scalar(select(Doctor).where(Doctor.doctor_id == doc_id))
        if existing:
            if payload.email and existing.email and existing.email.lower() == payload.email.lower():
                return existing
            max_num = db.scalar(
                text("SELECT COALESCE(MAX(SUBSTRING(doctor_id FROM '[0-9]+')::integer), 1000) FROM doctor")
            ) or 1000
            doc_id = f"DOC-{max_num + 1}"

    lic = payload.license_number
    if not lic:
        lic = f"MCI-DL-{random.randint(10000, 99999)}"
    else:
        existing_lic = db.scalar(select(Doctor).where(Doctor.license_number == lic))
        if existing_lic:
            lic = f"{lic}-{random.randint(100, 999)}"

    raw_name = (payload.full_name or "").strip()
    formatted_name = raw_name if (raw_name.lower().startswith("dr.") or raw_name.lower().startswith("dr ")) else f"Dr. {raw_name}"

    doc = Doctor(
        doctor_id=doc_id,
        hospital_id=hosp_id,
        full_name=formatted_name,
        specialization=payload.specialization,
        license_number=lic,
        email=payload.email,
        contact_number=payload.contact_number,
    )
    db.add(doc)
    try:
        db.commit()
        db.refresh(doc)
        return doc
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.put("/{doctor_id}", response_model=DoctorRead)
def update_doctor(doctor_id: str, payload: dict[str, Any], db: Session = Depends(get_db)):
    """Update doctor profile details in PostgreSQL (Update operation)."""
    doc = db.scalar(select(Doctor).where(Doctor.doctor_id == doctor_id))
    if not doc:
        raise HTTPException(status_code=404, detail="Doctor not found")

    if "full_name" in payload and payload["full_name"]:
        doc.full_name = str(payload["full_name"]).strip()
    if "specialization" in payload and payload["specialization"]:
        doc.specialization = str(payload["specialization"]).strip()
    if "email" in payload:
        doc.email = str(payload["email"]).strip() if payload["email"] else None
    if "contact_number" in payload:
        doc.contact_number = str(payload["contact_number"]).strip() if payload["contact_number"] else None
    if "hospital_id" in payload and payload["hospital_id"]:
        hosp_id = payload["hospital_id"]
        if hosp_id == "HSP-01": hosp_id = "HSP1001"
        elif hosp_id == "HSP-02": hosp_id = "HSP1002"
        elif hosp_id == "HSP-03": hosp_id = "HSP1005"
        doc.hospital_id = hosp_id

    try:
        db.commit()
        db.refresh(doc)
        return doc
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.delete("/{doctor_id}")
def delete_doctor(doctor_id: str, db: Session = Depends(get_db)):
    """Delete doctor record from PostgreSQL (Delete operation)."""
    doc = db.scalar(select(Doctor).where(Doctor.doctor_id == doctor_id))
    if not doc:
        raise HTTPException(status_code=404, detail="Doctor not found")

    try:
        db.delete(doc)
        db.commit()
        return {"status": "ok", "message": f"Doctor {doctor_id} successfully deleted."}
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete doctor with active clinical visits or audit records: {str(exc)}"
        ) from exc
