"use client";

import { TriangleAlert } from "lucide-react";
import { useRef } from "react";
import { revokeConsentAction } from "@/lib/actions";

/** Revoking consent is destructive, so it asks first. */
export function ConfirmRevoke({ consentId, who }: { consentId: number; who: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button type="button" className="btn btn--secondary btn--sm" onClick={() => dialog.current?.showModal()}>
        Revoke
      </button>
      <dialog ref={dialog} className="modal" aria-labelledby={`revoke-${consentId}`}>
        <form action={revokeConsentAction} className="stack-sm">
          <input type="hidden" name="consent_id" value={consentId} />
          <h2 id={`revoke-${consentId}`} className="flex">
            <TriangleAlert size={22} strokeWidth={1.75} aria-hidden="true" style={{ color: "var(--maroon-700)" }} />
            Revoke access?
          </h2>
          <p>
            {who} will no longer be able to open your record. You can grant access again at any time, and this change is
            written to your access history.
          </p>
          <div className="actions" style={{ marginTop: 8 }}>
            <button type="submit" className="btn btn--critical">
              Revoke access
            </button>
            <button type="button" className="btn btn--secondary" onClick={() => dialog.current?.close()}>
              Keep access
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
