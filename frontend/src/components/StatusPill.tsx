import type { CaseStatus } from "../lib/types";

export function StatusPill({ status }: { status: CaseStatus }) {
  const cls =
    status === "CLOSED" ? "closed" : status === "PENDING_CLOSURE_APPROVAL" ? "pending" : "";
  return <span className={`status-pill ${cls}`}>{status.replace(/_/g, " ")}</span>;
}
