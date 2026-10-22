import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApi } from "../lib/useApi";
import type { AnonymousReceipt } from "../lib/types";

export function AnonymousIntake() {
  const api = useApi();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    category: "procurement-fraud",
    summary: "",
    description: "",
    severity: "high",
    evidenceText: "",
    filename: "initial-anonymous-evidence.txt",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<AnonymousReceipt | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await api.createAnonymousCase(form);
      setReceipt(res.receipt);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit anonymous report.");
    } finally {
      setSubmitting(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  }

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "24px 16px" }}>
      <div style={{ marginBottom: 20 }}>
        <Link to="/" style={{ color: "var(--accent)", textDecoration: "none", fontSize: "0.9rem" }}>
          ← Back to TrustVoice Home
        </Link>
      </div>

      <h1>Anonymous Whistleblowing Intake</h1>
      <p style={{ color: "var(--text-dim)", lineHeight: 1.6 }}>
        Your report is independently protected, <strong>requiring no account or login</strong>, and collecting no identity
        or email address. All future interactions use the <strong>Secret Access Key</strong> and <strong>PIN</strong> issued upon submission.
      </p>
      <p style={{ color: "var(--text-dim)", fontSize: "0.85rem", lineHeight: 1.6 }}>
        <strong>Note:</strong> because this intake requires no login, submission occurs over HTTPS but is{" "}
        <strong>not</strong> threshold end-to-end encrypted (E2EE) by the Tide network like authenticated officer evidence vaults — avoid
        pasting extremely sensitive secrets here if you can submit via an authenticated Tide session.
      </p>

      {/* Security Guidance Box */}
      <div className="card" style={{ background: "var(--seal-wash)", borderColor: "var(--accent)" }}>
        <h3 style={{ marginTop: 0, color: "var(--accent)" }}>🛡️ Security Guarantees & Safe Practices</h3>
        <ul style={{ margin: "8px 0 0 20px", padding: 0, fontSize: "0.9rem", color: "var(--text-dim)", lineHeight: 1.5 }}>
          <li><strong>Strict Privacy:</strong> No IP addresses or device identifiers are recorded in the case record.</li>
          <li><strong>Avoid Personal Identifiers:</strong> Do not include your real name in the description if you wish to remain completely anonymous.</li>
          <li><strong>Preserve Your Credentials:</strong> After submitting, you must copy or record your <em>Access Key</em> and <em>PIN</em> to track progress.</li>
        </ul>
      </div>

      {receipt ? (
        <div className="card" style={{ borderColor: "var(--seal)", marginTop: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: "2rem" }}>✅</span>
            <div>
              <h2 style={{ margin: 0, color: "var(--seal)" }}>Anonymous Report Submitted Successfully!</h2>
              <p style={{ margin: "4px 0 0", color: "var(--text-dim)" }}>
                Your report has been received and queued for independent triage.
              </p>
            </div>
          </div>

          <div style={{ background: "var(--bg-card)", padding: 18, borderRadius: 8, margin: "20px 0", border: "1px dashed var(--border)" }}>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: "0.8rem", color: "var(--text-dim)", textTransform: "uppercase" }}>Case Reference Number</div>
              <div style={{ fontSize: "1.2rem", fontWeight: "bold" }}>{receipt.referenceNumber}</div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: "0.8rem", color: "var(--text-dim)", textTransform: "uppercase" }}>Secret Access Key</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4 }}>
                <code style={{ fontSize: "1.25rem", color: "var(--accent)", padding: "4px 8px", background: "var(--paper-sunken)", borderRadius: 4 }}>
                  {receipt.accessKey}
                </code>
                <button type="button" className="secondary" onClick={() => copyToClipboard(receipt.accessKey)}>
                  {copiedKey ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            <div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-dim)", textTransform: "uppercase" }}>Secret PIN (6 digits)</div>
              <code style={{ fontSize: "1.25rem", color: "var(--gold)", padding: "4px 8px", background: "var(--paper-sunken)", borderRadius: 4, display: "inline-block", marginTop: 4 }}>
                {receipt.pin}
              </code>
            </div>
          </div>

          <p style={{ color: "var(--wax)", fontSize: "0.9rem", fontWeight: 500 }}>
            ⚠️ Important Notice: Due to strict zero-knowledge anonymity, the system cannot recover a lost PIN. Please record it now!
          </p>

          <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
            <button
              onClick={() => navigate(`/track?key=${encodeURIComponent(receipt.accessKey)}&pin=${encodeURIComponent(receipt.pin)}`)}
            >
              Go to Case Tracker →
            </button>
            <button className="secondary" onClick={() => { setReceipt(null); setForm({ category: "procurement-fraud", summary: "", description: "", severity: "high", evidenceText: "", filename: "initial-anonymous-evidence.txt" }); }}>
              Submit Another Report
            </button>
          </div>
        </div>
      ) : (
        <form className="card" onSubmit={onSubmit} style={{ marginTop: 24 }}>
          <label>Misconduct Category</label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            <option value="procurement-fraud">Procurement Fraud / Public Purchasing</option>
            <option value="financial-misconduct">Financial Misconduct / Embezzlement</option>
            <option value="bribery-kickback">Bribery / Illegal Kickbacks</option>
            <option value="abuse-of-power">Abuse of Power / Conflict of Interest</option>
            <option value="harassment">Harassment / Retaliation</option>
            <option value="other">Other Legal / Regulatory Violation</option>
          </select>

          <label>Estimated Severity</label>
          <select
            value={form.severity}
            onChange={(e) => setForm({ ...form, severity: e.target.value })}
          >
            <option value="low">Low — Internal inquiry / warning needed</option>
            <option value="medium">Medium — Procedural violation with minor loss</option>
            <option value="high">High — Apparent legal violation / significant financial loss</option>
            <option value="critical">Critical — Ongoing destruction of evidence or active threats</option>
          </select>

          <label>Summary / Title</label>
          <input
            required
            placeholder="e.g. Unlawful single-source procurement on Q3 systems upgrade"
            value={form.summary}
            onChange={(e) => setForm({ ...form, summary: e.target.value })}
          />

          <label>Detailed Account</label>
          <textarea
            required
            rows={7}
            placeholder="Describe what happened: Who was involved? When and where? Who witnessed it? Who has a conflict of interest or is attempting a cover-up?"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <label>Initial Evidence (Text / Log extracts / Records)</label>
          <textarea
            rows={4}
            placeholder="Paste evidence contents (emails, contract numbers, beneficiary account numbers, internal memos)..."
            value={form.evidenceText}
            onChange={(e) => setForm({ ...form, evidenceText: e.target.value })}
          />

          {error && <div className="banner denied">{error}</div>}

          <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
            <button type="submit" disabled={submitting}>
              {submitting ? "Submitting report…" : "Submit Anonymous Report"}
            </button>
            <button type="button" className="secondary" onClick={() => navigate("/")}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
