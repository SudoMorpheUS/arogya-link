import type { Metadata } from "next";
import Link from "next/link";
import { MaskedId } from "@/components/MaskedId";
import { ActionChip, DataTable, Empty, PageHeader, Pager } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import { requireSession } from "@/lib/session";
import { api } from "@/lib/api";
import * as store from "@/lib/store";

export const metadata: Metadata = { title: "Audit log" };

const FILTERS: [string, string][] = [
  ["ALL", "All"],
  ["READ", "Reads"],
  ["DENIED", "Denied"],
  ["EMERGENCY_READ", "Emergency"],
  ["CONSENT_CHANGE", "Consent"],
  ["INSERT", "Visits"],
];
const PAGE_SIZE = 50;

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ action?: string; page?: string }> }) {
  const session = await requireSession();
  const { action = "ALL", page: pageParam } = await searchParams;

  let all: any[] = [];
  try {
    const patientId = session.role === "patient" ? session.id! : undefined;
    const doctorId = session.role === "doctor" ? session.id! : undefined;
    all = await api.getAuditLogs(patientId, doctorId, 500);
  } catch (err) {
    console.warn("Falling back to local store for audit logs:", err);
    all =
      session.role === "patient"
        ? store.auditForPatient(session.id!)
        : session.role === "doctor"
          ? store.auditForDoctor(session.id!)
          : store.allAudit();
  }
  const filtered =
    action === "ALL"
      ? all
      : all.filter((r) => {
          if (action === "EMERGENCY_READ") return r.action === "EMERGENCY_READ" || r.action === "EMERGENCY_OVERRIDE";
          return r.action === action;
        });
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, Number(pageParam) || 1), pages);
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const title = session.role === "patient" ? "Access history" : session.role === "doctor" ? "My access log" : "Audit log";
  const subtitle =
    session.role === "patient"
      ? "Everyone who opened, was blocked from, or changed access to your record."
      : session.role === "doctor"
        ? "Every chart you opened, were blocked from, or wrote to."
        : "Every access attempt, consent change and data modification on the platform.";
  const hrefFor = (p: number, a = action) => `/audit?${new URLSearchParams({ ...(a !== "ALL" ? { action: a } : {}), ...(p > 1 ? { page: String(p) } : {}) })}`.replace(/\?$/, "");

  const columns = [
    { header: "#", cell: (r: (typeof rows)[number]) => r.log_id },
    { header: "Time", cell: (r: (typeof rows)[number]) => formatDateTime(r.action_time), nowrap: true },
    ...(session.role !== "patient"
      ? [
          {
            header: "Patient",
            cell: (r: (typeof rows)[number]) => (
              <span className="stack-sm" style={{ gap: 0 }}>
                <span>{r.patient_name}</span>
                <span className="muted" style={{ fontSize: "var(--fs-xs)" }}>
                  <MaskedId id={r.patient_id} />
                </span>
              </span>
            ),
          },
        ]
      : []),
    { header: "Doctor", cell: (r: (typeof rows)[number]) => r.doctor_name ?? "—" },
    { header: "Action", cell: (r: (typeof rows)[number]) => <ActionChip action={r.action} /> },
    { header: "Details", cell: (r: (typeof rows)[number]) => r.details ?? "" },
  ];

  return (
    <div className="page">
      <PageHeader title={title} subtitle={subtitle} />

      <nav className="actions" aria-label="Filter by action">
        {FILTERS.map(([value, label]) => (
          <Link
            key={value}
            className={value === action ? "btn btn--sm" : "btn btn--secondary btn--sm"}
            href={hrefFor(1, value)}
            aria-current={value === action ? "true" : undefined}
          >
            {label}
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <Empty>No matching entries.</Empty>
      ) : (
        <>
          <DataTable
            caption={title}
            rows={rows}
            rowKey={(r) => r.log_id}
            rowClass={(r) => (r.action === "EMERGENCY_READ" ? "row-critical" : undefined)}
            columns={columns}
          />
          <Pager page={page} pages={pages} total={filtered.length} pageSize={PAGE_SIZE} hrefFor={(p) => hrefFor(p)} />
        </>
      )}
    </div>
  );
}
