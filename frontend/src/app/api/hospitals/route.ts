import { caseload, listHospitals } from "@/lib/store";

export function GET() {
  return Response.json({ hospitals: listHospitals(), caseload: caseload() });
}
