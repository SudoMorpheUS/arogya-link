import { ChevronRight, ShieldCheck, Stethoscope, UserPlus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Timeline } from "@/components/Timeline";
import {
  ActionChip,
  AttentionSummary,
  Avatar,
  Chip,
  DataTable,
  Empty,
  Kpi,
  LabChip,
  PageHeader,
  VisibilityNote,
} from "@/components/ui";
import { attentionFor } from "@/lib/attention";
import { ageOn, formatDate, formatDateTime, GENDER_LABEL, maskId } from "@/lib/format";
import { assessLab } from "@/lib/lab-ranges";
import { requireSession } from "@/lib/session";
import * as store from "@/lib/store";
import type { Session } from "@/lib/types";

export const metadata: Metadata = { title: "Dashboard" };

type Search = Promise<{ attention?: string; patient?: string }>;

export default async function DashboardPage({ searchParams }: { searchParams: Search }) {
  const session = await requireSession();
  const { attention, patient } = await searchParams;
  const showAll = attention === "all";
  if (session.role === "patient") return <PatientDashboard session={session} showAll={showAll} />;
  if (session.role === "doctor") return <DoctorDashboard session={session} showAll={showAll} selected={patient} />;
  return <AdminDashboard session={session} showAll={showAll} />;
}

// ---------------------------------------------------------------- patient

function PatientDashboard({ session, showAll }: { session: Session; showAll: boolean }) {
  const id = session.id!;
  const patient = store.getPatient(id)!;
  const entries = store.timeline(id);
  const today = store.today();
  const consents = store
    .consentsOf(id)
    .filter((c) => c.status === "Active" && c.start_date <= today && (!c.end_date || c.end_date >= today));
  const labs = store.labsOf(id);
  const meds = store.activePrescriptions(id);
  const events = store.auditForPatient(id).filter((a) => ["READ", "EMERGENCY_READ", "DENIED"].includes(a.action)).length;
  const team = [...new Map(entries.map((e) => [e.doctor_id, e])).values()];
  const last = entries[0];

  return (
    <div className="page">
      <section className="band hero-strip" aria-label="Welcome">
        <div>
          <p className="eyebrow">Your health record</p>
          <h1>Hello, {patient.full_name.split(" ")[0]}</h1>
          <p className="muted" style={{ marginTop: 4 }}>
            {last ? `Last visit ${formatDate(last.visit_date)} at ${last.hospital_name}.` : "No visits recorded yet."}
          </p>
        </div>
        <Link className="btn" href="/consents">
          <ShieldCheck size={18} strokeWidth={1.75} aria-hidden="true" />
          Manage who can see my data
        </Link>
      </section>

      <AttentionSummary items={attentionFor(session)} showAll={showAll} viewAllHref="/dashboard?attention=all#attention" />

      <div className="grid grid--kpi">
        <Kpi label="Visits" value={entries.length} hint="across all hospitals" />
        <Kpi label="Hospitals" value={new Set(entries.map((e) => e.hospital_id)).size} hint="hold your records" />
        <Kpi label="Active consents" value={consents.length} hint="can open your chart" />
        <Kpi label="Access events" value={events} hint="reads and blocked tries" />
      </div>

      <div className="workspace">
        <section className="card card-host pane" id="results" aria-labelledby="results-title">
          <div className="card-head">
            <h2 id="results-title">Latest results</h2>
            <span className="muted" style={{ fontSize: "var(--fs-xs)" }}>
              Outside the usual range is flagged
            </span>
          </div>
          {labs.length === 0 ? (
            <Empty>No lab results yet.</Empty>
          ) : (
            <DataTable
              caption="Latest lab results"
              rows={labs.slice(0, 6)}
              rowKey={(l) => l.lab_test_id}
              rowClass={(l) => (assessLab(l.test_name, l.result).flag === "critical" ? "row-critical" : undefined)}
              columns={[
                { header: "Test", cell: (l) => l.test_name },
                { header: "Result", cell: (l) => `${l.result ?? "—"} ${l.unit ?? ""}`.trim(), nowrap: true },
                {
                  header: "Range",
                  cell: (l) => {
                    const a = assessLab(l.test_name, l.result);
                    return <LabChip flag={a.flag} direction={a.direction} />;
                  },
                },
                { header: "Date", cell: (l) => formatDate(l.test_date), nowrap: true },
              ]}
            />
          )}
        </section>

        <section className="card card-host pane" id="medicines" aria-labelledby="meds-title">
          <div className="card-head">
            <h2 id="meds-title">My medicines</h2>
          </div>
          {meds.length === 0 ? (
            <Empty>No medicines in progress.</Empty>
          ) : (
            <ul className="list">
              {meds.map((m) => (
                <li key={m.prescription_id}>
                  <span className="list-row">
                    <strong className="truncate">
                      {m.medicine_name} {m.dosage}
                    </strong>
                    {m.days_left !== null && m.days_left <= 14 ? (
                      <Chip tone="attention">Refill in {m.days_left}d</Chip>
                    ) : (
                      <Chip>{m.days_left === null ? "Ongoing" : `${m.days_left} days left`}</Chip>
                    )}
                  </span>
                  <span className="muted" style={{ fontSize: "var(--fs-sm)" }}>
                    {m.frequency} · {m.doctor_name}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card card-host pane" aria-labelledby="team-title">
          <div className="card-head">
            <h2 id="team-title">My care team</h2>
          </div>
          {team.length === 0 ? (
            <Empty>No doctors yet.</Empty>
          ) : (
            <ul className="list">
              {team.map((e) => (
                <li key={e.doctor_id}>
                  <span className="flex" style={{ flexWrap: "nowrap" }}>
                    <Avatar name={e.doctor_name} />
                    <span style={{ minWidth: 0 }}>
                      <strong className="truncate" style={{ display: "block" }}>
                        {e.doctor_name}
                      </strong>
                      <span className="muted truncate" style={{ display: "block", fontSize: "var(--fs-sm)" }}>
                        {store.getDoctor(e.doctor_id)?.specialization} · {e.hospital_name}
                      </span>
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card card-host pane" aria-labelledby="profile-title">
          <div className="card-head">
            <h2 id="profile-title">My details</h2>
          </div>
          <div className="patient-head">
            <Avatar name={patient.full_name} large />
            <div style={{ minWidth: 0 }}>
              <strong className="wrap">{patient.full_name}</strong>
              <div className="facts">
                <span>
                  <b>{ageOn(patient.date_of_birth, today)}</b> yrs · {GENDER_LABEL[patient.gender]}
                </span>
                <span>
                  Blood group <b>{patient.blood_group ?? "—"}</b>
                </span>
                <span>{maskId(patient.patient_id)}</span>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <VisibilityNote>Only you and the {consents.length} hospital or doctor{consents.length === 1 ? "" : "s"} you allowed can see this.</VisibilityNote>
          </div>
        </section>
      </div>

      <section aria-labelledby="timeline-title" className="stack-sm">
        <h2 id="timeline-title">Your timeline</h2>
        <Timeline entries={entries} />
      </section>
    </div>
  );
}

// ----------------------------------------------------------------- doctor

function DoctorDashboard({ session, showAll, selected }: { session: Session; showAll: boolean; selected?: string }) {
  const id = session.id!;
  const doctor = store.getDoctor(id)!;
  const hospital = store.getHospital(doctor.hospital_id)!;
  const queue = store.patientsWithAccess(id);
  const attention = attentionFor(session);
  const mine = store.auditForDoctor(id);
  const myVisits = store.listPatients().flatMap((p) => store.timeline(p.patient_id)).filter((v) => v.doctor_id === id).length;
  const duplicates = store.duplicateLabs().filter((d) => store.accessLevel(d.patient_id, id) !== "none").length;
  const critical = attention.filter((a) => a.severity === "critical").length;

  const target = selected ? queue.find((p) => p.patient_id === selected) : undefined;
  const chart = target ? store.openChart(target.patient_id, id) : null;
  const today = store.today();

  return (
    <div className="page">
      <PageHeader
        title={doctor.full_name}
        subtitle={`${doctor.specialization} · ${hospital.hospital_name}`}
        actions={
          <Link className="btn" href="/patients">
            Find a patient
          </Link>
        }
      />

      <AttentionSummary items={attention} showAll={showAll} viewAllHref="/dashboard?attention=all#attention" />

      <div className="grid grid--kpi">
        <Kpi label="Patients sharing" value={queue.length} hint="allowed you or your hospital" />
        <Kpi label="Critical results" value={critical} hint="among your patients" />
        <Kpi label="Visits recorded" value={myVisits} hint="by you" />
        <Kpi label="Repeat-test alerts" value={duplicates} hint="avoidable repeats" />
      </div>

      <div className="workspace">
        <section className="card pane" aria-labelledby="queue-title">
          <div className="card-head">
            <h2 id="queue-title">Patient queue</h2>
            <span className="muted" style={{ fontSize: "var(--fs-xs)" }}>
              Newest activity first
            </span>
          </div>
          {queue.length === 0 ? (
            <Empty>No patient has granted access to you or your hospital yet.</Empty>
          ) : (
            <ul className="list" style={{ gap: 2 }}>
              {queue.map((p) => (
                <li key={p.patient_id} style={{ padding: 0, borderBottom: 0 }}>
                  <Link
                    className="queue-item"
                    href={`/dashboard?patient=${p.patient_id}`}
                    aria-current={p.patient_id === target?.patient_id ? "true" : undefined}
                  >
                    <Avatar name={p.full_name} />
                    <span style={{ minWidth: 0, flex: 1 }}>
                      <strong className="truncate" style={{ display: "block" }} title={p.full_name}>
                        {p.full_name}
                      </strong>
                      <span className="muted" style={{ fontSize: "var(--fs-xs)" }}>
                        {maskId(p.patient_id)} · last visit {p.last_visit ? formatDate(p.last_visit) : "none"}
                      </span>
                    </span>
                    <ChevronRight size={18} strokeWidth={1.75} aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {target && chart?.ok ? (
          <>
            <section className="card pane stack-sm" aria-labelledby="summary-title">
              <div className="patient-head">
                <Avatar name={target.full_name} large />
                <div style={{ minWidth: 0 }}>
                  <h2 id="summary-title" className="wrap">
                    {target.full_name}
                  </h2>
                  <div className="facts">
                    <span>
                      <b>{ageOn(target.date_of_birth, today)}</b> yrs · {GENDER_LABEL[target.gender]}
                    </span>
                    <span>
                      Blood group <b>{target.blood_group ?? "—"}</b>
                    </span>
                  </div>
                </div>
              </div>
              <VisibilityNote>
                You can see this because {chart.level === "emergency" ? "of an audited emergency override" : "the patient allowed your hospital or you"}.
              </VisibilityNote>

              <h3>Problems</h3>
              <ul className="dx-list">
                {[...new Map(chart.timeline.flatMap((v) => v.diagnoses).map((d) => [d.disease_code, d])).values()].map((d) => (
                  <li key={d.disease_code} className="wrap">
                    <strong>{d.disease_code}</strong> · {d.description}
                  </li>
                ))}
              </ul>

              <h3>Current medicines</h3>
              {store.activePrescriptions(target.patient_id).length === 0 ? (
                <p className="muted">None in progress.</p>
              ) : (
                <ul className="dx-list">
                  {store.activePrescriptions(target.patient_id).map((m) => (
                    <li key={m.prescription_id}>
                      {m.medicine_name} {m.dosage} · {m.frequency}
                    </li>
                  ))}
                </ul>
              )}

              <div className="actions">
                <Link className="btn" href={`/patients/${target.patient_id}`}>
                  <Stethoscope size={18} strokeWidth={1.75} aria-hidden="true" />
                  Open full chart
                </Link>
                <Link className="btn btn--secondary" href={`/visits/new?patient=${target.patient_id}`}>
                  Record visit
                </Link>
              </div>
            </section>

            <section className="card card-host pane" aria-labelledby="labs-title">
              <div className="card-head">
                <h2 id="labs-title">Latest results</h2>
              </div>
              <DataTable
                caption="Latest lab results"
                rows={store.labsOf(target.patient_id).slice(0, 6)}
                rowKey={(l) => l.lab_test_id}
                rowClass={(l) => (assessLab(l.test_name, l.result).flag === "critical" ? "row-critical" : undefined)}
                columns={[
                  { header: "Test", cell: (l) => l.test_name },
                  { header: "Result", cell: (l) => `${l.result ?? "—"} ${l.unit ?? ""}`.trim(), nowrap: true },
                  {
                    header: "Range",
                    cell: (l) => {
                      const a = assessLab(l.test_name, l.result);
                      return <LabChip flag={a.flag} direction={a.direction} />;
                    },
                  },
                  { header: "Where", cell: (l) => l.hospital_name },
                ]}
              />
            </section>
          </>
        ) : (
          <section className="pane" aria-label="Selected patient">
            <Empty>Select a patient from the queue to see their summary.</Empty>
          </section>
        )}

        <section className="card card-host pane" aria-labelledby="activity-title">
          <div className="card-head">
            <h2 id="activity-title">Recent activity</h2>
          </div>
          {mine.length === 0 ? (
            <Empty>Nothing logged yet.</Empty>
          ) : (
            <DataTable
              caption="Your recent access events"
              rows={mine.slice(0, 6)}
              rowKey={(a) => a.log_id}
              columns={[
                { header: "When", cell: (a) => formatDateTime(a.action_time), nowrap: true },
                { header: "Patient", cell: (a) => a.patient_name },
                { header: "Action", cell: (a) => <ActionChip action={a.action} /> },
              ]}
            />
          )}
        </section>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ admin

function AdminDashboard({ session, showAll }: { session: Session; showAll: boolean }) {
  const totals = store.totals();
  const caseload = store.caseload();
  const exceptions = store.allAudit().filter((a) => a.action === "DENIED" || a.action === "EMERGENCY_READ");
  const emergencyVisits = caseload.reduce((n, c) => n + c.emergency_visits, 0);
  const maxVisits = Math.max(...caseload.map((c) => c.visit_count), 1);

  return (
    <div className="page">
      <PageHeader
        title="Network overview"
        subtitle="Every hospital on the platform at a glance."
        actions={
          <Link className="btn" href="/patients?register=1#register">
            <UserPlus size={18} strokeWidth={1.75} aria-hidden="true" />
            Register patient
          </Link>
        }
      />

      <AttentionSummary items={attentionFor(session)} showAll={showAll} viewAllHref="/dashboard?attention=all#attention" />

      <div className="grid grid--kpi">
        <Kpi label="Hospitals" value={totals.hospitals} hint={`${totals.doctors} doctors on duty`} />
        <Kpi label="Patients" value={totals.patients} hint="global patient IDs" />
        <Kpi label="Visits" value={totals.visits} hint={`${emergencyVisits} emergency`} />
        <Kpi label="Active consents" value={totals.activeConsents} hint="patients sharing records" />
        <Kpi label="Audit entries" value={totals.auditEntries} hint={`${exceptions.length} exceptions`} />
      </div>

      <div className="workspace">
        <section className="card card-host pane" aria-labelledby="load-title">
          <div className="card-head">
            <h2 id="load-title">Hospital caseload</h2>
          </div>
          <div className="stack">
            {caseload.map((c) => (
              <div className="bar-row" key={c.hospital_id}>
                <div className="list-row">
                  <strong className="truncate" title={c.hospital_name}>
                    {c.hospital_name}
                  </strong>
                  <span className="muted nowrap" style={{ fontSize: "var(--fs-sm)", whiteSpace: "nowrap" }}>
                    {c.visit_count} visits · {c.patient_count} patients
                  </span>
                </div>
                <div className="bar" role="img" aria-label={`${c.opd_visits} outpatient, ${c.emergency_visits} emergency, ${c.inpatient_visits} inpatient visits`}>
                  <span style={{ width: `${(c.opd_visits / maxVisits) * 100}%` }} />
                  <span style={{ width: `${(c.emergency_visits / maxVisits) * 100}%` }} />
                  <span style={{ width: `${(c.inpatient_visits / maxVisits) * 100}%` }} />
                </div>
              </div>
            ))}
            <div className="legend">
              <span>
                <i style={{ background: "var(--blue-300)" }} />
                Outpatient
              </span>
              <span>
                <i style={{ background: "var(--blue-700)" }} />
                Emergency
              </span>
              <span>
                <i style={{ background: "var(--blue-600)" }} />
                Inpatient
              </span>
            </div>
          </div>
        </section>

        <section className="card card-host pane" aria-labelledby="exc-title">
          <div className="card-head">
            <h2 id="exc-title">Access exceptions</h2>
            <Link href="/audit">Open audit log</Link>
          </div>
          {exceptions.length === 0 ? (
            <Empty>No blocked or emergency access.</Empty>
          ) : (
            <DataTable
              caption="Blocked and emergency access events"
              rows={exceptions.slice(0, 6)}
              rowKey={(a) => a.log_id}
              rowClass={(a) => (a.action === "EMERGENCY_READ" ? "row-critical" : undefined)}
              columns={[
                { header: "When", cell: (a) => formatDateTime(a.action_time), nowrap: true },
                { header: "Doctor", cell: (a) => a.doctor_name ?? "—" },
                { header: "Action", cell: (a) => <ActionChip action={a.action} /> },
              ]}
            />
          )}
        </section>
      </div>
    </div>
  );
}
