"""``patient`` table (``database/init_migration_001.sql``). Independent entity."""

from __future__ import annotations

import datetime
from typing import TYPE_CHECKING

from sqlalchemy import CHAR, CheckConstraint, Date, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..core.database import Base

if TYPE_CHECKING:  # only for type checkers; resolved via SQLAlchemy registry at runtime
    from .audit_log import AuditLog
    from .consent import Consent
    from .visit import Visit


class Patient(Base):
    __tablename__ = "patient"
    __table_args__ = (
        CheckConstraint("gender IN ('M', 'F', 'O')", name="ck_patient_gender"),
    )

    patient_id: Mapped[str] = mapped_column(String(20), primary_key=True)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    date_of_birth: Mapped[datetime.date] = mapped_column(Date, nullable=False)
    gender: Mapped[str] = mapped_column(CHAR(1), nullable=False)
    blood_group: Mapped[str | None] = mapped_column(String(5), nullable=True)
    contact_number: Mapped[str] = mapped_column(String(15), nullable=False)
    email: Mapped[str | None] = mapped_column(String(100), unique=True, nullable=True)

    visits: Mapped[list[Visit]] = relationship(back_populates="patient")
    consents: Mapped[list[Consent]] = relationship(back_populates="patient")
    audit_logs: Mapped[list[AuditLog]] = relationship(back_populates="patient")

    def __repr__(self) -> str:
        return f"Patient(patient_id={self.patient_id!r}, full_name={self.full_name!r})"
