"""``audit_log`` table (``database/init_migration_001.sql``).

Belongs to ``patient`` (optionally ``doctor``); own file since it is an
append-only log rather than a pure child of one parent.
"""

from __future__ import annotations

import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..core.database import Base

if TYPE_CHECKING:  # only for type checkers; resolved via SQLAlchemy registry at runtime
    from .doctor import Doctor
    from .patient import Patient


class AuditLog(Base):
    __tablename__ = "audit_log"

    log_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    patient_id: Mapped[str] = mapped_column(
        String(20), ForeignKey("patient.patient_id"), nullable=False
    )
    doctor_id: Mapped[str | None] = mapped_column(
        String(15), ForeignKey("doctor.doctor_id"), nullable=True
    )
    action: Mapped[str] = mapped_column(String(30), nullable=False)
    action_time: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    details: Mapped[str | None] = mapped_column(Text, nullable=True)

    patient: Mapped[Patient] = relationship(back_populates="audit_logs")
    doctor: Mapped[Doctor | None] = relationship(back_populates="audit_logs")

    def __repr__(self) -> str:
        return f"AuditLog(log_id={self.log_id!r}, action={self.action!r})"
