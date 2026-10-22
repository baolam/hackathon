import { useTideCloak } from "@tidecloak/react";
import type {
  AppRole,
  CaseEvent,
  CaseRecord,
  CaseStatus,
  ClosureDecision,
  DisclosureRequestRecord,
  IdentityView,
} from "./types";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:4000/api";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * All calls go through IAMService.secureFetch, which attaches the DPoP proof automatically
 * (useDPoP: strict). A plain fetch() with a manually-set Bearer header would send an unbound
 * token the backend rejects outright — see backend/src/auth/middleware.ts.
 */
export function useApi() {
  const { IAMService } = useTideCloak();

  async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await IAMService.secureFetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: res.statusText }));
      throw new ApiError(res.status, body.error ?? res.statusText);
    }
    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  }

  return {
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
    transition: (id: string, to: CaseStatus) =>
      call<CaseRecord>(`/cases/${id}/transition`, { method: "POST", body: JSON.stringify({ to }) }),
    assignReviewer: (id: string, reviewerSubject: string) =>
      call<{ assignmentId: string }>(`/cases/${id}/assign-reviewer`, {
        method: "POST",
        body: JSON.stringify({ reviewerSubject }),
      }),
    revokeAssignment: (id: string, assignmentId: string) =>
      call<void>(`/cases/${id}/revoke-assignment/${assignmentId}`, { method: "POST" }),
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
  };
}

export const APP_ROLES: AppRole[] = ["reporter", "case-officer", "independent-reviewer", "admin"];
