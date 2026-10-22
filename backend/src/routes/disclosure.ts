import { Router } from "express";
import { nanoid } from "nanoid";
import { authenticate, requireRole } from "../auth/middleware.js";
import { cases, reporterIdentities, disclosureRequests, activeAssignmentFor, recordEvent } from "../store.js";

export const disclosureRouter = Router();
disclosureRouter.use(authenticate);

// A case officer or independent reviewer with a legitimate need may ask the reporter to disclose
// their identity. The reporter, and only the reporter, decides (see decision endpoint below) — this
// is a consent-based authorization condition tied to the reporter's own verified TideCloak subject,
// not administrator or case-officer discretion (PROJECT_OVERVIEW.md Feature A).
disclosureRouter.post(
  "/:caseId/disclosure-requests",
  requireRole("case-officer", "independent-reviewer", "admin"),
  (req, res) => {
    const c = cases.get(req.params.caseId);
    if (!c) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const sub = req.user!.sub;
    if (req.userRoles!.includes("independent-reviewer") && !activeAssignmentFor(c.id, sub)) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const { justification } = req.body ?? {};
    if (!justification) {
      res.status(400).json({ error: "justification is required" });
      return;
    }

    const role = req.userRoles!.includes("admin")
      ? "admin"
      : req.userRoles!.includes("independent-reviewer")
        ? "independent-reviewer"
        : "case-officer";

    const requestId = nanoid();
    disclosureRequests.set(requestId, {
      id: requestId,
      caseId: c.id,
      requestedBySubject: sub,
      requestedByRole: role,
      requestedAt: new Date().toISOString(),
      justification,
      status: "PENDING",
    });

    recordEvent({
      caseId: c.id,
      actorSubject: sub,
      actorRole: role,
      action: "DISCLOSURE_REQUESTED",
      outcome: "ALLOWED",
    });

    res.status(201).json({ requestId });
  },
);

disclosureRouter.get("/:caseId/disclosure-requests", (req, res) => {
  const c = cases.get(req.params.caseId);
  if (!c) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const list = [...disclosureRequests.values()].filter((r) => r.caseId === c.id);
  res.json(list);
});

// Only the reporter who owns this case's identity may decide. Verified against their own
// authenticated subject — never against a role claim alone.
disclosureRouter.post(
  "/:caseId/disclosure-requests/:requestId/decision",
  requireRole("reporter"),
  (req, res) => {
    const c = cases.get(req.params.caseId);
    const dr = disclosureRequests.get(req.params.requestId);
    if (!c || !dr || dr.caseId !== c.id) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const identity = reporterIdentities.get(c.reporterIdentityId);
    if (!identity || identity.reporterSubject !== req.user!.sub) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    if (dr.status !== "PENDING") {
      res.status(409).json({ error: "This disclosure request has already been decided" });
      return;
    }

    const { approve } = req.body ?? {};
    dr.status = approve ? "APPROVED" : "DENIED";
    dr.decidedBySubject = req.user!.sub;
    dr.decidedAt = new Date().toISOString();
    if (approve) identity.disclosurePreference = "disclosed";

    recordEvent({
      caseId: c.id,
      actorSubject: req.user!.sub,
      actorRole: "reporter",
      action: `DISCLOSURE_${dr.status}`,
      outcome: "ALLOWED",
    });

    res.json(dr);
  },
);

// Resolve identity. Only reachable once an APPROVED disclosure request names the caller, or the
// caller is the reporter themself. Everyone else gets the pseudonym — never the real subject.
disclosureRouter.get("/:caseId/identity", (req, res) => {
  const c = cases.get(req.params.caseId);
  const identity = c && reporterIdentities.get(c.reporterIdentityId);
  if (!c || !identity) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const sub = req.user!.sub;
  if (identity.reporterSubject === sub) {
    res.json({ pseudonym: identity.pseudonym, reporterSubject: sub });
    return;
  }
  const approvedForCaller = [...disclosureRequests.values()].some(
    (r) => r.caseId === c.id && r.status === "APPROVED" && r.requestedBySubject === sub,
  );
  if (approvedForCaller) {
    res.json({ pseudonym: identity.pseudonym, reporterSubject: identity.reporterSubject });
    return;
  }
  res.json({ pseudonym: identity.pseudonym, reporterSubject: null, disclosed: false });
});
