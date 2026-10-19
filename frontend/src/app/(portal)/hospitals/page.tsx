import type { Metadata } from "next";
import Link from "next/link";
import { Chip, DataTable, PageHeader } from "@/components/ui";
import { requireSession } from "@/lib/session";
import { api, type ApiHospitalCaseload, type ApiDoctor } from "@/lib/api";
import * as store from "@/lib/store";

export const metadata: Metadata = { title: "Hospitals & doctors" };

export default async function HospitalsPage() {
  await requireSession(["admin"]);
  let hospitals: ApiHospitalCaseload[] = [];
  let doctors: ApiDoctor[] = [];

  try {
    const [hospData, docData] = await Promise.all([
      api.getHospitalCaseload(),
      api.getDoctors(),
    ]);
    hospitals = hospData;
    doctors = docData;
  } catch (err) {
    console.warn("Falling back to local store for hospitals:", err);
    hospitals = store.caseload() as any;
    doctors = store.listDoctors() as any;
  }

  return (
    <div className="page">
      <PageHeader title="Hospitals & doctors" subtitle="Registered facilities, their clinicians and caseload." />
      <div className="grid grid--wide">
        {hospitals.map((h) => {
          const docsAtHospital = doctors.filter((d) => d.hospital_id === h.hospital_id);
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
              <div className="flex" style={{ flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
                <div className="flex" style={{ flexWrap: "wrap" }}>
                  <Chip tone="neutral" icon={false}>{h.visit_count} visits</Chip>
                  <Chip tone="neutral" icon={false}>{h.patient_count ?? h.active_patients ?? 0} patients</Chip>
                  <Chip tone="neutral" icon={false}>{h.opd_visits || 0} outpatient</Chip>
                  <Chip tone="neutral" icon={false}>{h.inpatient_visits || 0} inpatient</Chip>
                  <Chip tone="neutral" icon={false}>{h.emergency_visits || 0} emergency</Chip>
                  <Chip tone="neutral" icon={false}>{docsAtHospital.length} doctors</Chip>
                </div>
                <Link className="btn btn--secondary btn--sm" href={`/dashboard?hospital=${h.hospital_id}#hospital-patients`}>
                  View synced patients
                </Link>
              </div>
              <DataTable
                caption={`Doctors at ${h.hospital_name}`}
                rows={docsAtHospital}
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
