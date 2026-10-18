"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clearSession, requireSession, setSession } from "./session";
import * as store from "./store";

export interface FormState {
  error?: string;
  ok?: string;
}

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
const list = (fd: FormData, key: string) => fd.getAll(key).map((v) => String(v).trim());

// ---------- session ----------

export interface FirebaseSessionPayload {
  email: string;
  displayName?: string | null;
  role?: "patient" | "doctor" | "admin";
  dateOfBirth?: string;
  gender?: "M" | "F" | "O";
  bloodGroup?: string;
  contactNumber?: string;
  hospitalId?: string;
  specialization?: string;
  licenseNumber?: string;
}

export async function syncFirebaseUserSession(
  payload: FirebaseSessionPayload,
): Promise<{ success: boolean; error?: string }> {
  try {
    const email = payload.email.trim().toLowerCase();
    const existing = store.findUserByEmail(email);

    let role: "patient" | "doctor" | "admin" = payload.role ?? existing?.role ?? "patient";
    let id: string | null = null;
    let name: string = payload.displayName || existing?.name || email.split("@")[0];

    if (role === "admin") {
      store.registerAdmin({ email, name });
      id = null;
    } else if (role === "doctor") {
      const doc = store.findDoctorByEmail(email);
      id = doc
        ? doc.doctor_id
        : store.registerDoctor({
            full_name: name,
            hospital_id: payload.hospitalId || "HSP-01",
            specialization: payload.specialization || "General Medicine",
            license_number: payload.licenseNumber || "MCI-NEW-001",
            email,
          });
    } else {
      const pat = store.findPatientByEmail(email);
      id = pat
        ? pat.patient_id
        : store.registerPatient({
            full_name: name,
            date_of_birth: payload.dateOfBirth || "1995-01-01",
            gender: payload.gender || "M",
            blood_group: payload.bloodGroup || "O+",
            contact_number: payload.contactNumber || "9800000000",
            email,
          });
    }

    await setSession({
      role,
      id,
      email,
      displayName: name,
    });

    return { success: true };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

export async function signIn(formData: FormData): Promise<void> {
  const role = text(formData, "role");
  const id = text(formData, "id");
  if (role === "admin") await setSession({ role: "admin", id: null });
  else if (role === "doctor" && store.getDoctor(id)) await setSession({ role: "doctor", id });
  else if (role === "patient" && store.getPatient(id)) await setSession({ role: "patient", id });
  else redirect("/?error=1");
  redirect("/dashboard");
}

export async function signOut(): Promise<void> {
  await clearSession();
  redirect("/");
}

// ---------- consent (patient) ----------

export async function grantConsentAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession(["patient"]);
  const target = text(formData, "target"); // "hospital:HSP-01" or "doctor:DOC-03"
  const [kind, targetId] = target.split(":");
  const start = text(formData, "start_date") || store.today();
  const end = text(formData, "end_date") || null;
  try {
    store.grantConsent({
      patient_id: session.id!,
      hospital_id: kind === "hospital" ? targetId : null,
      doctor_id: kind === "doctor" ? targetId : null,
      start_date: start,
      end_date: end,
    });
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/consents");
  return { ok: "Consent granted." };
}

export async function revokeConsentAction(formData: FormData): Promise<void> {
  const session = await requireSession(["patient"]);
  store.revokeConsent(Number(text(formData, "consent_id")), session.id!);
  revalidatePath("/consents");
}

// ---------- doctor ----------

export async function breakGlassAction(formData: FormData): Promise<void> {
  const session = await requireSession(["doctor"]);
  const patientId = text(formData, "patient_id");
  try {
    store.breakGlass(patientId, session.id!, text(formData, "reason"));
  } catch (e) {
    redirect(`/patients/${patientId}?error=${encodeURIComponent((e as Error).message)}`);
  }
  redirect(`/patients/${patientId}`);
}

export async function recordVisitAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession(["doctor"]);
  const patient_id = text(formData, "patient_id");

  const codes = list(formData, "dx_code");
  const descs = list(formData, "dx_desc");
  const meds = list(formData, "rx_name");
  const doses = list(formData, "rx_dose");
  const freqs = list(formData, "rx_freq");
  const durs = list(formData, "rx_dur");
  const tests = list(formData, "lab_name");
  const results = list(formData, "lab_result");
  const units = list(formData, "lab_unit");

  const diagnoses = codes
    .map((disease_code, i) => ({ disease_code, description: descs[i] ?? "" }))
    .filter((d) => d.disease_code || d.description);
  const prescriptions = meds
    .map((medicine_name, i) => ({
      medicine_name,
      dosage: doses[i] ?? "",
      frequency: freqs[i] ?? "",
      duration: durs[i] ?? "",
    }))
    .filter((p) => p.medicine_name || p.dosage || p.frequency || p.duration);
  const labTests = tests
    .map((test_name, i) => ({ test_name, result: results[i] ?? "", unit: units[i] ?? "" }))
    .filter((l) => l.test_name || l.result);

  if (diagnoses.some((d) => !d.disease_code || !d.description))
    return { error: "Each diagnosis needs both an ICD code and a description." };
  if (prescriptions.some((p) => !p.medicine_name || !p.dosage || !p.frequency || !p.duration))
    return { error: "Each prescription needs medicine, dosage, frequency and duration." };
  if (labTests.some((l) => !l.test_name)) return { error: "Each lab result needs a test name." };

  try {
    store.recordVisit({
      patient_id,
      doctor_id: session.id!,
      visit_type: text(formData, "visit_type"),
      chief_complaint: text(formData, "chief_complaint"),
      diagnoses,
      prescriptions,
      labTests,
    });
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/", "layout");
  redirect(`/patients/${patient_id}?saved=1`);
}

export async function registerPatientAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireSession(["doctor", "admin"]);
  try {
    const emailVal = text(formData, "email");
    const id = store.registerPatient({
      full_name: text(formData, "full_name"),
      date_of_birth: text(formData, "date_of_birth"),
      gender: text(formData, "gender"),
      blood_group: text(formData, "blood_group"),
      contact_number: text(formData, "contact_number"),
      email: emailVal,
    });
    revalidatePath("/patients");
    const loginDetails = emailVal
      ? ` Login email: ${emailVal} (Temporary password: ArogyaLink@2026, or patient can set a custom password via Create Account).`
      : "";
    return { ok: `Registered ${id}.${loginDetails} Ask the patient to grant consent before opening their chart.` };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
