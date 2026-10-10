"""``consent`` table (``database/init_migration_001.sql``).

Links ``patient`` to ``hospital`` and/or ``doctor``; own file since it
carries its own CHECK constraints and links multiple parents.
"""

from __future__ import annotations

import datetime
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, Date, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..core.database import Base

if TYPE_CHECKING:  # only for type checkers; resolved via SQLAlchemy registry at runtime
    from .doctor import Doctor
    from .hospital import Hospital
    from .patient import Patient


class Consent(Base):
    __tablename__ = "consent"
    __table_args__ = (
        CheckConstraint("status IN ('Active', 'Revoked')", name="ck_consent_status"),
        CheckConstraint(
            "hospital_id IS NOT NULL OR doctor_id IS NOT NULL",
            name="ck_consent_hospital_or_doctor",
        ),
        CheckConstraint(
            "end_date IS NULL OR end_date >= start_date",
            name="ck_consent_end_date",
        ),
    )

    consent_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    patient_id: Mapped[str] = mapped_column(
        String(20), ForeignKey("patient.patient_id"), nullable=False
    )
    hospital_id: Mapped[str | None] = mapped_column(
        String(15), ForeignKey("hospital.hospital_id"), nullable=True
    )
    doctor_id: Mapped[str | None] = mapped_column(
        String(15), ForeignKey("doctor.doctor_id"), nullable=True
    )
    start_date: Mapped[datetime.date] = mapped_column(Date, nullable=False)
    end_date: Mapped[datetime.date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(15), nullable=False)

    patient: Mapped[Patient] = relationship(back_populates="consents")
    hospital: Mapped[Hospital | None] = relationship(back_populates="consents")
    doctor: Mapped[Doctor | None] = relationship(back_populates="consents")

    def __repr__(self) -> str:
        return f"Consent(consent_id={self.consent_id!r}, status={self.status!r})"
