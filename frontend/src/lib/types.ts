// Types mirror the PostgreSQL schema from Digital Assignment 2 (section 2).

export type Gender = "M" | "F" | "O";
export type VisitType = "OPD" | "Emergency" | "Inpatient";
export type ConsentStatus = "Active" | "Revoked";
export type Role = "patient" | "doctor" | "admin";

export interface Patient {
  patient_id: string;
  full_name: string;
  date_of_birth: string; // YYYY-MM-DD
  gender: Gender;
  blood_group: string | null;
  contact_number: string;
  email: string | null;
}

export interface Hospital {
  hospital_id: string;
  hospital_name: string;
  address: string;
  contact_number: string;
  registration_no: string;
}

export interface Doctor {
  doctor_id: string;
  hospital_id: string;
  full_name: string;
  specialization: string;
  license_number: string;
  email?: string | null;
}

export interface Visit {
  visit_id: number;
  patient_id: string;
  hospital_id: string;
  doctor_id: string;
  visit_date: string; // YYYY-MM-DDTHH:mm:ss
  visit_type: VisitType;
  chief_complaint: string | null;
}

export interface Diagnosis {
  diagnosis_id: number;
  visit_id: number;
  disease_code: string;
  description: string;
  diagnosed_date: string;
}

export interface Prescription {
  prescription_id: number;
  visit_id: number;
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

export interface LabTest {
  lab_test_id: number;
  visit_id: number;
  test_name: string;
  result: string | null;
  unit: string | null;
  test_date: string;
}

export interface Consent {
  consent_id: number;
  patient_id: string;
  hospital_id: string | null;
  doctor_id: string | null;
  start_date: string;
  end_date: string | null;
  status: ConsentStatus;
}

export interface AuditLogEntry {
  log_id: number;
  patient_id: string;
  doctor_id: string | null;
  action: string;
  action_time: string;
  details: string | null;
}

export interface Session {
  role: Role;
  id: string | null; // patient_id or doctor_id; null for admin
  email?: string | null;
  displayName?: string | null;
}

// ---- Derived shapes (the views from section 11 of the assignment) ----

export interface TimelineEntry extends Visit {
  hospital_name: string;
  doctor_name: string;
  diagnoses: Diagnosis[];
  prescriptions: Prescription[];
  labs: LabTest[];
}

export interface DuplicateLab {
  patient_id: string;
  patient_name: string;
  test_name: string;
  times_run: number;
  first_date: string;
  last_date: string;
  hospital_count: number;
  hospitals: string[];
}

export interface HospitalCaseload {
  hospital_id: string;
  hospital_name: string;
  doctor_count: number;
  visit_count: number;
  patient_count: number;
  emergency_visits: number;
  opd_visits: number;
  inpatient_visits: number;
}
