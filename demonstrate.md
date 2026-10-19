# AarogyaLink — Demonstration Personas Guide

This guide details the pre-configured demonstration accounts available via the 1-Click Instant Login panel on the AarogyaLink landing page. Each persona showcases a distinct workflow, security permission tier, or database scenario.

**Universal Demo Password:** `AarogyaLink@123`

---

## 1. Patient Accounts

### A. Mudit Jha
- **Email:** `mudit@gmail.com`
- **Role:** Patient (`PAT-IN-105001`)
- **Clinical Scenario:** 
  - Recently granted **Active Consent** to Apollo Hospitals and directly to `Dr. Rohan Mehta` (`DOC-01`).
  - Active prescriptions and recent lab tests recorded.
- **What to Demonstrate:**
  - Log in as Mudit Jha to view active consents under `/consents`.
  - Notice that Apollo Hospitals and Dr. Rohan Mehta are listed as authorized entities.
  - Log out and log in as `Dr. Rohan Mehta` &rarr; Navigate to `/patients` &rarr; Mudit Jha appears with the green **Allowed** badge and can be treated directly.

---

### B. Karthik Iyer
- **Email:** `karthik.iyer@example.in`
- **Role:** Patient (`PAT-IN-1002`)
- **Clinical Scenario:**
  - Multi-hospital historical data spanning Apollo Hospitals Chennai and Fortis Hospital Bengaluru.
  - Ongoing treatments: Type 2 Diabetes Mellitus, Essential Hypertension.
  - Active prescriptions: Metformin, Telmisartan.
- **What to Demonstrate:**
  - Log in as Karthik Iyer &rarr; View longitudinal unified timeline aggregating care across multiple hospital networks.
  - Demonstrates cross-hospital longitudinal health records and the duplicate diagnostic check (`v_duplicate_lab_tests`).

---

### C. Devansh Gupta
- **Email:** `devansh.gupta@example.in`
- **Role:** Patient (`PAT-IN-1006`)
- **Clinical Scenario:**
  - Has consent registered **only** for Fortis Hospital Bengaluru (`HSP1002`) and `Dr. Arjun Singh` (`DOC-03`).
  - Has **zero consent** granted to Apollo Hospitals or `Dr. Rohan Mehta`.
- **What to Demonstrate:**
  - Log in as `Dr. Rohan Mehta` (Apollo) &rarr; Go to `/patients` &rarr; Switch to **All Patients** &rarr; Devansh Gupta shows **`No consent`**.
  - Attempting to open chart triggers access blocking and records an audited `DENIED` entry.
  - **Emergency Override Demonstration:** Dr. Rohan Mehta fills out the **Emergency Access (Break-Glass)** form with a clinical justification &rarr; grants a 30-minute audited window and logs `EMERGENCY_OVERRIDE` to PostgreSQL `audit_log`.

---

### D. Meera Nair
- **Email:** `meera.nair@example.in`
- **Role:** Patient (`PAT-IN-1005`)
- **Clinical Scenario:**
  - Senior patient with multiple critical lab results (Elevated HbA1c, elevated LDL Cholesterol, abnormal TSH).
- **What to Demonstrate:**
  - Log in as Meera Nair &rarr; Dashboard automatically flags out-of-range critical diagnostic results (`LabChip` critical tags).
  - Open doctor dashboard with active consent &rarr; Doctor receives urgent clinical attention notifications.

---

## 2. Doctor Accounts

### A. Dr. Rohan Mehta
- **Email:** `rohan.mehta@example.in`
- **Role:** Doctor (`DOC-01`)
- **Hospital:** Apollo Hospitals Chennai (`HSP1001`)
- **Specialization:** Cardiology
- **What to Demonstrate:**
  - Default view on `/patients` filters strictly to **`Allowed Consent`** patients (Mudit Jha, Karthik Iyer, Meera Nair).
  - Opening patient charts (`/patients/[id]`) automatically writes tamper-evident `READ` audit logs.
  - Clinical visit recording form (`/visits/new?patient=...`) allows recording diagnoses, prescriptions, and lab tests, triggering database trigger `tr_visit_audit`.

---

### B. Dr. Nisha Kapoor
- **Email:** `nisha.kapoor@example.in`
- **Role:** Doctor (`DOC-04`)
- **Hospital:** Fortis Healthcare Bengaluru (`HSP1002`)
- **Specialization:** Internal Medicine
- **What to Demonstrate:**
  - Access control segregation: Can access Fortis-consented patients (like Devansh Gupta), demonstrating network-isolated permissions.

---

### C. Dr. Vikram Sharma
- **Email:** `vikram.sharma@example.in`
- **Role:** Doctor (`DOC-05`)
- **Hospital:** AIIMS New Delhi (`HSP1005`)
- **Specialization:** Orthopedics
- **What to Demonstrate:**
  - Demonstrates public health / apex institute access within the cross-network exchange.

---

## 3. Administrator Account

### Central Admin
- **Email:** `admin@arogyalink.in`
- **Role:** System Administrator
- **What to Demonstrate:**
  - `/hospitals` &rarr; Hospital Caseload Analytics aggregating volume, department breakdown, and doctor headcounts via database view `v_hospital_caseload`.
  - `/duplicates` &rarr; Cross-Hospital Duplicate Lab Test Detection via multi-table self-join view `v_duplicate_lab_tests`.
  - `/audit` &rarr; Complete compliance audit trail with categorized tabs (`Reads`, `Denied`, `Emergency`, `Consent`, `Visits`).
  - `/patients` &rarr; National Patient Registry with consent distribution breakdown across hospitals.
