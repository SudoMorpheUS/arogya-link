"""Pydantic v2 schemas for request validation / response serialization.

One ``*Base`` + ``*Create`` + ``*Update`` + ``*Read`` set per table, matching
``database/init_migration_001.sql`` and ``models.py``.
"""

from __future__ import annotations

import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class ORMBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Patient
# ---------------------------------------------------------------------------


class PatientBase(ORMBase):
    full_name: str = Field(max_length=100)
    date_of_birth: datetime.date
    gender: Literal["M", "F", "O"]
    blood_group: str | None = Field(default=None, max_length=5)
    contact_number: str = Field(max_length=15)
    email: EmailStr | None = None


class PatientCreate(PatientBase):
    patient_id: str = Field(max_length=20)


class PatientUpdate(ORMBase):
    full_name: str | None = Field(default=None, max_length=100)
    date_of_birth: datetime.date | None = None
    gender: Literal["M", "F", "O"] | None = None
    blood_group: str | None = Field(default=None, max_length=5)
    contact_number: str | None = Field(default=None, max_length=15)
    email: EmailStr | None = None


class PatientRead(PatientBase):
    patient_id: str


# ---------------------------------------------------------------------------
# Hospital
# ---------------------------------------------------------------------------


class HospitalBase(ORMBase):
    hospital_name: str = Field(max_length=150)
    address: str = Field(max_length=255)
    contact_number: str = Field(max_length=15)
    registration_no: str = Field(max_length=30)


class HospitalCreate(HospitalBase):
    hospital_id: str = Field(max_length=15)


class HospitalUpdate(ORMBase):
    hospital_name: str | None = Field(default=None, max_length=150)
    address: str | None = Field(default=None, max_length=255)
    contact_number: str | None = Field(default=None, max_length=15)
    registration_no: str | None = Field(default=None, max_length=30)


class HospitalRead(HospitalBase):
    hospital_id: str


# ---------------------------------------------------------------------------
# Doctor
# ---------------------------------------------------------------------------


class DoctorBase(ORMBase):
    hospital_id: str = Field(max_length=15)
    full_name: str = Field(max_length=100)
    specialization: str = Field(max_length=80)
    license_number: str = Field(max_length=30)
    email: EmailStr | None = None
    contact_number: str | None = None


class DoctorCreate(DoctorBase):
    doctor_id: str | None = Field(default=None, max_length=15)


class DoctorUpdate(ORMBase):
    hospital_id: str | None = Field(default=None, max_length=15)
    full_name: str | None = Field(default=None, max_length=100)
    specialization: str | None = Field(default=None, max_length=80)
    license_number: str | None = Field(default=None, max_length=30)
    email: EmailStr | None = None
    contact_number: str | None = None


class DoctorRead(DoctorBase):
    doctor_id: str


# ---------------------------------------------------------------------------
# Visit
# ---------------------------------------------------------------------------

VisitTypeLiteral = Literal["OPD", "Emergency", "Inpatient"]


class VisitBase(ORMBase):
    patient_id: str = Field(max_length=20)
    hospital_id: str = Field(max_length=15)
    doctor_id: str = Field(max_length=15)
    visit_type: VisitTypeLiteral
    chief_complaint: str | None = Field(default=None, max_length=255)


class VisitCreate(VisitBase):
    visit_date: datetime.datetime | None = None


class VisitUpdate(ORMBase):
    visit_type: VisitTypeLiteral | None = None
    chief_complaint: str | None = Field(default=None, max_length=255)


class VisitRead(VisitBase):
    visit_id: int
    visit_date: datetime.datetime


# ---------------------------------------------------------------------------
# Diagnosis
# ---------------------------------------------------------------------------


class DiagnosisBase(ORMBase):
    visit_id: int
    disease_code: str = Field(max_length=10)
    description: str = Field(max_length=255)
    diagnosed_date: datetime.date


class DiagnosisCreate(DiagnosisBase):
    pass


class DiagnosisUpdate(ORMBase):
    disease_code: str | None = Field(default=None, max_length=10)
    description: str | None = Field(default=None, max_length=255)
    diagnosed_date: datetime.date | None = None


class DiagnosisRead(DiagnosisBase):
    diagnosis_id: int


# ---------------------------------------------------------------------------
# Prescription
# ---------------------------------------------------------------------------


class PrescriptionBase(ORMBase):
    visit_id: int
    medicine_name: str = Field(max_length=100)
    dosage: str = Field(max_length=50)
    frequency: str = Field(max_length=50)
    duration: str = Field(max_length=50)


class PrescriptionCreate(PrescriptionBase):
    pass


class PrescriptionUpdate(ORMBase):
    medicine_name: str | None = Field(default=None, max_length=100)
    dosage: str | None = Field(default=None, max_length=50)
    frequency: str | None = Field(default=None, max_length=50)
    duration: str | None = Field(default=None, max_length=50)


class PrescriptionRead(PrescriptionBase):
    prescription_id: int


# ---------------------------------------------------------------------------
# LabTest
# ---------------------------------------------------------------------------


class LabTestBase(ORMBase):
    visit_id: int
    test_name: str = Field(max_length=100)
    result: str | None = Field(default=None, max_length=100)
    unit: str | None = Field(default=None, max_length=30)
    test_date: datetime.date


class LabTestCreate(LabTestBase):
    pass


class LabTestUpdate(ORMBase):
    test_name: str | None = Field(default=None, max_length=100)
    result: str | None = Field(default=None, max_length=100)
    unit: str | None = Field(default=None, max_length=30)
    test_date: datetime.date | None = None


class LabTestRead(LabTestBase):
    lab_test_id: int


# ---------------------------------------------------------------------------
# Consent
# ---------------------------------------------------------------------------


class ConsentBase(ORMBase):
    patient_id: str = Field(max_length=20)
    hospital_id: str | None = Field(default=None, max_length=15)
    doctor_id: str | None = Field(default=None, max_length=15)
    start_date: datetime.date
    end_date: datetime.date | None = None
    status: Literal["Active", "Revoked"]


class ConsentCreate(ConsentBase):
    pass


class ConsentUpdate(ORMBase):
    hospital_id: str | None = Field(default=None, max_length=15)
    doctor_id: str | None = Field(default=None, max_length=15)
    start_date: datetime.date | None = None
    end_date: datetime.date | None = None
    status: Literal["Active", "Revoked"] | None = None


class ConsentRead(ConsentBase):
    consent_id: int


# ---------------------------------------------------------------------------
# AuditLog
# ---------------------------------------------------------------------------


class AuditLogBase(ORMBase):
    patient_id: str = Field(max_length=20)
    doctor_id: str | None = Field(default=None, max_length=15)
    action: str = Field(max_length=30)
    details: str | None = None


class AuditLogCreate(AuditLogBase):
    pass


class AuditLogRead(AuditLogBase):
    log_id: int
    action_time: datetime.datetime
