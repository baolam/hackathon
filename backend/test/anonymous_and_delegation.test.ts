import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

const app = createApp();

function as(subject: string, role: string) {
  return { "x-dev-subject": subject, "x-dev-role": role };
}

const OFFICER = as("officer-1", "case-officer");
const ADMIN = as("admin-1", "admin");
const REVIEWER_A = as("reviewer-a", "independent-reviewer");

describe("Anonymous Reporting & Personnel Delegation", () => {
  let accessKey: string;
  let pin: string;
  let caseId: string;

  it("can fetch the prequalified roster of officers and reviewers without authentication", async () => {
    const res = await request(app).get("/api/cases/roster/personnel");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
    expect(res.body[0]).toHaveProperty("organization");
  });

  it("can submit an anonymous report without authentication and receives receipt", async () => {
    const res = await request(app)
      .post("/api/cases/anonymous")
      .send({
        category: "procurement-fraud",
        summary: "Anonymous Report: Bid rigging in procurement tender",
        description: "Discovered unauthorized sole-sourcing at southern branch.",
        severity: "critical",
        evidenceText: "Audio transcript and memo dated October 15th.",
      });

    expect(res.status).toBe(201);
    expect(res.body.case).toBeDefined();
    expect(res.body.case.isAnonymous).toBe(true);
    expect(res.body.receipt).toBeDefined();
    expect(res.body.receipt.accessKey).toMatch(/^TV-ANON-/);
    expect(res.body.receipt.pin).toMatch(/^\d{6}$/);

    accessKey = res.body.receipt.accessKey;
    pin = res.body.receipt.pin;
    caseId = res.body.case.id;
  });

  it("denies tracking when wrong PIN is provided", async () => {
    const res = await request(app)
      .post("/api/cases/anonymous/track")
      .send({ accessKey, pin: "000000" });
    expect(res.status).toBe(401);
  });

  it("allows tracking with valid accessKey and PIN", async () => {
    const res = await request(app)
      .post("/api/cases/anonymous/track")
      .send({ accessKey, pin });
    expect(res.status).toBe(200);
    expect(res.body.case.id).toBe(caseId);
    expect(res.body.case.status).toBe("SUBMITTED");
    expect(res.body.evidenceCount).toBe(1);
  });

  it("allows anonymous reporter to append supplementary evidence", async () => {
    const res = await request(app)
      .post("/api/cases/anonymous/append")
      .send({
        accessKey,
        pin,
        statement: "Supplementary bank accounts list receiving illegal kickbacks",
        filename: "supplement-bank-accounts.txt",
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify evidence count increased
    const trackRes = await request(app)
      .post("/api/cases/anonymous/track")
      .send({ accessKey, pin });
    expect(trackRes.body.evidenceCount).toBe(2);
  });

  it("admin can assign a specific case officer from the roster", async () => {
    const res = await request(app)
      .post(`/api/cases/${caseId}/assign-officer`)
      .set(ADMIN)
      .send({
        officerSubject: "officer-1",
        officerName: "Tran Tuan Anh (Internal Inspection & Legal Affairs)",
      });
    expect(res.status).toBe(200);
    expect(res.body.assignedCaseOfficerId).toBe("officer-1");
    expect(res.body.assignedCaseOfficerName).toContain("Tran Tuan Anh");
  });

  it("officer can assign an independent reviewer from the roster", async () => {
    const res = await request(app)
      .post(`/api/cases/${caseId}/assign-reviewer`)
      .set(OFFICER)
      .send({
        reviewerSubject: "reviewer-a",
        reviewerName: "Dr. Do Hoàng Long (Independent Bar Association)",
      });
    expect(res.status).toBe(201);
    expect(res.body.case.assignedReviewerId).toBe("reviewer-a");
    expect(res.body.case.assignedReviewerName).toContain("Do Hoàng Long");
  });

  it("assigned reviewer can view the case details", async () => {
    const res = await request(app).get(`/api/cases/${caseId}`).set(REVIEWER_A);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(caseId);
    expect(res.body.isAnonymous).toBe(true);
  });
});
