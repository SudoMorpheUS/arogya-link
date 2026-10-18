"use client";

import { useActionState } from "react";
import { grantConsentAction, type FormState } from "@/lib/actions";
import { Notice } from "./ui";

export interface ConsentTarget {
  value: string;
  label: string;
}

export function GrantConsentForm({
  hospitals,
  doctors,
  today,
}: {
  hospitals: ConsentTarget[];
  doctors: ConsentTarget[];
  today: string;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(grantConsentAction, {});

  return (
    <form action={action} className="form">
      <div className="form-row">
        <label className="field">
          Allow access for
          <select name="target" required defaultValue="">
            <option value="" disabled>
              Choose a hospital or doctor…
            </option>
            <optgroup label="Whole hospital">
              {hospitals.map((h) => (
                <option key={h.value} value={h.value}>
                  {h.label}
                </option>
              ))}
            </optgroup>
            <optgroup label="One doctor only">
              {doctors.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </optgroup>
          </select>
        </label>
        <label className="field">
          From
          <input type="date" name="start_date" defaultValue={today} required />
        </label>
        <label className="field">
          Until (optional)
          <input type="date" name="end_date" min={today} />
        </label>
      </div>
      {state.error ? <Notice tone="error">{state.error}</Notice> : null}
      {state.ok ? <Notice>{state.ok}</Notice> : null}
      <div>
        <button className="btn" disabled={pending}>
          {pending ? "Granting…" : "Grant consent"}
        </button>
      </div>
    </form>
  );
}
