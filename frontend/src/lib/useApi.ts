import { useTideCloak } from "@tidecloak/react";
import type {
  AnonymousReceipt,
  AnonymousTrackResult,
  AppRole,
  CaseEvent,
  CaseRecord,
  CaseStatus,
  ClosureDecision,
  DisclosureRequestRecord,
  EvidenceItem,
  IdentityView,
  PrequalifiedPersonnel,
} from "./types";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:4000/api";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export function getDemoAuthHeaders(): Record<string, string> {
  const role = localStorage.getItem("trustvoice_demo_role") || "admin";
  const subject = localStorage.getItem("trustvoice_demo_subject") || `${role}-1`;
  return {
    "x-dev-subject": subject,
    "x-dev-role": role,
  };
}

export function useApi() {
  const { IAMService, authenticated } = useTideCloak();

  async function call<T>(path: string, init: RequestInit & { isPublic?: boolean } = {}): Promise<T> {
    const isPublic = init.isPublic || path.startsWith("/cases/anonymous") || path.startsWith("/cases/roster");
    let res: Response;

    if (isPublic) {
      res = await fetch(`${API_BASE}${path}`, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          ...(init.headers ?? {}),
        },
      });
    } else if (authenticated) {
      // A real Tide session exists: always use it, and surface whatever the backend answers —
      // never silently swap a genuinely logged-in caller's identity for the Demo Switcher's.
      res = await IAMService.secureFetch(`${API_BASE}${path}`, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          ...(init.headers ?? {}),
        },
      });
    } else {
      // No real session: the Demo Switcher's dev-mode bypass stands in (only works if the
      // backend has TRUSTVOICE_DEV_MODE=true; otherwise this just gets a real 401).
      const devHeaders = getDemoAuthHeaders();
      res = await fetch(`${API_BASE}${path}`, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          ...devHeaders,
          ...(init.headers ?? {}),
        },
      });
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: res.statusText }));
      throw new ApiError(res.status, body.error ?? res.statusText);
    }
    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  }

  return {
    // Public Anonymous routes
    createAnonymousCase: (data: {
      category: string;
      summary: string;
      description: string;
      severity: string;
      evidenceText?: string;
      filename?: string;
    }) =>
      call<{ case: CaseRecord; receipt: AnonymousReceipt }>("/cases/anonymous", {
        method: "POST",
        body: JSON.stringify(data),
        isPublic: true,
      }),

    trackAnonymousCase: (accessKey: string, pin: string) =>
      call<AnonymousTrackResult>("/cases/anonymous/track", {
        method: "POST",
        body: JSON.stringify({ accessKey, pin }),
        isPublic: true,
      }),

    appendAnonymousEvidence: (accessKey: string, pin: string, statement: string, filename?: string) =>
      call<{ success: boolean; updatedAt: string }>("/cases/anonymous/append", {
        method: "POST",
        body: JSON.stringify({ accessKey, pin, statement, filename }),
        isPublic: true,
      }),

    getPersonnelList: () => call<PrequalifiedPersonnel[]>("/cases/roster/personnel", { isPublic: true }),

    // Authenticated / Management routes
    listCases: () => call<CaseRecord[]>("/cases"),
    getCase: (id: string) => call<CaseRecord>(`/cases/${id}`),
    createCase: (data: {
      category: string;
      summary: string;
      description: string;
      severity: string;
      disclosurePreference?: string;
      pseudonym?: string;
    }) => call<CaseRecord>("/cases", { method: "POST", body: JSON.stringify(data) }),

    claimCase: (id: string) => call<CaseRecord>(`/cases/${id}/claim`, { method: "POST" }),

    assignOfficer: (id: string, officerSubject: string, officerName?: string) =>
      call<CaseRecord>(`/cases/${id}/assign-officer`, {
        method: "POST",
        body: JSON.stringify({ officerSubject, officerName }),
      }),

    assignReviewer: (id: string, reviewerSubject: string, reviewerName?: string) =>
      call<{ assignmentId: string; case: CaseRecord }>(`/cases/${id}/assign-reviewer`, {
        method: "POST",
        body: JSON.stringify({ reviewerSubject, reviewerName }),
      }),

    grantE2EE: (id: string) =>
      call<{ success: boolean; case: CaseRecord }>(`/cases/${id}/grant-e2ee`, {
        method: "POST",
      }),

    revokeAssignment: (id: string, assignmentId: string) =>
      call<void>(`/cases/${id}/revoke-assignment/${assignmentId}`, { method: "POST" }),

    transition: (id: string, to: CaseStatus) =>
      call<CaseRecord>(`/cases/${id}/transition`, { method: "POST", body: JSON.stringify({ to }) }),

    requestClosure: (id: string, reason: string) =>
      call<{ closureRequestId: string }>(`/cases/${id}/closure-request`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      }),

    decideClosure: (id: string, decision: ClosureDecision, reason?: string) =>
      call<CaseRecord>(`/cases/${id}/closure-decision`, {
        method: "POST",
        body: JSON.stringify({ decision, reason }),
      }),

    listEvents: (id: string) => call<CaseEvent[]>(`/cases/${id}/events`),

    listEvidence: (caseId: string) => call<EvidenceItem[]>(`/cases/${caseId}/evidence`),

    uploadEvidence: (caseId: string, filename: string, ciphertext: string, mimeType = "text/plain") =>
      call<{ id: string }>(`/cases/${caseId}/evidence`, {
        method: "POST",
        body: JSON.stringify({ filename, ciphertext, mimeType }),
      }),

    logAccess: (caseId: string, evidenceId: string, outcome: "ALLOWED" | "DENIED", reasonCode?: string) =>
      call<void>(`/cases/${caseId}/evidence/${evidenceId}/log-access`, {
        method: "POST",
        body: JSON.stringify({ outcome, reasonCode }),
      }),

    requestDisclosure: (id: string, justification: string) =>
      call<{ requestId: string }>(`/cases/${id}/disclosure-requests`, {
        method: "POST",
        body: JSON.stringify({ justification }),
      }),

    listDisclosureRequests: (id: string) =>
      call<DisclosureRequestRecord[]>(`/cases/${id}/disclosure-requests`),

    decideDisclosure: (id: string, requestId: string, approve: boolean) =>
      call<DisclosureRequestRecord>(`/cases/${id}/disclosure-requests/${requestId}/decision`, {
        method: "POST",
        body: JSON.stringify({ approve }),
      }),

    getIdentity: (id: string) => call<IdentityView>(`/cases/${id}/identity`),

    // Tide threshold-E2EE: real RelationshipAttestation:1 policy plumbing (see lib/tide/relationship.ts)
    getMyPolicy: (recordId: string) =>
      call<{ policyB64: string; access: "read" | "write" | "read-write" }>(`/policies/${recordId}/mine`),

    getTideAdminPolicy: () => call<{ policy: string }>("/tide/admin-policy"),

    storeSignedPolicy: (payload: {
      subjectType: "User" | "Group" | "Role";
      subjectId: string;
      clientId?: string;
      recordId: string;
      policyB64: string;
      access: "read" | "write" | "read-write";
    }) => call<{ id: string }>("/policies", { method: "POST", body: JSON.stringify(payload) }),
  };
}

export const APP_ROLES: AppRole[] = ["reporter", "case-officer", "independent-reviewer", "admin"];
