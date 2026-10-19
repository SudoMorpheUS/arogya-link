from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.core.config import DEBUG
from src.routers.audit import router as audit_router
from src.routers.auth import router as auth_router
from src.routers.consents import router as consents_router
from src.routers.doctors import router as doctors_router
from src.routers.duplicates import router as duplicates_router
from src.routers.hospitals import router as hospitals_router
from src.routers.patients import router as patients_router
from src.routers.stats import router as stats_router
from src.routers.visits import router as visits_router

app = FastAPI(
    title="AarogyaLink API",
    description="Federated, Consent-Driven Multi-Hospital Health Data Sharing API",
    version="1.0.0",
)

# Enable CORS for Next.js frontend and external clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(hospitals_router)
app.include_router(doctors_router)
app.include_router(patients_router)
app.include_router(consents_router)
app.include_router(visits_router)
app.include_router(audit_router)
app.include_router(duplicates_router)
app.include_router(auth_router)
app.include_router(stats_router)

if DEBUG:
    from src.routers.debug import router as debug_router
    app.include_router(debug_router)


@app.get("/")
@app.get("/health")
@app.get("/api/health")
async def read_root():
    return {
        "service": "AarogyaLink FastAPI Backend",
        "status": "operational",
        "docs": "/docs",
        "database": "PostgreSQL 17 (BCNF)",
    }

