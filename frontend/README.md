# AarogyaLink frontend

Next.js (App Router) + React + TypeScript, running on Node.js. It implements the platform from *Digital Assignment 1 & 2*: one patient profile across hospitals, patient-controlled consent, a consent-gated unified chart, duplicate lab-test checks and a full audit trail.

The UI follows the `hospital-dashboard-design` system: a strict 60-30-10 palette (white, light blue, and maroon only for things a person must act on), Inter type, soft cards, and a responsive shell that switches layout mode by aspect ratio (`tall`, `portrait`, `standard`, `wide`, `ultra`, set as `data-shell` on `<html>`). The 3D tower loader (`src/components/TowerLoader*`) is the loading state and brand mark, coloured with the palette's blue ramp.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
```

```bash
npm run build && npm start   # production server on Node.js
npm run lint
npm run typecheck
```

Or with Docker, from the repository root: `docker compose up --build frontend`.

## How it works

- `src/lib/sample-data.ts` is the Assignment 2 data set: 3 hospitals, 6 doctors, 6 patients, 13 visits, 14 diagnoses, 17 prescriptions, 20 lab tests, 13 consents and 31 audit entries.
- `src/lib/store.ts` is an in-memory store on the Node server that mirrors the SQL objects: `fn_has_consent`, `sp_grant_consent`, the `visit_audit` trigger and the `v_patient_timeline`, `v_duplicate_lab_tests` and `v_hospital_caseload` views. Restarting the server resets it to the sample data.
- `src/lib/actions.ts` holds the server actions (sign-in, consent, record visit, emergency access, register patient).
- `src/app/api/*` are Node route handlers: `/api/health`, `/api/hospitals`, `/api/doctors`, `/api/patients`, `/api/patients/:id/history` (consent-gated and audited) and `/api/duplicates`.
- Sign-in is a persona picker with no passwords, intended for demos only.

## Roles

| Role | Can do |
|---|---|
| Patient | See own timeline, results and medicines, grant/revoke consent (with confirmation), read access history |
| Doctor | Search patients, open a consented chart (or use audited emergency access), record visits, see repeat-test alerts |
| Administrator | Network overview, hospitals and doctors, patient registry, full audit log (no clinical records) |

## Design-system details

- **Attention system** (`src/lib/attention.ts`, `src/lib/lab-ranges.ts`): each role gets a "Needs attention (n)" summary, nav badges and a bell dot. Rules include critical lab values, consents ending soon, medicines about to run out, emergency overrides and blocked access attempts. Lab thresholds are illustrative, not clinical guidance.
- **Privacy in the UI**: patient IDs and phone numbers are masked until revealed, page titles and URLs carry no names or diagnoses, consented views say who can see them, and doctor/admin screens blur after two idle minutes.
- **Zero overflow**: tables scroll inside a wrapper or turn into stacked cards in narrow containers, grids use `minmax(0, 1fr)` and `min(100%, N)`, and every layout was checked at 320x640 up to 5120x1440.
- **Keyboard (doctors)**: `/` search, `]` next patient, `[` previous patient.
