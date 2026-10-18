import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import * as store from "@/lib/store";
import { SESSION_COOKIE } from "@/lib/session";
import type { Role } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawEmail = String(body.email || "").trim().toLowerCase();
    if (!rawEmail) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
    }

    const isRegistration = Boolean(body.isRegistration || body.role);
    const requestedRole = (body.role as Role) || (body.preferredRole as Role) || undefined;
    const existing = store.findUserByEmail(rawEmail);

    let role: Role;
    let id: string | null = null;
    let name: string = body.displayName || existing?.name || rawEmail.split("@")[0];

    if (isRegistration && requestedRole) {
      // 1. Explicit registration: ALWAYS respect requestedRole
      role = requestedRole;
      if (role === "admin") {
        store.registerAdmin({ email: rawEmail, name });
        id = null;
      } else if (role === "doctor") {
        const doc = store.findDoctorByEmail(rawEmail);
        id = doc
          ? doc.doctor_id
          : store.registerDoctor({
              full_name: name,
              hospital_id: body.hospitalId || "HSP-01",
              specialization: body.specialization || "General Medicine",
              license_number: body.licenseNumber || "MCI-NEW-001",
              email: rawEmail,
            });
      } else {
        // patient
        const pat = store.findPatientByEmail(rawEmail);
        id = pat
          ? pat.patient_id
          : store.registerPatient({
              full_name: name,
              date_of_birth: body.dateOfBirth || "1995-01-01",
              gender: body.gender || "M",
              blood_group: body.bloodGroup || "O+",
              contact_number: body.contactNumber || "9800000000",
              email: rawEmail,
            });
      }
    } else {
      // 2. Sign-in flow: check existing registered role, then preferredRole, then fallback
      if (existing) {
        role = existing.role;
        id = existing.id;
        name = existing.name || name;
      } else if (requestedRole === "admin" || rawEmail.startsWith("admin@") || rawEmail.includes("admin")) {
        role = "admin";
        id = null;
        store.registerAdmin({ email: rawEmail, name });
      } else if (requestedRole === "doctor") {
        role = "doctor";
        const doc = store.findDoctorByEmail(rawEmail);
        id = doc
          ? doc.doctor_id
          : store.registerDoctor({
              full_name: name,
              hospital_id: "HSP-01",
              specialization: "General Medicine",
              license_number: "MCI-NEW-001",
              email: rawEmail,
            });
      } else {
        role = "patient";
        const pat = store.findPatientByEmail(rawEmail);
        id = pat
          ? pat.patient_id
          : store.registerPatient({
              full_name: name,
              date_of_birth: "1995-01-01",
              gender: "M",
              blood_group: "O+",
              contact_number: "9800000000",
              email: rawEmail,
            });
      }
    }

    const sessionData = {
      role,
      id,
      email: rawEmail,
      displayName: name,
    };

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, JSON.stringify(sessionData), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    return NextResponse.json({ success: true, session: sessionData });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Failed to establish session" }, { status: 500 });
  }
}
