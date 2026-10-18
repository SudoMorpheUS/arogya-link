import { listDoctors } from "@/lib/store";

export function GET(request: Request) {
  const hospital = new URL(request.url).searchParams.get("hospital_id");
  const rows = listDoctors().filter((d) => !hospital || d.hospital_id === hospital);
  return Response.json({ doctors: rows });
}
