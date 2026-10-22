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
  AnonymousSession,
  PrequalifiedPersonnel,
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

// Anonymous Sessions keyed by accessKey
export const anonymousSessions = new Map<string, AnonymousSession>();

// canSeeCase() (routes/cases.ts) matches on the REAL TideCloak JWT `sub` — the realm user's UUID,
// identical to its admin-API `id` — not a human-readable placeholder. These must be the actual
// `reporter1` / `reviewer1` user IDs from the bootstrapped realm, overridable via env for other
// environments.
const DEMO_REPORTER1_SUBJECT = process.env.DEMO_REPORTER1_SUBJECT ?? "ab730bd2-dfbc-46b5-95d5-b5497ec1ee9c";
const DEMO_REVIEWER1_SUBJECT = process.env.DEMO_REVIEWER1_SUBJECT ?? "3058d433-f886-4b99-a110-601ca8f73763";

// Prequalified Roster of Case Officers and Independent Reviewers. The "reviewer-a" slot (Dr. Do
// Hoang Long) is presented in the assign-reviewer UI as the real bootstrapped `reviewer1` realm
// user, so its id must BE that user's real subject — otherwise assigning them from this roster
// records a reviewerSubject that never matches `reviewer1`'s actual JWT `sub`, and canSeeCase()
// hides the case from them forever (the exact bug this was fixed for demo-case-1 below, but the
// roster itself still had the stale placeholder id).
export const prequalifiedPersonnel: PrequalifiedPersonnel[] = [
  {
    id: "officer-1",
    name: "Tran Tuan Anh",
    role: "case-officer",
    organization: "Internal Inspection & Legal Affairs",
    title: "Lead Investigator",
    email: "officer1@trustvoice.internal",
  },
  {
    id: "officer-2",
    name: "Nguyen Thi Mai",
    role: "case-officer",
    organization: "Compliance & Audit Department",
    title: "Supervisory Specialist",
    email: "officer2@trustvoice.internal",
  },
  {
    id: DEMO_REVIEWER1_SUBJECT,
    name: "Dr. Do Hoang Long",
    role: "independent-reviewer",
    organization: "Independent Bar Association & Integrity Oversight",
    title: "Independent Inspector",
    email: "reviewer-a@ombudsman.org",
  },
  {
    id: "reviewer-b",
    name: "Elena Vu",
    role: "independent-reviewer",
    organization: "Financial Transparency Initiative (TI Partner)",
    title: "Independent Assessment Specialist",
    email: "reviewer-b@ombudsman.org",
  },
];

// Seed demo-case-1 so the README E2EE demo works out of the box. Previously hardcoded as
// "reporter-1" / "reviewer-a", which never matched any real token and made demo-case-1 404 for
// anyone but `admin` (who bypasses the identity check).
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
  assignedCaseOfficerId: "officer-1",
  assignedCaseOfficerName: "Tran Tuan Anh (Internal Inspection & Legal Affairs)",
  assignedReviewerId: DEMO_REVIEWER1_SUBJECT,
  assignedReviewerName: "Dr. Do Hoang Long (Independent Bar Association)",
  e2eePolicyGranted: false,
});
reporterIdentities.set("demo-identity-1", {
  id: "demo-identity-1",
  caseId: "demo-case-1",
  pseudonym: "Whistleblower-Alpha",
  reporterSubject: DEMO_REPORTER1_SUBJECT,
  disclosurePreference: "confidential",
});

// Also create an active assignment for reviewer1 on demo-case-1
reviewAssignments.set("demo-assignment-1", {
  id: "demo-assignment-1",
  caseId: "demo-case-1",
  reviewerSubject: DEMO_REVIEWER1_SUBJECT,
  status: "ACTIVE",
  assignedAt: demoNow,
  assignedBySubject: "officer-1",
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

export function generateAccessKey(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const part1 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  const part2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `TV-ANON-${part1}-${part2}`;
}

export function generatePin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function createAnonymousSession(caseId: string): { accessKey: string; pin: string } {
  const accessKey = generateAccessKey();
  const pin = generatePin();
  const session: AnonymousSession = {
    accessKey,
    pin,
    caseId,
    createdAt: new Date().toISOString(),
  };
  anonymousSessions.set(accessKey, session);
  return { accessKey, pin };
}

export function verifyAnonymousSession(accessKey: string, pin: string): AnonymousSession | null {
  const session = anonymousSessions.get(accessKey.trim().toUpperCase());
  if (!session) return null;
  if (session.pin !== pin.trim()) return null;
  return session;
}
