import { api } from "@/lib/api";
import { totals } from "@/lib/store";

export async function GET() {
  try {
    const stats = await api.getStats();
    return Response.json({
      status: "ok",
      architecture: "3-Tier (Next.js -> FastAPI -> PostgreSQL 17)",
      backend: "FastAPI (:8000)",
      database: "PostgreSQL 17 (:5432)",
      records: stats,
    });
  } catch {
    return Response.json({
      status: "ok",
      architecture: "3-Tier (Fallback local)",
      records: totals(),
    });
  }
}
