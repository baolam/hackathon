import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApi } from "../lib/useApi";

export function SubmitReport() {
  const api = useApi();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    category: "financial-misconduct",
    summary: "",
    description: "",
    severity: "medium",
    disclosurePreference: "confidential",
    pseudonym: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const created = await api.createCase(form);
      navigate(`/cases/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit report");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1>Submit a report</h1>
      <p style={{ color: "var(--text-dim)" }}>
        Your identity is stored separately from this case content and is never shown to a
        reviewer or case officer unless you later approve a specific disclosure request.
      </p>
      <form className="card" onSubmit={onSubmit} style={{ maxWidth: 560 }}>
        <label>Category</label>
        <select
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        >
          <option value="financial-misconduct">Financial misconduct</option>
          <option value="procurement-fraud">Procurement fraud</option>
          <option value="harassment">Harassment</option>
          <option value="other">Other</option>
        </select>

        <label>Severity</label>
        <select
          value={form.severity}
          onChange={(e) => setForm({ ...form, severity: e.target.value })}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>

        <label>Summary</label>
        <input
          required
          value={form.summary}
          onChange={(e) => setForm({ ...form, summary: e.target.value })}
          placeholder="One sentence describing what happened"
        />

        <label>Description</label>
        <textarea
          required
          rows={6}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Full account, dates, people involved, evidence you can describe"
        />

        <label>Disclosure preference</label>
        <select
          value={form.disclosurePreference}
          onChange={(e) => setForm({ ...form, disclosurePreference: e.target.value })}
        >
          <option value="anonymous">Anonymous — never ask me to disclose</option>
          <option value="confidential">Confidential — I may approve disclosure later</option>
          <option value="disclosed">I am comfortable being identified now</option>
        </select>

        <label>Pseudonym shown to reviewers (optional)</label>
        <input
          value={form.pseudonym}
          onChange={(e) => setForm({ ...form, pseudonym: e.target.value })}
          placeholder="e.g. Reporter-Finance-1"
        />

        {error && <div className="banner denied">{error}</div>}

        <button type="submit" disabled={submitting}>
          {submitting ? "Submitting…" : "Submit report"}
        </button>
      </form>
    </div>
  );
}
