import { api } from "@/lib/api";
import { listDoctors } from "@/lib/store";

export async function GET(request: Request) {
  const hospital = new URL(request.url).searchParams.get("hospital_id") || undefined;
  try {
    const doctors = await api.getDoctors(hospital);
    return Response.json({ doctors, source: "PostgreSQL 17 (via FastAPI)" });
  } catch {
    const rows = listDoctors().filter((d) => !hospital || d.hospital_id === hospital);
    return Response.json({ doctors: rows, source: "In-memory cache" });
  }
}
