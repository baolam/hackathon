import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useApi } from "../lib/useApi";
import type { AnonymousTrackResult } from "../lib/types";
import { StatusPill } from "../components/StatusPill";

export function AnonymousTracker() {
  const [searchParams] = useSearchParams();
  const api = useApi();

  const [accessKey, setAccessKey] = useState(searchParams.get("key") || "");
  const [pin, setPin] = useState(searchParams.get("pin") || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnonymousTrackResult | null>(null);

  // Form for appending additional evidence/statement
  const [appendOpen, setAppendOpen] = useState(false);
  const [statement, setStatement] = useState("");
  const [appending, setAppending] = useState(false);
  const [appendSuccess, setAppendSuccess] = useState<string | null>(null);

  async function handleTrack(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!accessKey.trim() || !pin.trim()) {
      setError("Please enter both the Secret Access Key and 6-digit PIN.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await api.trackAnonymousCase(accessKey.trim(), pin.trim());
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid Secret Access Key or PIN.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (accessKey && pin) {
      handleTrack();
    }
  }, []);

  async function handleAppend(e: React.FormEvent) {
    e.preventDefault();
    if (!statement.trim()) return;
    setAppending(true);
    setAppendSuccess(null);
    try {
      await api.appendAnonymousEvidence(accessKey.trim(), pin.trim(), statement.trim());
      setAppendSuccess("Supplementary information/evidence successfully appended to the case.");
      setStatement("");
      setAppendOpen(false);
      // Refresh case details
      await handleTrack();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to append supplementary information.");
    } finally {
      setAppending(false);
    }
  }

  return (
    <div style={{ maxWidth: 840, margin: "0 auto", padding: "24px 16px" }}>
      <div style={{ marginBottom: 20 }}>
        <Link to="/" style={{ color: "var(--accent)", textDecoration: "none", fontSize: "0.9rem" }}>
          ← Back to TrustVoice Home
        </Link>
      </div>

      <h1>Anonymous Case Tracker</h1>
      <p style={{ color: "var(--text-dim)", lineHeight: 1.6 }}>
        Use the <strong>Secret Access Key</strong> and <strong>6-digit PIN</strong> you received when submitting your report to monitor independent progress or submit new supplementary evidence.
      </p>

      {/* Tracker Search Box */}
      <form className="card" onSubmit={handleTrack} style={{ marginBottom: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 12, alignItems: "end" }}>
          <div>
            <label style={{ marginBottom: 4, display: "block", fontSize: "0.85rem" }}>
              Secret Access Key
            </label>
            <input
              required
              placeholder="e.g. TV-ANON-XXXX-YYYY"
              value={accessKey}
              onChange={(e) => setAccessKey(e.target.value)}
              style={{ marginBottom: 0 }}
            />
          </div>
          <div>
            <label style={{ marginBottom: 4, display: "block", fontSize: "0.85rem" }}>
              Secret PIN (6 digits)
            </label>
            <input
              required
              type="password"
              maxLength={6}
              placeholder="e.g. 123456"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              style={{ marginBottom: 0 }}
            />
          </div>
          <button type="submit" disabled={loading} style={{ height: 42 }}>
            {loading ? "Tracking…" : "Track Case"}
          </button>
        </div>

        {error && <div className="banner denied" style={{ marginTop: 14 }}>{error}</div>}
      </form>

      {appendSuccess && <div className="banner allowed" style={{ marginBottom: 20 }}>{appendSuccess}</div>}

      {/* Case Details when loaded */}
      {result && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Main Case Info Card */}
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
              <div>
                <span style={{ fontSize: "0.85rem", color: "var(--text-dim)", textTransform: "uppercase" }}>Case Reference Number</span>
                <h2 style={{ margin: "2px 0 6px" }}>{result.case.referenceNumber}</h2>
              </div>
              <StatusPill status={result.case.status} />
            </div>

            <div style={{ marginTop: 12 }}>
              <p><strong>Summary:</strong> {result.case.summary}</p>
              <p style={{ color: "var(--text-dim)", whiteSpace: "pre-line" }}>{result.case.description}</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border)", fontSize: "0.85rem" }}>
              <div>
                <span style={{ color: "var(--text-dim)" }}>Category:</span> <strong>{result.case.category}</strong>
              </div>
              <div>
                <span style={{ color: "var(--text-dim)" }}>Severity:</span> <strong>{result.case.severity.toUpperCase()}</strong>
              </div>
              <div>
                <span style={{ color: "var(--text-dim)" }}>Submitted:</span> {new Date(result.case.createdAt).toLocaleString()}
              </div>
              <div>
                <span style={{ color: "var(--text-dim)" }}>Last Updated:</span> {new Date(result.case.updatedAt).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Personnel Assigned Card */}
          <div className="card">
            <h3 style={{ marginTop: 0 }}>👥 Assigned Personnel & Jurisdiction</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 12 }}>
              <div style={{ padding: 12, background: "rgba(255,255,255,0.03)", borderRadius: 6, border: "1px solid var(--border)" }}>
                <div style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>INTERNAL CASE OFFICER</div>
                <div style={{ fontWeight: 600, marginTop: 4, color: result.case.assignedCaseOfficerName ? "var(--text)" : "var(--text-dim)" }}>
                  {result.case.assignedCaseOfficerName || "In triage queue (Unassigned)"}
                </div>
              </div>
              <div style={{ padding: 12, background: "rgba(255,255,255,0.03)", borderRadius: 6, border: "1px solid var(--border)" }}>
                <div style={{ fontSize: "0.8rem", color: "var(--accent)" }}>⚖️ INDEPENDENT REVIEWER (OMBUDSMAN)</div>
                <div style={{ fontWeight: 600, marginTop: 4, color: result.case.assignedReviewerName ? "#10b981" : "var(--text-dim)" }}>
                  {result.case.assignedReviewerName || "Pending appointment from Independent Roster"}
                </div>
              </div>
            </div>
            {result.case.assignedReviewerId && (
              <p style={{ fontSize: "0.85rem", color: "#10b981", marginTop: 12, marginBottom: 0 }}>
                🛡️ <em>Anti-Cover-up rule activated:</em> This case can only be formally concluded and closed upon independent approval from this reviewer.
              </p>
            )}
          </div>

          {/* Evidence Count & Append Card */}
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0 }}>📁 Evidence & Confidential Files ({result.evidenceCount} items)</h3>
              <button onClick={() => setAppendOpen(!appendOpen)}>
                {appendOpen ? "Close form" : "+ Add Supplementary Info / Evidence"}
              </button>
            </div>

            {result.evidenceItems.length > 0 && (
              <ul style={{ margin: "14px 0 0 20px", padding: 0 }}>
                {result.evidenceItems.map((e) => (
                  <li key={e.id} style={{ marginBottom: 6, fontSize: "0.9rem" }}>
                    <strong>{e.filename}</strong> — uploaded at {new Date(e.uploadedAt).toLocaleString()} ({e.uploadedBySubject})
                  </li>
                ))}
              </ul>
            )}

            {appendOpen && (
              <form onSubmit={handleAppend} style={{ marginTop: 16, paddingTop: 16, borderTop: "1px dashed var(--border)" }}>
                <label>Supplementary statement or new evidence narrative</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Enter newly discovered facts, additional transaction details, or response to case officer requests..."
                  value={statement}
                  onChange={(e) => setStatement(e.target.value)}
                />
                <button type="submit" disabled={appending} style={{ marginTop: 8 }}>
                  {appending ? "Submitting…" : "Submit Securely"}
                </button>
              </form>
            )}
          </div>

          {/* Audit Timeline */}
          <div className="card">
            <h3 style={{ marginTop: 0 }}>📜 Case Audit Trail (Immutable Log)</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {result.events.map((e) => (
                <div key={e.id} className="timeline-item">
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <strong>{e.action}</strong>
                    <span className={e.outcome === "DENIED" ? "status-pill denied" : "status-pill"}>
                      {e.outcome}
                    </span>
                  </div>
                  <div className="meta">
                    {e.actorRole} · {new Date(e.timestamp).toLocaleString()}
                    {e.reasonCode && ` · Reason code: ${e.reasonCode}`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
