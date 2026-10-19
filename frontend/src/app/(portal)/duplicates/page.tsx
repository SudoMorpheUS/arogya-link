import type { Metadata } from "next";
import Link from "next/link";
import { DataTable, Empty, PageHeader } from "@/components/ui";
import { MaskedId } from "@/components/MaskedId";
import { formatDate } from "@/lib/format";
import { requireSession } from "@/lib/session";
import { api } from "@/lib/api";
import * as store from "@/lib/store";

export const metadata: Metadata = { title: "Duplicate tests" };

export default async function DuplicatesPage() {
  const session = await requireSession(["doctor", "admin"]);
  let rows: any[] = [];
  try {
    const raw = await api.getDuplicates(100);
    rows = raw.map((d) => ({
      ...d,
      times_run: 2,
      first_date: d.initial_date,
      last_date: d.duplicate_date,
      hospitals: [d.initial_hospital_name, d.duplicate_hospital_name],
    }));
  } catch (err) {
    console.warn("Falling back to local store for duplicates:", err);
    rows = store.duplicateLabs();
  }
  if (session.role === "doctor") {
    rows = rows.filter((d) => store.accessLevel(d.patient_id, session.id!) !== "none");
  }

  return (
    <div className="page">
      <PageHeader
        title="Duplicate tests"
        subtitle="The same test run at different hospitals within 90 days. Reuse the earlier result and spare the patient a repeat."
      />
      {rows.length === 0 ? (
        <Empty>No repeated tests among patients who have allowed you access.</Empty>
      ) : (
        <DataTable
          caption="Repeated lab tests"
          rows={rows}
          rowKey={(d) => `${d.patient_id}-${d.test_name}`}
          columns={[
            {
              header: "Patient",
              cell: (d) => (
                <span className="stack-sm" style={{ gap: 0 }}>
                  <Link href={`/patients/${d.patient_id}`}>{d.patient_name}</Link>
                  <span className="muted" style={{ fontSize: "var(--fs-xs)" }}>
                    <MaskedId id={d.patient_id} />
                  </span>
                </span>
              ),
            },
            { header: "Test", cell: (d) => d.test_name },
            { header: "Times run", cell: (d) => d.times_run },
            { header: "First", cell: (d) => formatDate(d.first_date), nowrap: true },
            { header: "Latest", cell: (d) => formatDate(d.last_date), nowrap: true },
            { header: "Hospitals", cell: (d) => d.hospitals.join(", ") },
          ]}
        />
      )}
    </div>
  );
}
