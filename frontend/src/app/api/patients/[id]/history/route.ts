import { getSession } from "@/lib/session";
import { api } from "@/lib/api";
import { getPatient, openChart, timeline } from "@/lib/store";

// Consent-gated unified history. Doctors are checked with fn_has_consent and every
// attempt is written to the audit log; patients may read their own.
export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await getSession();
  if (!session) return Response.json({ error: "Sign in required" }, { status: 401 });

  if (session.role === "patient") {
    if (session.id !== id) return Response.json({ error: "You can only view your own history" }, { status: 403 });
    try {
      const remoteTimeline = await api.getTimeline(id);
      return Response.json({ patient_id: id, visits: remoteTimeline, source: "PostgreSQL 17 (via FastAPI)" });
    } catch {
      return Response.json({ patient_id: id, visits: timeline(id), source: "In-memory cache" });
    }
  }

  if (session.role === "doctor") {
    // Check consent via FastAPI calling fn_has_consent in PostgreSQL
    let hasAccess = false;
    try {
      const consentCheck = await api.checkConsent(id, session.id!);
      const emergencyCheck = await api.checkEmergencyAccess(id, session.id!);
      hasAccess = consentCheck.has_consent || emergencyCheck.has_emergency_access;
    } catch {
      hasAccess = openChart(id, session.id!).ok;
    }

    if (!hasAccess) {
      return Response.json({ error: "No active consent or emergency override for this patient" }, { status: 403 });
    }

    try {
      const remoteTimeline = await api.getTimeline(id);
      const labs = await api.getPatientLabs(id);
      return Response.json({
        patient_id: id,
        access: "consent",
        visits: remoteTimeline,
        recent_labs: labs,
        source: "PostgreSQL 17 (via FastAPI)",
      });
    } catch {
      const chart = openChart(id, session.id!);
      if (!chart.ok) return Response.json({ error: "Access denied" }, { status: 403 });
      return Response.json({ patient_id: id, access: chart.level, visits: chart.timeline, recent_labs: chart.recentLabs, source: "In-memory cache" });
    }
  }

  return Response.json({ error: "Administrators cannot read clinical records" }, { status: 403 });
}
