import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDoctor, getPatient } from "./store";
import type { Role, Session } from "./types";

export const SESSION_COOKIE = "al_session";

export async function getSession(): Promise<Session | null> {
  const raw = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  let role: Role | undefined;
  let id: string | null = null;
  let email: string | null = null;
  let displayName: string | null = null;

  if (raw.startsWith("{")) {
    try {
      const parsed = JSON.parse(raw);
      role = parsed.role;
      id = parsed.id ?? null;
      email = parsed.email ?? null;
      displayName = parsed.displayName ?? null;
    } catch {
      return null;
    }
  } else {
    const parts = raw.split(":");
    role = parts[0] as Role;
    id = parts[1] || null;
    email = parts[2] || null;
  }

  if (role === "admin") {
    return {
      role: "admin",
      id: null,
      email: email || "admin@arogyalink.in",
      displayName: displayName || "Central Administrator",
    };
  }

  if (role === "doctor" && id && getDoctor(id)) {
    const doc = getDoctor(id)!;
    return {
      role: "doctor",
      id,
      email: email || doc.email || null,
      displayName: displayName || doc.full_name,
    };
  }

  if (role === "patient" && id && getPatient(id)) {
    const pat = getPatient(id)!;
    return {
      role: "patient",
      id,
      email: email || pat.email || null,
      displayName: displayName || pat.full_name,
    };
  }

  return null;
}

export async function requireSession(allowed?: Role[]): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/");
  if (allowed && !allowed.includes(session.role)) redirect("/dashboard");
  return session;
}

export async function setSession(session: Session): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, JSON.stringify(session), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function clearSession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}
