import { Router } from "express";
import { authenticate } from "../auth/middleware.js";
import { cases, reporterIdentities, activeAssignmentFor, caseEvents } from "../store.js";

export const eventsRouter = Router();
eventsRouter.use(authenticate);

// Case-event history (PROJECT_OVERVIEW.md section 6). Events never carry identity content, only
// actor subject + role + action + outcome, so this endpoint is safe to expose to every role that
// can already see the case — it is itself part of the auditability story, not a new leak surface.
eventsRouter.get("/:caseId/events", (req, res) => {
  const c = cases.get(req.params.caseId);
  if (!c) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const sub = req.user!.sub;
  const roles = req.userRoles ?? [];
  const identity = reporterIdentities.get(c.reporterIdentityId);

  const allowed =
    roles.includes("admin") ||
    (roles.includes("case-officer") && c.assignedCaseOfficerId === sub) ||
    (roles.includes("independent-reviewer") && activeAssignmentFor(c.id, sub)) ||
    (roles.includes("reporter") && identity?.reporterSubject === sub);

  if (!allowed) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const events = caseEvents.filter((e) => e.caseId === c.id);
  res.json(events);
});
