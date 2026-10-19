# AarogyaLink (आरोग्यLink)

> **Federated, Consent-Driven Multi-Hospital Health Data Sharing Platform**  
> *Database Management Systems (DBMS) — Digital Assignment 02*  
> **Developer:** Archit (25BRS1030)

---

## 🌟 Overview

**AarogyaLink** is a unified digital health data exchange designed to solve the critical problem of fragmented medical histories across disparate hospital networks in India. 

Rather than locking patient data in proprietary hospital silos, AarogyaLink provides:
1. **One Unified Longitudinal Health Record:** A patient's complete medical history (diagnoses, prescriptions, and lab investigations) travels with them across participating hospitals (e.g., Apollo Hospitals, Fortis Healthcare, AIIMS, Medanta).
2. **Patient-Governed Dynamic Consent:** Patients have sole ownership over who can view their clinical chart, granting broad facility-level or narrow doctor-specific access with customizable expiry dates, medical specializations, and geographic locations (city/state).
3. **Audited "Break-Glass" Emergency Access:** In life-threatening situations, physicians can bypass standard consent by providing mandatory clinical justification, which is instantly logged to a tamper-evident audit ledger.
4. **Cross-Hospital Duplicate Lab Test Detection:** Intelligent analytics automatically flag repeated investigations (e.g., HbA1c, Serum Creatinine, MRI) ordered within a 90-day window across different hospitals, preventing redundant costs and unnecessary procedures.

---

## 🏗️ System Architecture (3-Tier Production Stack)

```mermaid
graph TD
    subgraph Clients["Presentation Layer (Next.js 16)"]
        P["👤 Patient Portal\n(/dashboard, /consents)"]
        D["🩺 Doctor Portal\n(/patients, /visits/new)"]
        A["🛡️ Admin Portal\n(/dashboard, /hospitals, /audit)"]
        UI["Neobrutalist UI & 3D Lever Switch"]
        Auth["Firebase Auth & Session Engine"]
    end

    subgraph Backend["Application Layer (FastAPI & Uvicorn)"]
        API["FastAPI REST Endpoints\n(/api/hospitals, /api/consents, /api/audit)"]
        AuthRouter["Session & Authentication Router"]
        PolicyEngine["Consent Policy & Break-Glass Verifier"]
    end

    subgraph Database["Database Layer (PostgreSQL 17 — BCNF Relational Tables)"]
        DB[(9 Relational Tables in BCNF\n5,000+ Patients, 50 Hospitals, 300+ Doctors)]
        Procs["Stored Procedures & Functions\n(fn_has_consent, sp_grant_consent)"]
        Views["Analytical Views\n(v_patient_timeline, v_duplicate_lab_tests, v_hospital_caseload)"]
        Triggers["Triggers & Audit Ledger\n(trg_visit_audit -> audit_log)"]
    end

    P --> UI
    D --> UI
    A --> UI
    UI --> Auth
    Auth --> API
    API --> PolicyEngine
    PolicyEngine --> Procs
    API --> Views
    API --> DB
    DB --> Triggers
```

---

## 🚀 How to Run the Project

### Method 1: Docker Compose (Full Stack — Recommended)

Runs the entire containerized application (**PostgreSQL 17**, **FastAPI Python Backend**, and **Next.js 16 Frontend**) with pre-populated datasets and synchronized sequences in one command:

```bash
# From the repository root:
docker compose up -d --build
```

#### Application Endpoints:
* **Frontend Web App:** [http://localhost:3000](http://localhost:3000)
* **Backend API Health Check:** [http://localhost:8000/api/health](http://localhost:8000/api/health)
* **Interactive API Specification:** [http://localhost:8000/redoc](http://localhost:8000/redoc)
* **PostgreSQL Database:** `localhost:5432`  
  * Database: `aarogya_db`
  * Username: `aarogya`
  * Password: `aarogya_dev_password`

---

### Method 2: Hybrid Local Development (Docker DB + Local Services)

Ideal for active development with instant hot-reloading (FastAPI reload and Next.js Turbopack HMR):

1. **Start PostgreSQL in Docker:**
   ```bash
   docker compose up -d db
   ```

2. **Start Backend Locally:**
   ```bash
   cd backend
   # Set the database connection string:
   # PowerShell:
   $env:DATABASE_URL="postgresql+psycopg://aarogya:aarogya_dev_password@localhost:5432/aarogya_db"
   # Bash/Linux:
   # export DATABASE_URL="postgresql+psycopg://aarogya:aarogya_dev_password@localhost:5432/aarogya_db"

   python -m uvicorn main:app --reload --port 8000
   ```

3. **Start Frontend Locally:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

---

### Method 3: Standalone Frontend Demo Mode (Offline / Zero-Docker)

For presenting offline or on machines without Docker or Python:
The Next.js application features a built-in in-memory relational fallback engine mirroring the PostgreSQL BCNF schema, `fn_has_consent`, triggers, and analytical views.

```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000). The frontend automatically detects the absence of the backend and runs seamlessly with the offline relational store.

---

## 🔑 Authentication & Demo Persona Credentials

AarogyaLink supports both **1-Click Instant Demo Persona Logins** and **Firebase Email/Password Authentication**.

### 1-Click Instant Demo Logins:

| Role | Persona Name | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- | :--- |
| **Patient** | Karthik Iyer | `karthik.iyer@example.in` | `AarogyaLink@123` | View unified visits, active prescriptions, labs, and manage consents |
| **Doctor** | Dr. Rohan Mehta | `rohan.mehta@example.in` | `AarogyaLink@123` | Cardiology @ Apollo Hospitals (OPD chart access & visit records) |
| **Emergency Doctor** | Dr. Arjun Singh | `arjun.singh@example.in` | `AarogyaLink@123` | Emergency Medicine @ Fortis Healthcare (Audited break-glass override) |
| **Admin** | Central Administrator | `admin@aarogyalink.in` | `AarogyaLink@123` | Network-wide facility caseload, patient roster sync, audit trail |

### Resilient Session Management:
* Supports both Firebase client token validation and standard HTTP session cookies.
* Dedicated session revocation endpoint (`DELETE /api/auth/session`) guarantees clean, error-free sign-outs across browser refreshes and container rebuilds.

---

## 🛡️ Dynamic Consent & Dual-Tier Access Control

Access control is enforced at the database level inside PostgreSQL via the stored function `fn_has_consent(p_patient_id, p_doctor_id)`:

```sql
CREATE OR REPLACE FUNCTION public.fn_has_consent(
    p_patient_id character varying, 
    p_doctor_id character varying
)
RETURNS boolean
LANGUAGE sql
STABLE
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM consent c
    JOIN doctor d ON d.doctor_id = p_doctor_id
    WHERE c.patient_id = p_patient_id
      AND c.status = 'Active'
      AND c.start_date <= CURRENT_DATE
      AND (c.end_date IS NULL OR c.end_date >= CURRENT_DATE)
      AND (c.doctor_id = p_doctor_id OR c.hospital_id = d.hospital_id)
  );
$function$;
```

### Access Model Breakdown:
* **Hospital-Level Consent (`c.hospital_id = d.hospital_id`):** When granted to a hospital facility, all doctors affiliated with that institution can review the patient's record during consultations and emergency care.
* **Doctor-Specific Consent (`c.doctor_id = p_doctor_id`):** Grants access strictly to an individual physician (e.g. private oncologist or cardiologist). Other physicians in the same facility are denied access.
* **Consent Table Metadata:** Displays doctor specialization (e.g., Cardiology, Endocrinology, Pulmonology), affiliated hospital facility, and geographic location (City, State).

---

## 🗄️ Database Architecture & BCNF Schema

The relational schema is structured in **Boyce-Codd Normal Form (BCNF)** and enforces referential integrity:

### Entity Relationship Model

```mermaid
erDiagram
    HOSPITAL ||--o{ DOCTOR : employs
    HOSPITAL ||--o{ VISIT : hosts
    HOSPITAL ||--o{ CONSENT : "receives consent"
    PATIENT ||--o{ VISIT : has
    PATIENT ||--o{ CONSENT : grants
    PATIENT ||--o{ AUDIT_LOG : tracks
    DOCTOR ||--o{ VISIT : conducts
    DOCTOR ||--o{ CONSENT : "receives consent"
    DOCTOR ||--o{ AUDIT_LOG : performs
    VISIT ||--o{ DIAGNOSIS : contains
    VISIT ||--o{ PRESCRIPTION : generates
    VISIT ||--o{ LAB_TEST : orders
```

### Table Breakdown

| Table | Primary Key | Foreign Keys | Delete Rule | Description |
| :--- | :--- | :--- | :--- | :--- |
| `patient` | `patient_id` | — | RESTRICT | Demographics, contact info, unique email. |
| `hospital` | `hospital_id` | — | RESTRICT | Accredited hospital facilities, addresses, and registration numbers. |
| `doctor` | `doctor_id` | `hospital_id` → `hospital` | RESTRICT | Doctors with license numbers, specializations, and hospital affiliations. |
| `visit` | `visit_id` | `patient_id`, `hospital_id`, `doctor_id` | RESTRICT | Clinical encounter records (OPD, Emergency, Inpatient). |
| `diagnosis` | `diagnosis_id`| `visit_id` → `visit` | **CASCADE** | ICD-10 diagnostic codes and clinical notes. |
| `prescription`| `prescription_id`| `visit_id` → `visit`| **CASCADE** | Medications, dosage, frequency, and duration. |
| `lab_test` | `lab_test_id` | `visit_id` → `visit` | **CASCADE** | Diagnostic lab results, units, flags, and test dates. |
| `consent` | `consent_id` | `patient_id`, `hospital_id` (opt), `doctor_id` (opt) | RESTRICT | Dynamic access permissions (`Active` / `Revoked`). |
| `audit_log` | `log_id` | `patient_id`, `doctor_id` (opt) | RESTRICT / SET NULL | Immutable audit trail (`READ`, `INSERT`, `EMERGENCY_OVERRIDE`, `CONSENT_CHANGE`, `DENIED`). |

---

## 📁 Repository Structure

```
arogya-link/
├── README.md                      # Project root documentation (this file)
├── docker-compose.yml             # Full-stack container orchestration
├── database/
│   ├── init_migration_001.sql     # PostgreSQL schema DDL (tables, views, functions, triggers)
│   ├── initial_mock_data_load_fixed.sql # Multi-hospital seed dataset (5,000 patients, 50 hospitals)
│   └── seed_demo_consents.sql     # Demo consent generation & sequence synchronization
├── frontend/                      # Next.js 16 Web Application (App Router)
│   ├── src/
│   │   ├── app/                   # Portal pages (/dashboard, /consents, /patients, /audit)
│   │   │   ├── api/auth/session/  # Authentication session handlers (POST, DELETE)
│   │   │   ├── globals.css        # Neo-brutalist styles and 3D lever CSS
│   │   │   └── page.tsx           # Interactive landing page with authentication card
│   │   ├── components/            # UI Components (NavLinks, ThemeToggle, AuthCard, etc.)
│   │   └── lib/                   # API client, store, Firebase client, session manager
│   ├── Dockerfile                 # Multi-stage optimized standalone production image
│   └── package.json
└── backend/                       # FastAPI Python Backend
    ├── main.py                    # Application entry point with CORS & routers
    ├── requirements.txt           # Python dependencies (FastAPI, SQLAlchemy, Psycopg, Uvicorn)
    ├── Dockerfile                 # Container specification
    └── src/
        ├── core/                  # Database configuration & session factories
        ├── models/                # SQLAlchemy ORM models (BCNF)
        └── routers/               # Modular REST endpoints (hospitals, doctors, consents, audit)
```
