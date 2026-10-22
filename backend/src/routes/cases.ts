import { Router } from "express";
import { nanoid } from "nanoid";
import { authenticate, requireRole } from "../auth/middleware.js";
import {
  cases,
  reporterIdentities,
  reviewAssignments,
  closureRequests,
  caseEvents,
  evidence,
  prequalifiedPersonnel,
  createAnonymousSession,
  verifyAnonymousSession,
  recordEvent,
  activeAssignmentFor,
  nextReferenceNumber,
} from "../store.js";
import { assertTransition, InvalidTransitionError } from "../stateMachine.js";
import type { Case, ClosureRequest } from "../types.js";

export const casesRouter = Router();

function redactCase(c: Case) {
  // Never includes reporterIdentityId's contents — only the opaque link, which callers resolve
  // through /identity, itself gated by an approved DisclosureRequest.
  return c;
}

function canSeeCase(req: { userRoles?: string[]; user?: { sub: string } }, c: Case): boolean {
  const sub = req.user?.sub;
  const roles = req.userRoles ?? [];
  if (!sub) return false;
  if (roles.includes("admin")) return true; // operational visibility, not identity (AP: see README)
  if (roles.includes("case-officer")) {
    if (c.assignedCaseOfficerId === sub) return true;
    // Unclaimed triage queue: any case officer can see a case that has no owner yet.
    if (!c.assignedCaseOfficerId && (c.status === "SUBMITTED" || c.status === "TRIAGE")) return true;
  }
  if (roles.includes("independent-reviewer") && activeAssignmentFor(c.id, sub)) return true;
  if (roles.includes("reporter")) {
    const identity = reporterIdentities.get(c.reporterIdentityId);
    if (identity?.reporterSubject === sub) return true;
  }
  return false;
}

// ==============================================================================================
// PUBLIC ROUTES (No authentication required)
// ==============================================================================================

// 1. Get prequalified roster of officers and reviewers
casesRouter.get("/roster/personnel", (_req, res) => {
  res.json(prequalifiedPersonnel);
});

// 2. Submit anonymous report without authentication
casesRouter.post("/anonymous", (req, res) => {
  const { category, summary, description, severity, evidenceText, filename } = req.body ?? {};
  if (!category || !summary || !description || !severity) {
    res.status(400).json({ error: "category, summary, description, severity are required" });
    return;
  }

  const caseId = nanoid();
  const identityId = nanoid();
  const now = new Date().toISOString();

  reporterIdentities.set(identityId, {
    id: identityId,
    caseId,
    pseudonym: "Anonymous Whistleblower",
    reporterSubject: "anonymous-public",
    disclosurePreference: "anonymous",
  });

  const newCase: Case = {
    id: caseId,
    referenceNumber: nextReferenceNumber(),
    category,
    summary,
    description,
    status: "SUBMITTED",
    severity,
    createdAt: now,
    updatedAt: now,
    reporterIdentityId: identityId,
    isAnonymous: true,
  };
  cases.set(caseId, newCase);

  const { accessKey, pin } = createAnonymousSession(caseId);

  // If evidenceText was provided during anonymous intake, store it
  if (evidenceText) {
    const evId = nanoid();
    evidence.set(evId, {
      id: evId,
      caseId,
      filename: filename || "anonymous-evidence.txt",
      ciphertext: evidenceText,
      mimeType: "text/plain",
      uploadedBySubject: "anonymous",
      uploadedAt: now,
    });
  }

  recordEvent({
    caseId,
    actorSubject: "anonymous",
    actorRole: "reporter",
    action: "CASE_SUBMITTED_ANONYMOUS",
    outcome: "ALLOWED",
  });

  res.status(201).json({
    case: redactCase(newCase),
    receipt: {
      accessKey,
      pin,
      referenceNumber: newCase.referenceNumber,
      createdAt: now,
    },
  });
});

// 3. Track anonymous report with accessKey and pin
casesRouter.post("/anonymous/track", (req, res) => {
  const { accessKey, pin } = req.body ?? {};
  if (!accessKey || !pin) {
    res.status(400).json({ error: "accessKey and pin are required" });
    return;
  }
  const session = verifyAnonymousSession(accessKey, pin);
  if (!session) {
    res.status(401).json({ error: "Invalid Access Key or PIN" });
    return;
  }
  const c = cases.get(session.caseId);
  if (!c) {
    res.status(404).json({ error: "Case not found" });
    return;
  }
  const events = caseEvents.filter((e) => e.caseId === c.id);
  const evList = [...evidence.values()].filter((e) => e.caseId === c.id);

  res.json({
    case: redactCase(c),
    events,
    evidenceCount: evList.length,
    evidenceItems: evList.map((e) => ({
      id: e.id,
      filename: e.filename,
      uploadedAt: e.uploadedAt,
      uploadedBySubject: e.uploadedBySubject,
    })),
  });
});

// 4. Append note or evidence to anonymous report
casesRouter.post("/anonymous/append", (req, res) => {
  const { accessKey, pin, statement, filename, ciphertext } = req.body ?? {};
  if (!accessKey || !pin) {
    res.status(400).json({ error: "accessKey and pin are required" });
    return;
  }
  const session = verifyAnonymousSession(accessKey, pin);
  if (!session) {
    res.status(401).json({ error: "Invalid Access Key or PIN" });
    return;
  }
  const c = cases.get(session.caseId);
  if (!c) {
    res.status(404).json({ error: "Case not found" });
    return;
  }

  const now = new Date().toISOString();
  if (statement || ciphertext) {
    const evId = nanoid();
    evidence.set(evId, {
      id: evId,
      caseId: c.id,
      filename: filename || "supplementary-statement.txt",
      ciphertext: ciphertext || statement || "",
      mimeType: "text/plain",
      uploadedBySubject: "anonymous",
      uploadedAt: now,
    });
  }

  c.updatedAt = now;
  recordEvent({
    caseId: c.id,
    actorSubject: "anonymous",
    actorRole: "reporter",
    action: "ANONYMOUS_INFORMATION_APPENDED",
    outcome: "ALLOWED",
  });

  res.json({ success: true, updatedAt: now });
});

// ==============================================================================================
// AUTHENTICATED ROUTES
// ==============================================================================================
casesRouter.use(authenticate);

// Create a report. Reporter only (Authenticated mode).
casesRouter.post("/", requireRole("reporter"), (req, res) => {
  const { category, summary, description, severity, disclosurePreference, pseudonym } = req.body ?? {};
  if (!category || !summary || !description || !severity) {
    res.status(400).json({ error: "category, summary, description, severity are required" });
    return;
  }

  const caseId = nanoid();
  const identityId = nanoid();
  const now = new Date().toISOString();

  reporterIdentities.set(identityId, {
    id: identityId,
    caseId,
    pseudonym: pseudonym || `Reporter-${identityId.slice(0, 6)}`,
    reporterSubject: req.user!.sub,
    disclosurePreference: disclosurePreference || "confidential",
  });

  const newCase: Case = {
    id: caseId,
    referenceNumber: nextReferenceNumber(),
    category,
    summary,
    description,
    status: "SUBMITTED",
    severity,
    createdAt: now,
    updatedAt: now,
    reporterIdentityId: identityId,
    isAnonymous: false,
  };
  cases.set(caseId, newCase);

  recordEvent({
    caseId,
    actorSubject: req.user!.sub,
    actorRole: "reporter",
    action: "CASE_SUBMITTED",
    outcome: "ALLOWED",
  });

  res.status(201).json(redactCase(newCase));
});

// List cases visible to the caller's role.
casesRouter.get("/", (req, res) => {
  const visible = [...cases.values()].filter((c) => canSeeCase(req, c));
  res.json(visible.map(redactCase));
});

// Case detail. 404 (not 403) when the case exists but the caller has no assignment.
casesRouter.get("/:id", (req, res) => {
  const c = cases.get(req.params.id);
  if (!c || !canSeeCase(req, c)) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(redactCase(c));
});

// Claim an unassigned case into triage. Any case officer; first to claim wins.
casesRouter.post("/:id/claim", requireRole("case-officer"), (req, res) => {
  const c = cases.get(req.params.id);
  if (!c || !canSeeCase(req, c)) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  if (c.assignedCaseOfficerId) {
    res.status(409).json({ error: "Case already has an assigned case officer" });
    return;
  }
  c.assignedCaseOfficerId = req.user!.sub;
  const officerUser = prequalifiedPersonnel.find((p) => p.id === req.user!.sub);
  if (officerUser) {
    c.assignedCaseOfficerName = `${officerUser.name} (${officerUser.organization})`;
  } else {
    c.assignedCaseOfficerName = req.user!.sub;
  }
  c.updatedAt = new Date().toISOString();
  recordEvent({
    caseId: c.id,
    actorSubject: req.user!.sub,
    actorRole: "case-officer",
    action: "CASE_CLAIMED",
    outcome: "ALLOWED",
  });
  res.json(redactCase(c));
});

// Assign a specific case officer. Case officer or admin.
casesRouter.post(
  "/:id/assign-officer",
  requireRole("case-officer", "admin"),
  (req, res) => {
    const c = cases.get(req.params.id);
    if (!c) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const { officerSubject, officerName } = req.body ?? {};
    if (!officerSubject) {
      res.status(400).json({ error: "officerSubject is required" });
      return;
    }

    const found = prequalifiedPersonnel.find((p) => p.id === officerSubject);
    c.assignedCaseOfficerId = officerSubject;
    c.assignedCaseOfficerName = officerName || (found ? `${found.name} (${found.organization})` : officerSubject);
    c.updatedAt = new Date().toISOString();

    recordEvent({
      caseId: c.id,
      actorSubject: req.user!.sub,
      actorRole: req.userRoles!.includes("admin") ? "admin" : "case-officer",
      action: `CASE_OFFICER_ASSIGNED:${officerSubject}`,
      outcome: "ALLOWED",
    });

    res.json(redactCase(c));
  },
);

// Assign an independent reviewer to a case. Case officer or admin.
casesRouter.post(
  "/:id/assign-reviewer",
  requireRole("case-officer", "admin"),
  (req, res) => {
    const c = cases.get(req.params.id);
    if (!c) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const { reviewerSubject, reviewerName, expiresAt } = req.body ?? {};
    if (!reviewerSubject) {
      res.status(400).json({ error: "reviewerSubject is required" });
      return;
    }

    const assignmentId = nanoid();
    reviewAssignments.set(assignmentId, {
      id: assignmentId,
      caseId: c.id,
      reviewerSubject,
      status: "ACTIVE",
      assignedAt: new Date().toISOString(),
      assignedBySubject: req.user!.sub,
      expiresAt,
    });
    c.assignedReviewerId = reviewerSubject;
    const found = prequalifiedPersonnel.find((p) => p.id === reviewerSubject);
    c.assignedReviewerName = reviewerName || (found ? `${found.name} (${found.organization})` : reviewerSubject);
    c.updatedAt = new Date().toISOString();

    recordEvent({
      caseId: c.id,
      actorSubject: req.user!.sub,
      actorRole: req.userRoles!.includes("admin") ? "admin" : "case-officer",
      action: `REVIEWER_ASSIGNED:${reviewerSubject}`,
      outcome: "ALLOWED",
    });

    res.status(201).json({ assignmentId, case: redactCase(c) });
  },
);

// Revoke an active review assignment. Case officer or admin.
casesRouter.post(
  "/:id/revoke-assignment/:assignmentId",
  requireRole("case-officer", "admin"),
  (req, res) => {
    const assignment = reviewAssignments.get(req.params.assignmentId);
    if (!assignment || assignment.caseId !== req.params.id) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    assignment.status = "REVOKED";
    assignment.revokedAt = new Date().toISOString();

    recordEvent({
      caseId: req.params.id,
      actorSubject: req.user!.sub,
      actorRole: req.userRoles!.includes("admin") ? "admin" : "case-officer",
      action: `ASSIGNMENT_REVOKED:${assignment.reviewerSubject}`,
      outcome: "ALLOWED",
    });

    res.status(204).send();
  },
);

// Grant E2EE policy flag for case (record keeping)
casesRouter.post(
  "/:id/grant-e2ee",
  requireRole("case-officer", "admin"),
  (req, res) => {
    const c = cases.get(req.params.id);
    if (!c) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    c.e2eePolicyGranted = true;
    c.updatedAt = new Date().toISOString();

    recordEvent({
      caseId: c.id,
      actorSubject: req.user!.sub,
      actorRole: req.userRoles!.includes("admin") ? "admin" : "case-officer",
      action: "E2EE_POLICY_GRANTED_FOR_CASE",
      outcome: "ALLOWED",
    });

    res.json({ success: true, case: redactCase(c) });
  },
);

// Ordinary workflow transitions (never CLOSED — that only happens through the closure-decision
// endpoint below, gated to the independent reviewer). Case officer or admin.
casesRouter.post(
  "/:id/transition",
  requireRole("case-officer", "admin"),
  (req, res) => {
    const c = cases.get(req.params.id);
    if (!c) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const { to } = req.body ?? {};
    if (to === "PENDING_CLOSURE_APPROVAL" || to === "CLOSED") {
      res.status(403).json({
        error:
          "Use /closure-request and /closure-decision. Closure cannot be reached via a generic transition.",
      });
      return;
    }
    try {
      assertTransition(c.status, to);
    } catch (e) {
      if (e instanceof InvalidTransitionError) {
        res.status(409).json({ error: e.message });
        return;
      }
      throw e;
    }
    c.status = to;
    c.updatedAt = new Date().toISOString();
    recordEvent({
      caseId: c.id,
      actorSubject: req.user!.sub,
      actorRole: req.userRoles!.includes("admin") ? "admin" : "case-officer",
      action: `TRANSITION:${to}`,
      outcome: "ALLOWED",
    });
    res.json(redactCase(c));
  },
);

// --- Anti-Cover-up Protocol -------------------------------------------------------------------

// Propose closure. Case officer or admin. Requires an ACTIVE reviewer assignment to exist — there
// is no path to CLOSED without a named, currently-active independent reviewer able to decide it.
casesRouter.post(
  "/:id/closure-request",
  requireRole("case-officer", "admin"),
  (req, res) => {
    const c = cases.get(req.params.id);
    if (!c) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    if (!["UNDER_REVIEW", "ESCALATED"].includes(c.status)) {
      res.status(409).json({ error: `Cannot propose closure from status ${c.status}` });
      return;
    }
    const assignment = [...reviewAssignments.values()].find(
      (a) => a.caseId === c.id && a.status === "ACTIVE",
    );
    if (!assignment) {
      recordEvent({
        caseId: c.id,
        actorSubject: req.user!.sub,
        actorRole: req.userRoles!.includes("admin") ? "admin" : "case-officer",
        action: "CLOSURE_REQUESTED",
        outcome: "DENIED",
        reasonCode: "NO_ACTIVE_REVIEWER",
      });
      res.status(409).json({
        error: "Closure denied. No active independent reviewer is assigned to approve it.",
      });
      return;
    }

    const { reason } = req.body ?? {};
    const requestId = nanoid();
    const closureRequest: ClosureRequest = {
      id: requestId,
      caseId: c.id,
      proposedBySubject: req.user!.sub,
      proposedAt: new Date().toISOString(),
      reason: reason || "",
      status: "PENDING",
      eligibleAssignmentId: assignment.id,
    };
    closureRequests.set(requestId, closureRequest);
    c.status = "PENDING_CLOSURE_APPROVAL";
    c.pendingClosureRequestId = requestId;
    c.updatedAt = new Date().toISOString();

    recordEvent({
      caseId: c.id,
      actorSubject: req.user!.sub,
      actorRole: req.userRoles!.includes("admin") ? "admin" : "case-officer",
      action: "CLOSURE_REQUESTED",
      outcome: "ALLOWED",
    });

    res.status(201).json({ closureRequestId: requestId });
  },
);

// Decide a closure request. ONLY the independent reviewer named on the eligible, still-active
// assignment may decide — not the proposer, not an admin, not any other reviewer. This is the
// server-side enforcement of Feature C: there is no alternate endpoint or role that reaches CLOSED.
casesRouter.post(
  "/:id/closure-decision",
  requireRole("independent-reviewer"),
  (req, res) => {
    const c = cases.get(req.params.id);
    if (!c || !c.pendingClosureRequestId) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const closureRequest = closureRequests.get(c.pendingClosureRequestId);
    if (!closureRequest || closureRequest.status !== "PENDING") {
      res.status(409).json({ error: "No pending closure request for this case" });
      return;
    }

    const assignment = reviewAssignments.get(closureRequest.eligibleAssignmentId);
    const sub = req.user!.sub;
    const denyWith = (reasonCode: string, message: string, statusCode = 403) => {
      recordEvent({
        caseId: c.id,
        actorSubject: sub,
        actorRole: "independent-reviewer",
        action: "CLOSURE_DECISION",
        outcome: "DENIED",
        reasonCode,
      });
      res.status(statusCode).json({ error: message });
    };

    if (!assignment || assignment.caseId !== c.id) {
      denyWith("NO_ASSIGNMENT", "Closure denied. No matching review assignment for this case.", 404);
      return;
    }
    if (assignment.status !== "ACTIVE") {
      denyWith(
        "ASSIGNMENT_NOT_ACTIVE",
        "Closure denied. The required independent approval has not been satisfied: the review assignment has been revoked or expired.",
      );
      return;
    }
    if (assignment.reviewerSubject !== sub) {
      denyWith(
        "WRONG_REVIEWER",
        "Closure denied. Only the independent reviewer assigned to this case may decide its closure.",
      );
      return;
    }

    const { decision, reason } = req.body ?? {};
    if (decision !== "APPROVE" && decision !== "REJECT") {
      res.status(400).json({ error: "decision must be APPROVE or REJECT" });
      return;
    }

    closureRequest.status = decision === "APPROVE" ? "APPROVED" : "REJECTED";
    closureRequest.decidedBySubject = sub;
    closureRequest.decidedAt = new Date().toISOString();
    closureRequest.decisionReason = reason || "";

    c.status = decision === "APPROVE" ? "CLOSED" : "UNDER_REVIEW";
    c.pendingClosureRequestId = undefined;
    c.updatedAt = new Date().toISOString();

    recordEvent({
      caseId: c.id,
      actorSubject: sub,
      actorRole: "independent-reviewer",
      action: `CLOSURE_${closureRequest.status}`,
      outcome: "ALLOWED",
    });

    res.json(redactCase(c));
  },
);
