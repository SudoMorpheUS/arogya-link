import { getSession } from "@/lib/session";
import { api } from "@/lib/api";
import { accessLevel, duplicateLabs } from "@/lib/store";

export async function GET() {
  const session = await getSession();
  if (session?.role !== "doctor") {
    return Response.json({ error: "Doctor sign-in required" }, { status: 403 });
  }

  try {
    const duplicates = await api.getDuplicates();
    return Response.json({ duplicates, source: "PostgreSQL 17 (v_duplicate_lab_tests view via FastAPI)" });
  } catch {
    const duplicates = duplicateLabs().filter((d) => accessLevel(d.patient_id, session.id!) !== "none");
    return Response.json({ duplicates, source: "In-memory cache" });
  }
}
