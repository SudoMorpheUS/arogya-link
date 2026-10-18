import type { Metadata } from "next";
import Link from "next/link";
import { DataTable, Empty, PageHeader } from "@/components/ui";
import { MaskedId } from "@/components/MaskedId";
import { formatDate } from "@/lib/format";
import { requireSession } from "@/lib/session";
import * as store from "@/lib/store";

export const metadata: Metadata = { title: "Duplicate tests" };

export default async function DuplicatesPage() {
  const session = await requireSession(["doctor"]);
  // Only patients who have allowed this doctor or hospital are shown.
  const rows = store.duplicateLabs().filter((d) => store.accessLevel(d.patient_id, session.id!) !== "none");

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
