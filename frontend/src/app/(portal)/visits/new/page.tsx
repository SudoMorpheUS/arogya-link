import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { VisitForm } from "@/components/VisitForm";
import { requireSession } from "@/lib/session";
import * as store from "@/lib/store";

export const metadata: Metadata = { title: "Record visit" };

export default async function NewVisitPage({ searchParams }: { searchParams: Promise<{ patient?: string }> }) {
  const session = await requireSession(["doctor"]);
  const { patient: patientId } = await searchParams;
  const patient = patientId ? store.getPatient(patientId) : null;
  if (!patient) notFound();
  if (store.accessLevel(patient.patient_id, session.id!) === "none") redirect(`/patients/${patient.patient_id}`);

  const doctor = store.getDoctor(session.id!)!;
  const hospital = store.getHospital(doctor.hospital_id)!;
  const recent = store.recentLabs(patient.patient_id).map((l) => ({
    test_name: l.test_name,
    result: l.result,
    unit: l.unit,
    test_date: l.test_date,
    hospital_name: l.hospital_name,
    days_ago: l.days_ago,
  }));

  return (
    <div className="page" style={{ ["--page-max" as string]: "960px" }}>
      <PageHeader
        title="Record visit"
        subtitle={`${patient.full_name} at ${hospital.hospital_name} with ${doctor.full_name}`}
        actions={
          <Link className="btn btn--secondary" href={`/patients/${patient.patient_id}`}>
            Back to chart
          </Link>
        }
      />
      <VisitForm patientId={patient.patient_id} recentLabs={recent} />
    </div>
  );
}
