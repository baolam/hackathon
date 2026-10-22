[![Built with TideCloak](https://tide.org/badges/built-with-tidecloak.svg)](https://tide.org/tidecloak?utm_source=github&utm_medium=readme&utm_campaign=unlocked)

## Project overview

TrustVoice enables protected whistleblowing and independent case review without giving any single administrator or organisation unilateral control over sensitive evidence or governed case decisions.

Built with [TideCloak](https://tide.org/tidecloak?utm_source=github&utm_medium=readme&utm_campaign=unlocked).

### 1. Vision & originality

Most whistleblowing and intake platforms (such as SecureDrop or generic complaint inboxes) focus exclusively on the submission moment: encrypting an initial intake form. **TrustVoice focuses on what happens after a report is received:** conducting a credible investigation when the organisation being investigated may itself have a direct conflict of interest.

The core innovation is **Conflict-Safe Independent Escalation**:
- **Cross-Organisational Trust**: Enables an external, qualified independent reviewer to step into a specific case under pre-established governance rules without taking unrestricted custody of the organisation’s broader confidential files.
- **Separation of Concerns**: Strictly separates reporter identity, case metadata, and evidence payloads into isolated permission boundaries.
- **Anti-Cover-up Workflow**: Prevents conflicted insiders from quietly burying or marking uncomfortable allegations as "resolved" without independent scrutiny.

### 2. Trust constraint insight

In corporate misconduct, fraud, and public-sector corruption, three competing tensions create a deadlock:
1. **Reporter → Organisation:** An employee fears retaliation or exposure if they report through internal channels where the accused manager has administrative or political influence.
2. **Organisation → Independent Reviewer:** The organisation cannot hand over unrestricted database or file access to an external reviewer due to intellectual property, customer privacy, and compliance obligations.
3. **All Parties → Case Outcome:** Whoever controls the central database and API server can unilaterally alter rows, reassign roles, delete logs, or flip `status = CLOSED`.

**The bottleneck is unilateral power, not weak encryption.** Conventional architectures rely on database administrators holding master keys or application-level `isAdmin` checks. When an administrator can bypass protections with an `if` statement, trust fails. Removing this constraint allows independent oversight across untrusted organizational boundaries.

### 3. Value & impact

- **Whistleblowers & Employees:** Gain guaranteed protection against unauthorized identity disclosure and retaliation. The reporter retains sovereign consent over when and to whom their real identity is disclosed.
- **Independent Reviewers & Ombudsmen:** Receive cryptographically scoped evidence strictly for their assigned case, without exposure to unrelated corporate data or liability for broader leaks.
- **Organisations & Boards:** Achieve credible compliance and risk mitigation. Board audit committees can prove to regulators that investigations are immune to executive cover-ups.
- **Fairness for Accused Parties:** Prevents kangaroo courts and leaked unverified allegations by strictly enforcing pseudonymous intake, governed review, and immutable audit trails.

**Concrete Scenario:** An employee uncovers executive procurement kickbacks. Using TrustVoice, the employee submits evidence that even IT administrators cannot inspect. The case escalates to an independent ombudsman who alone receives the cryptographic grant to decrypt that case’s evidence, while the internal case officer can only see redacted summaries and propose closure.

### 4. Why TideCloak matters

TrustVoice leverages TideCloak to move the enforcement boundary **outside the application server and database**:

- **Threshold E2EE via `RelationshipAttestation:1`:** Evidence is encrypted and decrypted exclusively inside the browser using Tide’s threshold key infrastructure. The backend only stores opaque ciphertext blobs. Decrypting a case requires both the realm role `_tide_decryptor` and a signed `RelationshipAttestation` policy issued through the Tide enclave. Even an administrator with full database access, server root access, and a valid session token **cannot decrypt the evidence**. The refusal comes from the decentralized Tide network, not a backend `403`.
- **RFC 9449 DPoP (Sender-Constrained Tokens):** Tokens are cryptographically bound to an ephemeral private key held in the client browser (`cnf.jkt`). The backend verifies the DPoP proof (`ath`, `htm`, `htu`, `iat`, and `jti` replay checks), ensuring stolen access tokens cannot be replayed.
- **Enclave Policy Governance:** Administrative actions (such as signing relationship policies) are executed inside the Tide enclave, making privilege grants verifiable and resistant to unilateral tampering.

### 5. Prototype & storytelling

The prototype demonstrates a complete, interactive vertical slice: **"The Compromised Admin"** narrative:

1. **Protected Intake:** A reporter (`reporter1`) logs in and submits a misconduct case.
2. **Threshold E2EE:** The reporter encrypts sensitive evidence directly in the browser. The server receives only ciphertext.
3. **The Compromised Admin Test (Denial):** An administrator (`admin`) logs in with full API privileges. Navigating to the evidence, the admin attempts to decrypt it. **The attempt fails with a real cryptographic denial from the Tide network (`TIDE-TIDEJS-NET-THRESHOLD_FAILURE`)**, proving that administrative rank does not grant decryption authority.
4. **Governed Delegation (Success):** The admin opens the Tide enclave to sign a scoped `RelationshipAttestation` policy for `reviewer1`.
5. **Scoped Reviewer Access:** `reviewer1` logs in, views the assigned case, and clicks **Attempt decrypt**. The decryption succeeds immediately and shows the plaintext.
6. **Anti-Cover-up Enforcement:** The internal officer proposes closure, but cannot finalize it; only the assigned independent reviewer can execute the closure decision.

---

## Setup

### Prerequisites

- Node.js 20+ (with npm)
- Docker Desktop (if running a local TideCloak instance)
- Modern browser (Chrome / Edge / Firefox)

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
npm run dev      # Runs API at http://localhost:4000
```

#### Run Automated Security Tests
The backend includes 19 automated tests validating the Anti-Cover-up protocol, cross-case access controls, and disclosure consent:

```bash
npm test         # 19 tests passing via Vitest
```

### 2. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev      # Runs SPA at http://localhost:5173
```

### 3. TideCloak Realm Bootstrap (Local Docker)

Bootstrap is driven by `frontend/scripts/bootstrap-tidecloak.windows.sh` (or the Unix counterpart):

```bash
cd frontend
# Configure KC_BOOTSTRAP_ADMIN_PASSWORD and TIDE_LICENSE_EMAIL in .env
ADAPTER_OUTPUT=public/tidecloak.json CLIENT_APP_URL=http://localhost:5173 \
  bash scripts/bootstrap-tidecloak.windows.sh
```

This bootstraps realm `trustvoice`, sets up `_tide_encryptor` and `_tide_decryptor` roles, configures protocol mappers (`tideUserKey`, `vuid`), and writes the adapter JSON to `frontend/public/tidecloak.json`.

### 4. Demo Accounts & Walkthrough

Three identities demonstrate the complete governance model:

| Account | Role Granted | Purpose |
|---|---|---|
| `admin` | `tide-realm-admin` (client role on `realm-management`) | Signs relationship policies in the Tide enclave. Deliberately **not** granted `_tide_decryptor` to demonstrate the compromised admin denial. |
| `reporter1` | `reporter`, `_tide_encryptor` | Submits reports and encrypts evidence narratives. |
| `reviewer1` | `independent-reviewer`, `_tide_decryptor` | Inspects assigned cases and decrypts evidence when granted a policy. |

#### Local Development Mode (Without Docker)
For evaluating application RBAC logic without running a local TideCloak container, set `TRUSTVOICE_DEV_MODE=true` in `backend/.env`. The backend will accept `x-dev-subject` and `x-dev-role` test headers. (Note: Threshold E2EE encryption requires a live Tide network).
