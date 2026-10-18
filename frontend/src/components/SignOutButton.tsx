"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { auth, fbSignOut } from "@/lib/firebase";
import { signOut } from "@/lib/actions";

export function SignOutButton() {
  const [isPending, startTransition] = useTransition();

  const handleSignOut = () => {
    startTransition(async () => {
      try {
        await fbSignOut(auth);
      } catch (e) {
        console.warn("Firebase sign-out note:", e);
      }
      await signOut();
    });
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={isPending}
      className="btn btn--secondary"
      style={{ width: "100%", justifyContent: "center" }}
    >
      <LogOut size={16} aria-hidden="true" />
      {isPending ? "Signing out..." : "Sign out"}
    </button>
  );
}
