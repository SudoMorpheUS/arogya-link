from __future__ import annotations

import random
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..models.doctor import Doctor
from ..models.hospital import Hospital
from ..models.schemas import DoctorCreate, DoctorRead

router = APIRouter(prefix="/api/doctors", tags=["doctors"])


@router.get("")
def list_doctors(
    hospital_id: str | None = None,
    limit: int = Query(default=300, ge=1, le=1000),
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    """List doctors, optionally filtered by hospital."""
    stmt = (
        select(Doctor, Hospital.hospital_name)
        .join(Hospital, Doctor.hospital_id == Hospital.hospital_id)
        .order_by(Doctor.full_name)
    )
    if hospital_id:
        stmt = stmt.where(Doctor.hospital_id == hospital_id)
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
    }


@router.post("", response_model=DoctorRead, status_code=201)
def create_doctor(payload: DoctorCreate, db: Session = Depends(get_db)):
    """Register a new doctor."""
    existing = db.scalar(select(Doctor).where(Doctor.doctor_id == payload.doctor_id))
    if existing:
        raise HTTPException(status_code=400, detail="Doctor ID already exists")

    doc = Doctor(
        doctor_id=payload.doctor_id,
        hospital_id=payload.hospital_id,
        full_name=payload.full_name,
        specialization=payload.specialization,
        license_number=payload.license_number,
    )
    db.add(doc)
    try:
        db.commit()
        db.refresh(doc)
        return doc
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(exc)) from exc
