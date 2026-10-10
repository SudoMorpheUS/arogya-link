"""Shared enums mirroring the DB CHECK constraints in ``init_migration_001.sql``."""

from __future__ import annotations

import enum


class Gender(str, enum.Enum):
    M = "M"
    F = "F"
    O = "O"


class VisitType(str, enum.Enum):
    OPD = "OPD"
    Emergency = "Emergency"
    Inpatient = "Inpatient"


class ConsentStatus(str, enum.Enum):
    Active = "Active"
    Revoked = "Revoked"
