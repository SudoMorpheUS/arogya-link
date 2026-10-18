"use client";

import { useActionState } from "react";
import { registerPatientAction, type FormState } from "@/lib/actions";
import { Notice } from "./ui";

export function RegisterPatientForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(registerPatientAction, {});

  return (
    <form action={action} className="form">
      <div className="form-row">
        <label className="field">
          Full name
          <input name="full_name" required maxLength={100} autoComplete="off" />
        </label>
        <label className="field">
          Date of birth
          <input name="date_of_birth" type="date" required />
        </label>
        <label className="field">
          Gender
          <select name="gender" required defaultValue="">
            <option value="" disabled>
              Select…
            </option>
            <option value="M">Male</option>
            <option value="F">Female</option>
            <option value="O">Other</option>
          </select>
        </label>
        <label className="field">
          Blood group
          <select name="blood_group" defaultValue="">
            <option value="">Unknown</option>
            {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="form-row">
        <label className="field">
          Mobile number
          <input name="contact_number" required inputMode="numeric" pattern="\d{10,15}" maxLength={15} />
        </label>
        <label className="field">
          Email (optional)
          <input name="email" type="email" maxLength={100} autoComplete="off" placeholder="patient@example.in" />
          <span className="muted" style={{ display: "block", marginTop: 4, fontSize: "var(--fs-xs)" }}>
            Used for patient login. Default initial password: <code>ArogyaLink@2026</code> (or create a password on the Create Account tab).
          </span>
        </label>
      </div>
      {state.error ? <Notice tone="error">{state.error}</Notice> : null}
      {state.ok ? <Notice>{state.ok}</Notice> : null}
      <div>
        <button className="btn" disabled={pending}>
          {pending ? "Registering…" : "Register patient"}
        </button>
      </div>
    </form>
  );
}
