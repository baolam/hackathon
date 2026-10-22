import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

const app = createApp();

function as(subject: string, role: string) {
  return { "x-dev-subject": subject, "x-dev-role": role };
}

const REPORTER = as("reporter-1", "reporter");
const OFFICER = as("officer-1", "case-officer");
const REVIEWER_A = as("reviewer-a", "independent-reviewer");
const REVIEWER_B = as("reviewer-b", "independent-reviewer");
const ADMIN = as("admin-1", "admin");

describe("TrustVoice anti-cover-up protocol (end-to-end, dev-mode auth bypass)", () => {
  let caseId: string;

  it("reporter can create a report", async () => {
    const res = await request(app)
      .post("/api/cases")
      .set(REPORTER)
      .send({
        category: "financial-misconduct",
        summary: "Manager inflating vendor invoices",
        description: "Detailed account of suspected procurement fraud.",
        severity: "high",
      });
    expect(res.status).toBe(201);
    caseId = res.body.id;
    expect(res.body.status).toBe("SUBMITTED");
  });

  it("a case officer cannot be impersonated by a reviewer role (role check on claim)", async () => {
    const res = await request(app).post(`/api/cases/${caseId}/claim`).set(REVIEWER_A);
    expect(res.status).toBe(403);
  });

  it("case officer claims the case", async () => {
    const res = await request(app).post(`/api/cases/${caseId}/claim`).set(OFFICER);
    expect(res.status).toBe(200);
    expect(res.body.assignedCaseOfficerId).toBe("officer-1");
  });

  it("admin cannot directly set status to CLOSED via the generic transition endpoint", async () => {
    const res = await request(app)
      .post(`/api/cases/${caseId}/transition`)
      .set(ADMIN)
      .send({ to: "CLOSED" });
    expect(res.status).toBe(403);
  });

  it("officer moves the case through triage into review", async () => {
    let res = await request(app)
      .post(`/api/cases/${caseId}/transition`)
      .set(OFFICER)
      .send({ to: "TRIAGE" });
    expect(res.status).toBe(200);
    res = await request(app)
      .post(`/api/cases/${caseId}/transition`)
      .set(OFFICER)
      .send({ to: "UNDER_REVIEW" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("UNDER_REVIEW");
  });

  it("Anti-Cover-up Protocol: closure is denied when no independent reviewer is assigned", async () => {
    const res = await request(app)
      .post(`/api/cases/${caseId}/closure-request`)
      .set(OFFICER)
      .send({ reason: "Investigation complete, reporter unresponsive" });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/Closure denied/);
  });

  it("officer assigns an independent reviewer", async () => {
    const res = await request(app)
      .post(`/api/cases/${caseId}/assign-reviewer`)
      .set(OFFICER)
      .send({ reviewerSubject: "reviewer-a" });
    expect(res.status).toBe(201);
  });

  it("an unrelated reviewer cannot see the case (cross-case access denial)", async () => {
    const res = await request(app).get(`/api/cases/${caseId}`).set(REVIEWER_B);
    expect(res.status).toBe(404);
  });

  it("the assigned reviewer can see the case", async () => {
    const res = await request(app).get(`/api/cases/${caseId}`).set(REVIEWER_A);
    expect(res.status).toBe(200);
  });

  it("officer proposes closure now that a reviewer is active", async () => {
    const res = await request(app)
      .post(`/api/cases/${caseId}/closure-request`)
      .set(OFFICER)
      .send({ reason: "Investigation complete" });
    expect(res.status).toBe(201);
  });

  it("admin cannot decide the closure (role-gated to independent-reviewer only)", async () => {
    const res = await request(app)
      .post(`/api/cases/${caseId}/closure-decision`)
      .set(ADMIN)
      .send({ decision: "APPROVE" });
    expect(res.status).toBe(403);
  });

  it("the wrong reviewer cannot decide the closure", async () => {
    const res = await request(app)
      .post(`/api/cases/${caseId}/closure-decision`)
      .set(REVIEWER_B)
      .send({ decision: "APPROVE" });
    expect([403, 404]).toContain(res.status);
  });

  it("the officer who proposed closure cannot also approve it", async () => {
    const res = await request(app)
      .post(`/api/cases/${caseId}/closure-decision`)
      .set(OFFICER)
      .send({ decision: "APPROVE" });
    expect(res.status).toBe(403); // requireRole('independent-reviewer') rejects the officer outright
  });

  it("the assigned reviewer rejects closure, case returns to UNDER_REVIEW", async () => {
    const res = await request(app)
      .post(`/api/cases/${caseId}/closure-decision`)
      .set(REVIEWER_A)
      .send({ decision: "REJECT", reason: "Needs more evidence" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("UNDER_REVIEW");
  });

  it("officer proposes closure again and the assigned reviewer approves it", async () => {
    let res = await request(app)
      .post(`/api/cases/${caseId}/closure-request`)
      .set(OFFICER)
      .send({ reason: "Second review complete" });
    expect(res.status).toBe(201);

    res = await request(app)
      .post(`/api/cases/${caseId}/closure-decision`)
      .set(REVIEWER_A)
      .send({ decision: "APPROVE" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("CLOSED");
  });

  it("a revoked assignment can no longer approve a future closure request", async () => {
    // Re-open the scenario with a fresh case to test revocation in isolation.
    const created = await request(app).post("/api/cases").set(REPORTER).send({
      category: "financial-misconduct",
      summary: "Second case",
      description: "Another report",
      severity: "medium",
    });
    const id2 = created.body.id;
    await request(app).post(`/api/cases/${id2}/claim`).set(OFFICER);
    await request(app).post(`/api/cases/${id2}/transition`).set(OFFICER).send({ to: "TRIAGE" });
    await request(app).post(`/api/cases/${id2}/transition`).set(OFFICER).send({ to: "UNDER_REVIEW" });
    const assign = await request(app)
      .post(`/api/cases/${id2}/assign-reviewer`)
      .set(OFFICER)
      .send({ reviewerSubject: "reviewer-a" });
    const assignmentId = assign.body.assignmentId;

    await request(app)
      .post(`/api/cases/${id2}/closure-request`)
      .set(OFFICER)
      .send({ reason: "done" });

    await request(app).post(`/api/cases/${id2}/revoke-assignment/${assignmentId}`).set(OFFICER);

    const res = await request(app)
      .post(`/api/cases/${id2}/closure-decision`)
      .set(REVIEWER_A)
      .send({ decision: "APPROVE" });
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Closure denied/);
  });

  it("identity disclosure requires the reporter's own consent", async () => {
    const dr = await request(app)
      .post(`/api/cases/${caseId}/disclosure-requests`)
      .set(OFFICER)
      .send({ justification: "Need to verify employment dates" });
    expect(dr.status).toBe(201);
    const requestId = dr.body.requestId;

    const deniedAttempt = await request(app)
      .post(`/api/cases/${caseId}/disclosure-requests/${requestId}/decision`)
      .set(OFFICER) // officer trying to approve their own request — must fail
      .send({ approve: true });
    expect(deniedAttempt.status).toBe(403);

    const approved = await request(app)
      .post(`/api/cases/${caseId}/disclosure-requests/${requestId}/decision`)
      .set(REPORTER)
      .send({ approve: true });
    expect(approved.status).toBe(200);
    expect(approved.body.status).toBe("APPROVED");
  });

  it("case events record the closure decisions for audit", async () => {
    const res = await request(app).get(`/api/cases/${caseId}/events`).set(OFFICER);
    expect(res.status).toBe(200);
    const actions = res.body.map((e: { action: string }) => e.action);
    expect(actions).toContain("CLOSURE_APPROVED");
    expect(actions).toContain("CLOSURE_REJECTED");
  });

  it("an unrelated reviewer cannot read the case's event history", async () => {
    const res = await request(app).get(`/api/cases/${caseId}/events`).set(REVIEWER_B);
    expect(res.status).toBe(404);
  });
});
