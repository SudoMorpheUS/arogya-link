import { UserPlus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { MaskedId } from "@/components/MaskedId";
import { RegisterPatientForm } from "@/components/RegisterPatientForm";
import { Chip, DataTable, Empty, PageHeader } from "@/components/ui";
import { ageOn, maskPhone } from "@/lib/format";
import { requireSession } from "@/lib/session";
import { api, type ApiPatient } from "@/lib/api";
import * as store from "@/lib/store";

export const metadata: Metadata = { title: "Patients" };

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; register?: string; action?: string }>;
}) {
  const session = await requireSession(["doctor", "admin"]);
  const { q = "", register, action } = await searchParams;
  let rows: (ApiPatient | import("@/lib/types").Patient)[] = [];
  let consentDist: any[] = [];
  try {
    const [patientsData, distData] = await Promise.all([
      api.getPatients(q, 100),
      session.role === "admin" ? api.getConsentDistribution(200) : Promise.resolve([]),
    ]);
    rows = patientsData;
    consentDist = distData;
  } catch (err) {
    console.warn("Falling back to local store for patients:", err);
    rows = store.listPatients(q);
  }
  const consentMap = new Map(consentDist.map((d) => [d.patient_id, d]));
  const today = store.today();
  const isDoctor = session.role === "doctor";
  const isRegistering = Boolean(register || action === "register");

  return (
    <div className="page">
      <PageHeader
        title={isDoctor ? "Patients" : "Patient registry"}
        subtitle={
          isDoctor
            ? "Search by name or patient ID. A chart opens only when the patient has allowed access."
            : "Registered patients and their global IDs. Administrators do not see clinical records."
        }
        actions={
          <a className="btn" href="#register">
            <UserPlus size={18} strokeWidth={1.75} aria-hidden="true" />
            Register patient
          </a>
        }
      />

      <form className="search-form" role="search">
        <input name="q" defaultValue={q} placeholder="Name, patient ID or blood group" aria-label="Search patients" type="search" />
        <button className="btn">Search</button>
        {q ? (
          <Link className="btn btn--secondary" href="/patients">
            Clear
          </Link>
        ) : null}
      </form>

      {rows.length === 0 ? (
        <Empty>No patient matches that search.</Empty>
      ) : (
        <DataTable
          caption="Patients"
          rows={rows}
          rowKey={(p) => p.patient_id}
          columns={[
            {
              header: "Patient",
              cell: (p) => (
                <span className="truncate" style={{ display: "block", maxWidth: "24ch" }} title={p.full_name}>
                  {p.full_name}
                </span>
              ),
            },
            { header: "ID", cell: (p) => <MaskedId id={p.patient_id} /> },
            { header: "Age / sex", cell: (p) => `${ageOn(p.date_of_birth, today)} / ${p.gender}`, nowrap: true },
            { header: "Blood", cell: (p) => p.blood_group ?? "—" },
            { header: "Contact", cell: (p) => maskPhone(p.contact_number), nowrap: true },
            ...(isDoctor
              ? [
                  {
                    header: "Access",
                    cell: (p: (typeof rows)[number]) => {
                      const level = store.accessLevel(p.patient_id, session.id!);
                      return (
                        <span className="flex">
                          {level === "none" ? (
                            <Chip tone="attention">No consent</Chip>
                          ) : level === "emergency" ? (
                            <Chip tone="attention">Emergency</Chip>
                          ) : (
                            <Chip>Allowed</Chip>
                          )}
                          <Link className="btn btn--secondary btn--sm" href={`/patients/${p.patient_id}`}>
                            Open chart
                          </Link>
                        </span>
                      );
                    },
                  },
                ]
              : [
                  {
                    header: "Consented hospitals",
                    cell: (p: (typeof rows)[number]) => {
                      const dist = consentMap.get(p.patient_id);
                      if (!dist || !dist.consented_hospitals || dist.consented_hospitals.length === 0) {
                        return <span className="muted" style={{ fontSize: "var(--fs-xs)" }}>None</span>;
                      }
                      return (
                        <div className="flex" style={{ flexWrap: "wrap", gap: 4 }}>
                          {dist.consented_hospitals.slice(0, 2).map((h: string) => (
                            <Chip key={h} tone="neutral" icon={false}>
                              {h}
                            </Chip>
                          ))}
                          {dist.consented_hospitals.length > 2 ? (
                            <span className="muted" style={{ fontSize: "var(--fs-xs)" }}>
                              +{dist.consented_hospitals.length - 2} more
                            </span>
                          ) : null}
                        </div>
                      );
                    },
                  },
                ]),
          ]}
        />
      )}

      <details className="card" id="register" open={isRegistering || undefined}>
        <summary>
          <UserPlus size={18} strokeWidth={1.75} aria-hidden="true" style={{ color: "var(--blue-600)" }} />
          Register a new patient
        </summary>
        <RegisterPatientForm />
      </details>
    </div>
  );
}
