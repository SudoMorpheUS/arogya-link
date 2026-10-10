"""Debug-only routers. Mounted in ``main.py`` only when ``DEBUG`` is true."""

from .debug import router as debug_router

__all__ = ["debug_router"]
