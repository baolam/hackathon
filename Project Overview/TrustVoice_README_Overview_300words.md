# TrustVoice — Independent Oversight Without Unilateral Control

**One-sentence description:** TrustVoice enables protected whistleblowing and independent case review without giving any single administrator or organisation unilateral control over sensitive evidence or governed case decisions.

## 1. Vision & Originality (25%)

Most whistleblowing platforms only encrypt initial submissions. **TrustVoice solves what happens next:** conducting a credible investigation when the organisation itself has an inherent conflict of interest. Its innovation is **Conflict-Safe Independent Escalation**: enabling qualified external reviewers to assess case-specific evidence under pre-established governance rules without taking unrestricted custody of the organisation's broader confidential files.

## 2. Trust Constraint Insight (20%)

Reporters fear retaliation from conflicted insiders. Organisations fear disclosing confidential data to outsiders. Traditional architectures rely on central DBAs or `isAdmin` application checks who hold unilateral override power. **The bottleneck is unilateral administrative power, not weak encryption.** If an insider can alter rows or mark allegations resolved, trust fails.

## 3. Value & Impact (20%)

TrustVoice provides employees with sovereign identity disclosure consent, independent reviewers with cryptographically scoped access, and enterprise boards with provable anti-cover-up compliance (SOX, EU Directive). It also protects accused individuals against kangaroo courts through pseudonymous intake and immutable audit trails.

## 4. Why TideCloak Matters (20%)

TideCloak shifts authority from application servers to a decentralized threshold network:
- **Threshold E2EE (`RelationshipAttestation:1`):** In-browser evidence encryption; decryption requires both role and enclave-signed policy.
- **Cryptographic Denial:** A compromised admin attempting decryption receives a genuine threshold failure (`TIDE-TIDEJS-NET-THRESHOLD_FAILURE`) from the Tide network, not a bypassable backend 403.
- **RFC 9449 DPoP:** Cryptographically binds tokens to browser keys, preventing token theft and replay attacks.

## 5. Prototype & Storytelling (15%)

The live prototype demonstrates:
1. **Protected intake:** Authenticated E2EE reporting and anonymous receipt tracking (`tv-rcpt-...`).
2. **The Compromised Admin denial:** Real cryptographic rejection.
3. **Enclave delegation:** Signed policy grants to independent ombudsman.
4. **Scoped decryption:** Authorised case evidence rendered in-browser.
5. **Anti-Cover-up enforcement:** Case closure strictly requires independent reviewer counter-signature.
