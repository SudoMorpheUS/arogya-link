"use client";

import { useMemo, useState } from "react";
import { Building2, History, MapPin, ShieldCheck, Stethoscope } from "lucide-react";
import { ConfirmRevoke } from "@/components/ConfirmRevoke";
import { Chip, DataTable, Empty } from "@/components/ui";
import { daysBetween, formatDate } from "@/lib/format";

export interface EnrichedConsent {
  consent_id: number;
  patient_id: string;
  hospital_id?: string | null;
  doctor_id?: string | null;
  start_date: string;
  end_date: string | null;
  status: "Active" | "Revoked";
  isDoctor: boolean;
  name: string;
  specialization: string;
  hospitalName: string;
  location: string;
  city: string;
  state: string;
}

export function ConsentsView({
  consents,
  today,
}: {
  consents: EnrichedConsent[];
  today: string;
}) {
  const [tab, setTab] = useState<"active" | "revoked" | "all">("active");

  const activeConsents = useMemo(
    () =>
      consents.filter(
        (c) => c.status === "Active" && c.start_date <= today && (!c.end_date || c.end_date >= today)
      ),
    [consents, today]
  );

  const revokedOrExpiredConsents = useMemo(
    () =>
      consents.filter(
        (c) => c.status === "Revoked" || (c.end_date && c.end_date < today)
      ),
    [consents, today]
  );

  const displayedRows =
    tab === "active"
      ? activeConsents
      : tab === "revoked"
        ? revokedOrExpiredConsents
        : consents;

  return (
    <section
      className="card card-host pane stack-sm"
      aria-labelledby="list-title"
      style={{ minHeight: "100%", display: "flex", flexDirection: "column" }}
    >
      <div
        className="card-head"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <h2 id="list-title" className="flex" style={{ margin: 0 }}>
            <ShieldCheck size={20} strokeWidth={1.75} aria-hidden="true" style={{ color: "var(--blue-600)" }} />
            Your consents
          </h2>
        </div>

        {/* Tab Controls */}
        <div
          role="tablist"
          aria-label="Consent status filters"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "var(--surface-sunken, #1c1c1c)",
            padding: "3px 4px",
            borderRadius: "var(--r-button, 8px)",
            border: "1px solid var(--line)",
          }}
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === "active"}
            onClick={() => setTab("active")}
            className={`btn btn--sm ${tab === "active" ? "" : "btn--secondary"}`}
            style={{
              padding: "4px 10px",
              fontSize: "var(--fs-xs)",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Active ({activeConsents.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "revoked"}
            onClick={() => setTab("revoked")}
            className={`btn btn--sm ${tab === "revoked" ? "" : "btn--secondary"}`}
            style={{
              padding: "4px 10px",
              fontSize: "var(--fs-xs)",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Revoked / Expired ({revokedOrExpiredConsents.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "all"}
            onClick={() => setTab("all")}
            className={`btn btn--sm ${tab === "all" ? "" : "btn--secondary"}`}
            style={{
              padding: "4px 10px",
              fontSize: "var(--fs-xs)",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            All ({consents.length})
          </button>
        </div>
      </div>

      {/* Empty States */}
      {displayedRows.length === 0 ? (
        tab === "active" ? (
          <Empty>
            You haven&apos;t shared your record with anyone. Right now nobody but you can see your record.
          </Empty>
        ) : tab === "revoked" ? (
          <Empty>No revoked or expired consents on file.</Empty>
        ) : (
          <Empty>No consent records found.</Empty>
        )
      ) : (
        <DataTable
          caption={
            tab === "active"
              ? "Active consents"
              : tab === "revoked"
                ? "Revoked & expired consents"
                : "All consents"
          }
          rows={displayedRows}
          rowKey={(c) => c.consent_id}
          columns={[
            {
              header: "Granted to",
              cell: (c) => (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                  {c.isDoctor ? (
                    <Stethoscope size={16} style={{ color: "var(--blue-600)", flexShrink: 0 }} />
                  ) : (
                    <Building2 size={16} style={{ color: "var(--blue-600)", flexShrink: 0 }} />
                  )}
                  <div style={{ minWidth: 0 }}>
                    <span style={{ fontWeight: 600, color: "var(--ink-900)", display: "block" }}>
                      {c.name}
                    </span>
                    <span style={{ fontSize: "11px", color: "var(--ink-600)" }}>
                      {c.isDoctor ? "Doctor" : "Whole hospital"}
                    </span>
                  </div>
                </div>
              ),
            },
            {
              header: "Specialization",
              cell: (c) => (
                <span
                  style={{
                    display: "inline-block",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    fontSize: "var(--fs-xs)",
                    fontWeight: 500,
                    background: c.isDoctor ? "var(--blue-50, #242424)" : "transparent",
                    border: "1px solid var(--line)",
                    color: c.isDoctor ? "var(--ink-900)" : "var(--ink-600)",
                  }}
                >
                  {c.specialization}
                </span>
              ),
            },
            {
              header: "Hospital / Facility",
              cell: (c) => <span style={{ fontWeight: 500 }}>{c.hospitalName}</span>,
            },
            {
              header: "Location & State",
              cell: (c) => (
                <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "var(--ink-900)" }}>
                  <MapPin size={14} style={{ color: "var(--blue-600)", flexShrink: 0 }} />
                  <span>{c.location}</span>
                </div>
              ),
              nowrap: true,
            },
            { header: "From", cell: (c) => formatDate(c.start_date), nowrap: true },
            {
              header: "Until",
              cell: (c) => (c.end_date ? formatDate(c.end_date) : "No end date"),
              nowrap: true,
            },
            {
              header: "Status",
              cell: (c) => {
                if (c.status === "Revoked")
                  return (
                    <Chip tone="neutral" icon={false}>
                      Revoked
                    </Chip>
                  );
                if (c.end_date && c.end_date < today)
                  return (
                    <Chip tone="neutral" icon={false}>
                      Expired
                    </Chip>
                  );
                if (c.start_date > today)
                  return (
                    <Chip tone="neutral" icon={false}>
                      Scheduled
                    </Chip>
                  );
                if (c.end_date && daysBetween(today, c.end_date) <= 90)
                  return <Chip tone="attention">Ends in {daysBetween(today, c.end_date)}d</Chip>;
                return <Chip>Active</Chip>;
              },
            },
            {
              header: "",
              cell: (c) =>
                c.status === "Active" && !(c.end_date && c.end_date < today) ? (
                  <ConfirmRevoke consentId={c.consent_id} who={c.name} />
                ) : (
                  <span
                    style={{
                      fontSize: "11px",
                      color: "var(--ink-500)",
                      fontStyle: "italic",
                    }}
                  >
                    {c.status === "Revoked"
                      ? `Revoked on ${formatDate(c.end_date || today)}`
                      : `Expired`}
                  </span>
                ),
            },
          ]}
        />
      )}
    </section>
  );
}
