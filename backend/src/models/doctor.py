"""``doctor`` table (``database/init_migration_001.sql``).

Depends on ``hospital``; kept in its own file as a first-class entity.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..core.database import Base

if TYPE_CHECKING:  # only for type checkers; resolved via SQLAlchemy registry at runtime
    from .audit_log import AuditLog
    from .consent import Consent
    from .hospital import Hospital
    from .visit import Visit


class Doctor(Base):
    __tablename__ = "doctor"

    doctor_id: Mapped[str] = mapped_column(String(15), primary_key=True)
    hospital_id: Mapped[str] = mapped_column(
        String(15), ForeignKey("hospital.hospital_id"), nullable=False
    )
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    specialization: Mapped[str] = mapped_column(String(80), nullable=False)
    license_number: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)
    email: Mapped[str | None] = mapped_column(String(100), nullable=True)
    contact_number: Mapped[str | None] = mapped_column(String(15), nullable=True)

    hospital: Mapped[Hospital] = relationship(back_populates="doctors")
    visits: Mapped[list[Visit]] = relationship(back_populates="doctor")
    consents: Mapped[list[Consent]] = relationship(back_populates="doctor")
    audit_logs: Mapped[list[AuditLog]] = relationship(back_populates="doctor")

    def __repr__(self) -> str:
        return f"Doctor(doctor_id={self.doctor_id!r}, full_name={self.full_name!r})"
