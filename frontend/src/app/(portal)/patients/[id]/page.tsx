import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MaskedId } from "@/components/MaskedId";
import { Timeline } from "@/components/Timeline";
import { Notice, AttentionBanner, Avatar, DataTable, Empty, LabChip, PageHeader, VisibilityNote } from "@/components/ui";
import { breakGlassAction } from "@/lib/actions";
import { ageOn, formatDate, GENDER_LABEL } from "@/lib/format";
import { assessLab } from "@/lib/lab-ranges";
import { requireSession } from "@/lib/session";
import { api } from "@/lib/api";
import * as store from "@/lib/store";

export const metadata: Metadata = { title: "Patient chart" };

export default async function ChartPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const session = await requireSession(["doctor"]);
  const { id } = await params;
  const { saved, error } = await searchParams;
  const patient = store.getPatient(id);
  if (!patient) notFound();

  const chart = store.openChart(id, session.id!);
  const hospital = store.getHospital(store.getDoctor(session.id!)!.hospital_id)!;
  const today = store.today();

  try {
    if (!chart.ok) {
      await api.createAuditEntry({
        patient_id: id,
        doctor_id: session.id,
        action: "DENIED",
        details: `Access denied: no active consent for ${hospital?.hospital_name ?? "hospital"}`,
      });
    } else if (chart.level === "consent") {
      await api.createAuditEntry({
        patient_id: id,
        doctor_id: session.id,
        action: "READ",
        details: `Opened unified chart at ${hospital?.hospital_name ?? "hospital"}`,
      });
    }
  } catch {}


  const header = (
    <section className="card patient-head" aria-label="Patient">
      <Avatar name={patient.full_name} large />
      <div style={{ minWidth: 0 }}>
        <h2 className="wrap">{patient.full_name}</h2>
        <div className="facts">
          <span>
            <MaskedId id={patient.patient_id} />
          </span>
          <span>
            <b>{ageOn(patient.date_of_birth, today)}</b> yrs · {GENDER_LABEL[patient.gender]}
          </span>
          <span>
            Blood group <b>{patient.blood_group ?? "—"}</b>
          </span>
        </div>
      </div>
    </section>
  );

  if (!chart.ok) {
    return (
      <div className="page">
        <PageHeader title="Patient chart" subtitle="Consent required" />
        {header}
        <AttentionBanner title={`Access blocked: no active consent for ${hospital.hospital_name}`}>
          The patient has not allowed you or your hospital to view their history. This attempt was recorded in the audit
          log. Ask the patient to grant access from their Consent page.
        </AttentionBanner>

        <form action={breakGlassAction} className="card form" style={{ maxWidth: 640 }}>
          <h2>Emergency access</h2>
          <p className="muted">
            Only if the patient cannot consent and delaying care is unsafe. Your reason is written to the audit log as an
            emergency read, the patient is told, and access ends after 30 minutes.
          </p>
          <input type="hidden" name="patient_id" value={patient.patient_id} />
          <label className="field">
            Reason
            <input name="reason" required minLength={8} maxLength={200} placeholder="e.g. Unconscious on arrival with chest pain" />
          </label>
          {error ? <Notice tone="error">{error}</Notice> : null}
          <div>
            <button className="btn btn--critical">Use emergency access</button>
          </div>
        </form>
      </div>
    );
  }

  const labs = store.labsOf(id).slice(0, 8);
  const critical = labs.find((l) => assessLab(l.test_name, l.result).flag === "critical");

  return (
    <div className="page">
      <PageHeader
        title="Patient chart"
        subtitle="Unified history from every hospital"
        actions={
          <Link className="btn" href={`/visits/new?patient=${patient.patient_id}`}>
            Record visit
          </Link>
        }
      />
      {saved ? <Notice>Visit recorded and written to the audit log.</Notice> : null}
      {header}
      <VisibilityNote>
        {chart.level === "emergency"
          ? "You are viewing this through an audited emergency override. The patient will see it in their access history."
          : `Visible to you because the patient allowed ${hospital.hospital_name} or you. They can revoke this at any time.`}
      </VisibilityNote>

      {critical ? (
        <AttentionBanner title={`Critical result: ${critical.test_name} ${critical.result} ${critical.unit ?? ""}`.trim()} href="#recent-results" action="Review results">
          Recorded {formatDate(critical.test_date)} at {critical.hospital_name}. Check it before ordering or prescribing.
        </AttentionBanner>
      ) : null}

      <section className="card card-host" id="recent-results" aria-labelledby="dup-title">
        <div className="card-head">
          <h2 id="dup-title">Duplicate test check</h2>
          <span className="muted" style={{ fontSize: "var(--fs-xs)" }}>
            Last 90 days, any hospital
          </span>
        </div>
        {chart.recentLabs.length === 0 ? (
          <Empty>No lab results in the last 90 days, so any test you order is new.</Empty>
        ) : (
          <DataTable
            caption="Lab results from the last 90 days"
            rows={chart.recentLabs}
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
              { header: "Date", cell: (l) => `${formatDate(l.test_date)} (${l.days_ago}d ago)`, nowrap: true },
              { header: "Hospital", cell: (l) => l.hospital_name },
            ]}
          />
        )}
      </section>

      <section className="stack-sm" aria-labelledby="history-title">
        <h2 id="history-title">Visit history</h2>
        <Timeline entries={chart.timeline} />
      </section>
    </div>
  );
}
