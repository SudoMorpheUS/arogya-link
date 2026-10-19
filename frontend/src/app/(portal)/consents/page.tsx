import { Building2, MapPin, ShieldCheck, Stethoscope } from "lucide-react";
import type { Metadata } from "next";
import { ConfirmRevoke } from "@/components/ConfirmRevoke";
import { GrantConsentForm } from "@/components/GrantConsentForm";
import { Chip, DataTable, Empty, PageHeader, VisibilityNote } from "@/components/ui";
import { daysBetween, formatDate } from "@/lib/format";
import { requireSession } from "@/lib/session";
import { api } from "@/lib/api";
import * as store from "@/lib/store";

export const metadata: Metadata = { title: "Consent" };

const CITY_STATE_MAP: Record<string, [string, string]> = {
  kolkata: ["Kolkata", "West Bengal"],
  mumbai: ["Mumbai", "Maharashtra"],
  bhopal: ["Bhopal", "Madhya Pradesh"],
  hyderabad: ["Hyderabad", "Telangana"],
  pune: ["Pune", "Maharashtra"],
  nagpur: ["Nagpur", "Maharashtra"],
  coimbatore: ["Coimbatore", "Tamil Nadu"],
  lucknow: ["Lucknow", "Uttar Pradesh"],
  jaipur: ["Jaipur", "Rajasthan"],
  ahmedabad: ["Ahmedabad", "Gujarat"],
  bangalore: ["Bengaluru", "Karnataka"],
  bengaluru: ["Bengaluru", "Karnataka"],
  bhubaneswar: ["Bhubaneswar", "Odisha"],
  patna: ["Patna", "Bihar"],
  visakhapatnam: ["Visakhapatnam", "Andhra Pradesh"],
  chennai: ["Chennai", "Tamil Nadu"],
  surat: ["Surat", "Gujarat"],
  kochi: ["Kochi", "Kerala"],
  delhi: ["Delhi", "Delhi"],
  "new delhi": ["Delhi", "Delhi"],
  indore: ["Indore", "Madhya Pradesh"],
};

export function parseLocationState(address: string | null | undefined): { city: string; state: string; formatted: string } {
  if (!address) return { city: "—", state: "—", formatted: "—" };
  const lower = address.toLowerCase();
  for (const [key, [city, state]] of Object.entries(CITY_STATE_MAP)) {
    if (lower.includes(key)) {
      return { city, state, formatted: `${city}, ${state}` };
    }
  }
  const parts = address.split(",").map((s) => s.trim()).filter(Boolean);
  const city = parts[parts.length - 1] || "—";
  return { city, state: "India", formatted: `${city}, India` };
}

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

  const hospitalMap = new Map(hospitalsList.map((h) => [h.hospital_id, h]));
  const doctorMap = new Map(doctorsList.map((d) => [d.doctor_id, d]));

  const hospitals = hospitalsList.map((h) => {
    const loc = parseLocationState(h.address);
    return {
      value: `hospital:${h.hospital_id}`,
      label: h.hospital_name,
      subtitle: `${h.address} · Location: ${loc.formatted}`,
      type: "hospital" as const,
      badge: loc.formatted,
    };
  });

  const doctors = doctorsList.map((d) => {
    const hosp = hospitalMap.get(d.hospital_id);
    const loc = parseLocationState(hosp?.address);
    return {
      value: `doctor:${d.doctor_id}`,
      label: d.full_name,
      subtitle: `${d.specialization || "General Medicine"} · ${hosp?.hospital_name || d.hospital_id} (${loc.formatted})`,
      type: "doctor" as const,
      badge: `${d.specialization || "Doctor"} · ${loc.city}`,
    };
  });

  const resolveConsent = (c: any) => {
    const isDoctor = Boolean(c.doctor_id);
    const doc = c.doctor_id ? doctorMap.get(c.doctor_id) : null;
    const hosp = isDoctor
      ? (doc?.hospital_id ? hospitalMap.get(doc.hospital_id) : null)
      : (c.hospital_id ? hospitalMap.get(c.hospital_id) : null);

    const name = c.doctor_name || doc?.full_name || c.hospital_name || hosp?.hospital_name || "Authorized Entity";
    const specialization = isDoctor
      ? c.doctor_specialization || doc?.specialization || "General Medicine"
      : "All Departments (Hospital-wide)";
    const hospitalName = isDoctor
      ? c.doctor_hospital_name || hosp?.hospital_name || "Hospital Network"
      : c.hospital_name || hosp?.hospital_name || "Hospital Network";
    const address = isDoctor
      ? c.doctor_hospital_address || hosp?.address || ""
      : c.hospital_address || hosp?.address || "";
    const loc = c.location && c.location !== "—" ? { formatted: c.location, city: c.city, state: c.state } : parseLocationState(address);

    return {
      isDoctor,
      name,
      specialization,
      hospitalName,
      location: loc.formatted,
      city: loc.city,
      state: loc.state,
    };
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
                  cell: (c) => {
                    const info = resolveConsent(c);
                    return (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                        {info.isDoctor ? (
                          <Stethoscope size={16} style={{ color: "var(--blue-600)", flexShrink: 0 }} />
                        ) : (
                          <Building2 size={16} style={{ color: "var(--blue-600)", flexShrink: 0 }} />
                        )}
                        <div style={{ minWidth: 0 }}>
                          <span style={{ fontWeight: 600, color: "var(--ink-900)", display: "block" }}>
                            {info.name}
                          </span>
                          <span style={{ fontSize: "11px", color: "var(--ink-600)" }}>
                            {info.isDoctor ? "Doctor" : "Whole hospital"}
                          </span>
                        </div>
                      </div>
                    );
                  },
                },
                {
                  header: "Specialization",
                  cell: (c) => {
                    const info = resolveConsent(c);
                    return (
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontSize: "var(--fs-xs)",
                          fontWeight: 500,
                          background: info.isDoctor ? "var(--blue-50, #242424)" : "transparent",
                          border: "1px solid var(--line)",
                          color: info.isDoctor ? "var(--ink-900)" : "var(--ink-600)",
                        }}
                      >
                        {info.specialization}
                      </span>
                    );
                  },
                },
                {
                  header: "Hospital / Facility",
                  cell: (c) => {
                    const info = resolveConsent(c);
                    return <span style={{ fontWeight: 500 }}>{info.hospitalName}</span>;
                  },
                },
                {
                  header: "Location & State",
                  cell: (c) => {
                    const info = resolveConsent(c);
                    return (
                      <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "var(--ink-900)" }}>
                        <MapPin size={14} style={{ color: "var(--blue-600)", flexShrink: 0 }} />
                        <span>{info.location}</span>
                      </div>
                    );
                  },
                  nowrap: true,
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
                      <ConfirmRevoke consentId={c.consent_id} who={resolveConsent(c).name} />
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
