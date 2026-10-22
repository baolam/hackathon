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
  assignedCaseOfficerName?: string;
  assignedReviewerId?: string;
  assignedReviewerName?: string;
  isAnonymous?: boolean;
  e2eePolicyGranted?: boolean;
  pendingClosureRequestId?: string;
}

export interface PrequalifiedPersonnel {
  id: string;
  name: string;
  role: "case-officer" | "independent-reviewer";
  organization: string;
  title: string;
  email: string;
}

export interface AnonymousReceipt {
  accessKey: string;
  pin: string;
  referenceNumber: string;
  createdAt: string;
}

export interface EvidenceItem {
  id: string;
  caseId: string;
  filename: string;
  ciphertext: string;
  mimeType: string;
  uploadedBySubject: string;
  uploadedAt: string;
}

export interface AnonymousTrackResult {
  case: CaseRecord;
  events: CaseEvent[];
  evidenceCount: number;
  evidenceItems: {
    id: string;
    filename: string;
    uploadedAt: string;
    uploadedBySubject: string;
  }[];
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
