"""``visit`` and its dependent relational tables.

``diagnosis``, ``prescription`` and ``lab_test`` exist only via
``visit.visit_id ON DELETE CASCADE``, so they reside here with their
dependency instead of getting standalone files.
"""

from __future__ import annotations

import datetime
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, Date, DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..core.database import Base

if TYPE_CHECKING:  # only for type checkers; resolved via SQLAlchemy registry at runtime
    from .doctor import Doctor
    from .hospital import Hospital
    from .patient import Patient


class Visit(Base):
    __tablename__ = "visit"
    __table_args__ = (
        CheckConstraint(
            "visit_type IN ('OPD', 'Emergency', 'Inpatient')",
            name="ck_visit_visit_type",
        ),
    )

    visit_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    patient_id: Mapped[str] = mapped_column(
        String(20), ForeignKey("patient.patient_id"), nullable=False
    )
    hospital_id: Mapped[str] = mapped_column(
        String(15), ForeignKey("hospital.hospital_id"), nullable=False
    )
    doctor_id: Mapped[str] = mapped_column(
        String(15), ForeignKey("doctor.doctor_id"), nullable=False
    )
    visit_date: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    visit_type: Mapped[str] = mapped_column(String(20), nullable=False)
    chief_complaint: Mapped[str | None] = mapped_column(String(255), nullable=True)

    patient: Mapped[Patient] = relationship(back_populates="visits")
    hospital: Mapped[Hospital] = relationship(back_populates="visits")
    doctor: Mapped[Doctor] = relationship(back_populates="visits")

    diagnoses: Mapped[list[Diagnosis]] = relationship(
        back_populates="visit", cascade="all, delete-orphan", passive_deletes=True
    )
    prescriptions: Mapped[list[Prescription]] = relationship(
        back_populates="visit", cascade="all, delete-orphan", passive_deletes=True
    )
    lab_tests: Mapped[list[LabTest]] = relationship(
        back_populates="visit", cascade="all, delete-orphan", passive_deletes=True
    )

    def __repr__(self) -> str:
        return f"Visit(visit_id={self.visit_id!r}, patient_id={self.patient_id!r})"


class Diagnosis(Base):
    __tablename__ = "diagnosis"

    diagnosis_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    visit_id: Mapped[int] = mapped_column(
        ForeignKey("visit.visit_id", ondelete="CASCADE"), nullable=False
    )
    disease_code: Mapped[str] = mapped_column(String(10), nullable=False)
    description: Mapped[str] = mapped_column(String(255), nullable=False)
    diagnosed_date: Mapped[datetime.date] = mapped_column(Date, nullable=False)

    visit: Mapped[Visit] = relationship(back_populates="diagnoses")

    def __repr__(self) -> str:
        return f"Diagnosis(diagnosis_id={self.diagnosis_id!r}, disease_code={self.disease_code!r})"


class Prescription(Base):
    __tablename__ = "prescription"

    prescription_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    visit_id: Mapped[int] = mapped_column(
        ForeignKey("visit.visit_id", ondelete="CASCADE"), nullable=False
    )
    medicine_name: Mapped[str] = mapped_column(String(100), nullable=False)
    dosage: Mapped[str] = mapped_column(String(50), nullable=False)
    frequency: Mapped[str] = mapped_column(String(50), nullable=False)
    duration: Mapped[str] = mapped_column(String(50), nullable=False)

    visit: Mapped[Visit] = relationship(back_populates="prescriptions")

    def __repr__(self) -> str:
        return f"Prescription(prescription_id={self.prescription_id!r}, medicine_name={self.medicine_name!r})"


class LabTest(Base):
    __tablename__ = "lab_test"

    lab_test_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    visit_id: Mapped[int] = mapped_column(
        ForeignKey("visit.visit_id", ondelete="CASCADE"), nullable=False
    )
    test_name: Mapped[str] = mapped_column(String(100), nullable=False)
    result: Mapped[str | None] = mapped_column(String(100), nullable=True)
    unit: Mapped[str | None] = mapped_column(String(30), nullable=True)
    test_date: Mapped[datetime.date] = mapped_column(Date, nullable=False)

    visit: Mapped[Visit] = relationship(back_populates="lab_tests")

    def __repr__(self) -> str:
        return f"LabTest(lab_test_id={self.lab_test_id!r}, test_name={self.test_name!r})"
