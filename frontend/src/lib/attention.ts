// The attention system: the few things a human must act on or look at now.
// Each role gets its own rules (SKILL section 8). Items drive the maroon UI,
// so every rule here has to be worth the colour.

import { assessLab } from "./lab-ranges";
import { daysBetween, maskId } from "./format";
import * as store from "./store";
import type { Session } from "./types";

export type AttentionKind = "lab" | "consent" | "prescription" | "access";

export interface AttentionItem {
  id: string;
  kind: AttentionKind;
  severity: "watch" | "critical";
  title: string;
  detail: string;
  href: string;
  action: string;
}

const CRITICAL_LAB_WINDOW_DAYS = 270;
const CONSENT_EXPIRY_PATIENT_DAYS = 90;
const CONSENT_EXPIRY_STAFF_DAYS = 30;
const REFILL_WINDOW_DAYS = 14;
const OVERRIDE_PATIENT_WINDOW_DAYS = 30;
const EXCEPTION_WINDOW_DAYS = 90;

const rank = (i: AttentionItem) => (i.severity === "critical" ? 0 : 1);

function criticalLabs(patientId: string) {
  const now = store.today();
  return store
    .labsOf(patientId)
    .filter((l) => daysBetween(l.test_date, now) <= CRITICAL_LAB_WINDOW_DAYS)
    .map((l) => ({ lab: l, a: assessLab(l.test_name, l.result) }))
    .filter(({ a }) => a.flag === "critical");
}

export function attentionFor(session: Session, auditList?: any[], consentsList?: any[]): AttentionItem[] {
  const now = store.today();
  const items: AttentionItem[] = [];

  if (session.role === "patient") {
    const id = session.id!;

    for (const { lab, a } of criticalLabs(id)) {
      items.push({
        id: `lab-${lab.lab_test_id}`,
        kind: "lab",
        severity: "critical",
        title: `${lab.test_name} is ${a.direction === "low" ? "lower" : "higher"} than the safe range`,
        detail: `Result from ${lab.hospital_name}. Your doctor may call you back; contact them if you have symptoms.`,
        href: "/dashboard#results",
        action: "See result",
      });
    }
    for (const c of store.consentsOf(id)) {
      if (c.status !== "Active" || !c.end_date) continue;
      const left = daysBetween(now, c.end_date);
      if (left < 0 || left > CONSENT_EXPIRY_PATIENT_DAYS) continue;
      const who = c.doctor_id ? store.getDoctor(c.doctor_id)?.full_name : store.getHospital(c.hospital_id!)?.hospital_name;
      items.push({
        id: `consent-${c.consent_id}`,
        kind: "consent",
        severity: "watch",
        title: `Access for ${who} ends in ${left} days`,
        detail: "After that date they can no longer open your record. Renew it if you still need their care.",
        href: "/consents",
        action: "Review consent",
      });
    }
    for (const rx of store.activePrescriptions(id)) {
      if (rx.days_left === null || rx.days_left > REFILL_WINDOW_DAYS) continue;
      items.push({
        id: `rx-${rx.prescription_id}`,
        kind: "prescription",
        severity: "watch",
        title: `${rx.medicine_name} runs out in ${rx.days_left} days`,
        detail: `Prescribed by ${rx.doctor_name}. Book a review before it ends so you don't miss a dose.`,
        href: "/dashboard#medicines",
        action: "See medicines",
      });
    }
    for (const e of store.auditForPatient(id)) {
      if (e.action !== "EMERGENCY_READ" || daysBetween(e.action_time, now) > OVERRIDE_PATIENT_WINDOW_DAYS) continue;
      items.push({
        id: `override-${e.log_id}`,
        kind: "access",
        severity: "watch",
        title: "Your record was opened in an emergency",
        detail: `${e.doctor_name ?? "A doctor"} used emergency access. Check the access history if this is unexpected.`,
        href: "/audit",
        action: "Open history",
      });
    }
  }

  if (session.role === "doctor") {
    const id = session.id!;
    for (const p of store.patientsWithAccess(id)) {
      for (const { lab } of criticalLabs(p.patient_id)) {
        items.push({
          id: `lab-${lab.lab_test_id}`,
          kind: "lab",
          severity: "critical",
          title: `Critical ${lab.test_name}: ${lab.result} ${lab.unit ?? ""}`.trim(),
          detail: `${p.full_name}, ${maskId(p.patient_id)}, at ${lab.hospital_name}.`,
          href: `/patients/${p.patient_id}`,
          action: "Open chart",
        });
      }
      for (const c of store.consentsOf(p.patient_id)) {
        if (c.status !== "Active" || !c.end_date) continue;
        const left = daysBetween(now, c.end_date);
        if (left < 0 || left > CONSENT_EXPIRY_STAFF_DAYS) continue;
        items.push({
          id: `consent-${c.consent_id}`,
          kind: "consent",
          severity: "watch",
          title: `Consent for ${p.full_name} ends in ${left} days`,
          detail: "Ask the patient to renew it if you still need to see their record.",
          href: `/patients/${p.patient_id}`,
          action: "Open chart",
        });
      }
      if (store.accessLevel(p.patient_id, id) === "emergency") {
        items.push({
          id: `override-${p.patient_id}`,
          kind: "access",
          severity: "watch",
          title: `Emergency access active for ${p.full_name}`,
          detail: "It was logged and the patient will see it. Ask for consent as soon as they can give it.",
          href: `/patients/${p.patient_id}`,
          action: "Open chart",
        });
      }
    }
  }

  if (session.role === "admin") {
    const source = auditList ?? store.allAudit();
    const exceptions = source
      .filter((e: any) => (e.action === "DENIED" || e.action === "EMERGENCY_READ") && daysBetween(e.action_time, now) <= EXCEPTION_WINDOW_DAYS);
    const denied = exceptions.filter((e) => e.action === "DENIED").length;
    const overrides = exceptions.length - denied;
    if (overrides > 0) {
      items.push({
        id: "audit-override",
        kind: "access",
        severity: "critical",
        title: `${overrides} emergency override${overrides > 1 ? "s" : ""} in the last ${EXCEPTION_WINDOW_DAYS} days`,
        detail: "Each one bypassed patient consent and needs a compliance review.",
        href: "/audit?action=EMERGENCY_READ",
        action: "Review",
      });
    }
    if (denied > 0) {
      items.push({
        id: "audit-denied",
        kind: "access",
        severity: "watch",
        title: `${denied} blocked access attempt${denied > 1 ? "s" : ""} in the last ${EXCEPTION_WINDOW_DAYS} days`,
        detail: "Doctors tried to open charts without consent. Check that none are repeated.",
        href: "/audit?action=DENIED",
        action: "Review",
      });
    }
    const consentSource = consentsList ?? store.allConsents();
    const expiring = consentSource.filter((c: any) => {
      if (c.status !== "Active" || !c.end_date) return false;
      const left = daysBetween(now, c.end_date);
      return left >= 0 && left <= CONSENT_EXPIRY_PATIENT_DAYS;
    }).length;
    if (expiring > 0) {
      items.push({
        id: "consent-expiring",
        kind: "consent",
        severity: "watch",
        title: `${expiring} consent${expiring > 1 ? "s expire" : " expires"} within ${CONSENT_EXPIRY_PATIENT_DAYS} days`,
        detail: "Doctors will lose access to these records when they lapse.",
        href: "/audit?action=CONSENT_CHANGE",
        action: "See changes",
      });
    }
  }

  return items.sort((a, b) => rank(a) - rank(b));
}
