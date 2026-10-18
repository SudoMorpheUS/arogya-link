"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

/** Doctor keyboard shortcuts: "/" focuses search, "]" and "[" move to the next / previous patient. */
export function Shortcuts({ patientIds }: { patientIds: string[] }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;

      if (e.key === "/") {
        const input = document.getElementById("global-search") as HTMLInputElement | null;
        if (input && input.offsetParent !== null) {
          e.preventDefault();
          input.focus();
        } else {
          router.push("/patients");
        }
        return;
      }
      if ((e.key === "]" || e.key === "[") && patientIds.length > 0) {
        const current = patientIds.indexOf(pathname.split("/")[2] ?? "");
        const step = e.key === "]" ? 1 : -1;
        const next = patientIds[(current + step + patientIds.length) % patientIds.length];
        router.push(`/patients/${next}`);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, pathname, patientIds]);

  return null;
}
