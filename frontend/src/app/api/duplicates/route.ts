import { getSession } from "@/lib/session";
import { accessLevel, duplicateLabs } from "@/lib/store";

export async function GET() {
  const session = await getSession();
  if (session?.role !== "doctor") {
    return Response.json({ error: "Doctor sign-in required" }, { status: 403 });
  }
  const duplicates = duplicateLabs().filter((d) => accessLevel(d.patient_id, session.id!) !== "none");
  return Response.json({ duplicates });
}
