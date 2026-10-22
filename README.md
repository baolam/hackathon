[![Built with TideCloak](https://tide.org/badges/built-with-tidecloak.svg)](https://tide.org/tidecloak?utm_source=github&utm_medium=readme&utm_campaign=unlocked)

## Project overview

TrustVoice enables protected whistleblowing and independent case review without giving any single administrator or organisation unilateral control over sensitive evidence or governed case decisions.

Built with [TideCloak](https://tide.org/tidecloak?utm_source=github&utm_medium=readme&utm_campaign=unlocked).

### 1. Vision & originality

Most whistleblowing and intake platforms (such as SecureDrop, EthicsPoint, or generic compliance forms) focus exclusively on the submission moment: encrypting an initial intake payload. **TrustVoice focuses on what happens after a report is received:** conducting a credible, tamper-proof investigation when the organisation being investigated may itself have an inherent conflict of interest.

The core innovation is **Conflict-Safe Independent Escalation**:
- **Cross-Organisational Trust**: Enables an external, qualified independent reviewer (e.g., ombudsman, forensic auditor, legal counsel) to step into a specific case under pre-established governance rules without taking unrestricted custody of the organisation’s broader confidential files.
- **Sovereign Whistleblower Pathways**: Provides both browser-side Threshold E2EE for authenticated reporters and zero-knowledge Anonymous Intake with cryptographically unguessable receipt tokens (`tv-rcpt-...`) for unauthenticated whistleblowers.
- **Separation of Concerns**: Strictly isolates reporter identity, case metadata, granular role delegations, and encrypted evidence payloads into distinct cryptographic and authorization boundaries.
- **Anti-Cover-up Workflow**: Prevents conflicted internal officers or administrators from quietly burying, editing, or marking uncomfortable allegations as "resolved" without independent scrutiny and multi-party sign-off.

### 2. Trust constraint insight

In corporate misconduct, financial fraud, and public-sector corruption, three competing tensions create an unavoidable deadlock:
1. **Reporter → Organisation:** An employee fears retaliation, surveillance, or career termination if they report through internal channels where the accused manager or executive exercises operational control.
2. **Organisation → Independent Reviewer:** An organisation cannot hand over unrestricted database or file access to an external reviewer due to trade secrets, customer privacy, and compliance liabilities.
3. **All Parties → Case Outcome:** Whoever controls the central database and API server can unilaterally alter rows, reassign roles, delete logs, or flip `status = CLOSED`.

**The bottleneck is unilateral power, not weak encryption.** Conventional architectures rely on database administrators holding master keys or application-level `if (user.isAdmin)` checks. When an administrator can bypass protections with an `if` statement or database update, trust fails. Removing this constraint requires cryptographic enforcement of authority across untrusted organizational boundaries.

### 3. Value & impact

- **Whistleblowers & Employees:** Gain mathematically guaranteed protection against unauthorized identity disclosure and retaliation. The reporter retains sovereign consent over when, how, and to whom their real identity is disclosed.
- **Independent Reviewers & Ombudsmen:** Receive cryptographically scoped evidence strictly for their assigned case, without exposure to unrelated corporate data or liability for broader leaks.
- **Enterprises, Boards & Regulators:** Achieve provable compliance with global standards (EU Whistleblower Protection Directive 2019/1937, Sarbanes-Oxley, ISO 37002). Board audit committees can prove to regulators and shareholders that internal investigations are mathematically immune to executive cover-ups.
- **Fairness for Accused Parties:** Prevents kangaroo courts, biased internal witch-hunts, and leaked unverified allegations by enforcing pseudonymous intake, governed multi-party review, and immutable audit trails.

**Concrete Scenario:** An employee uncovers executive procurement kickbacks. Using TrustVoice, the employee submits evidence that even IT administrators cannot inspect. The case escalates to an independent ombudsman who alone receives the cryptographic grant to decrypt that case’s evidence, while the internal case officer can only see redacted summaries and propose closure.

### 4. Why TideCloak matters

TrustVoice leverages TideCloak to move the enforcement boundary **outside the application server and database**:

- **Threshold E2EE via `RelationshipAttestation:1`:** Evidence is encrypted and decrypted exclusively inside the browser using Tide’s decentralized threshold key infrastructure. The backend only stores opaque ciphertext blobs. Decrypting a case requires both the realm role `_tide_decryptor` and a signed `RelationshipAttestation` policy issued through the Tide enclave. Even an administrator with full database access, server root access, and a valid session token **cannot decrypt the evidence**. The refusal comes from the decentralized Tide network (`TIDE-TIDEJS-NET-THRESHOLD_FAILURE`), not an application `403`.
- **RFC 9449 DPoP (Sender-Constrained Tokens):** Tokens are cryptographically bound to an ephemeral private key held in the client browser (`cnf.jkt`). The backend verifies the DPoP proof (`ath`, `htm`, `htu`, `iat`, and single-use `jti` replay checks), ensuring stolen access tokens cannot be replayed.
- **Enclave Policy Governance & Role Delegation:** Administrative actions (such as signing relationship policies and delegating case review scopes) are verified and signed inside the Tide enclave, making privilege grants verifiable, auditable, and resistant to unilateral tampering.

### 5. Prototype & storytelling

The prototype demonstrates a complete, interactive vertical slice: **"The Compromised Admin & The Independent Ombudsman"** narrative:

1. **Dual Protected Intake:** 
   - *Option A (Authenticated):* A reporter (`reporter1`) logs in with TideCloak and encrypts sensitive evidence directly in the browser via Threshold E2EE.
   - *Option B (Anonymous):* A whistleblower submits an unauthenticated report, receiving a secure cryptographic tracking receipt token (`tv-rcpt-...`) to follow case progress privately.
2. **Threshold E2EE Evidence Lock:** The server receives only ciphertext. Neither database operators nor network sniffers can read the allegations.
3. **The Compromised Admin Test (Denial):** An administrator (`admin`) logs in with full API privileges. Navigating to the evidence, the admin attempts to decrypt it. **The attempt fails with a real cryptographic denial from the Tide network (`TIDE-TIDEJS-NET-THRESHOLD_FAILURE`)**, proving that administrative rank does not grant decryption authority.
4. **Governed Delegation (Success):** The admin or case officer delegates the case and signs a scoped `RelationshipAttestation` policy in the Tide enclave for `reviewer1`.
5. **Scoped Reviewer Access:** `reviewer1` logs in, views the assigned case, and clicks **Attempt decrypt**. Decryption succeeds immediately, revealing plaintext evidence exclusively for this assigned case.
6. **Anti-Cover-up Enforcement:** An internal case officer can only *propose* closure with detailed rationales; only the assigned independent reviewer holds the cryptographic authority to execute formal case closure.

---

## Architecture & Security Model

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              TRUSTVOICE SPA                                 │
│  ┌────────────────────────┐  ┌───────────────────┐  ┌────────────────────┐  │
│  │   Anonymous Intake &   │  │ Authenticated UI  │  │  Demo Role Switcher │  │
│  │     Receipt Tracker    │  │ (DPoP + Tide JS)  │  │  (Quick Evaluation) │  │
│  └────────────────────────┘  └───────────────────┘  └────────────────────┘  │
└───────────────────────┬──────────────────────┬──────────────────────────────┘
                        │                      │
           Plaintext    │         Ciphertext   │  Threshold E2EE
           Metadata     │         Payloads     │  Key Generation & Decryption
                        ▼                      ▼
┌────────────────────────────────┐   ┌────────────────────────────────────────┐
│     TRUSTVOICE API SERVER      │   │           TIDECLOAK & TIDE             │
│   • RFC 9449 DPoP Verification │   │          DECENTRALIZED NETWORK         │
│   • Multi-Party State Machine  │   │  • Threshold Key Management            │
│   • Anti-Cover-up Enforcement  │   │  • Enclave Policy Signing              │
│   • Scoped Delegation Grants   │   │  • RelationshipAttestation:1           │
│   • Immutable Audit Trails     │   │  • Real Cryptographic Access Denial    │
└────────────────────────────────┘   └────────────────────────────────────────┘
```

---

## Setup & Quickstart

### Prerequisites

- Node.js 20+ (with npm)
- Docker Desktop *(Optional: only needed if running local TideCloak container)*
- Modern web browser (Chrome / Edge / Firefox)

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
npm run dev      # Runs API at http://localhost:4000
```

#### Run Automated Security Tests
The backend includes **27 automated tests** validating the Anti-Cover-up protocol, role delegation, anonymous receipt tracking, cross-case access controls, and disclosure consent:

```bash
npm test         # 27 tests passing via Vitest
```

### 2. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev      # Runs SPA at http://localhost:5173
```

### 3. Immediate Evaluation Mode (No Docker Required)

For judges and evaluators wanting to inspect the complete RBAC, Anonymous Reporting, Role Delegation, and Anti-Cover-up governance workflows immediately:
- The backend defaults to `TRUSTVOICE_DEV_MODE=true`.
- The frontend features an interactive **Floating Role Switcher** (`DemoRoleSwitcher`) allowing instantaneous switching between:
  - 👤 **Anonymous Whistleblower** (Submits without login, tracks via receipt code)
  - 📝 **Reporter** (`reporter1`)
  - 🛡️ **Internal Case Officer** (`officer1`)
  - ⚖️ **Independent Reviewer** (`reviewer1`)
  - 🔑 **System Administrator** (`admin`)

### 4. Full Live TideCloak Setup (Decentralized Threshold E2EE)

To experience live browser-to-enclave cryptographic threshold decryption:

1. Launch your TideCloak container with license email configured:
   ```bash
   cd frontend
   bash scripts/bootstrap-tidecloak.windows.sh   # Or .sh on Linux/macOS
   ```
2. This bootstraps realm `trustvoice`, configures `_tide_encryptor` and `_tide_decryptor` roles, protocol mappers (`tideUserKey`, `vuid`), and exports `frontend/public/tidecloak.json`.

---

## Demo Walkthrough Guide

| Persona | Key Actions in Demo | Security Property Proven |
|---|---|---|
| **Whistleblower (Anon)** | Navigates to `/anonymous-report`, submits allegation, receives `tv-rcpt-...` | Zero-knowledge intake; no credentials leaked. |
| **Whistleblower (Track)** | Enters receipt token at `/track` to view triage status and provide follow-ups | Anonymous status tracking without session compromise. |
| **Reporter (`reporter1`)** | Submits case at `/submit` and encrypts sensitive narrative with TideJS | Browser-side Threshold E2EE; backend only stores ciphertext. |
| **Admin (`admin`)** | Logs in, visits `/evidence`, clicks **Attempt decrypt** | **Cryptographic Denial (`TIDE-TIDEJS-NET-THRESHOLD_FAILURE`)**: Admin privilege cannot decrypt data. |
| **Case Officer (`officer1`)** | Reviews case, assigns Independent Reviewer, delegates forensic role | Granular separation of duty; cannot unilaterally close case. |
| **Admin / Approver** | Enters reviewer's `tideUserKey` to sign `RelationshipAttestation:1` | Enclave policy governance delegates scoped cryptographic access. |
| **Reviewer (`reviewer1`)** | Views assigned case, clicks **Attempt decrypt** | **Cryptographic Success**: Plaintext is decrypted solely for the authorized case. |
| **Case Officer & Reviewer** | Officer proposes case closure; Reviewer approves or rejects | **Anti-Cover-up**: Resolving case requires independent counter-signature. |
