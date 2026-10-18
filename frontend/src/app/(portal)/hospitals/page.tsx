import type { Metadata } from "next";
import { Chip, DataTable, PageHeader } from "@/components/ui";
import { requireSession } from "@/lib/session";
import * as store from "@/lib/store";

export const metadata: Metadata = { title: "Hospitals & doctors" };

export default async function HospitalsPage() {
  await requireSession(["admin"]);
  const caseload = new Map(store.caseload().map((c) => [c.hospital_id, c]));
  const doctors = store.listDoctors();

  return (
    <div className="page">
      <PageHeader title="Hospitals & doctors" subtitle="Registered facilities, their clinicians and caseload." />
      <div className="grid grid--wide">
        {store.listHospitals().map((h) => {
          const c = caseload.get(h.hospital_id)!;
          return (
            <section className="card card-host stack-sm" key={h.hospital_id} aria-labelledby={`h-${h.hospital_id}`}>
              <div>
                <h2 id={`h-${h.hospital_id}`}>{h.hospital_name}</h2>
                <p className="muted" style={{ fontSize: "var(--fs-sm)" }}>
                  {h.address} · {h.contact_number}
                </p>
                <p className="muted" style={{ fontSize: "var(--fs-xs)" }}>
                  {h.hospital_id} · {h.registration_no}
                </p>
              </div>
              <div className="flex">
                <Chip tone="neutral" icon={false}>{c.visit_count} visits</Chip>
                <Chip tone="neutral" icon={false}>{c.patient_count} patients</Chip>
                <Chip tone="neutral" icon={false}>{c.opd_visits} outpatient</Chip>
                <Chip tone="neutral" icon={false}>{c.inpatient_visits} inpatient</Chip>
                <Chip tone="neutral" icon={false}>{c.emergency_visits} emergency</Chip>
              </div>
              <DataTable
                caption={`Doctors at ${h.hospital_name}`}
                rows={doctors.filter((d) => d.hospital_id === h.hospital_id)}
                rowKey={(d) => d.doctor_id}
                columns={[
                  { header: "Doctor", cell: (d) => d.full_name },
                  { header: "Specialty", cell: (d) => d.specialization },
                  { header: "Licence", cell: (d) => d.license_number, nowrap: true },
                ]}
              />
            </section>
          );
        })}
      </div>
    </div>
  );
}
