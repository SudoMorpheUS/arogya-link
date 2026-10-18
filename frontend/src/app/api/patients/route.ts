import { getSession } from "@/lib/session";
import { listPatients } from "@/lib/store";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || session.role === "patient") {
    return Response.json({ error: "Doctor or admin sign-in required" }, { status: 403 });
  }
  const q = new URL(request.url).searchParams.get("q") ?? "";
  return Response.json({ patients: listPatients(q) });
}
