import type { CaseStatus } from "./types.js";

// Explicit transition table (PROJECT_OVERVIEW.md section 4, Feature C). Any transition not listed
// here is invalid and must be rejected server-side, regardless of what a client requests.
const TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  SUBMITTED: ["TRIAGE"],
  TRIAGE: ["UNDER_REVIEW"],
  UNDER_REVIEW: [
    "ADDITIONAL_INFORMATION_REQUIRED",
    "ESCALATED",
    "PENDING_CLOSURE_APPROVAL",
  ],
  ADDITIONAL_INFORMATION_REQUIRED: ["UNDER_REVIEW"],
  ESCALATED: ["UNDER_REVIEW", "PENDING_CLOSURE_APPROVAL"],
  PENDING_CLOSURE_APPROVAL: ["CLOSED", "UNDER_REVIEW"],
  CLOSED: [],
};

export function canTransition(from: CaseStatus, to: CaseStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(from: CaseStatus, to: CaseStatus): void {
  if (!canTransition(from, to)) {
    throw new InvalidTransitionError(from, to);
  }
}

export class InvalidTransitionError extends Error {
  constructor(public from: CaseStatus, public to: CaseStatus) {
    super(`Invalid case transition: ${from} -> ${to}`);
    this.name = "InvalidTransitionError";
  }
}
