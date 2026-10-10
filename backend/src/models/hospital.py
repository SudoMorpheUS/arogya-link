"""``hospital`` table (``database/init_migration_001.sql``). Independent entity."""

from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..core.database import Base

if TYPE_CHECKING:  # only for type checkers; resolved via SQLAlchemy registry at runtime
    from .consent import Consent
    from .doctor import Doctor
    from .visit import Visit


class Hospital(Base):
    __tablename__ = "hospital"

    hospital_id: Mapped[str] = mapped_column(String(15), primary_key=True)
    hospital_name: Mapped[str] = mapped_column(String(150), nullable=False)
    address: Mapped[str] = mapped_column(String(255), nullable=False)
    contact_number: Mapped[str] = mapped_column(String(15), nullable=False)
    registration_no: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)

    doctors: Mapped[list[Doctor]] = relationship(back_populates="hospital")
    visits: Mapped[list[Visit]] = relationship(back_populates="hospital")
    consents: Mapped[list[Consent]] = relationship(back_populates="hospital")

    def __repr__(self) -> str:
        return f"Hospital(hospital_id={self.hospital_id!r}, hospital_name={self.hospital_name!r})"
