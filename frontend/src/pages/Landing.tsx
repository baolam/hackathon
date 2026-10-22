import { Link } from "react-router-dom";
import { useTideCloak } from "@tidecloak/react";

export function Landing() {
  const { login } = useTideCloak();

  return (
    <div className="center-page" style={{ padding: "40px 16px" }}>
      <div style={{ maxWidth: 880, width: "100%" }}>
        {/* Hero Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div
            style={{
              display: "inline-block",
              background: "var(--seal-wash)",
              color: "var(--seal-deep)",
              border: "1px solid var(--seal)",
              padding: "4px 12px",
              borderRadius: 20,
              fontSize: "0.85rem",
              fontWeight: 600,
              marginBottom: 12,
            }}
          >
            Tide UNLOCKED 2026 — Conflict-Safe Independent Escalation
          </div>
          <h1 style={{ fontSize: "2.5rem", marginBottom: 12 }}>TrustVoice</h1>
          <p style={{ color: "var(--text-dim)", fontSize: "1.1rem", maxWidth: 640, margin: "0 auto", lineHeight: 1.6 }}>
            Protected whistleblowing and conflict-safe independent escalation. Eliminates unilateral administrative power to conceal reports or eavesdrop on sensitive evidence.
          </p>
        </div>

        {/* Feature Highlights Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20, marginBottom: 40 }}>
          <div className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "2rem", marginBottom: 8 }}>🛡️</div>
              <h3 style={{ margin: "0 0 8px" }}>Fully Anonymous Reporting</h3>
              <p style={{ color: "var(--text-dim)", fontSize: "0.9rem", lineHeight: 1.5 }}>
                No account or login required. Receive a secret Access Key & PIN to track outcomes without IP or metadata logging.
              </p>
            </div>
            <Link to="/anonymous-report" style={{ marginTop: 16 }}>
              <button style={{ width: "100%" }}>Submit Anonymous Report →</button>
            </Link>
          </div>

          <div className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "2rem", marginBottom: 8 }}>🔍</div>
              <h3 style={{ margin: "0 0 8px" }}>Independent Case Tracking</h3>
              <p style={{ color: "var(--text-dim)", fontSize: "0.9rem", lineHeight: 1.5 }}>
                Use your issued Access Key & PIN to monitor investigation milestones and securely append supplementary evidence.
              </p>
            </div>
            <Link to="/track" style={{ marginTop: 16 }}>
              <button className="secondary" style={{ width: "100%" }}>Track Case Progress →</button>
            </Link>
          </div>

          <div className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", borderColor: "var(--accent)" }}>
            <div>
              <div style={{ fontSize: "2rem", marginBottom: 8 }}>⚖️</div>
              <h3 style={{ margin: "0 0 8px" }}>Investigation & Review Workspace</h3>
              <p style={{ color: "var(--text-dim)", fontSize: "0.9rem", lineHeight: 1.5 }}>
                For Internal Case Officers, Independent Reviewers (Ombudsman), and Administrators handling assigned cases.
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
              {login ? (
                <button onClick={login} style={{ width: "100%" }}>
                  Log In with TideCloak
                </button>
              ) : null}
              <Link to="/cases">
                <button className="secondary" style={{ width: "100%" }}>
                  Enter Workspace (Demo Mode) →
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* 3 Core Pillars */}
        <div className="card" style={{ background: "var(--paper-sunken)" }}>
          <h4 style={{ margin: "0 0 12px", color: "var(--accent)", fontSize: "0.95rem" }}>
            Core protection principles of TrustVoice
          </h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, fontSize: "0.85rem", color: "var(--text-dim)", lineHeight: 1.5 }}>
            <div>
              <strong style={{ color: "var(--text)" }}>1. Anti-Cover-up Protocol:</strong> Administrators and accused parties cannot unilaterally close a case. Only the assigned independent reviewer holds closure approval authority.
            </div>
            <div>
              <strong style={{ color: "var(--text)" }}>2. Hermetic E2EE:</strong> Evidence is threshold-encrypted in the browser. Database root or API admin decryption requests are cryptographically rejected by the Tide network.
            </div>
            <div>
              <strong style={{ color: "var(--text)" }}>3. Scoped Delegation:</strong> Independent reviewers are granted decryption access strictly for their designated case, preventing cross-case data leakage.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
