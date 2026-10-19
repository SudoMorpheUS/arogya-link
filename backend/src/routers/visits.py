from __future__ import annotations

import datetime
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..models.doctor import Doctor
from ..models.patient import Patient
from ..models.visit import Diagnosis, LabTest, Prescription, Visit

router = APIRouter(prefix="/api/visits", tags=["visits"])


@router.post("", status_code=201)
def create_visit(payload: dict[str, Any], db: Session = Depends(get_db)) -> dict[str, Any]:
    """Record a clinical encounter with diagnoses, prescriptions, and lab tests."""
    patient_id = payload.get("patient_id")
    doctor_id = payload.get("doctor_id")
    visit_type = payload.get("visit_type", "OPD")
    chief_complaint = payload.get("chief_complaint") or None

    if not patient_id or not doctor_id:
        raise HTTPException(status_code=400, detail="patient_id and doctor_id are required")

    patient = db.scalar(select(Patient).where(Patient.patient_id == patient_id))
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    doctor = db.scalar(select(Doctor).where(Doctor.doctor_id == doctor_id))
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    hospital_id = payload.get("hospital_id") or doctor.hospital_id

    # 1. Create Visit record (fires PostgreSQL trigger `tr_visit_audit`)
    visit = Visit(
        patient_id=patient_id,
        hospital_id=hospital_id,
        doctor_id=doctor_id,
        visit_date=datetime.datetime.now(datetime.timezone.utc),
        visit_type=visit_type,
        chief_complaint=chief_complaint,
    )
    db.add(visit)
    db.flush()  # Populates visit.visit_id

    today = datetime.date.today()

    # 2. Add diagnoses
    diagnoses_data = payload.get("diagnoses", [])
    for d in diagnoses_data:
        code = d.get("disease_code")
        desc = d.get("description")
        if code and desc:
            diag = Diagnosis(
                visit_id=visit.visit_id,
                disease_code=code,
                description=desc,
                diagnosed_date=today,
            )
            db.add(diag)

    # 3. Add prescriptions
    prescriptions_data = payload.get("prescriptions", [])
    for p in prescriptions_data:
        name = p.get("medicine_name")
        if name:
            rx = Prescription(
                visit_id=visit.visit_id,
                medicine_name=name,
                dosage=p.get("dosage", "1 tablet"),
                frequency=p.get("frequency", "Once daily"),
                duration=p.get("duration", "5 days"),
            )
            db.add(rx)

    # 4. Add lab tests
    lab_tests_data = payload.get("lab_tests", []) or payload.get("labTests", [])
    for l in lab_tests_data:
        t_name = l.get("test_name")
        if t_name:
            lt = LabTest(
                visit_id=visit.visit_id,
                test_name=t_name,
                result=l.get("result") or None,
                unit=l.get("unit") or None,
                test_date=today,
            )
            db.add(lt)

    try:
        db.commit()
        db.refresh(visit)
        return {
            "visit_id": visit.visit_id,
            "patient_id": visit.patient_id,
            "hospital_id": visit.hospital_id,
            "doctor_id": visit.doctor_id,
            "visit_type": visit.visit_type,
            "chief_complaint": visit.chief_complaint,
            "visit_date": visit.visit_date.isoformat(),
            "message": "Visit successfully recorded and audited in PostgreSQL.",
        }
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("")
def list_visits(
    patient_id: str | None = None,
    doctor_id: str | None = None,
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    """List recent visits."""
    stmt = select(Visit).order_by(Visit.visit_date.desc())
    if patient_id:
        stmt = stmt.where(Visit.patient_id == patient_id)
    if doctor_id:
        stmt = stmt.where(Visit.doctor_id == doctor_id)
    stmt = stmt.limit(limit)

    visits = db.scalars(stmt).all()
    results = []
    for v in visits:
        results.append({
            "visit_id": v.visit_id,
            "patient_id": v.patient_id,
            "hospital_id": v.hospital_id,
            "doctor_id": v.doctor_id,
            "visit_date": v.visit_date.isoformat() if v.visit_date else "",
            "visit_type": v.visit_type,
            "chief_complaint": v.chief_complaint,
        })
    return results
