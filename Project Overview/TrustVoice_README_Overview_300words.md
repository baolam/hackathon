[![Built with TideCloak](https://tide.org/badges/built-with-tidecloak.svg)](https://tide.org/tidecloak?utm_source=github&utm_medium=readme&utm_campaign=unlocked)

## Project overview

TrustVoice enables protected whistleblowing and independent case review without giving any single administrator or organisation unilateral control over sensitive evidence or governed decisions.

Built with [TideCloak](https://tide.org/tidecloak?utm_source=github&utm_medium=readme&utm_campaign=unlocked).

### 1. Vision & originality

Most whistleblowing tools only protect submissions. **TrustVoice focuses on what happens next:** investigating an organisation that may be conflicted. Its innovation, **Conflict-Safe Independent Escalation**, lets outside reviewers assess case-specific evidence without exposing broader corporate files.

### 2. Trust constraint insight

Three tensions create an impasse:
- Reporters fear retaliation from conflicted managers.
- Organisations fear exposing confidential files to outsiders.
- Traditional architectures leave administrators with master keys and unilateral override power.

**The bottleneck is unilateral power, not weak encryption.** Removing it enables credible oversight across untrusted boundaries.

### 3. Value & impact

- **Whistleblowers:** Sovereign consent over identity disclosure; retaliation protection.
- **Reviewers:** Cryptographically scoped access solely to assigned case evidence.
- **Boards & Regulators:** Verifiable anti-cover-up compliance (SOX, EU Directive).

*Example:* An employee reports kickbacks; IT cannot inspect evidence, and only an independent ombudsman can approve case closure.

### 4. Why TideCloak matters

TideCloak moves authority outside the application server:
- **Threshold E2EE (`RelationshipAttestation:1`):** In-browser evidence encryption; decryption requires both a realm role and an enclave-signed policy.
- **Cryptographic Denial:** A rogue admin attempting decryption receives a genuine threshold failure (`TIDE-TIDEJS-NET-THRESHOLD_FAILURE`), not an application 403.
- **RFC 9449 DPoP:** Sender-constrained tokens prevent replay attacks.

### 5. Prototype & storytelling

The prototype demonstrates **"The Compromised Admin"** narrative:
1. **Intake:** Reporter encrypts evidence (or submits anonymously with tracking code).
2. **Denial:** Admin attempts decryption; Tide network cryptographically rejects it.
3. **Delegation:** Admin signs an enclave policy delegating the case to an ombudsman.
4. **Decryption:** The ombudsman decrypts authorized evidence.
5. **Anti-Cover-up:** Officer proposes closure; only the ombudsman can execute it.
