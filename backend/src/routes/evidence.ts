import { Router } from "express";
import { nanoid } from "nanoid";
import { authenticate } from "../auth/middleware.js";
import { cases, evidence, recordEvent } from "../store.js";

export const evidenceRouter = Router();
evidenceRouter.use(authenticate);

/**
 * Stores only an opaque Tide ciphertext blob plus metadata. There is no server-side decrypt path
 * here, deliberately: this backend never holds a key that could read it, encryption and
 * decryption both happen in the uploader's / viewer's own browser via
 * frontend/src/lib/tide/relationship.ts, using a signed policy only the Tide network can honour.
 */
evidenceRouter.post("/:caseId/evidence", (req, res) => {
  const c = cases.get(req.params.caseId);
  if (!c) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const { filename, mimeType, ciphertext } = req.body ?? {};
  if (!filename || !ciphertext) {
    res.status(400).json({ error: "filename and ciphertext are required" });
    return;
  }
  const id = nanoid();
  evidence.set(id, {
    id,
    caseId: c.id,
    filename,
    mimeType: mimeType || "text/plain",
    ciphertext,
    uploadedBySubject: req.user!.sub,
    uploadedAt: new Date().toISOString(),
  });
  recordEvent({
    caseId: c.id,
    actorSubject: req.user!.sub,
    actorRole: (req.userRoles?.[0] ?? "unknown") as never,
    action: `EVIDENCE_UPLOADED:${filename}`,
    outcome: "ALLOWED",
  });
  res.status(201).json({ id });
});

evidenceRouter.get("/:caseId/evidence", (req, res) => {
  const c = cases.get(req.params.caseId);
  if (!c) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const list = [...evidence.values()].filter((e) => e.caseId === c.id);
  res.json(list);
});

/**
 * Records a decrypt ATTEMPT — called by the frontend after it already tried to decrypt in the
 * browser, so the outcome logged here is the real cryptographic result, not a guess. The backend
 * cannot verify the plaintext (it never sees it), so this is an honesty log, not an enforcement
 * point: the actual enforcement already happened at the ORK before this call was ever made.
 */
evidenceRouter.post("/:caseId/evidence/:evidenceId/log-access", (req, res) => {
  const c = cases.get(req.params.caseId);
  if (!c) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const { outcome, reasonCode } = req.body ?? {};
  recordEvent({
    caseId: c.id,
    actorSubject: req.user!.sub,
    actorRole: (req.userRoles?.[0] ?? "unknown") as never,
    action: `EVIDENCE_DECRYPT_ATTEMPT:${req.params.evidenceId}`,
    outcome: outcome === "ALLOWED" ? "ALLOWED" : "DENIED",
    reasonCode,
  });
  res.status(204).send();
});
