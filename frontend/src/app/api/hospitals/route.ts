import { api } from "@/lib/api";
import { caseload, listHospitals } from "@/lib/store";

export async function GET() {
  try {
    const [hospitals, caseloadData] = await Promise.all([
      api.getHospitals(),
      api.getHospitalCaseload(),
    ]);
    return Response.json({
      hospitals,
      caseload: caseloadData,
      source: "PostgreSQL 17 (via FastAPI)",
    });
  } catch {
    return Response.json({
      hospitals: listHospitals(),
      caseload: caseload(),
      source: "In-memory cache",
    });
  }
}
