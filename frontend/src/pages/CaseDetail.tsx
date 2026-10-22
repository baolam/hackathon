import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useApi, ApiError } from "../lib/useApi";
import { useAppRoles } from "../components/Layout";
import type { CaseEvent, CaseRecord, DisclosureRequestRecord, IdentityView } from "../lib/types";
import { StatusPill } from "../components/StatusPill";

export function CaseDetail() {
  const { id } = useParams<{ id: string }>();
  const api = useApi();
  const roles = useAppRoles();

  const [caseRecord, setCaseRecord] = useState<CaseRecord | null>(null);
  const [events, setEvents] = useState<CaseEvent[]>([]);
  const [disclosures, setDisclosures] = useState<DisclosureRequestRecord[]>([]);
  const [identity, setIdentity] = useState<IdentityView | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<{ kind: "allowed" | "denied"; message: string } | null>(null);

  async function refresh() {
    if (!id) return;
    try {
      const [c, ev, dr, idn] = await Promise.all([
        api.getCase(id),
        api.listEvents(id),
        api.listDisclosureRequests(id).catch(() => []),
        api.getIdentity(id).catch(() => null),
      ]);
      setCaseRecord(c);
      setEvents(ev);
      setDisclosures(dr);
      setIdentity(idn);
      setLoadError(null);
    } catch (e) {
      setLoadError(
        e instanceof ApiError && e.status === 404
          ? "Not found. Either this case does not exist, or your account is not authorized to view it."
          : "Could not load this case.",
      );
    }
  }

  useEffect(() => {
    refresh();
  }, [id]);

  async function runAction(fn: () => Promise<unknown>, successMessage: string) {
    try {
      await fn();
      setActionResult({ kind: "allowed", message: successMessage });
      await refresh();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Action failed";
      setActionResult({ kind: "denied", message });
    }
  }

  if (loadError) return <div className="banner denied">{loadError}</div>;
  if (!caseRecord) return <p>Loading…</p>;

  const c = caseRecord;
  const isCaseOfficer = roles.includes("case-officer") && (!c.assignedCaseOfficerId || c.assignedCaseOfficerId);
  const isReviewer = roles.includes("independent-reviewer");
  const isAdmin = roles.includes("admin");

  return (
    <div>
      <h1>{c.referenceNumber}</h1>
      <div className="card">
        <StatusPill status={c.status} />
        <p style={{ marginTop: 12 }}><strong>{c.summary}</strong></p>
        <p style={{ color: "var(--text-dim)" }}>{c.description}</p>
        <p style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>
          Category: {c.category} · Severity: {c.severity} · Updated {new Date(c.updatedAt).toLocaleString()}
        </p>
        {identity && (
          <p style={{ fontSize: "0.85rem" }}>
            Reporter: {identity.reporterSubject ? identity.reporterSubject : identity.pseudonym}
            {!identity.reporterSubject && " (not disclosed)"}
          </p>
        )}
      </div>

      {actionResult && (
        <div className={`banner ${actionResult.kind === "denied" ? "denied" : "allowed"}`}>
          {actionResult.message}
        </div>
      )}

      <div className="card">
        <h3>Actions</h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {isCaseOfficer && !c.assignedCaseOfficerId && (
            <button onClick={() => runAction(() => api.claimCase(c.id), "Case claimed.")}>
              Claim case
            </button>
          )}
          {(isCaseOfficer || isAdmin) && c.status === "SUBMITTED" && (
            <button onClick={() => runAction(() => api.transition(c.id, "TRIAGE"), "Moved to triage.")}>
              Move to triage
            </button>
          )}
          {(isCaseOfficer || isAdmin) && c.status === "TRIAGE" && (
            <button onClick={() => runAction(() => api.transition(c.id, "UNDER_REVIEW"), "Moved to under review.")}>
              Begin review
            </button>
          )}
          {(isCaseOfficer || isAdmin) && (c.status === "UNDER_REVIEW" || c.status === "ESCALATED") && (
            <AssignReviewerAction caseId={c.id} onDone={refresh} runAction={runAction} api={api} />
          )}
          {(isCaseOfficer || isAdmin) && (c.status === "UNDER_REVIEW" || c.status === "ESCALATED") && (
            <ClosureRequestAction caseId={c.id} runAction={runAction} api={api} />
          )}
          {isReviewer && c.status === "PENDING_CLOSURE_APPROVAL" && (
            <ClosureDecisionAction caseId={c.id} runAction={runAction} api={api} />
          )}
          {(isCaseOfficer || isReviewer || isAdmin) && (
            <DisclosureRequestAction caseId={c.id} runAction={runAction} api={api} />
          )}
        </div>
      </div>

      {roles.includes("reporter") && (
        <DisclosureDecisionPanel
          disclosures={disclosures}
          caseId={c.id}
          runAction={runAction}
          api={api}
        />
      )}

      <div className="card">
        <h3>Case event history</h3>
        {events.length === 0 && <p style={{ color: "var(--text-dim)" }}>No events yet.</p>}
        {events.map((e) => (
          <div key={e.id} className="timeline-item">
            <div>
              <strong>{e.action}</strong>{" "}
              <span className={e.outcome === "DENIED" ? "status-pill denied" : "status-pill"}>
                {e.outcome}
              </span>
            </div>
            <div className="meta">
              {e.actorRole} · {e.actorSubject} · {new Date(e.timestamp).toLocaleString()}
              {e.reasonCode && ` · ${e.reasonCode}`}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

type Api = ReturnType<typeof useApi>;
type RunAction = (fn: () => Promise<unknown>, successMessage: string) => Promise<void>;

function AssignReviewerAction({
  caseId,
  runAction,
  api,
}: {
  caseId: string;
  onDone: () => void;
  runAction: RunAction;
  api: Api;
}) {
  const [subject, setSubject] = useState("");
  const [open, setOpen] = useState(false);
  if (!open) return <button className="secondary" onClick={() => setOpen(true)}>Assign reviewer</button>;
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <input
        placeholder="Reviewer subject (TideCloak vuid)"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        style={{ marginBottom: 0, width: 220 }}
      />
      <button
        onClick={() =>
          runAction(() => api.assignReviewer(caseId, subject), "Independent reviewer assigned.").then(() =>
            setOpen(false),
          )
        }
      >
        Assign
      </button>
    </div>
  );
}

function ClosureRequestAction({ caseId, runAction, api }: { caseId: string; runAction: RunAction; api: Api }) {
  const [reason, setReason] = useState("");
  const [open, setOpen] = useState(false);
  if (!open) return <button className="secondary" onClick={() => setOpen(true)}>Propose closure</button>;
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <input
        placeholder="Reason for closure"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        style={{ marginBottom: 0, width: 260 }}
      />
      <button
        onClick={() =>
          runAction(
            () => api.requestClosure(caseId, reason),
            "Closure proposed. Awaiting the assigned independent reviewer's decision.",
          ).then(() => setOpen(false))
        }
      >
        Submit
      </button>
    </div>
  );
}

function ClosureDecisionAction({ caseId, runAction, api }: { caseId: string; runAction: RunAction; api: Api }) {
  return (
    <>
      <button
        onClick={() => runAction(() => api.decideClosure(caseId, "APPROVE"), "Closure approved. Case is now closed.")}
      >
        Approve closure
      </button>
      <button
        className="secondary"
        onClick={() => runAction(() => api.decideClosure(caseId, "REJECT", "More investigation required"), "Closure rejected. Case returned to review.")}
      >
        Reject closure
      </button>
    </>
  );
}

function DisclosureRequestAction({ caseId, runAction, api }: { caseId: string; runAction: RunAction; api: Api }) {
  const [justification, setJustification] = useState("");
  const [open, setOpen] = useState(false);
  if (!open) return <button className="secondary" onClick={() => setOpen(true)}>Request identity disclosure</button>;
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <input
        placeholder="Why you need the reporter's identity"
        value={justification}
        onChange={(e) => setJustification(e.target.value)}
        style={{ marginBottom: 0, width: 280 }}
      />
      <button
        onClick={() =>
          runAction(
            () => api.requestDisclosure(caseId, justification),
            "Disclosure requested. Only the reporter can approve it.",
          ).then(() => setOpen(false))
        }
      >
        Send request
      </button>
    </div>
  );
}

function DisclosureDecisionPanel({
  disclosures,
  caseId,
  runAction,
  api,
}: {
  disclosures: DisclosureRequestRecord[];
  caseId: string;
  runAction: RunAction;
  api: Api;
}) {
  const pending = disclosures.filter((d) => d.status === "PENDING");
  if (pending.length === 0) return null;
  return (
    <div className="card">
      <h3>Disclosure requests awaiting your decision</h3>
      <p style={{ color: "var(--text-dim)" }}>
        Only you, as the reporter, can approve revealing your identity on this case.
      </p>
      {pending.map((d) => (
        <div key={d.id} className="timeline-item">
          <div>
            {d.requestedByRole} requests disclosure: <em>{d.justification}</em>
          </div>
          <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
            <button onClick={() => runAction(() => api.decideDisclosure(caseId, d.id, true), "Disclosure approved.")}>
              Approve
            </button>
            <button
              className="secondary"
              onClick={() => runAction(() => api.decideDisclosure(caseId, d.id, false), "Disclosure denied.")}
            >
              Deny
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
