import { getSession } from "@/lib/session";
import { api } from "@/lib/api";
import { listPatients } from "@/lib/store";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || session.role === "patient") {
    return Response.json({ error: "Doctor or admin sign-in required" }, { status: 403 });
  }
  const q = new URL(request.url).searchParams.get("q") ?? "";

  try {
    const patients = await api.getPatients(q, 100);
    return Response.json({ patients, source: "PostgreSQL 17 (via FastAPI)" });
  } catch {
    return Response.json({ patients: listPatients(q), source: "In-memory cache" });
  }
}
