export type AppRole = "reporter" | "case-officer" | "independent-reviewer" | "admin";

export type CaseStatus =
  | "SUBMITTED"
  | "TRIAGE"
  | "UNDER_REVIEW"
  | "ADDITIONAL_INFORMATION_REQUIRED"
  | "ESCALATED"
  | "PENDING_CLOSURE_APPROVAL"
  | "CLOSED";

export type ClosureDecision = "APPROVE" | "REJECT";

export interface CaseRecord {
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
  pendingClosureRequestId?: string;
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

export interface DisclosureRequestRecord {
  id: string;
  caseId: string;
  requestedBySubject: string;
  requestedByRole: AppRole;
  requestedAt: string;
  justification: string;
  status: "PENDING" | "APPROVED" | "DENIED";
  decidedBySubject?: string;
  decidedAt?: string;
}

export interface IdentityView {
  pseudonym: string;
  reporterSubject: string | null;
  disclosed?: boolean;
}
