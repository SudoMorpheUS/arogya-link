import { getSession } from "@/lib/session";
import { getPatient, openChart, timeline } from "@/lib/store";

// Consent-gated unified history. Doctors are checked with fn_has_consent and every
// attempt (READ / DENIED) is written to the audit log; patients may read their own.
export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!getPatient(id)) return Response.json({ error: "Patient not found" }, { status: 404 });

  const session = await getSession();
  if (!session) return Response.json({ error: "Sign in required" }, { status: 401 });

  if (session.role === "patient") {
    if (session.id !== id) return Response.json({ error: "You can only view your own history" }, { status: 403 });
    return Response.json({ patient_id: id, visits: timeline(id) });
  }
  if (session.role === "doctor") {
    const chart = openChart(id, session.id!);
    if (!chart.ok) return Response.json({ error: "No active consent for this patient" }, { status: 403 });
    return Response.json({ patient_id: id, access: chart.level, visits: chart.timeline, recent_labs: chart.recentLabs });
  }
  return Response.json({ error: "Administrators cannot read clinical records" }, { status: 403 });
}
