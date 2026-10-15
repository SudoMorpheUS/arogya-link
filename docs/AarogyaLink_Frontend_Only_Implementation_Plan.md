# AarogyaLink --- Frontend Implementation Plan

**Project:** Multi-Hospital Health Data Sharing Platform\
**Scope:** Frontend implementation only. The backend is being developed
separately; the frontend should integrate with its actual API contract,
and backend changes can be made as needed to support the agreed UI.

## 1. Frontend goal

Build a responsive web application that lets different kinds of users
work with shared health records according to their roles:

-   **Doctor:** Search for patients and view authorized cross-hospital
    medical history.
-   **Hospital Admin:** Manage users and activity within their hospital
    and review hospital-level statistics.
-   **Patient:** View their own records and manage consent through the
    supported workflow.
-   **Platform Admin:** Manage the wider hospital network and monitor
    platform-level activity.

The app should present different dashboards, navigation, pages, and
available actions for each role. The core demo flow is:

**Sign in → Load role and hospital context → Show the appropriate
dashboard → Perform role-appropriate actions.**

Use synthetic demo data only. Do not place real patient data or secrets
in the frontend repository.

## 2. Recommended frontend stack

-   React + Vite + TypeScript
-   React Router for navigation
-   CSS Modules or a consistent global CSS system
-   TanStack Query (recommended) or a consistent custom hook pattern for
    API loading/caching
-   `fetch` or Axios through one shared API client
-   Optional chart library for dashboard visualizations

Reuse the current frontend stack and installed dependencies if a project
already exists; avoid replacing working setup unnecessarily.

## 3. Suggested frontend folder structure

``` text
frontend/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── routes/
│   │   ├── AppRoutes.tsx
│   │   └── RoleGuard.tsx
│   ├── layouts/
│   │   ├── AppLayout.tsx
│   │   └── AuthLayout.tsx
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── dashboards/
│   │   │   ├── DoctorDashboard.tsx
│   │   │   ├── HospitalAdminDashboard.tsx
│   │   │   ├── PatientDashboard.tsx
│   │   │   └── PlatformAdminDashboard.tsx
│   │   ├── PatientSearchPage.tsx
│   │   ├── PatientProfilePage.tsx
│   │   ├── VisitDetailsPage.tsx
│   │   ├── ConsentPage.tsx
│   │   ├── DuplicateTestsPage.tsx
│   │   ├── HospitalsPage.tsx
│   │   ├── DoctorsPage.tsx
│   │   ├── UsersPage.tsx
│   │   ├── AuditLogPage.tsx
│   │   ├── AccessDeniedPage.tsx
│   │   └── NotFoundPage.tsx
│   ├── components/
│   │   ├── Sidebar.tsx
│   │   ├── Topbar.tsx
│   │   ├── PageHeader.tsx
│   │   ├── StatCard.tsx
│   │   ├── DataTable.tsx
│   │   ├── SearchInput.tsx
│   │   ├── FilterBar.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── ConfirmDialog.tsx
│   │   ├── LoadingState.tsx
│   │   ├── EmptyState.tsx
│   │   └── ErrorState.tsx
│   ├── features/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── patients/
│   │   ├── timeline/
│   │   ├── consent/
│   │   ├── users/
│   │   ├── duplicate-tests/
│   │   └── audit/
│   ├── api/
│   │   ├── client.ts
│   │   └── endpoints.ts
│   ├── hooks/
│   ├── types/
│   ├── utils/
│   └── styles/
├── .env.example
├── package.json
└── vite.config.ts
```

This is a suggested organization, not a requirement to create every file
immediately.

## 4. Role-based application design

### 4.1 Shared login and session initialization

All four roles use the same login page unless the product later requires
separate branded entry points.

**Login UI** - AarogyaLink logo/name and a concise explanation. -
Email/username and password fields. - Show/hide password control. -
Sign-in button, validation, loading state, and generic invalid-login
message. - Optional demo-account information in development mode only.

**After login** 1. Call the backend login endpoint. 2. Fetch the current
user's identity and role. 3. Load the user's hospital scope, if
applicable. 4. Redirect to the correct role dashboard. 5. Render only
the navigation and actions appropriate for that role.

Suggested role values (align these with the actual backend): `doctor`,
`hospital_admin`, `patient`, `platform_admin`.

If the API returns an unknown role, show a safe access-denied page
rather than guessing which dashboard to display.

### 4.2 Doctor view

**Purpose:** Support clinical work and authorized cross-hospital record
access.

**Dashboard** - Patients recently viewed or recently handled, if the API
supports this. - Recent visits. - Quick patient search. - Active
access/consent status relevant to the doctor. - Potential duplicate lab
tests requiring review. - Recent permitted activity.

**Navigation** - Dashboard - Patient Search - My Visits / Visit
Details - Duplicate Tests - Consent Status - Profile / Sign Out

**Pages and actions** - Search patients by permitted identifiers. - Open
a patient profile only if the API authorizes access. - View the
longitudinal timeline: visits, diagnoses, prescriptions, and lab
tests. - See which hospital/doctor is accessing the record and why
access is available or denied. - Create a visit if that action is part
of the agreed project scope and the user is authorized. - View
duplicate-test flags as possible repeats, not clinical conclusions.

**Restrictions** - Do not expose records just because the doctor can
search for a patient. - Handle missing, expired, or revoked consent
states clearly. - Only show fields and actions provided for the doctor's
role.

### 4.3 Hospital Admin view

**Purpose:** Manage the hospital's local users and operational overview.

**Dashboard** - Patient count relevant to the hospital. - Doctor and
staff counts. - Visits by type (OPD, Emergency, Inpatient). - Recent
hospital activity. - Hospital-level audit events, if permitted.

**Navigation** - Dashboard - Hospital Overview - Doctors - Staff /
Users - Visits or Hospital Activity - Audit Log - Profile / Sign Out

**Pages and actions** - View hospital details and caseload. - Browse
doctors assigned to that hospital. - Manage hospital staff accounts or
roles only if the backend supports those operations. - Review
hospital-scoped activity/audit events. - View operational statistics
limited to the admin's hospital.

**Restrictions** - Do not show other hospitals' private data or
network-wide patient records by default. - Hide platform-wide
configuration and hospital onboarding actions. - Do not render
create/edit/delete controls unless the backend supports the operation
and the current role is permitted to use it.

### 4.4 Patient view

**Purpose:** Give patients a clear, read-focused view of their own
health history and permissions.

**Dashboard** - Personal profile summary. - Recent visits. - Recent lab
results. - Current active consent permissions. - Quick access to medical
timeline and consent management.

**Navigation** - My Dashboard - My Medical Records - My Visits - My Lab
Results / Prescriptions - Consent & Sharing - Profile / Sign Out

**Pages and actions** - View only the signed-in patient's own profile
and timeline. - Browse visits, diagnoses, prescriptions, and lab
results. - See which hospital/doctor currently has access, the scope of
that access, and any expiry date returned by the API. - Grant or revoke
consent if the backend's consent policy supports patient self-service. -
View a history of consent changes if the API exposes it.

**Restrictions** - Never provide a patient search page that lets a
patient browse other people's records. - Do not allow patients to edit
clinician-authored diagnoses or prescriptions unless that is an explicit
product requirement. - Do not show consent-request workflows or pending
requests unless the backend actually implements them.

### 4.5 Platform Admin view

**Purpose:** Provide network-level system administration across
participating hospitals.

**Dashboard** - Total participating hospitals. - Total doctors and staff
accounts. - Aggregate patient and visit counts. - Network-level usage
trends. - System activity and security/audit summaries. -
Integration/service status only if the API provides it.

**Navigation** - Platform Dashboard - Hospitals - Users / Accounts -
Network Statistics - Audit & Activity - Configuration (only if
supported) - Profile / Sign Out

**Pages and actions** - Browse participating hospitals and network-level
caseload. - Manage hospital onboarding or accounts only if supported by
backend APIs. - Review platform-level audit events. - View aggregate
statistics across hospitals. - Manage platform configuration only where
actual API operations exist.

**Restrictions** - Platform admin access should not automatically imply
unrestricted clinical-record access. Keep operational administration
separate from clinical authorization. - Do not show controls that the
backend cannot execute. - Limit patient-identifiable data in
network-wide summaries.

### 4.6 Role comparison matrix

  -------------------------------------------------------------------------------------------------
  Feature         Doctor                  Hospital Admin    Patient        Platform Admin
  --------------- ----------------------- ----------------- -------------- ------------------------
  Role-specific   Yes                     Yes               Yes            Yes
  dashboard                                                                

  Search for      Yes, permission-checked Only if policy    No             Only if separately
  patients                                allows                           authorized

  View clinical   With                    Only if           Own records    Not by default
  timeline        authorization/consent   explicitly                       
                                          authorized                       

  Create visit    If enabled/authorized   Not by default    No             No

  View own        Yes, as needed          Yes               No             Yes, network-wide
  hospital's                                                               
  doctors                                                                  

  Manage hospital No, unless granted      Within own        No             Network-level if enabled
  staff                                   hospital, if                     
                                          enabled                          

  Grant/revoke    Only if policy permits  Only if policy    For own        Not by default
  consent                                 permits           records if     
                                                            supported      

  Review          Authorized              Hospital-scoped   No, unless     Aggregate/system-level
  duplicate tests patient-related data    summary if        product        only by default
                                          allowed           explicitly     
                                                            offers it      

  View audit logs Limited if permitted    Hospital-scoped   Own consent    Platform-level if
                                          if permitted      history if     permitted
                                                            available      

  Manage          No                      Own hospital      No             If backend supports it
  hospitals                               details only                     

  View            No by default           No by default     No             Yes, preferably
  network-wide                                                             aggregate
  analytics                                                                
  -------------------------------------------------------------------------------------------------

This matrix is a proposed product design. Confirm the actual permission
policy with the backend and assignment requirements; frontend role
checks must mirror the API's policy.

## 5. Role-aware navigation and routing

Create a central navigation configuration rather than scattering role
checks across components.

Example concept (adapt names to your code):

``` ts
type UserRole = "doctor" | "hospital_admin" | "patient" | "platform_admin";

type NavItem = {
  label: string;
  path: string;
  allowedRoles: UserRole[];
};
```

Recommended routing behavior: - `/login` --- public login. -
`/dashboard` --- redirects to the correct dashboard based on the
authenticated role. - `/doctor/*` --- doctor pages. -
`/hospital-admin/*` --- hospital administration pages. - `/patient/*`
--- patient portal pages. - `/platform-admin/*` --- platform
administration pages. - Shared pages such as patient details must still
check role and API response before rendering. - Unknown roles and
unauthorized routes should display an access-denied page. - After
logout, redirect to login and clear cached protected data.

Role-aware navigation is a user-experience feature, not a security
boundary. The backend must authorize every protected request.

## 6. Shared pages and reusable components

Build shared UI elements once and reuse them across roles: -
`AppLayout`, `Sidebar`, `Topbar`, `Breadcrumbs` - `PageHeader`,
`StatCard`, `DataTable`, `Pagination` - `SearchInput`, `FilterBar`,
`DateRangeFilter` - `StatusBadge`, `ConsentStatus`, `VisitTypeBadge`,
`RoleBadge` - `FormField`, `Modal`, `ConfirmDialog` - `LoadingState`,
`EmptyState`, `ErrorState` - `PatientSummaryCard`, `VisitTimeline`,
`VisitCard` - `DiagnosisList`, `PrescriptionList`, `LabResultTable` -
`ConsentTable`, `ConsentForm` - `DuplicateTestTable`, `AuditLogTable` -
`ProtectedRoute`, `RoleGuard`, `AccessDeniedPage`

The same underlying component can render different fields/actions based
on the authorized response, but avoid turning every role into one
overloaded dashboard. Use role-specific dashboard pages with shared
cards and table components.

Accessibility requirements: - Semantic buttons and links. - A visible
label for every input. - Keyboard navigation and visible focus. -
Adequate contrast and responsive layouts. - Never rely on color alone to
communicate status.

## 7. Other application pages

### Patient search

-   Search by patient ID/name only where permitted.
-   Server-side pagination and filters.
-   Show only fields allowed by the API.
-   Distinguish no results, access denied, and network failure.

### Patient profile and timeline

-   Patient summary and access/consent status.
-   Visits, diagnoses, prescriptions, lab results, doctor, and hospital.
-   Expandable visit cards and newest-first ordering.
-   Patient users see only their own record.

### Consent management

-   List permission scope, target hospital/doctor, start/end date, and
    status.
-   Grant/revoke controls only for roles allowed by the API.
-   Confirmation before revocation.
-   Refresh the state only after server confirmation.
-   Do not display pending requests unless the backend has a real
    request workflow.

### Duplicate lab tests

-   Potential duplicate test name, patient reference where permitted,
    dates, and hospitals.
-   Filters if supported by the API.
-   Describe them as potential duplicates for human review.

### Hospital directory

-   Hospital details and appropriate caseload fields.
-   Hospital admins see their own hospital context; platform admins may
    see the network.

### Doctor directory

-   Doctor name, specialization, and hospital.
-   License number only when necessary and permitted.

### Audit log

-   Timestamp, actor, action, patient reference if permitted, and
    details.
-   Role-scoped events and server-side pagination.
-   Read-only interface; render only events actually recorded by the
    backend.

### Visit details / visit creation

-   View encounter information and linked clinical data.
-   Optional create-visit form if required.
-   Do not render mutation controls before the API operation is
    available.

## 8. Suggested frontend folder structure

``` text
frontend/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── routes/
│   │   ├── AppRoutes.tsx
│   │   └── RoleGuard.tsx
│   ├── layouts/
│   │   ├── AppLayout.tsx
│   │   └── AuthLayout.tsx
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── dashboards/
│   │   │   ├── DoctorDashboard.tsx
│   │   │   ├── HospitalAdminDashboard.tsx
│   │   │   ├── PatientDashboard.tsx
│   │   │   └── PlatformAdminDashboard.tsx
│   │   ├── PatientSearchPage.tsx
│   │   ├── PatientProfilePage.tsx
│   │   ├── VisitDetailsPage.tsx
│   │   ├── ConsentPage.tsx
│   │   ├── DuplicateTestsPage.tsx
│   │   ├── HospitalsPage.tsx
│   │   ├── DoctorsPage.tsx
│   │   ├── UsersPage.tsx
│   │   ├── AuditLogPage.tsx
│   │   ├── AccessDeniedPage.tsx
│   │   └── NotFoundPage.tsx
│   ├── components/
│   ├── features/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── patients/
│   │   ├── timeline/
│   │   ├── consent/
│   │   ├── users/
│   │   ├── duplicate-tests/
│   │   └── audit/
│   ├── api/
│   │   ├── client.ts
│   │   └── endpoints.ts
│   ├── hooks/
│   ├── types/
│   ├── utils/
│   └── styles/
├── .env.example
├── package.json
└── vite.config.ts
```

Treat this as a target structure, not a requirement to create every file
in one go.

## 9. API integration contract

The following are frontend data/action needs, not claims that these
endpoints already exist. Map them to the actual backend routes as they
become available.

  -----------------------------------------------------------------------
  Feature                             Frontend needs
  ----------------------------------- -----------------------------------
  Login/logout                        Authenticate and end session

  Current user                        User ID/name, role, hospital scope

  Dashboard                           Role-scoped summary counts and
                                      recent activity

  Patient search                      Authorized search results and
                                      pagination

  Patient profile                     Permitted patient summary

  Timeline                            Visits plus diagnoses,
                                      prescriptions, labs

  Visit details                       One encounter and related records

  Consent list                        Relevant consent entries and status

  Grant/revoke consent                Submit action and receive confirmed
                                      updated state

  Duplicate tests                     Potential duplicate records and
                                      supported filters

  Hospitals                           Role-scoped hospital list/details

  Doctors                             Role-scoped doctor list/details

  Users                               Accounts and actions available to
                                      the current role

  Audit log                           Authorized paginated events
  -----------------------------------------------------------------------

For each endpoint, document method/path, query parameters, request body,
response example, error shape, pagination format, authentication, and
permitted roles.

## 10. API client and environment setup

-   Put the API base URL in one variable such as `VITE_API_BASE_URL`.
-   Create one shared API client for credentials, JSON parsing, and
    normalized errors.
-   Keep TypeScript API types in `src/types`.
-   Use one consistent loading/caching/refetch pattern.
-   Clear protected cached data on logout or session expiry.
-   Refresh affected views after a successful mutation.
-   Never place PostgreSQL credentials or backend secrets in `VITE_*`
    variables; they are visible in the browser bundle.
-   If cookie authentication is used, coordinate credential handling,
    CORS, and CSRF with the backend.

## 11. Implementation phases

### Phase 1 --- Foundation

-   Inspect the existing frontend repository and retain its stack if
    already configured.
-   Set up routing, shared styles, application/auth layouts, and role
    guards.
-   Build navigation and page placeholders for all four roles.
-   Create loading, empty, error, table, and badge components.

**Done when:** the app is navigable and each role can be previewed with
a development fixture.

### Phase 2 --- Role-specific dashboards

-   Build the four distinct dashboards.
-   Add a central role-to-dashboard and role-to-navigation mapping.
-   Use mock fixtures where API endpoints are not ready.
-   Keep mock data separate from API service code.

**Done when:** each role sees the correct dashboard and menu using a
test user fixture.

### Phase 3 --- Patient search and timeline

-   Build patient search and results.
-   Build patient profile and timeline.
-   Add permission-denied, no-results, loading, and error states.
-   Connect real APIs as they become available.

**Done when:** a synthetic patient timeline renders from the API and
patient users can only access their own profile.

### Phase 4 --- Consent UI

-   Build consent list, grant form, revoke confirmation, and status
    badges.
-   Display only actions supported for the current role.
-   Refresh related state after the server confirms changes.

**Done when:** the UI reflects server-confirmed consent status.

### Phase 5 --- Administration and supporting modules

-   Build hospital/doctor directories.
-   Build hospital staff/user management if supported.
-   Build duplicate-test review and audit log.
-   Build network-level platform admin pages.

**Done when:** each page renders real API data with role-appropriate
fields and actions.

### Phase 6 --- Polish and testing

-   Add responsive layout and accessibility improvements.
-   Test all four roles, including attempts to visit routes they should
    not see.
-   Test long text, empty data, expired sessions, network errors, and
    denied access.
-   Remove mock data from production paths.
-   Prepare a repeatable demo flow.

## 12. Frontend testing checklist

-   [ ] Each role redirects to its own dashboard after sign-in.
-   [ ] Each role sees only its allowed navigation items.
-   [ ] Direct navigation to a disallowed route shows access denied.
-   [ ] Patient users cannot search or open another patient's record.
-   [ ] Doctor timeline views handle consent-denied responses correctly.
-   [ ] Hospital admins see only their permitted hospital context.
-   [ ] Platform admin analytics do not unnecessarily expose clinical
    details.
-   [ ] Grant/revoke UI waits for the API response and handles errors.
-   [ ] Search supports Enter, pagination, no results, and API failure.
-   [ ] Loading states prevent duplicate form submissions.
-   [ ] Logout clears protected UI data.
-   [ ] Tables work on narrow screens and support keyboard navigation.
-   [ ] No credentials or sensitive records are written to console logs.
-   [ ] Mock fixtures can be replaced with API calls without rewriting
    page components.

## 13. Design direction

Create a **clinical operations dashboard**, not a public marketing
website.

-   Compact sidebar and simple top bar.
-   Clear page title and breadcrumbs.
-   Summary cards above tables.
-   Expandable visit cards for detailed records.
-   Restrained navy/blue base with teal accents; reserve red for
    errors/warnings.
-   Readable typography and consistent spacing.
-   Desktop-first for hospital staff, still usable on tablet/mobile.
-   Clear role, hospital context, and consent/access indicators.
-   Patient portal should feel simpler and more personal than admin
    dashboards.

## 14. Definition of done

-   [ ] Frontend runs using documented commands.
-   [ ] Four distinct role-specific dashboards exist.
-   [ ] Role-aware navigation and route handling work.
-   [ ] Patient search/profile/timeline render API data when available.
-   [ ] Patient view is restricted to the signed-in patient's own
    records.
-   [ ] Consent UI shows supported actions and server-confirmed
    outcomes.
-   [ ] Hospital admin and platform admin views have different scopes.
-   [ ] Doctors can access clinical screens only when authorized.
-   [ ] Duplicate-test, hospital, doctor, user, and audit screens handle
    loading/empty/error states.
-   [ ] API types and endpoint mappings are centralized.
-   [ ] Mock data is isolated and removable.
-   [ ] No backend secrets or real patient data are exposed in frontend
    code.

## 15. Immediate next steps

1.  Inspect the existing frontend folder and run the app.
2.  Build shared layout, routes, and role-aware navigation.
3.  Add development fixtures for doctor, hospital admin, patient, and
    platform admin accounts.
4.  Build all four dashboards and verify role switching.
5.  Build patient search and timeline with mock data.
6.  Agree on API request/response examples as backend endpoints become
    available.
7.  Connect real APIs feature by feature.
8.  Finish consent, duplicate tests, hospital/doctor directories, audit,
    and user management.
9.  Test role restrictions and polish the demo.

**Recommended priority:** Role-based shell → four dashboards → patient
search → patient timeline → consent UI → duplicate tests →
hospital/doctor/user management → audit log.

---

## 16. Tree-Based Frontend Reference

Use this tree as a quick overview of the planned frontend modules. It is a reference structure; implement features in phases rather than creating every page at once.

```text
AAROGYALINK
│
├── 1. AUTHENTICATION
│   ├── Login Page
│   │   ├── Username / Email
│   │   ├── Password + Show / Hide
│   │   └── Validation, Loading, and Error States
│   ├── Load Current User
│   │   ├── User Role
│   │   └── Hospital Context (when applicable)
│   └── Logout
│
├── 2. ROLE-BASED DASHBOARDS
│   ├── A. DOCTOR
│   │   ├── Dashboard Statistics / Recent Activity
│   │   ├── Patient Search
│   │   ├── Patient Profile and Medical Timeline
│   │   │   ├── Visits
│   │   │   ├── Diagnoses
│   │   │   ├── Prescriptions
│   │   │   └── Lab Results
│   │   ├── Visit Details / Create Visit (if supported)
│   │   ├── Consent / Access Status
│   │   └── Potential Duplicate Lab Tests
│   │
│   ├── B. HOSPITAL ADMIN
│   │   ├── Hospital Statistics and Overview
│   │   ├── Doctor Directory
│   │   ├── Staff / User Management (if supported)
│   │   ├── Hospital Visit Statistics
│   │   └── Hospital-Scoped Audit Logs
│   │
│   ├── C. PATIENT
│   │   ├── Personal Dashboard and Profile
│   │   ├── My Medical Records / Timeline
│   │   ├── My Visits
│   │   ├── My Prescriptions
│   │   ├── My Lab Results
│   │   └── Consent and Sharing
│   │       ├── View Active Permissions
│   │       ├── Grant Consent (if supported)
│   │       ├── Revoke Consent (if supported)
│   │       └── Consent History (if available)
│   │
│   └── D. PLATFORM ADMIN
│       ├── Network Statistics / Aggregate Analytics
│       ├── Hospital Management (if supported)
│       ├── User / Account Management (if supported)
│       ├── Platform Audit Logs
│       └── Configuration (if supported)
│
├── 3. SHARED APPLICATION MODULES
│   ├── Patient Search and Profiles (permission-aware)
│   ├── Medical Timeline
│   ├── Hospital Directory
│   ├── Doctor Directory
│   ├── Consent Management
│   ├── Duplicate Lab-Test Review
│   └── Audit Log Viewer
│
├── 4. REUSABLE UI COMPONENTS
│   ├── Sidebar and Topbar
│   ├── Page Headers and Breadcrumbs
│   ├── Statistics Cards
│   ├── Data Tables and Pagination
│   ├── Search and Filter Bars
│   ├── Status / Role Badges
│   ├── Forms and Confirmation Dialogs
│   ├── Loading Indicators
│   ├── Empty States
│   ├── Error States
│   └── Toast Notifications
│
├── 5. FRONTEND INFRASTRUCTURE
│   ├── Routing
│   │   ├── Public Routes
│   │   ├── Protected Routes
│   │   └── Role-Aware Routes
│   ├── API Integration
│   │   ├── Shared API Client
│   │   ├── Endpoint Mapping
│   │   ├── Request / Response Types
│   │   └── Error Handling
│   ├── State and Data Management
│   │   ├── Authenticated User
│   │   ├── Loading and Error States
│   │   ├── Cached Data
│   │   └── Refresh After Updates
│   ├── Shared Hooks and Utilities
│   └── Styling, Responsiveness, and Accessibility
│
└── 6. TESTING AND QUALITY
    ├── Login / Logout
    ├── Role-Specific Dashboards and Navigation
    ├── Direct Access to Restricted Routes
    ├── Patient Search and Timeline
    ├── Consent Workflow UI
    ├── API Error and Empty States
    ├── Responsive Layout
    ├── Keyboard Accessibility
    └── Mock-to-API Integration
```

### How the frontend pieces connect

```text
Login
  ↓
Load authenticated user + role + hospital context
  ↓
Select the role-specific dashboard
  ├── Doctor Dashboard
  ├── Hospital Admin Dashboard
  ├── Patient Dashboard
  └── Platform Admin Dashboard
  ↓
Role-specific pages + reusable shared components
  ↓
Shared API client
  ↓
Your backend APIs
  ↓
PostgreSQL / application data
```

### Quick responsibility reference

| Area | Responsibility |
|---|---|
| Authentication | Sign-in, sign-out, and loading the current user. |
| Role-based dashboards | Different landing pages, navigation, and available actions for each of the four roles. |
| Shared modules | Reuse clinical timeline, directory, consent, and audit UI where permitted. |
| UI components | Keep forms, tables, navigation, and status displays consistent. |
| Frontend infrastructure | Handle routes, API calls, loading states, cached data, and errors. |
| Testing | Check role behavior, API states, accessibility, and responsive layouts. |

**Important:** The tree describes the planned frontend. Actions marked “if supported” depend on the actual backend APIs. Hiding a page or button is not a security boundary; the backend must enforce permissions on every protected request.
