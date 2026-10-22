import { nanoid } from "nanoid";
import type {
  Case,
  CaseEvent,
  ClosureRequest,
  DisclosureRequest,
  Evidence,
  ReporterIdentity,
  ReviewAssignment,
  SignedPolicy,
  AppRole,
} from "./types.js";

// In-memory store for the hackathon MVP. Every entity from PROJECT_OVERVIEW.md section 9 lives
// here as a plain Map. Swap for Postgres/SQLite for anything beyond a demo — nothing here is
// tamper-evident or durable across a restart, and that limitation is documented in README.md.

export const cases = new Map<string, Case>();
export const reporterIdentities = new Map<string, ReporterIdentity>();
export const reviewAssignments = new Map<string, ReviewAssignment>();
export const closureRequests = new Map<string, ClosureRequest>();
export const disclosureRequests = new Map<string, DisclosureRequest>();
export const caseEvents: CaseEvent[] = [];
export const evidence = new Map<string, Evidence>();
// Keyed by `${subjectType}:${subjectId}:${recordId}` — one signed policy per subject per record.
export const signedPolicies = new Map<string, SignedPolicy>();

// Seed demo-case-1 so the README E2EE demo works out of the box
const demoNow = new Date().toISOString();
cases.set("demo-case-1", {
  id: "demo-case-1",
  referenceNumber: "TV-2026-0001",
  category: "financial-misconduct",
  summary: "Executive financial manipulation (E2EE Demo Case)",
  description: "Synthetic case used to demonstrate threshold-E2EE evidence encryption and decryption.",
  status: "UNDER_REVIEW",
  severity: "high",
  createdAt: demoNow,
  updatedAt: demoNow,
  reporterIdentityId: "demo-identity-1",
});
reporterIdentities.set("demo-identity-1", {
  id: "demo-identity-1",
  caseId: "demo-case-1",
  pseudonym: "Whistleblower-Alpha",
  reporterSubject: "reporter-1",
  disclosurePreference: "confidential",
});


export function policyKey(subjectType: string, subjectId: string, recordId: string): string {
  return `${subjectType}:${subjectId}:${recordId}`;
}

export function recordEvent(input: {
  caseId: string;
  actorSubject: string;
  actorRole: AppRole | "unknown";
  action: string;
  outcome: "ALLOWED" | "DENIED";
  reasonCode?: string;
}): CaseEvent {
  const event: CaseEvent = {
    id: nanoid(),
    timestamp: new Date().toISOString(),
    ...input,
  };
  caseEvents.push(event);
  return event;
}

export function activeAssignmentFor(caseId: string, reviewerSubject: string): ReviewAssignment | undefined {
  return [...reviewAssignments.values()].find(
    (a) => a.caseId === caseId && a.reviewerSubject === reviewerSubject && a.status === "ACTIVE",
  );
}

export function nextReferenceNumber(): string {
  const n = cases.size + 1;
  return `TV-${new Date().getFullYear()}-${String(n).padStart(4, "0")}`;
}
