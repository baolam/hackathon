# TrustVoice

Secure whistleblowing and delegated case-resolution platform for the Tide UNLOCKED challenge.
Full product brief: [`PROJECT_OVERVIEW.md`](PROJECT_OVERVIEW.md).

## Repository layout

```
frontend/   React + Vite SPA (TideCloak login, DPoP, case UI)
backend/    Node.js + Express API (JWT + DPoP verification, case state machine, in-memory store)
```

Each half has its own `package.json`, `.env.example`, and run scripts — they are two independent
npm projects, not a workspace, so run commands from inside each directory.

## Why TideCloak, specifically

TrustVoice's core product principle is: **no single administrator should be able to unilaterally
bypass the platform's protections.** An ordinary Express app with session cookies and a `role`
column cannot make that claim credibly — whoever controls the database controls the roles. The
honest test (see `TrustVoice_Full_Concept_and_Improvements.md` §1.1): *if the same guarantee could
be had with login + role + an `if` in a backend the admin controls, TideCloak added nothing.*

### The genuine cryptographic claim: Evidence (E2EE)

`frontend/src/pages/E2EEDemo.tsx` + `frontend/src/lib/tide/relationship.ts` implement **threshold
E2EE via Tide's built-in `RelationshipAttestation:1` contract** (no custom contract written or
deployed — see `tide_scenario relationship-attestation`). Evidence is encrypted and decrypted
**entirely in the browser**:

- The backend (`backend/src/routes/evidence.ts`) stores only an opaque ciphertext blob. It has no
  key, no decrypt path, and no way to read what it stores — not a permission choice, a cryptographic
  fact.
- Decrypting a record requires **two things that must both be true for the same user**: the realm
  role `_tide_decryptor`, and a `RelationshipAttestation` policy — signed by a `tide-realm-admin` in
  the Tide enclave, never by this app's server — naming that user for that specific record
  (`backend/src/routes/policies.ts` only stores the signed bytes; it never signs them).
- **A real admin, with a valid verified token and full API access, who has not been granted a
  policy for a record, cannot decrypt it.** This is checked by the Tide network itself at decrypt
  time, not by a `403` this app's code could be talked out of.

This is the single demo moment the judging rubric's "Why TideCloak Matters" (20%) asks for: a
genuine protected denial/success pair with the enforcement boundary outside this app's own backend.

### The RBAC claim: Anti-Cover-up Protocol (application-enforced, not TideCloak-enforced)

`backend/src/routes/cases.ts` still implements the original case-closure workflow: every actor is a
cryptographically verified, distinct TideCloak identity (JWT signature + RFC 9449 DPoP proof via
`backend/src/auth/verifyDpop.ts`), and no endpoint, under any role, can set a case straight to
`CLOSED` — only `/closure-decision`, gated to `requireRole("independent-reviewer")` plus an `ACTIVE`
assignment match. **This part is honestly a backend authorization decision, not a TideCloak-enforced
one** — it uses TideCloak only as the trust anchor for *who is asking*, the same honest boundary
`THREAT_MODEL.md` already drew before this E2EE feature existed. Treat it as the secondary,
RBAC-based demonstration; Evidence (E2EE) is the primary one.

## Setup

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev      # http://localhost:4000 (devMode:false once a real realm is wired up)
npm test         # 19 tests covering the anti-cover-up protocol, cross-case access, disclosure consent
```

`npm test` runs against a local dev-mode auth bypass (`TRUSTVOICE_DEV_MODE=true`, set in
`vitest.config.ts`) so the RBAC authorization *logic* is provable without a running TideCloak
instance. That bypass is clearly labeled wherever it is used — see "Local development mode" below —
and must never be set in a deployed environment. It is irrelevant to the Evidence (E2EE) feature,
which has no bypass: without a real signed policy from a real realm, encryption/decryption simply
does not work, by construction.

### 2. TideCloak (local Docker) — realm `trustvoice`, already bootstrapped in this environment

Bootstrap is driven by a Windows-adapted copy of the pack's own script, kept at
`frontend/scripts/bootstrap-tidecloak.windows.sh` (upstream `templates/shared/bootstrap-tidecloak.sh`
with `sudo` removed from three lines — Windows has no POSIX uid/chown semantics for a Docker-Desktop
bind mount, and `sudo` is disabled by default on this machine; see the comment in that file for
exactly what changed and why). To redo it elsewhere:

```bash
cd frontend
npm install
cp .env.example .env
# fill in KC_BOOTSTRAP_ADMIN_PASSWORD, TIDE_LICENSE_EMAIL, TIDE_TERMS_ACCEPTED=yes
ADAPTER_OUTPUT=public/tidecloak.json CLIENT_APP_URL=http://localhost:5173 \
  bash "<pack install dir>/templates/shared/bootstrap-tidecloak.sh"   # or the .windows.sh copy
```

This creates the realm (licensed, IGA enabled), the `_tide_encryptor`/`_tide_decryptor` realm roles
and `tideUserKey`/`vuid`/`groups` protocol mappers the E2EE feature needs (all ship in the pack's
own realm template), links the first admin, and writes the real adapter JSON to
`frontend/public/tidecloak.json` (overwriting the placeholder that lets `npm run dev` start before
bootstrap). The backend reads the same file via `TIDECLOAK_ADAPTER_PATH` (see `backend/.env.example`).

**One-way door**: granting `tide-realm-admin` to the first admin flips the realm `FirstAdmin →
MultiAdmin`. After that, every further governed change (creating a user, granting a role, signing a
relationship policy) needs a human to approve it in a real browser — via TideCloak's own admin
console at `http://localhost:8080/realms/trustvoice/tide-console/`, or, for relationship policies
specifically, via this app's own Evidence page (below). No script, including this one, can forge
that approval afterward — that is the security property, not a bug.

### 3. Frontend

```bash
npm run dev       # http://localhost:5173
```

### 4. Wiring up the Evidence (E2EE) demo accounts

Three real TideCloak identities are used:

| Account | Role granted | Purpose |
|---|---|---|
| `admin` | `tide-realm-admin` (client role on `realm-management`) | Signs relationship policies in the enclave. Deliberately **not** granted `_tide_decryptor` — this is the account the demo tries to use to decrypt evidence and fails. |
| `reporter1` | realm role `_tide_encryptor` | Encrypts/uploads evidence for a record it has a `write`/`read-write` policy for. |
| `reviewer1` | realm role `_tide_decryptor` | Decrypts evidence for a record it has a `read` policy for. |

Each new user must sign in once (there is no password-based signup; a required-action invite link,
generated the same way as the first admin's, is how they set up their Tide credential) before they
have a `tideUserKey` — visible to them on the Evidence page after login — that an admin can grant a
policy to from the same page (`isTideRealmAdmin` panel, calling
`frontend/src/lib/tide/relationship.ts` → `signRelationshipPolicy`, which opens the Tide enclave in
the admin's own browser; the server never signs anything).

## Local development mode (no TideCloak running)

Set `TRUSTVOICE_DEV_MODE=true` on the backend and send `x-dev-subject` / `x-dev-role` headers
instead of a real token (see `backend/src/auth/middleware.ts`). This is how the automated tests
and the demo script below prove the case-management logic without first standing up TideCloak. It
is a named, visible bypass — every response and audit event is tagged, and the server logs a
warning on startup — never a silent stand-in for real enforcement. Do not deploy with it set.

## Demo script — Evidence (E2EE), the primary one

1. Log in as `admin`. Go to **Evidence (E2EE)**. The admin's own session shows `_tide_decryptor: no`.
2. As `admin`, grant `reporter1` (paste their `tideUserKey`) `read-write` on record `demo-case-1`.
3. Log in as `reporter1` (different browser/profile). Go to **Evidence (E2EE)**, record
   `demo-case-1`, write and encrypt an evidence narrative. The server receives ciphertext only.
4. Log back in as `admin`. On the same record, click **Attempt decrypt** on the uploaded item.
   **It fails** — a real Tide network refusal (`TIDE-TIDEJS-NET-THRESHOLD_FAILURE` or a missing-role
   error), not a `403` this app's code produced. This is the compromised-admin moment.
5. As `admin`, grant `reviewer1` `read` on `demo-case-1`.
6. Log in as `reviewer1`. **Attempt decrypt** on the same item. It succeeds and shows the plaintext.
7. Log in as a second reviewer who was never granted a policy for this record. **Attempt decrypt**
   fails the same way admin's did — access is per-record, not per-role.

## Demo script — Anti-Cover-up Protocol (secondary, application-enforced RBAC)

1. Reporter submits a report (`POST /api/cases`, `reporter` role).
2. Case officer claims it, moves it to `UNDER_REVIEW`.
3. Case officer tries `POST /cases/:id/closure-request` with **no reviewer assigned** → `409`,
   "Closure denied. No active independent reviewer is assigned to approve it."
4. Case officer assigns an independent reviewer; now proposes closure → `201`, case moves to
   `PENDING_CLOSURE_APPROVAL`.
5. Admin tries `POST /cases/:id/closure-decision` → `403` (wrong role, by design: no admin path to
   `CLOSED` exists at all).
6. The assigned reviewer approves → case `CLOSED`.
7. `GET /cases/:id/events` shows the full, actor-stamped history: submission, claim, closure
   request, the denied admin attempt, the approval.

`backend/test/cases.test.ts` runs this exact sequence (plus the cross-case and revoked-assignment
variants) as an automated test.

## What's implemented vs. what's left

Implemented: live TideCloak realm (`trustvoice`, local Docker, licensed, IGA enabled);
policy-governed threshold E2EE for evidence via the built-in `RelationshipAttestation:1` contract
(encrypt/decrypt/grant all exercised against the real network, not mocked); case state machine;
anti-cover-up closure protocol; case-specific reviewer assignment with revocation;
reporter-identity separation; consent-gated identity disclosure; full case-event audit trail;
server-side JWT + DPoP verification; automated security tests for the RBAC path.

Not yet implemented: evidence file upload (text only for the demo), persistent database (current
store is in-memory and resets on restart — explicitly not tamper-evident, see `THREAT_MODEL.md`),
blind-review redaction UI, a `Disputed`/`Escalated` terminal outcome distinct from `Resolved`
(flagged as a gap in `TrustVoice_Full_Concept_and_Improvements.md` §8.3), branding/onboarding
customization (declined for this submission to save time), and automated tests for the E2EE path
(it is demoed live against the real realm instead — see the demo script above).
