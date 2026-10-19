import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { ConfirmRevoke } from "@/components/ConfirmRevoke";
import { GrantConsentForm } from "@/components/GrantConsentForm";
import { Chip, DataTable, Empty, PageHeader, VisibilityNote } from "@/components/ui";
import { daysBetween, formatDate } from "@/lib/format";
import { requireSession } from "@/lib/session";
import { api } from "@/lib/api";
import * as store from "@/lib/store";

export const metadata: Metadata = { title: "Consent" };

export default async function ConsentsPage() {
  const session = await requireSession(["patient"]);
  const today = store.today();
  let rows: any[] = [];
  let hospitalsList: any[] = [];
  let doctorsList: any[] = [];

  try {
    const [consentsData, hospData, docData] = await Promise.all([
      api.getConsents(session.id!),
      api.getHospitals(),
      api.getDoctors(),
    ]);
    rows = consentsData;
    hospitalsList = hospData;
    doctorsList = docData;
  } catch (err) {
    console.warn("Falling back to local store for consents:", err);
    rows = store.consentsOf(session.id!);
    hospitalsList = store.listHospitals() as any[];
    doctorsList = store.listDoctors() as any[];
  }

  const active = rows.filter((c) => c.status === "Active" && c.start_date <= today && (!c.end_date || c.end_date >= today));

  const hospitalMap = new Map(hospitalsList.map((h) => [h.hospital_id, h.hospital_name]));
  const doctorMap = new Map(doctorsList.map((d) => [d.doctor_id, d]));

  const hospitals = hospitalsList.map((h) => ({ value: `hospital:${h.hospital_id}`, label: h.hospital_name }));
  const doctors = doctorsList.map((d) => ({
    value: `doctor:${d.doctor_id}`,
    label: `${d.full_name}, ${hospitalMap.get(d.hospital_id) || d.hospital_id}`,
  }));

  const nameOf = (c: any) => {
    if (c.doctor_name) return `${c.doctor_name} (doctor)`;
    if (c.doctor_id && doctorMap.has(c.doctor_id)) return `${doctorMap.get(c.doctor_id)!.full_name} (doctor)`;
    if (c.hospital_name) return `${c.hospital_name} (hospital)`;
    if (c.hospital_id && hospitalMap.has(c.hospital_id)) return `${hospitalMap.get(c.hospital_id)} (hospital)`;
    return c.doctor_id ? `${c.doctor_id} (doctor)` : `${c.hospital_id} (hospital)`;
  };

  return (
    <div className="page">
      <PageHeader
        title="Consent"
        subtitle="Nobody can open your chart unless an active consent names their hospital or them personally."
      />
      <VisibilityNote>
        {active.length === 0
          ? "Right now nobody but you can see your record."
          : `${active.length} active consent${active.length === 1 ? "" : "s"} let doctors open your record.`}
      </VisibilityNote>

      <div className="workspace">
        <section className="card card-host pane" aria-labelledby="grant-title">
          <div className="card-head">
            <h2 id="grant-title" className="flex">
              <ShieldCheck size={20} strokeWidth={1.75} aria-hidden="true" style={{ color: "var(--blue-600)" }} />
              Grant access
            </h2>
          </div>
          <GrantConsentForm key={rows.filter((c) => c.status === "Revoked").length} hospitals={hospitals} doctors={doctors} today={today} />
        </section>

        <section className="pane stack-sm" aria-labelledby="list-title">
          <h2 id="list-title">Your consents</h2>
          {rows.length === 0 ? (
            <Empty>You haven&apos;t shared your record with anyone.</Empty>
          ) : (
            <DataTable
              caption="Your consents"
              rows={rows}
              rowKey={(c) => c.consent_id}
              columns={[
                {
                  header: "Granted to",
                  cell: (c) => (
                    <span className="truncate" style={{ display: "block", maxWidth: "28ch" }} title={nameOf(c)}>
                      {nameOf(c)}
                    </span>
                  ),
                },
                { header: "From", cell: (c) => formatDate(c.start_date), nowrap: true },
                { header: "Until", cell: (c) => (c.end_date ? formatDate(c.end_date) : "No end date"), nowrap: true },
                {
                  header: "Status",
                  cell: (c) => {
                    if (c.status === "Revoked") return <Chip tone="neutral" icon={false}>Revoked</Chip>;
                    if (c.end_date && c.end_date < today) return <Chip tone="neutral" icon={false}>Expired</Chip>;
                    if (c.start_date > today) return <Chip tone="neutral" icon={false}>Scheduled</Chip>;
                    if (c.end_date && daysBetween(today, c.end_date) <= 90)
                      return <Chip tone="attention">Ends in {daysBetween(today, c.end_date)}d</Chip>;
                    return <Chip>Active</Chip>;
                  },
                },
                {
                  header: "",
                  cell: (c) =>
                    c.status === "Active" && !(c.end_date && c.end_date < today) ? (
                      <ConfirmRevoke consentId={c.consent_id} who={nameOf(c)} />
                    ) : null,
                },
              ]}
            />
          )}
        </section>
      </div>
    </div>
  );
}
