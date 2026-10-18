"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { maskId } from "@/lib/format";

/** Patient identifiers stay masked ("ID ••••1002") until the user chooses to reveal them. */
export function MaskedId({ id }: { id: string }) {
  const [shown, setShown] = useState(false);
  return (
    <span className="id-mask">
      <span>{shown ? id : maskId(id)}</span>
      <button
        type="button"
        onClick={() => setShown(!shown)}
        aria-pressed={shown}
        aria-label={shown ? "Hide patient ID" : "Show patient ID"}
        title={shown ? "Hide ID" : "Show ID"}
      >
        {shown ? <EyeOff size={16} strokeWidth={1.75} /> : <Eye size={16} strokeWidth={1.75} />}
      </button>
    </span>
  );
}
