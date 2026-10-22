import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useApi } from "../lib/useApi";
import { useAppRoles } from "../components/Layout";
import type { CaseRecord } from "../lib/types";
import { StatusPill } from "../components/StatusPill";

export function Dashboard() {
  const api = useApi();
  const roles = useAppRoles();
  const [cases, setCases] = useState<CaseRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .listCases()
      .then(setCases)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div>
      <h1>Overview</h1>
      <p style={{ color: "var(--text-dim)" }}>
        The list below is exactly what the backend's server-side authorization decided you may
        see — a reporter sees their own reports, a case officer sees their claimed cases plus the
        unclaimed triage queue, an independent reviewer sees only cases they are actively assigned
        to, and no role sees another role's unrelated cases.
      </p>

      {roles.length === 0 && (
        <div className="banner denied">
          Your account has no TrustVoice role yet. Ask a platform administrator to assign one via
          TideCloak (reporter, case-officer, independent-reviewer, or admin).
        </div>
      )}

      {error && <div className="banner denied">Could not load cases: {error}</div>}

      {cases && cases.length === 0 && (
        <div className="card">No cases visible to your account right now.</div>
      )}

      {cases && cases.length > 0 && (
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Reference</th>
                <th>Category</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((c) => (
                <tr key={c.id}>
                  <td><Link to={`/cases/${c.id}`}>{c.referenceNumber}</Link></td>
                  <td>{c.category}</td>
                  <td>{c.severity}</td>
                  <td><StatusPill status={c.status} /></td>
                  <td>{new Date(c.updatedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
