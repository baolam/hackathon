# TrustVoice — Threat Model & Security Limitations

Scope: the MVP vertical slice described in `README.md`. This does not cover infrastructure
hosting, dependency supply chain, or anything outside the application and its TideCloak
integration.

## Assets

Reporter identity · report content · evidence (not yet implemented) · reviewer communications ·
investigation notes · closure decisions · access/authorization history · authentication
credentials and integration secrets (`.env`, never committed — see `.gitignore`).

## Required threat scenarios

### 1. Administrator attempts to close a report without required independent approval

- **Attacker capability**: valid `admin` credentials, full knowledge of the API.
- **Security boundary**: only `requireRole("independent-reviewer")` on `/closure-decision`, and
  only when that reviewer's own verified `sub` matches an `ACTIVE` assignment for that case.
- **Enforcement**: `backend/src/routes/cases.ts` — role middleware + assignment check. There is no
  other endpoint, parameter, or flag that reaches `CLOSED`.
- **Expected result**: `403 Forbidden`.
- **Test**: `cases.test.ts` → "admin cannot decide the closure".
- **Residual risk**: an admin who also holds TideCloak's `tide-realm-admin` client role could, in a
  fully bootstrapped realm, directly edit role assignments through the TideCloak admin console —
  e.g. grant themselves `independent-reviewer` and self-assign. That is an IGA/governance problem
  one layer up from this app (mitigated by TideCloak's own multi-admin quorum once two admins are
  linked — see `PROJECT_OVERVIEW.md` §3 — not by TrustVoice's code). Documented, not hidden.

### 2. A reviewer attempts to access another reviewer's case

- **Boundary**: `canSeeCase()` requires an `ACTIVE` `ReviewAssignment` row matching both the case
  id and the caller's subject.
- **Enforcement**: `backend/src/routes/cases.ts` `GET /:id`.
- **Expected result**: `404` (not `403` — see scenario 3 for why).
- **Test**: "an unrelated reviewer cannot see the case".
- **Residual risk**: none identified for this specific path; see scenario 3 for ID-enumeration.

### 3. A user changes a case ID in a request to retrieve unauthorized information

- **Boundary**: same as scenario 2, applied uniformly across `GET /:id`, `/events`,
  `/disclosure-requests`, `/identity`.
- **Design choice**: unauthorized and nonexistent both return `404`, deliberately — a `403` would
  confirm the case ID exists, which is itself information disclosure (case-ID enumeration).
- **Expected result**: `404` for every related sub-resource, not just the case itself.
- **Test**: "an unrelated reviewer cannot read the case's event history".
- **Residual risk**: timing side-channels (a lookup that hits a real case vs. a missing one) are
  not defended against; this is an in-memory `Map.get`, effectively constant-time regardless.

### 4. An actor attempts to disclose a reporter's identity without authorization

- **Boundary**: `/disclosure-requests/:id/decision` is `requireRole("reporter")` *and* checks the
  caller's `sub` equals `ReporterIdentity.reporterSubject` for that specific case — not just "any
  reporter", the one reporter who filed this case.
- **Enforcement**: `backend/src/routes/disclosure.ts`.
- **Expected result**: a case officer or admin calling this endpoint gets `403` even if they
  authored the disclosure request themselves.
- **Test**: "identity disclosure requires the reporter's own consent" (officer self-approval
  attempt asserted at `403`).
- **Residual risk**: this is consent-based, not policy-threshold-based. A reporter who is coerced
  or deceived into approving disclosure is not protected by this mechanism — the spec requires us
  to state this rather than imply cryptographic coercion-resistance that does not exist.

### 5. A user replays an expired or revoked approval

- **Boundary**: closure decisions check `assignment.status === "ACTIVE"` at decision time, not at
  proposal time. Revoking an assignment (`/revoke-assignment/:id`) after a closure request was
  filed but before it is decided invalidates that reviewer's standing to decide it.
- **Enforcement**: `backend/src/routes/cases.ts` `/closure-decision` → `ASSIGNMENT_NOT_ACTIVE`.
- **Expected result**: `403`, "Closure denied… the review assignment has been revoked or expired."
- **Test**: "a revoked assignment can no longer approve a future closure request".
- **Residual risk**: token-level replay (a stolen but still-valid JWT+DPoP pair) is covered by the
  DPoP `jti` replay cache in `verifyDpop.ts`, which is **in-memory and per-process** — not safe
  across multiple backend instances. Documented in that file; do not scale out without a shared
  store.

### 6. A privileged actor attempts to alter or remove evidence of a prior decision

- **Boundary**: `CaseEvent` records are append-only in application code — no route updates or
  deletes an existing event.
- **Enforcement**: `backend/src/store.ts` `recordEvent()` only pushes; nothing in the router layer
  exposes a delete/update path for `caseEvents`.
- **Residual risk — stated plainly, not glossed over**: this is **not tamper-evident storage**.
  The event list is a plain in-memory array. Anyone with direct process/database access (which
  nothing here encrypts or signs) could edit it, and a restart wipes it entirely. A real
  tamper-evident log (hash-chained entries, or writing to an append-only/WORM store) is listed as
  future work, not implemented.

### 7. A reviewer account is compromised or its access needs to be revoked

- **Boundary**: `/revoke-assignment/:id` immediately flips `ReviewAssignment.status` to
  `REVOKED`; every subsequent authorization check (`activeAssignmentFor`, closure decision) reads
  live status, not a cached grant.
- **Expected result**: a revoked reviewer immediately loses case visibility (`canSeeCase` requires
  `ACTIVE`) and closure-decision rights, with no token refresh or re-login required on the backend
  side (the JWT itself still carries the reviewer's TideCloak roles until it expires — this app's
  authorization is enforced per-request, not baked into the token's validity window).
- **Residual risk**: the JWT itself is not revoked early — TrustVoice's own `ReviewAssignment`
  table is the actual authorization record (role is necessary but not sufficient), which is
  intentional: it is strictly stronger than relying on token expiry alone, but is still only as
  durable as this process's memory until a real database replaces it.

### 8. Two authorized actors may collude to abuse the approval process

- **Boundary**: the proposer (case officer) and the decider (independent reviewer) must be
  different verified subjects by construction — the closure-decision endpoint is not reachable by
  the `case-officer` role at all (`requireRole("independent-reviewer")`), so a single person cannot
  hold both roles in one request even if their account somehow had both roles assigned.
- **Test**: "the officer who proposed closure cannot also approve it".
- **Residual risk, stated honestly**: this is **role separation, not cryptographic
  non-collusion**. If an organization assigns the same human both the `case-officer` and
  `independent-reviewer` roles across different accounts, or two colluding humans hold the two
  roles, TrustVoice's current MVP cannot detect or prevent that collusion — it only guarantees the
  two decisions were made by two distinct, independently authenticated TideCloak identities. A
  stronger guarantee (e.g., organizational conflict-of-interest checks, or moving the decision into
  a cryptographic quorum) is out of scope for this MVP and listed as future work.

## What is NOT claimed

- This is not an independently audited or production-hardened system.
- The in-memory store is not durable or tamper-evident (scenario 6).
- Identity "disclosure" is consent-based, not coercion-resistant (scenario 4).
- Evidence upload/storage is not implemented in this MVP.
- The full TideCloak IGA quorum/change-request governance layer (multi-admin approval for *realm*
  changes) is a separate, real TideCloak capability that this app's bootstrap can use for realm
  administration, but it is distinct from, and not currently wired into, TrustVoice's own
  case-closure approval — which is enforced by this application's verified-identity + role +
  assignment logic described above.
