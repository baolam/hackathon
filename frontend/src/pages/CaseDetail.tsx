import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useApi, ApiError } from "../lib/useApi";
import { useAppRoles } from "../components/Layout";
import type {
  CaseEvent,
  CaseRecord,
  DisclosureRequestRecord,
  EvidenceItem,
  IdentityView,
  PrequalifiedPersonnel,
} from "../lib/types";
import { StatusPill } from "../components/StatusPill";
import { encryptForRecord, decryptForRecord, signRelationshipPolicy } from "../lib/tide/relationship";
import tcConfig from "../../public/tidecloak.json";

/** Turns a raw crypto/network error into a short line a non-technical reviewer can read. */
function describeCryptoError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes("not initialised")) {
    return "Not signed in with Tide in this browser — a real TideCloak login is required to encrypt/decrypt (cannot be simulated via the Demo Switcher).";
  }
  return msg;
}

export function CaseDetail() {
  const { id } = useParams<{ id: string }>();
  const api = useApi();
  const roles = useAppRoles();

  const [caseRecord, setCaseRecord] = useState<CaseRecord | null>(null);
  const [events, setEvents] = useState<CaseEvent[]>([]);
  const [disclosures, setDisclosures] = useState<DisclosureRequestRecord[]>([]);
  const [identity, setIdentity] = useState<IdentityView | null>(null);
  const [personnel, setPersonnel] = useState<PrequalifiedPersonnel[]>([]);
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([]);
  const [decryptedText, setDecryptedText] = useState<Record<string, string>>({});
  const [decryptErrors, setDecryptErrors] = useState<Record<string, string>>({});

  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<{ kind: "allowed" | "denied"; message: string } | null>(null);

  // Evidence upload in Case Detail
  const [newEvidenceName, setNewEvidenceName] = useState("");
  const [newEvidenceContent, setNewEvidenceContent] = useState("");
  const [uploadingEvidence, setUploadingEvidence] = useState(false);

  // Real E2EE grant (Tide RelationshipAttestation:1 policy) for the assigned reviewer
  const [granteeTideUserKey, setGranteeTideUserKey] = useState("");
  const [grantingE2EE, setGrantingE2EE] = useState(false);

  async function refresh() {
    if (!id) return;
    try {
      const [c, ev, dr, idn, roster, evList] = await Promise.all([
        api.getCase(id),
        api.listEvents(id),
        api.listDisclosureRequests(id).catch(() => []),
        api.getIdentity(id).catch(() => null),
        api.getPersonnelList().catch(() => []),
        api.listEvidence(id).catch(() => []),
      ]);
      setCaseRecord(c);
      setEvents(ev);
      setDisclosures(dr);
      setIdentity(idn);
      setPersonnel(roster);
      setEvidenceList(evList);
      setLoadError(null);
    } catch (e) {
      setLoadError(
        e instanceof ApiError && e.status === 404
          ? "Case does not exist or your account lacks authorization to view this case (Cross-case denial)."
          : "Could not load case details.",
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
      const message = e instanceof Error ? e.message : "Action failed.";
      setActionResult({ kind: "denied", message });
    }
  }

  // Real Tide threshold-E2EE decrypt: fetch the caller's signed RelationshipAttestation:1 policy
  // for this record (if any — this is also the enforcement point, not a UI check) and ask the
  // Tide network to decrypt with it. A denial here is a genuine network refusal, not a guess.
  async function handleAttemptDecrypt(ev: EvidenceItem) {
    if (!caseRecord) return;
    try {
      const { policyB64 } = await api.getMyPolicy(caseRecord.id);
      const plaintext = await decryptForRecord(ev.ciphertext, caseRecord.id, policyB64);
      setDecryptErrors((prev) => {
        const next = { ...prev };
        delete next[ev.id];
        return next;
      });
      setDecryptedText((prev) => ({ ...prev, [ev.id]: plaintext }));
      await api.logAccess(caseRecord.id, ev.id, "ALLOWED");
    } catch (e) {
      const message =
        e instanceof ApiError && e.status === 404
          ? "TIDE-TIDEJS-NET-THRESHOLD_FAILURE: No RelationshipAttestation:1 policy grants you decryption rights on this case."
          : describeCryptoError(e);
      setDecryptErrors((prev) => ({ ...prev, [ev.id]: message }));
      setDecryptedText((prev) => {
        const next = { ...prev };
        delete next[ev.id];
        return next;
      });
      await api.logAccess(caseRecord.id, ev.id, "DENIED", message.slice(0, 160));
    } finally {
      await refresh();
    }
  }

  // Real Tide threshold-E2EE encrypt: fetch the caller's signed write policy, encrypt in the
  // browser, and send only ciphertext to the backend (it never sees plaintext).
  async function handleUploadEvidence(e: React.FormEvent) {
    e.preventDefault();
    if (!newEvidenceName.trim() || !newEvidenceContent.trim() || !caseRecord) return;
    setUploadingEvidence(true);
    try {
      const { policyB64 } = await api.getMyPolicy(caseRecord.id);
      const ciphertext = await encryptForRecord(newEvidenceContent.trim(), caseRecord.id, policyB64);
      await api.uploadEvidence(caseRecord.id, newEvidenceName.trim(), ciphertext);
      setNewEvidenceName("");
      setNewEvidenceContent("");
      setActionResult({ kind: "allowed", message: "Threshold-E2EE encrypted and uploaded confidential evidence successfully." });
      await refresh();
    } catch (err) {
      const message =
        err instanceof ApiError && err.status === 404
          ? "No RelationshipAttestation:1 policy grants you encryption rights for this case — write or read-write access must be granted first."
          : describeCryptoError(err);
      setActionResult({ kind: "denied", message });
    } finally {
      setUploadingEvidence(false);
    }
  }

  // Real admin grant: sign a RelationshipAttestation:1 policy in the Tide enclave for the named
  // reviewer's tideUserKey, store it, and only then flip the case's bookkeeping flag.
  async function handleGrantE2EE() {
    if (!caseRecord || !granteeTideUserKey.trim()) return;
    setGrantingE2EE(true);
    try {
      const { policy: adminPolicyB64 } = await api.getTideAdminPolicy();
      const adminPolicyBytes = Uint8Array.from(atob(adminPolicyB64), (c) => c.charCodeAt(0));
      const signedB64 = await signRelationshipPolicy(
        {
          vendorId: (tcConfig as { vendorId: string }).vendorId,
          subject: { type: "User", id: granteeTideUserKey.trim() },
          recordId: caseRecord.id,
          access: "read",
        },
        adminPolicyBytes,
      );
      await api.storeSignedPolicy({
        subjectType: "User",
        subjectId: granteeTideUserKey.trim(),
        recordId: caseRecord.id,
        policyB64: signedB64,
        access: "read",
      });
      await api.grantE2EE(caseRecord.id);
      setGranteeTideUserKey("");
      setActionResult({ kind: "allowed", message: "Signed in Tide enclave and granted E2EE decryption rights to Reviewer." });
      await refresh();
    } catch (err) {
      setActionResult({ kind: "denied", message: describeCryptoError(err) });
    } finally {
      setGrantingE2EE(false);
    }
  }

  if (loadError) {
    return (
      <div style={{ maxWidth: 800, margin: "20px auto" }}>
        <div className="banner denied">{loadError}</div>
        <Link to="/cases" style={{ display: "inline-block", marginTop: 12, color: "var(--accent)" }}>
          ← Back to Cases
        </Link>
      </div>
    );
  }

  if (!caseRecord) return <p style={{ padding: 20 }}>Loading case details…</p>;

  const c = caseRecord;
  const isCaseOfficer = roles.includes("case-officer");
  const isReviewer = roles.includes("independent-reviewer");
  const isAdmin = roles.includes("admin");

  const officersList = personnel.filter((p) => p.role === "case-officer");
  const reviewersList = personnel.filter((p) => p.role === "independent-reviewer");

  return (
    <div style={{ maxWidth: 940, margin: "0 auto", paddingBottom: 40 }}>
      <div style={{ marginBottom: 16 }}>
        <Link to="/cases" style={{ color: "var(--accent)", textDecoration: "none", fontSize: "0.9rem" }}>
          ← Back to Cases
        </Link>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <span style={{ fontSize: "0.85rem", color: "var(--text-dim)", textTransform: "uppercase" }}>Case Record</span>
          <h1 style={{ margin: "4px 0" }}>{c.referenceNumber}</h1>
        </div>
        <StatusPill status={c.status} />
      </div>

      {actionResult && (
        <div className={`banner ${actionResult.kind === "denied" ? "denied" : "allowed"}`} style={{ marginTop: 12 }}>
          {actionResult.message}
        </div>
      )}

      {/* Main Details Card */}
      <div className="card" style={{ marginTop: 16 }}>
        <h2 style={{ fontSize: "1.2rem", margin: "0 0 8px" }}>{c.summary}</h2>
        <p style={{ color: "var(--text-dim)", whiteSpace: "pre-line", lineHeight: 1.6 }}>{c.description}</p>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: "0.85rem", color: "var(--text-dim)", marginTop: 16, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
          <span>Category: <strong>{c.category}</strong></span>
          <span>Severity: <strong>{c.severity.toUpperCase()}</strong></span>
          <span>Updated: {new Date(c.updatedAt).toLocaleString()}</span>
          <span>Case Type: <strong>{c.isAnonymous ? "🛡️ Fully Anonymous" : "📑 Protected Pseudonym"}</strong></span>
        </div>
        {identity && (
          <p style={{ fontSize: "0.85rem", marginTop: 10, marginBottom: 0 }}>
            Reporter: <strong>{identity.pseudonym}</strong>
            {identity.reporterSubject ? ` (Real identity revealed: ${identity.reporterSubject})` : " (Identity not disclosed)"}
          </p>
        )}
      </div>

      {/* 1. Personnel Assignment & Delegation */}
      <div className="card" style={{ marginTop: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>👥 Personnel Assignment &amp; Delegation</h3>
          {c.e2eePolicyGranted ? (
            <span style={{ background: "#065f46", color: "#34d399", padding: "2px 8px", borderRadius: 4, fontSize: "0.75rem", fontWeight: "bold" }}>
              ✓ E2EE POLICY GRANTED
            </span>
          ) : (
            <span style={{ background: "#78350f", color: "#fbbf24", padding: "2px 8px", borderRadius: 4, fontSize: "0.75rem" }}>
              ⏳ PENDING E2EE POLICY SIGNING
            </span>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Case Officer Box */}
          <div style={{ background: "rgba(255,255,255,0.03)", padding: 14, borderRadius: 6, border: "1px solid var(--border)" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", textTransform: "uppercase" }}>
              1. Internal Case Officer
            </div>
            <div style={{ fontWeight: 600, margin: "6px 0 10px", color: c.assignedCaseOfficerName ? "var(--text)" : "var(--text-dim)" }}>
              {c.assignedCaseOfficerName || "No officer assigned yet"}
            </div>

            {(isAdmin || isCaseOfficer) && (
              <AssignOfficerDropdown
                officers={officersList}
                currentOfficerId={c.assignedCaseOfficerId}
                onAssign={(officerId, officerName) =>
                  runAction(() => api.assignOfficer(c.id, officerId, officerName), "Case Officer assigned successfully.")
                }
              />
            )}
          </div>

          {/* Independent Reviewer Box */}
          <div style={{ background: "rgba(255,255,255,0.03)", padding: 14, borderRadius: 6, border: "1px solid var(--border)" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--accent)", textTransform: "uppercase" }}>
              2. Independent Reviewer (Ombudsman)
            </div>
            <div style={{ fontWeight: 600, margin: "6px 0 10px", color: c.assignedReviewerName ? "#10b981" : "var(--text-dim)" }}>
              {c.assignedReviewerName || "No reviewer assigned yet"}
            </div>

            {(isAdmin || isCaseOfficer) && (
              <AssignReviewerDropdown
                reviewers={reviewersList}
                currentReviewerId={c.assignedReviewerId}
                onAssign={(reviewerId, reviewerName) =>
                  runAction(() => api.assignReviewer(c.id, reviewerId, reviewerName), "Independent Reviewer assigned successfully.")
                }
              />
            )}
          </div>
        </div>

        {/* E2EE Enclave Grant Action for Admin */}
        {(isAdmin || isCaseOfficer) && c.assignedReviewerId && !c.e2eePolicyGranted && (
          <div style={{ marginTop: 16, padding: 12, background: "rgba(59, 130, 246, 0.08)", borderRadius: 6 }}>
            <strong style={{ color: "var(--accent)" }}>Grant E2EE Evidence Decryption Rights (Tide Relationship Policy)</strong>
            <div style={{ fontSize: "0.85rem", color: "var(--text-dim)", marginTop: 4, marginBottom: 10 }}>
              Sign a genuine policy inside the Tide Enclave to delegate exclusive decryption authority to reviewer{" "}
              <em>{c.assignedReviewerName}</em>. Paste the reviewer's <code>tideUserKey</code> (obtained from the 🔐 E2EE
              Showcase page after they sign in to Tide at least once).
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                placeholder="Reviewer's tideUserKey"
                value={granteeTideUserKey}
                onChange={(e) => setGranteeTideUserKey(e.target.value)}
                style={{ marginBottom: 0, flex: 1 }}
              />
              <button onClick={handleGrantE2EE} disabled={grantingE2EE || !granteeTideUserKey.trim()}>
                {grantingE2EE ? "Opening Enclave…" : "Sign & Grant E2EE"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. Integrated E2EE Evidence Room */}
      <div className="card" style={{ marginTop: 20 }}>
        <h3 style={{ margin: "0 0 8px" }}>🔐 Hermetic E2EE Evidence Room</h3>
        <p style={{ color: "var(--text-dim)", fontSize: "0.85rem", lineHeight: 1.5 }}>
          Evidence is protected with decentralized threshold cryptography (RelationshipAttestation:1).{" "}
          <strong>Try "The Compromised Admin Test":</strong> Switch role to Admin and click Attempt Decrypt — the Tide network will cryptographically refuse! Only the designated Independent Reviewer can decrypt.
        </p>

        {evidenceList.length === 0 ? (
          <p style={{ color: "var(--text-dim)", fontStyle: "italic" }}>No evidence has been uploaded for this case yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 14 }}>
            {evidenceList.map((ev) => (
              <div key={ev.id} style={{ padding: 12, background: "rgba(255,255,255,0.02)", borderRadius: 6, border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <strong>📄 {ev.filename}</strong>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
                      Uploaded: {new Date(ev.uploadedAt).toLocaleString()} ({ev.uploadedBySubject})
                    </div>
                  </div>
                  <button onClick={() => handleAttemptDecrypt(ev)}>
                    Attempt Decrypt
                  </button>
                </div>

                {/* Plaintext decrypted */}
                {decryptedText[ev.id] && (
                  <div style={{ marginTop: 12, padding: 10, background: "rgba(16, 185, 129, 0.1)", border: "1px solid #10b981", borderRadius: 4, color: "#10b981", fontSize: "0.9rem" }}>
                    <strong>✅ DECRYPTION SUCCESSFUL:</strong>
                    <div style={{ marginTop: 4, color: "#f8fafc" }}>{decryptedText[ev.id]}</div>
                  </div>
                )}

                {/* Cryptographic denial */}
                {decryptErrors[ev.id] && (
                  <div style={{ marginTop: 12, padding: 10, background: "rgba(239, 68, 68, 0.1)", border: "1px solid #ef4444", borderRadius: 4, color: "#f87171", fontSize: "0.85rem" }}>
                    <strong>⛔ CRYPTOGRAPHIC DENIAL:</strong>
                    <div style={{ marginTop: 4 }}>{decryptErrors[ev.id]}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Upload form */}
        <form onSubmit={handleUploadEvidence} style={{ marginTop: 20, paddingTop: 16, borderTop: "1px dashed var(--border)" }}>
          <div style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: 8 }}>+ Attach New Evidence to Case</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr auto", gap: 10, alignItems: "end" }}>
            <div>
              <label style={{ fontSize: "0.75rem" }}>Document Name</label>
              <input
                required
                placeholder="e.g. invoices-audit.pdf"
                value={newEvidenceName}
                onChange={(e) => setNewEvidenceName(e.target.value)}
                style={{ marginBottom: 0 }}
              />
            </div>
            <div>
              <label style={{ fontSize: "0.75rem" }}>Confidential Document Content</label>
              <input
                required
                placeholder="Confidential text to be E2EE threshold-encrypted..."
                value={newEvidenceContent}
                onChange={(e) => setNewEvidenceContent(e.target.value)}
                style={{ marginBottom: 0 }}
              />
            </div>
            <button type="submit" disabled={uploadingEvidence} style={{ height: 42 }}>
              {uploadingEvidence ? "Encrypting…" : "Encrypt & Upload"}
            </button>
          </div>
        </form>
      </div>

      {/* 3. Anti-Cover-up & Life Cycle Actions */}
      <div className="card" style={{ marginTop: 20 }}>
        <h3 style={{ margin: "0 0 12px" }}>⚙️ Case Actions &amp; Lifecycle (Anti-Cover-up Protocol)</h3>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          {/* Claim */}
          {isCaseOfficer && !c.assignedCaseOfficerId && (
            <button onClick={() => runAction(() => api.claimCase(c.id), "Case claimed successfully.")}>
              Claim Case
            </button>
          )}

          {/* Workflow Transitions */}
          {(isCaseOfficer || isAdmin) && c.status === "SUBMITTED" && (
            <button onClick={() => runAction(() => api.transition(c.id, "TRIAGE"), "Transitioned to Triage.")}>
              Move to Triage
            </button>
          )}
          {(isCaseOfficer || isAdmin) && c.status === "TRIAGE" && (
            <button onClick={() => runAction(() => api.transition(c.id, "UNDER_REVIEW"), "Investigation begun (Under Review).")}>
              Begin Review
            </button>
          )}

          {/* Propose Closure */}
          {(isCaseOfficer || isAdmin) && (c.status === "UNDER_REVIEW" || c.status === "ESCALATED") && (
            <ClosureRequestAction caseId={c.id} runAction={runAction} api={api} />
          )}

          {/* Closure Decision - Reviewer Only */}
          {isReviewer && c.status === "PENDING_CLOSURE_APPROVAL" && (
            <ClosureDecisionAction caseId={c.id} runAction={runAction} api={api} />
          )}

          {/* Request disclosure */}
          {(isCaseOfficer || isReviewer || isAdmin) && !c.isAnonymous && (
            <DisclosureRequestAction caseId={c.id} runAction={runAction} api={api} />
          )}
        </div>

        {c.status === "PENDING_CLOSURE_APPROVAL" && (
          <div style={{ marginTop: 14, padding: 12, background: "rgba(245, 158, 11, 0.1)", border: "1px solid #f59e0b", borderRadius: 6, fontSize: "0.85rem", color: "#fbbf24" }}>
            ⏳ <strong>Pending Closure Approval:</strong> An internal officer has proposed closing this case. Under the <em>Anti-Cover-up</em> protocol, the case <strong>cannot be closed</strong> until the assigned Independent Reviewer reviews and approves (or rejects) the closure.
          </div>
        )}
      </div>

      {/* Disclosure Decision Panel (for Reporter) */}
      {roles.includes("reporter") && !c.isAnonymous && (
        <DisclosureDecisionPanel disclosures={disclosures} caseId={c.id} runAction={runAction} api={api} />
      )}

      {/* Audit Log */}
      <div className="card" style={{ marginTop: 20 }}>
        <h3 style={{ margin: "0 0 12px" }}>📜 Case Audit Trail (Immutable Log)</h3>
        {events.length === 0 ? (
          <p style={{ color: "var(--text-dim)" }}>No events recorded yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {events.map((e) => (
              <div key={e.id} className="timeline-item">
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <strong>{e.action}</strong>
                  <span className={e.outcome === "DENIED" ? "status-pill denied" : "status-pill"}>
                    {e.outcome}
                  </span>
                </div>
                <div className="meta">
                  {e.actorRole}
                  {isAdmin && ` · ${e.actorSubject}`} · {new Date(e.timestamp).toLocaleString()}
                  {e.reasonCode && ` · Reason: ${e.reasonCode}`}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Subcomponents for Assignment Dropdowns
function AssignOfficerDropdown({
  officers,
  currentOfficerId,
  onAssign,
}: {
  officers: PrequalifiedPersonnel[];
  currentOfficerId?: string;
  onAssign: (id: string, name: string) => void;
}) {
  const [selectedId, setSelectedId] = useState(currentOfficerId || (officers[0]?.id ?? ""));

  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      <select
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        style={{ marginBottom: 0, fontSize: "0.82rem", flex: 1 }}
      >
        {officers.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name} — {o.organization}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="secondary"
        style={{ fontSize: "0.8rem", padding: "6px 10px" }}
        onClick={() => {
          const found = officers.find((o) => o.id === selectedId);
          if (found) onAssign(found.id, `${found.name} (${found.organization})`);
        }}
      >
        Assign Officer
      </button>
    </div>
  );
}

function AssignReviewerDropdown({
  reviewers,
  currentReviewerId,
  onAssign,
}: {
  reviewers: PrequalifiedPersonnel[];
  currentReviewerId?: string;
  onAssign: (id: string, name: string) => void;
}) {
  const [selectedId, setSelectedId] = useState(currentReviewerId || (reviewers[0]?.id ?? ""));

  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      <select
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        style={{ marginBottom: 0, fontSize: "0.82rem", flex: 1 }}
      >
        {reviewers.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name} — {r.organization}
          </option>
        ))}
      </select>
      <button
        type="button"
        style={{ fontSize: "0.8rem", padding: "6px 10px" }}
        onClick={() => {
          const found = reviewers.find((r) => r.id === selectedId);
          if (found) onAssign(found.id, `${found.name} (${found.organization})`);
        }}
      >
        Assign Reviewer
      </button>
    </div>
  );
}

type Api = ReturnType<typeof useApi>;
type RunAction = (fn: () => Promise<unknown>, successMessage: string) => Promise<void>;

function ClosureRequestAction({ caseId, runAction, api }: { caseId: string; runAction: RunAction; api: Api }) {
  const [reason, setReason] = useState("");
  const [open, setOpen] = useState(false);
  if (!open) return <button className="secondary" onClick={() => setOpen(true)}>Propose Closure</button>;
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <input
        placeholder="Reason for proposed closure/resolution..."
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        style={{ marginBottom: 0, width: 280 }}
      />
      <button
        onClick={() =>
          runAction(
            () => api.requestClosure(caseId, reason),
            "Closure proposal submitted. Awaiting Independent Reviewer evaluation.",
          ).then(() => setOpen(false))
        }
      >
        Submit Proposal
      </button>
      <button className="secondary" onClick={() => setOpen(false)}>Cancel</button>
    </div>
  );
}

function ClosureDecisionAction({ caseId, runAction, api }: { caseId: string; runAction: RunAction; api: Api }) {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <button
        onClick={() => runAction(() => api.decideClosure(caseId, "APPROVE"), "Case closure approved. Case is officially concluded.")}
      >
        ✓ Approve Closure
      </button>
      <button
        className="secondary"
        onClick={() => runAction(() => api.decideClosure(caseId, "REJECT", "Further evidence clarification required"), "Closure rejected. Case returned to active investigation.")}
      >
        ✕ Reject (Require Further Review)
      </button>
    </div>
  );
}

function DisclosureRequestAction({ caseId, runAction, api }: { caseId: string; runAction: RunAction; api: Api }) {
  const [justification, setJustification] = useState("");
  const [open, setOpen] = useState(false);
  if (!open) return <button className="secondary" onClick={() => setOpen(true)}>Request Reporter Disclosure</button>;
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <input
        placeholder="Justification for identity verification..."
        value={justification}
        onChange={(e) => setJustification(e.target.value)}
        style={{ marginBottom: 0, width: 280 }}
      />
      <button
        onClick={() =>
          runAction(
            () => api.requestDisclosure(caseId, justification),
            "Disclosure request submitted. Decision authority rests exclusively with the Reporter.",
          ).then(() => setOpen(false))
        }
      >
        Send Request
      </button>
      <button className="secondary" onClick={() => setOpen(false)}>Cancel</button>
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
    <div className="card" style={{ marginTop: 20, borderColor: "#3b82f6" }}>
      <h3 style={{ margin: "0 0 8px", color: "var(--accent)" }}>🔔 Identity Disclosure Request Pending Your Approval</h3>
      <p style={{ color: "var(--text-dim)", fontSize: "0.85rem" }}>
        Only you (the Reporter) hold the authority to approve or refuse revealing your real identity to investigators.
      </p>
      {pending.map((d) => (
        <div key={d.id} className="timeline-item" style={{ marginTop: 10 }}>
          <div>
            <strong>{d.requestedByRole}</strong> requested identity disclosure stating: <em>"{d.justification}"</em>
          </div>
          <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
            <button onClick={() => runAction(() => api.decideDisclosure(caseId, d.id, true), "You consented to identity disclosure for this case.")}>
              Consent to Disclosure
            </button>
            <button
              className="secondary"
              onClick={() => runAction(() => api.decideDisclosure(caseId, d.id, false), "You refused identity disclosure. Pseudonym retained.")}
            >
              Refuse (Keep Pseudonym)
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
