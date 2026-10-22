# TrustVoice — Project Overview & Product Handoff

**Project:** TrustVoice  
**Tagline:** Independent Oversight Without Unilateral Control  
**Core idea:** Conflict-Safe Independent Escalation  
**Challenge:** Tide UNLOCKED 2026 — Challenge 2  
**Document status:** Product-level handoff for subsequent implementation planning (not code or a verified architecture)  
**Version:** 2.1 — 2026-10-22

> **Dành cho nhóm phát triển:** Tài liệu này viết bằng tiếng Anh để dễ làm đầu vào cho coding agent. Các mục `MUST`, `SHOULD` là **yêu cầu sản phẩm mục tiêu**, chưa có nghĩa là đã được triển khai hoặc TideCloak tự hỗ trợ sẵn. Bản phân tích đầy đủ bằng tiếng Việt nằm trong `TrustVoice_Full_Concept_and_Improvements.md`.

---

## 1. Executive Summary

TrustVoice is a protected whistleblowing and independent case-review experience for situations where the organisation receiving a report may also have a conflict of interest. A person can submit sensitive evidence, request qualified independent review, and track a case without granting a single application administrator, manager or organisation unilateral authority over protected evidence or designated case decisions.

The proposed innovation is **Conflict-Safe Independent Escalation**: a case can be escalated to an eligible independent reviewer under pre-established rules, and that reviewer receives only the evidence required for that case. TrustVoice is not primarily an anonymous submission form. Its purpose is to make **cross-organisational review credible when neither side can be assumed to fully trust the other**.

**The key thesis:** *The organisation being investigated should not be the sole authority controlling the investigation.*

### One-sentence pitch

> TrustVoice enables protected whistleblowing and independent review without giving any single administrator or organisation unilateral control over sensitive evidence or governed case outcomes.

### What the demo must prove

1. An unauthorised administrator cannot successfully perform a **real protected evidence-read/decryption operation**, even when the application UI/backend is under their control in the tested threat model.
2. A properly authorised independent reviewer can access **only the evidence allowed for their case**.
3. The product explains the governance model of independent escalation, and a case outcome cannot be treated as an authoritative governed decision without its required approvals **if the outcome workflow is truly protected**.
4. The demo never misrepresents frontend checks, mock controls, or database UI statuses as cryptographic enforcement.

---

## 2. The Problem: A Trust Bottleneck, Not Just an Encryption Problem

**Primary scenario:** An employee possesses evidence that a senior manager manipulated financial reporting. The employee distrusts an internal complaint channel because the accused manager may influence the people who manage that channel. The employer also has a legitimate interest in preventing unrestricted export of its internal data. An independent reviewer cannot examine the allegation without access to sufficiently scoped evidence.

Three distinct tensions block a credible process:

- **Reporter → Organisation:** The reporter needs a remedy without granting a conflicted administrator the power to expose their identity or inspect the evidence without authorisation.
- **Organisation → Independent Reviewer:** The organisation needs independent scrutiny without opening its entire confidential data estate.
- **All parties → Case outcome:** The workflow needs a trustworthy record of assessments, disagreements and resolution, rather than allowing one conflicted stakeholder to mark the issue as closed.

A conventional system may have encryption-at-rest, RBAC and approval screens while still leaving the application operator with master keys, policy-editing rights or unilateral authority over case records. TrustVoice must demonstrate a **different authority boundary**.

---

## 3. Vision and Differentiation

### Not the product

- Not just a secure file-upload portal.
- Not just an anonymous messaging tool.
- Not a general-purpose legal case-management suite.
- Not an automated misconduct verdict engine.
- Not a claim that every insider, reviewer or compromised system becomes harmless.

### The product

**A governed independent-review workflow for sensitive reports involving a potential conflict of interest.**

It integrates three concepts:

1. **Protected Disclosure:** Sensitive report materials and any collected reporter identity are separate protected data classes.
2. **Independent Escalation:** An eligible outside reviewer can be brought into the specific case under previously established conditions and receive strictly scoped access.
3. **Governed Resolution:** Formal case outcomes follow declared authority and disagreement rules, rather than a single administrator's arbitrary preference.

**Competitive framing:** Systems such as SecureDrop already support secure, anonymous source submissions. TrustVoice focuses on **what happens after a case is received**, when independently governed access and handling matter most. This is a proposed positioning, not a claim that no other product offers similar functions.

---

## 4. Target Users and Roles

| Role | Motivation | Allowed conceptual actions | Must not implicitly control |
|---|---|---|---|
| Reporter | Submit a complaint without undue exposure | Create case, upload evidence, receive case receipt, follow status, request independent review, approve identity disclosure where applicable | Selection of arbitrary unvetted recipients for corporate data |
| Organisation Case Handler | Respond and participate in case handling | View permitted summaries, respond to case, propose decisions | Unilateral access to protected identity/evidence or unilateral governed closure |
| Independent Reviewer | Investigate impartially within assigned scope | Access authorised evidence for assigned case, record assessment | Other cases, unapproved identity, global system data |
| Governance Approvers | Enforce established access/authority rules | Review changes and governed actions according to policy | Single-party override of protected controls |
| Application Administrator | Operate and support the service | Technical administration and operational monitoring | Unilateral protected data decryption/privilege escalation |
| Respondent / Accused Party | Be treated fairly | Provide appropriate response through the case procedure | Manipulation of evidence, reviewer appointments or conclusion |

**Reviewer selection rule for the prototype:** Select from a prequalified reviewer roster governed separately from the accused manager. The accused manager must not have unilateral veto over an escalation request. This is a **product-policy assumption**, and the means of verifying genuine independence requires separate governance design.

---

## 5. Important Privacy Distinction

Do **not** conflate the following modes:

- **Anonymous report:** The platform does not collect the person's real identity; there is no stored identity that can later be decrypted and revealed.
- **Confidential / pseudonymous report:** The platform may collect identity separately and protect its disclosure. A case alias is not automatically network anonymity.

**Recommended MVP decision:** Implement the **confidential/pseudonymous** narrative because it supports an understandable consent-and-authority model. True anonymous intake is a separate future product flow unless explicitly implemented and tested.

Network metadata, file metadata, logging, time correlations and authorised-human leaks can still reveal a source. The prototype must use synthetic data and state the remaining risks.

---

## 6. Core Capabilities and Expected Behaviour

### Capability A — Protected Case Submission

**Goal:** A reporter creates a case with an account/alias, narrative and evidence without making plaintext available to arbitrary administrators.

Expected product behaviour:

- Clear notice about privacy guarantees and limits.
- Case created with an unambiguous reference and receipt.
- Report narrative, protected identity and evidence represented as separately permissioned resources where needed.
- Reporter can view permitted case status without impersonating an internal handler.
- Only approved recipients can read specific protected materials.

### Capability B — Case-Specific Independent Reviewer Access

**Goal:** Allow a qualified independent reviewer to perform an authorised review without exposing unrelated data.

Expected product behaviour:

- Each case has a distinct review workspace or context.
- A reporter or eligible participant can request independent escalation for a case.
- Reviewer eligibility and conflict checks follow an agreed pre-established rule, not arbitrary invitation by a conflicted administrator.
- A reviewer assigned to Case A can view only the authorised documents in Case A.
- Reviewer A's access must not imply access to Case B or reporter identity.

### Capability C — Governed Case Outcome

**Goal:** An organisation administrator cannot make a protected case outcome authoritative merely by changing an application flag.

Expected product behaviour:

- Reviewer assessments and organisation responses are distinguishable.
- Formal resolution requires the agreed decision authority and any relevant approvals.
- Disagreement moves to `Disputed`/`Escalated`; a party refusing approval must not silently erase the case or force a false resolution.
- A protected decision should be independently identifiable from an ordinary draft/status field.

**Critical implementation caveat:** TideCloak's governed access to cryptographic actions does **not automatically** make a generic database `closed=true` column tamper-proof. This capability may be claimed in the demo only after the relevant authoritative outcome action has an effective protected enforcement boundary. Otherwise mark it as a planned next phase.

### Capability D — Progressive Disclosure (Secondary)

Early case intake may hide unnecessary identifying details and later authorise specific fields as required. Blind review cannot promise impartiality by itself: a case narrative may implicitly reveal names, roles or timestamps. This is a **secondary feature**, not the core proof of TideCloak's value.

---

## 7. Product Journey and Case Lifecycle

### Main journey

1. Reporter opens TrustVoice, reviews privacy limitations, submits a **synthetic** misconduct report.
2. Reporter receives a case reference and can check permitted status.
3. Case handler receives a scoped notification, not blanket access to identity and evidence.
4. Reporter requests independent review due to a documented conflict of interest.
5. An eligible reviewer is assigned according to the established governance policy.
6. The reviewer accesses the specific authorised evidence and files an assessment.
7. Organisational participants may provide an authorised response.
8. A governed conclusion is recorded if conditions are satisfied; otherwise the case is explicitly disputed or escalated.

### Proposed status model (business concept only)

`Submitted → Under Initial Review → Independent Review Requested → Independent Review Active → Assessment Filed → (Resolved | Disputed | Escalated)`

Do not confuse UI labels with cryptographically protected outcomes.

### Important negative journey

- A compromised app administrator attempts to decrypt protected evidence: **denied at the protected operation**.
- The administrator attempts to grant themselves a privilege: protected governance must require appropriate approvals in the configured environment.
- The administrator tries to finalise the case: denied **only if** the formal outcome mechanism is actually protected; otherwise the demo must not claim this property.
- A reviewer attempts to access evidence belonging to another case: denied.

---

## 8. Authority and Consent Policy at the Product Level

The following are intended **rules to be designed and tested**, not SDK instructions.

| Operation | Proposed authority constraint |
|---|---|
| Submit case | The reporter may submit under the intake policy |
| Read protected evidence | Requesting principal + case/resource scope + required permissions/approval |
| Read reporter identity | Explicit reporter consent and appropriately authorised recipient for MVP |
| Escalate to independent review | Qualifying conflict/request and reviewer selection policy; no accused-manager unilateral veto |
| Change sensitive access rules | Governed policy or administrative quorum rather than one admin override |
| Record reviewer assessment | Assigned eligible reviewer, limited to their case |
| Finalise official governed outcome | Required participants/authority as declared in outcome policy |
| Handle disagreement | Preserve dissent and move to Disputed/Escalated; no forced false agreement |

**Avoid the single `isAdmin` shortcut.** Operations must be separated by identity, evidence resource, review scope and outcome authority.

---

## 9. Why TideCloak Is Material

TideCloak is the part of this concept that should move sensitive authority outside the unilateral control of the application operator.

Official Tide concepts relevant to the later architecture include **Emergent Authority**, **Quorum-Enforced Governance**, **Hermetic E2EE**, and **programmable policy enforcement through Forseti**. Their exact use, available integration paths, release-specific configuration and ability to govern a given TrustVoice operation must be **verified during technical design**.

| Question | Ordinary application-controlled approach | Desired TideCloak-backed result |
|---|---|---|
| Who can read sensitive evidence? | Anyone who can abuse backend credentials or centrally held decryption power may be able to bypass checks | Access depends on protected, distributed authority and valid policy |
| Can one admin change privileges? | A sufficiently privileged admin may change role/ACL rules | Governed changes require configured approvals/quorum |
| Can the reviewer access everything? | A badly scoped API/role can expose the full repository | Reviewer capability is limited to specific case/evidence scope |
| Can an admin force case closure? | Database fields may be freely modified by privileged operators | **Only if** the case-outcome mechanism is independently governed and validated—not automatically from TideCloak login |

**Non-negotiable demonstration principle:** Show a genuine protected denial/success pair and explain its enforcement boundary. A hidden button, backend route returning 403, or simulated popup alone is not sufficient proof of the TideCloak trust claim.

---

## 10. Threat Model and Honest Limits

### Primary protected assets

Protected evidence, confidential reporter identity, scoped document access, sensitive role/policy changes and — if separately designed — authoritative case outcomes.

### Threat actors considered

A compromised app admin; a conflicted senior manager; an overprivileged reviewer; a compromised backend/storage service; and parties attempting to collude to satisfy approval thresholds.

### Out of security guarantee

- **Availability:** An administrator may disable services or erase storage; backups and independent retention need additional design.
- **Metadata anonymity:** IP addresses, timing or document metadata can reveal a reporter unless separately mitigated.
- **Authorised recipient exfiltration:** A reviewer who legitimately sees plaintext may photograph/copy it.
- **Human impartiality:** Code cannot establish that a reviewer is unbiased.
- **Legal correctness:** A platform case result is not a court judgment.
- **Quorum collusion:** Sufficiently many colluding authorised parties can defeat a threshold-governed condition under its threat model.

Treat both whistleblower and accused parties fairly: limit unnecessary disclosure, avoid automatically declaring guilt and enable appropriate response.

---

## 11. Prototype Scope and Priorities

### P0 — Must-have for an honest compelling demo

- Synthetic misconduct case and protected evidence.
- Reporter submission with case receipt.
- A clearly demonstrated unauthorised admin access attempt that **fails through the real protected action**.
- An authorised independent reviewer access attempt that **succeeds only for assigned evidence**.
- Case-level escalation narrative and role-specific user views.
- Short, clear explanation of the TideCloak difference.

### P1 — Add only if P0 works end-to-end

- Governed official case outcome with a verifiable policy-bound action.
- An explicit `Disputed/Escalated` decision flow to avoid deadlock.
- Protected reporter identity disclosure consent.
- Basic access/action history and an intelligible receipt.

### Out of Scope

AI-based verdicts or evidence summarisation; live legal integrations; real whistleblower submissions; full anonymity guarantees; production-grade anti-deletion/DoS; comprehensive legal compliance; multi-domain complaint management.

**Fallback if governed outcome is not ready:** Demonstrate protected evidence access and case-specific delegation as the novel capability, and explicitly identify governed case closure as a future extension. Do not claim a capability you cannot test.

---

## 12. Product Acceptance Scenarios

| Test | Actor and action | Required observable behaviour |
|---|---|---|
| T01 | Reporter submits example case | Receives a case receipt/reference |
| T02 | Unauthorised administrator requests protected evidence | Actual protected read/decrypt denied |
| T03 | Admin modifies client UI or calls API directly | Protected plaintext remains inaccessible in the tested setup |
| T04 | Qualified reviewer assigned to Case A accesses approved Case A document | Access succeeds |
| T05 | Same reviewer requests Case B data | Protected access denied |
| T06 | Reviewer tries to see reporter identity without required consent/authority | Denied |
| T07 | Admin attempts privilege escalation via a sensitive policy change | Cannot take effect unilaterally when governed by quorum |
| T08 | Reviewer submits an assessment | Case displays the authorised assessment to appropriate participants |
| T09 | Participants disagree | `Disputed` or `Escalated` is shown rather than a fabricated settlement |
| T10 | Admin tries official unilateral closure | Denied **only when** official closure is protected by effective policy |
| T11 | Demo data review | No real names, private allegations or actual confidential files |
| T12 | Demo integrity review | Every security claim shown has evidence beyond a UI-only check |

These scenarios are a bridge to a future technical test plan. They are not yet executed tests.

---

## 13. Two-Minute Demo Storyboard

**Title:** The Compromised Admin

| Timing | Narrative | Evidence |
|---|---|---|
| 0–20s | An employee reports a senior-manager misconduct case | Submit + receipt |
| 20–45s | A conflicted admin attempts to open protected evidence | Genuine TideCloak-mediated denial |
| 45–80s | Eligible independent reviewer receives case-specific access | Genuine protected read succeeds for a narrowly defined resource |
| 80–105s | Admin attempts to claim case is closed without due authority | **Only if** protected outcome is operational; otherwise use a governance explainer rather than a false security claim |
| 105–120s | Reporter sees the independent-review status and value | Outcome/status + takeaway |

**Last line:** *The platform can be administered, but the administrator cannot unilaterally become the authority to decrypt protected evidence.*

---

## 14. Screen Inventory (Product Intent, Not UI Specification)

1. `Trust & Limitations` — plain-language explanation of rights and what is not guaranteed.
2. `New Report` — synthetic case intake, protected evidence and optional confidential identity.
3. `My Case` — receipt, current status, request escalation, limited history.
4. `Organisation Cases` — permitted case summaries and responses.
5. `Independent Review Room` — assigned cases, scoped evidence, assessment.
6. `Governance Actions` — what approval is required for sensitive operations.
7. `Demo Persona Switcher` — controlled Reporter/Admin/Reviewer journey without suggesting impersonation security in production.

---

## 15. The Five Judging Criteria as Design Checks

| Criterion | Key question | Primary proof |
|---|---|---|
| Vision & Originality — 25% | Is the product more than encrypted anonymous intake? | Conflict-safe independent review, not another complaint inbox |
| Trust Constraint Insight — 20% | What specific authority is unsafe? | Conflicted internal administrator controlling evidence/review authority |
| Value & Impact — 20% | Who benefits, and how? | Reporter protection + constrained organisational sharing + independent review + fairness to respondent |
| Why TideCloak Matters — 20% | What does TideCloak credibly change? | Genuine protected operation resistant to unilateral app-admin override |
| Prototype & Storytelling — 15% | Can judges understand it in 2 minutes? | Compromised admin denial followed by qualified reviewer success |

---

## 16. Open Decisions That Must Not Be Invented by a Coding Agent

The following choices are **proposed defaults, not silent permissions to make high-impact policy decisions**:

| Decision | Proposed default for hackathon | Needs further confirmation? |
|---|---|---|
| Initial user domain | Corporate misconduct reporting | Product team can confirm |
| Reporter mode | Confidential/pseudonymous | Yes — this affects the identity model |
| Reviewer governance | Prequalified reviewer roster independent of accused manager | Yes — requires a realistic governance owner |
| Identity disclosure | Reporter consent + authorised recipient | Yes — define exact consent rules and exceptions |
| Case outcome policy | Distinguish reviewer assessment from formal final resolution; preserve disagreement | Yes — determine legitimate approval participants |
| Retention and deletion | Separate from crypto access; no anti-deletion claim in MVP | Yes before real-world use |
| Data used | Entirely synthetic | No — fixed for prototype |
| AI integration | Excluded from MVP | No — fixed for prototype |
| First protected demo action | Evidence access/decryption | Yes — confirm supported TideCloak flow |

**Do not select a storage layer, cryptography scheme, policy language, approval threshold, SDK surface, authentication flow or software architecture from this product overview alone.** Those belong to the next verified technical design phase.

---

## 17. Definition of Ready for Technical Design

The concept is ready to transition to architecture when the team can answer:

1. Who is allowed to nominate an independent reviewer and what prevents conflicted unilateral appointments?
2. What is the exact reporter identity consent rule in the MVP?
3. Which user action will be proved as a TideCloak-enforced, not server-enforced, operation?
4. Which official decisions require what authority, and what happens on disagreement?
5. Which security claims will **not** be made because metadata, availability or authorised-recipient behaviour are outside the MVP?

Once these answers are documented, technical design can specify resource boundaries, policy enforcement, architecture, SDK integration and test execution without changing the product promise by accident.

---

## 18. Deliverables & References

**Companion files:**

- `TrustVoice_Full_Concept_and_Improvements.md` — full Vietnamese rationale, critique, improvements, policy proposals and risks.
- `TrustVoice_README_Overview_300words.md` — challenge-ready concise description, separate from setup instructions.

**Official/background sources:**

- Challenge: https://tide.org/unlocked/
- TideCloak Core Concepts: https://docs.tide.org/Core-Concepts/core-concepts
- Quorum-Enforced Governance: https://docs.tide.org/Core-Concepts/iga-workflow
- Forseti: https://docs.tide.org/Core-Concepts/forseti-engine
- E2EE setup: https://docs.tide.org/Admin/e2ee
- SecureDrop overview: https://securedrop.org/overview/

**Truthfulness statement:** This is a product proposal, not a verified working system. It deliberately separates **desired security properties** from **features demonstrated in a functioning TideCloak integration**.
