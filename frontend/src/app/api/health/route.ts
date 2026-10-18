import { totals } from "@/lib/store";

export function GET() {
  return Response.json({ status: "ok", service: "arogya-link", runtime: "node", records: totals() });
}
