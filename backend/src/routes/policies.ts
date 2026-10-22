import { Router } from "express";
import { nanoid } from "nanoid";
import { authenticate, requireTideRealmAdmin } from "../auth/middleware.js";
import { signedPolicies, policyKey, recordEvent } from "../store.js";

export const policiesRouter = Router();
policiesRouter.use(authenticate);

/**
 * Store a signed RelationshipAttestation policy (PolicyEnabledEncryption/Decryption:1). The server
 * never signs or mints these — only a realm admin's browser can, via the Tide enclave
 * (frontend/src/lib/tide/relationship.ts `signRelationshipPolicy`). This endpoint just persists the
 * resulting bytes, keyed by subject + record, so the subject can fetch them back later. Storing a
 * bad or unsigned blob here grants nothing: the ORK itself verifies the signature and the caller's
 * role/subject before it will encrypt or decrypt anything with it.
 */
policiesRouter.post("/", requireTideRealmAdmin, (req, res) => {
  const { subjectType, subjectId, clientId, recordId, policyB64, access } = req.body ?? {};
  if (!subjectType || !subjectId || !recordId || !policyB64 || !access) {
    res.status(400).json({ error: "subjectType, subjectId, recordId, policyB64, access are required" });
    return;
  }
  const id = nanoid();
  signedPolicies.set(policyKey(subjectType, subjectId, recordId), {
    id,
    subjectType,
    subjectId,
    clientId,
    recordId,
    policyB64,
    access,
    grantedBySubject: req.user!.sub,
    createdAt: new Date().toISOString(),
  });
  recordEvent({
    caseId: recordId,
    actorSubject: req.user!.sub,
    actorRole: req.userRoles!.includes("admin") ? "admin" : "case-officer",
    action: `POLICY_GRANTED:${subjectType}:${access}`,
    outcome: "ALLOWED",
  });
  res.status(201).json({ id });
});

/**
 * Return the policy (if any) that names the caller for this record, checked three ways: as the
 * named User (by their own verified `tideuserkey`), as a member of a named Group, or as the
 * holder of a named Role — exactly how the ORK itself will check the subject when the policy is
 * used. This endpoint saves the caller a lookup; it grants nothing by itself.
 */
policiesRouter.get("/:recordId/mine", (req, res) => {
  const { recordId } = req.params;
  const tideUserKey = req.user?.tideuserkey;
  const roles = req.user?.realm_access?.roles ?? [];
  const groups = req.user?.groups ?? [];

  const candidates = [...signedPolicies.values()].filter((p) => p.recordId === recordId);
  const mine = candidates.find((p) => {
    if (p.subjectType === "User") return tideUserKey && p.subjectId === tideUserKey;
    if (p.subjectType === "Role") return roles.includes(p.subjectId);
    if (p.subjectType === "Group") return groups.includes(p.subjectId);
    return false;
  });

  if (!mine) {
    res.status(404).json({ error: "No policy grants you access to this record" });
    return;
  }
  res.json({ policyB64: mine.policyB64, access: mine.access });
});

policiesRouter.get("/:recordId", requireTideRealmAdmin, (req, res) => {
  const list = [...signedPolicies.values()].filter((p) => p.recordId === req.params.recordId);
  res.json(list.map((p) => ({ ...p, policyB64: undefined })));
});
