"use client";

import { useActionState, useState } from "react";
import { recordVisitAction, type FormState } from "@/lib/actions";
import { Notice } from "./ui";

export interface RecentLabView {
  test_name: string;
  result: string | null;
  unit: string | null;
  test_date: string;
  hospital_name: string;
  days_ago: number;
}

let nextKey = 0;
const newKey = () => ++nextKey;

export function VisitForm({ patientId, recentLabs }: { patientId: string; recentLabs: RecentLabView[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(recordVisitAction, {});
  const [dx, setDx] = useState([newKey()]);
  const [rx, setRx] = useState<number[]>([]);
  const [labs, setLabs] = useState<{ key: number; name: string }[]>([]);

  const duplicates = labs
    .map((l) => ({ key: l.key, match: recentLabs.find((r) => r.test_name.toLowerCase() === l.name.trim().toLowerCase()) }))
    .filter((d) => d.match);

  return (
    <form action={action} className="form">
      <input type="hidden" name="patient_id" value={patientId} />

      <section className="card">
        <h2>Visit</h2>
        <div className="form-row">
          <label className="field">
            Visit type
            <select name="visit_type" defaultValue="OPD" required>
              <option>OPD</option>
              <option>Emergency</option>
              <option>Inpatient</option>
            </select>
          </label>
          <label className="field field--wide">
            Chief complaint
            <input name="chief_complaint" maxLength={255} placeholder="Main reason for the visit" />
          </label>
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h2>Diagnosis</h2>
          <button type="button" className="btn btn--secondary btn--sm" onClick={() => setDx([...dx, newKey()])}>
            Add diagnosis
          </button>
        </div>
        <div className="rows">
          {dx.map((key) => (
            <div className="row-line" key={key}>
              <label className="field">
                ICD code
                <input name="dx_code" maxLength={10} placeholder="E11.9" />
              </label>
              <label className="field field--wide">
                Description
                <input name="dx_desc" maxLength={255} placeholder="Type 2 diabetes mellitus without complications" />
              </label>
              <button type="button" className="btn btn--secondary btn--sm" onClick={() => setDx(dx.filter((k) => k !== key))}>
                Remove
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h2>Prescriptions</h2>
          <button type="button" className="btn btn--secondary btn--sm" onClick={() => setRx([...rx, newKey()])}>
            Add medicine
          </button>
        </div>
        {rx.length === 0 ? <p className="muted">No medicines added.</p> : null}
        <div className="rows">
          {rx.map((key) => (
            <div className="row-line" key={key}>
              <label className="field">
                Medicine
                <input name="rx_name" maxLength={100} />
              </label>
              <label className="field">
                Dosage
                <input name="rx_dose" maxLength={50} placeholder="500 mg" />
              </label>
              <label className="field">
                Frequency
                <input name="rx_freq" maxLength={50} placeholder="Twice daily" />
              </label>
              <label className="field">
                Duration
                <input name="rx_dur" maxLength={50} placeholder="30 days" />
              </label>
              <button type="button" className="btn btn--secondary btn--sm" onClick={() => setRx(rx.filter((k) => k !== key))}>
                Remove
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h2>Lab tests</h2>
          <button type="button" className="btn btn--secondary btn--sm" onClick={() => setLabs([...labs, { key: newKey(), name: "" }])}>
            Add lab test
          </button>
        </div>
        {labs.length === 0 ? <p className="muted">No lab tests added.</p> : null}
        <div className="rows">
          {labs.map((l) => (
            <div className="row-line" key={l.key}>
              <label className="field">
                Test name
                <input
                  name="lab_name"
                  maxLength={100}
                  value={l.name}
                  onChange={(e) => setLabs(labs.map((x) => (x.key === l.key ? { ...x, name: e.target.value } : x)))}
                />
              </label>
              <label className="field">
                Result
                <input name="lab_result" maxLength={100} />
              </label>
              <label className="field">
                Unit
                <input name="lab_unit" maxLength={30} />
              </label>
              <button type="button" className="btn btn--secondary btn--sm" onClick={() => setLabs(labs.filter((x) => x.key !== l.key))}>
                Remove
              </button>
            </div>
          ))}
        </div>
        {duplicates.map(({ key, match }) => (
          <div key={key} style={{ marginTop: 12 }}>
            <Notice tone="info">
              <strong>{match!.test_name}</strong> was already run {match!.days_ago} days ago at {match!.hospital_name}
              {match!.result ? ` (${match!.result} ${match!.unit ?? ""})` : ""}. Consider reusing that result.
            </Notice>
          </div>
        ))}
      </section>

      {state.error ? <Notice tone="error">{state.error}</Notice> : null}
      <div>
        <button className="btn" disabled={pending}>
          {pending ? "Saving…" : "Save visit"}
        </button>
      </div>
    </form>
  );
}
