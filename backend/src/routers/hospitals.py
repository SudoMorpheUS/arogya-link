from __future__ import annotations

from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select, text
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..models.doctor import Doctor
from ..models.hospital import Hospital
from ..models.schemas import HospitalRead
from ..models.visit import Visit

router = APIRouter(prefix="/api/hospitals", tags=["hospitals"])


@router.get("", response_model=list[HospitalRead])
def list_hospitals(db: Session = Depends(get_db)):
    """List all registered hospitals."""
    stmt = select(Hospital).order_by(Hospital.hospital_name)
    return db.scalars(stmt).all()


@router.get("/caseload")
def get_hospital_caseload(db: Session = Depends(get_db)) -> list[dict[str, Any]]:
    """Return caseload statistics for each hospital (doctors, visits, visit types)."""
    sql = text("""
        SELECT 
            h.hospital_id,
            h.hospital_name,
            h.address,
            h.contact_number,
            h.registration_no,
            COALESCE(d.doctor_count, 0) AS doctor_count,
            COALESCE(v.visit_count, 0) AS visit_count,
            COALESCE(v.patient_count, 0) AS patient_count,
            COALESCE(v.opd_visits, 0) AS opd_visits,
            COALESCE(v.emergency_visits, 0) AS emergency_visits,
            COALESCE(v.inpatient_visits, 0) AS inpatient_visits
        FROM hospital h
        LEFT JOIN (
            SELECT hospital_id, COUNT(*) AS doctor_count
            FROM doctor
            GROUP BY hospital_id
        ) d ON h.hospital_id = d.hospital_id
        LEFT JOIN (
            SELECT 
                hospital_id,
                COUNT(*) AS visit_count,
                COUNT(DISTINCT patient_id) AS patient_count,
                COUNT(*) FILTER (WHERE visit_type = 'OPD') AS opd_visits,
                COUNT(*) FILTER (WHERE visit_type = 'Emergency') AS emergency_visits,
                COUNT(*) FILTER (WHERE visit_type = 'Inpatient') AS inpatient_visits
            FROM visit
            GROUP BY hospital_id
        ) v ON h.hospital_id = v.hospital_id
        ORDER BY visit_count DESC;
    """)
    rows = db.execute(sql).mappings().all()
    return [dict(r) for r in rows]


@router.get("/{hospital_id}", response_model=HospitalRead)
def get_hospital(hospital_id: str, db: Session = Depends(get_db)):
    """Get single hospital by ID."""
    hospital = db.scalar(select(Hospital).where(Hospital.hospital_id == hospital_id))
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    return hospital


@router.get("/{hospital_id}/patients")
def get_hospital_patients(
    hospital_id: str,
    limit: int = 50,
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    """Return distinct patients who visited or gave consent to this hospital."""
    sql = text("""
        SELECT 
            p.patient_id,
            p.full_name,
            p.gender,
            p.blood_group,
            p.contact_number,
            COUNT(v.visit_id) AS visit_count,
            MAX(v.visit_date) AS last_visit
        FROM patient p
        JOIN visit v ON p.patient_id = v.patient_id
        WHERE v.hospital_id = :hid
        GROUP BY p.patient_id, p.full_name, p.gender, p.blood_group, p.contact_number
        ORDER BY last_visit DESC
        LIMIT :limit
    """)
    rows = db.execute(sql, {"hid": hospital_id, "limit": limit}).mappings().all()
    return [
        {
            "patient_id": r["patient_id"],
            "full_name": r["full_name"],
            "gender": r["gender"],
            "blood_group": r["blood_group"],
            "contact_number": r["contact_number"],
            "visit_count": r["visit_count"],
            "last_visit": r["last_visit"].isoformat() if r["last_visit"] else None,
        }
        for r in rows
    ]
