import { ChevronRight, ShieldCheck, Stethoscope, UserPlus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { MaskedId } from "@/components/MaskedId";
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
import { api } from "@/lib/api";
import { requireSession } from "@/lib/session";
import * as store from "@/lib/store";
import type { Session } from "@/lib/types";

export const metadata: Metadata = { title: "Dashboard" };

type Search = Promise<{ attention?: string; patient?: string; hospital?: string }>;

export default async function DashboardPage({ searchParams }: { searchParams: Search }) {
  const session = await requireSession();
  const { attention, patient, hospital } = await searchParams;
  const showAll = attention === "all";
  if (session.role === "patient") return <PatientDashboard session={session} showAll={showAll} />;
  if (session.role === "doctor") return <DoctorDashboard session={session} showAll={showAll} selected={patient} />;
  return <AdminDashboard session={session} showAll={showAll} selectedHospital={hospital} />;
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

async function AdminDashboard({
  session,
  showAll,
  selectedHospital,
}: {
  session: Session;
  showAll: boolean;
  selectedHospital?: string;
}) {
  let totals = {
    patients: 0,
    hospitals: 0,
    doctors: 0,
    visits: 0,
    activeConsents: 0,
    auditEntries: 0,
    duplicateCount: 0,
  };
  let caseload: any[] = [];
  let auditLogs: any[] = [];
  let consentDistribution: any[] = [];
  let consentsList: any[] = [];

  try {
    const [statsData, caseloadData, logsData, distData, consentsData] = await Promise.all([
      api.getStats(),
      api.getHospitalCaseload(),
      api.getAuditLogs(undefined, undefined, 50),
      api.getConsentDistribution(50),
      api.getConsents(undefined, undefined, undefined, 200),
    ]);
    totals = statsData;
    caseload = caseloadData;
    auditLogs = logsData;
    consentDistribution = distData;
    consentsList = consentsData;
  } catch (err) {
    console.warn("Falling back to local store for admin dashboard:", err);
    totals = store.totals() as any;
    caseload = store.caseload() as any;
    auditLogs = store.allAudit() as any;
    consentsList = store.allConsents() as any;
  }

  const exceptions = auditLogs.filter((a) => a.action === "DENIED" || a.action === "EMERGENCY_READ");
  const emergencyVisits = caseload.reduce((n, c) => n + (c.emergency_visits || 0), 0);
  const maxVisits = Math.max(...caseload.map((c) => c.visit_count || 0), 1);

  const currentHospitalId = selectedHospital || caseload[0]?.hospital_id;
  let hospitalPatients: any[] = [];
  if (currentHospitalId) {
    try {
      hospitalPatients = await api.getHospitalPatients(currentHospitalId, 25);
    } catch (e) {
      console.warn("Failed to fetch hospital patients:", e);
    }
  }
  const currentHospital = caseload.find((c) => c.hospital_id === currentHospitalId);

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

      <AttentionSummary
        items={attentionFor(session, auditLogs, consentsList)}
        showAll={showAll}
        viewAllHref="/dashboard?attention=all#attention"
      />

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
            <span className="muted" style={{ fontSize: "var(--fs-xs)" }}>
              Select facility to view synced patient roster
            </span>
          </div>
          <div className="stack">
            {caseload.map((c) => {
              const isSelected = c.hospital_id === currentHospitalId;
              return (
                <div
                  className="bar-row"
                  key={c.hospital_id}
                  style={
                    isSelected
                      ? {
                          outline: "2px solid var(--blue-500)",
                          background: "var(--card-hover, rgba(255,255,255,0.03))",
                          borderRadius: 8,
                          padding: "6px 10px",
                        }
                      : { padding: "4px 0" }
                  }
                >
                  <div className="list-row">
                    <Link
                      href={`/dashboard?hospital=${c.hospital_id}#hospital-patients`}
                      style={{ textDecoration: "none", color: "inherit", flex: 1 }}
                    >
                      <strong className="truncate" title={c.hospital_name}>
                        {c.hospital_name} {isSelected ? "•" : ""}
                      </strong>
                    </Link>
                    <span className="muted nowrap" style={{ fontSize: "var(--fs-sm)", whiteSpace: "nowrap" }}>
                      {c.visit_count} visits · {c.patient_count ?? c.active_patients ?? 0} patients
                    </span>
                  </div>
                  <div
                    className="bar"
                    role="img"
                    aria-label={`${c.opd_visits || 0} outpatient, ${c.emergency_visits || 0} emergency, ${c.inpatient_visits || 0} inpatient visits`}
                  >
                    <span style={{ width: `${((c.opd_visits || 0) / maxVisits) * 100}%` }} />
                    <span style={{ width: `${((c.emergency_visits || 0) / maxVisits) * 100}%` }} />
                    <span style={{ width: `${((c.inpatient_visits || 0) / maxVisits) * 100}%` }} />
                  </div>
                </div>
              );
            })}
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

        {currentHospital && (
          <section className="card card-host pane" id="hospital-patients" aria-labelledby="hosp-patients-title">
            <div className="card-head">
              <div>
                <h2 id="hosp-patients-title">Patients at {currentHospital.hospital_name}</h2>
                <p className="muted" style={{ fontSize: "var(--fs-xs)", margin: 0 }}>
                  Live synchronized roster of patients with clinical records at this facility.
                </p>
              </div>
              <Link className="btn btn--secondary btn--sm" href="/hospitals">
                All facilities
              </Link>
            </div>
            {hospitalPatients.length === 0 ? (
              <Empty>No patients recorded at this hospital.</Empty>
            ) : (
              <DataTable
                caption={`Patient roster for ${currentHospital.hospital_name}`}
                rows={hospitalPatients}
                rowKey={(p) => p.patient_id}
                columns={[
                  {
                    header: "Patient",
                    cell: (p) => (
                      <span className="stack-sm" style={{ gap: 0 }}>
                        <Link href={`/patients?q=${encodeURIComponent(p.patient_id)}`}>
                          <strong>{p.full_name}</strong>
                        </Link>
                        <span className="muted" style={{ fontSize: "var(--fs-xs)" }}>
                          <MaskedId id={p.patient_id} />
                        </span>
                      </span>
                    ),
                  },
                  { header: "Blood / Sex", cell: (p) => `${p.blood_group || "—"} · ${p.gender}` },
                  { header: "Visits at facility", cell: (p) => `${p.visit_count} visits` },
                  { header: "Last visit", cell: (p) => (p.last_visit ? formatDateTime(p.last_visit) : "—"), nowrap: true },
                ]}
              />
            )}
          </section>
        )}

        <section className="card card-host pane" aria-labelledby="consent-dist-title" style={{ gridColumn: "1 / -1" }}>
          <div className="card-head">
            <div>
              <h2 id="consent-dist-title">Patient consents across hospitals</h2>
              <p className="muted" style={{ fontSize: "var(--fs-xs)", margin: 0 }}>
                Live visibility into which hospitals each patient has authorized to access their medical records.
              </p>
            </div>
            <Link className="btn btn--secondary btn--sm" href="/audit?action=CONSENT_CHANGE">
              Consent audit log
            </Link>
          </div>
          {consentDistribution.length === 0 ? (
            <Empty>No consent records found.</Empty>
          ) : (
            <DataTable
              caption="Cross-hospital patient consent mapping"
              rows={consentDistribution.slice(0, 20)}
              rowKey={(p) => p.patient_id}
              columns={[
                {
                  header: "Patient",
                  cell: (p) => (
                    <span className="stack-sm" style={{ gap: 0 }}>
                      <Link href={`/patients?q=${encodeURIComponent(p.patient_id)}`}>
                        <strong>{p.full_name}</strong>
                      </Link>
                      <span className="muted" style={{ fontSize: "var(--fs-xs)" }}>
                        <MaskedId id={p.patient_id} />
                      </span>
                    </span>
                  ),
                },
                {
                  header: "Authorized hospitals",
                  cell: (p) => (
                    <div className="flex" style={{ flexWrap: "wrap", gap: 4 }}>
                      {p.consented_hospitals && p.consented_hospitals.length > 0 ? (
                        p.consented_hospitals.map((h: string) => (
                          <Chip key={h} tone="neutral" icon={false}>
                            {h}
                          </Chip>
                        ))
                      ) : (
                        <span className="muted">None</span>
                      )}
                    </div>
                  ),
                },
                {
                  header: "Named doctors",
                  cell: (p) =>
                    p.consented_doctors && p.consented_doctors.length > 0 ? (
                      <span className="muted" style={{ fontSize: "var(--fs-xs)" }}>
                        {p.consented_doctors.join(", ")}
                      </span>
                    ) : (
                      <span className="muted">—</span>
                    ),
                },
                {
                  header: "Active consents",
                  cell: (p) => <Chip>{p.active_consents} active</Chip>,
                },
                {
                  header: "Valid until",
                  cell: (p) => (p.latest_expiry ? formatDate(p.latest_expiry) : "Ongoing"),
                  nowrap: true,
                },
              ]}
            />
          )}
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
