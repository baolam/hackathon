// Domain types for TrustVoice. These are conceptual entities (see PROJECT_OVERVIEW.md section 9),
// adapted to an in-memory store for the hackathon MVP. Swap the store implementation for a real
// database without changing these shapes.

export type AppRole =
  | "reporter"
  | "case-officer"
  | "independent-reviewer"
  | "admin";

export type CaseStatus =
  | "SUBMITTED"
  | "TRIAGE"
  | "UNDER_REVIEW"
  | "ADDITIONAL_INFORMATION_REQUIRED"
  | "ESCALATED"
  | "PENDING_CLOSURE_APPROVAL"
  | "CLOSED";

export type DisclosurePreference = "anonymous" | "confidential" | "disclosed";

export interface Case {
  id: string;
  referenceNumber: string;
  category: string;
  summary: string;
  description: string;
  status: CaseStatus;
  severity: "low" | "medium" | "high" | "critical";
  createdAt: string;
  updatedAt: string;
  reporterIdentityId: string;
  assignedCaseOfficerId?: string;
  assignedReviewerId?: string;
  /** Set while a closure is proposed and awaiting the required independent approval. */
  pendingClosureRequestId?: string;
}

/**
 * Kept in a separate record from Case so that application code which only needs case content
 * (e.g. an independent reviewer's case list) never has to touch identity fields at all.
 */
export interface ReporterIdentity {
  id: string;
  caseId: string;
  /** Opaque pseudonym shown to reviewers and case officers who have not been granted disclosure. */
  pseudonym: string;
  /** The reporter's verified TideCloak subject (vuid/sub). Never returned in ordinary API responses. */
  reporterSubject: string;
  disclosurePreference: DisclosurePreference;
}

export interface Evidence {
  id: string;
  caseId: string;
  filename: string;
  /**
   * Tide threshold-E2EE ciphertext (RelationshipAttestation:1, policy-governed VVK encryption).
   * The server stores and serves only this opaque blob — it never has the key material to read
   * it, and neither does an administrator unless a signed relationship policy names them. See
   * backend/src/routes/policies.ts and frontend/src/lib/tide/relationship.ts.
   */
  ciphertext: string;
  mimeType: string;
  uploadedBySubject: string;
  uploadedAt: string;
}

/**
 * A signed RelationshipAttestation policy, stored keyed by subject + record so the subject it
 * names can fetch it back and decrypt/encrypt that one case's evidence. The server never signs
 * these — only a realm admin's browser can, via the Tide enclave (see relationship.ts). The
 * server only stores and serves the bytes, and enforces who may do which.
 */
export interface SignedPolicy {
  id: string;
  subjectType: "User" | "Group" | "Role";
  subjectId: string;
  clientId?: string;
  recordId: string;
  policyB64: string;
  access: "read" | "write" | "read-write";
  grantedBySubject: string;
  createdAt: string;
}

export type ReviewAssignmentStatus = "ACTIVE" | "REVOKED" | "EXPIRED";

export interface ReviewAssignment {
  id: string;
  caseId: string;
  reviewerSubject: string;
  status: ReviewAssignmentStatus;
  assignedAt: string;
  assignedBySubject: string;
  expiresAt?: string;
  revokedAt?: string;
}

export type ClosureRequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export interface ClosureRequest {
  id: string;
  caseId: string;
  proposedBySubject: string;
  proposedAt: string;
  reason: string;
  status: ClosureRequestStatus;
  /** The ReviewAssignment that was active and eligible to decide this request. */
  eligibleAssignmentId: string;
  decidedBySubject?: string;
  decidedAt?: string;
  decisionReason?: string;
}

export type DisclosureRequestStatus = "PENDING" | "APPROVED" | "DENIED";

export interface DisclosureRequest {
  id: string;
  caseId: string;
  requestedBySubject: string;
  requestedByRole: AppRole;
  requestedAt: string;
  justification: string;
  status: DisclosureRequestStatus;
  /** Only the reporter who owns the identity may decide — see README threat model. */
  decidedBySubject?: string;
  decidedAt?: string;
}

export interface CaseEvent {
  id: string;
  caseId: string;
  actorSubject: string;
  actorRole: AppRole | "unknown";
  action: string;
  timestamp: string;
  outcome: "ALLOWED" | "DENIED";
  reasonCode?: string;
}

export interface TideJwtPayload {
  sub: string;
  azp?: string;
  exp?: number;
  iat?: number;
  realm_access?: { roles?: string[] };
  resource_access?: Record<string, { roles?: string[] }>;
  cnf?: { jkt?: string };
  preferred_username?: string;
  /** The user's Tide public key — what a RelationshipAttestation `User` policy names. */
  tideuserkey?: string;
  groups?: string[];
}
