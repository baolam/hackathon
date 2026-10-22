import { useEffect, useState } from "react";

export interface DemoIdentity {
  role: "reporter" | "case-officer" | "independent-reviewer" | "admin";
  subject: string;
  /** Short tag shown on the switcher button — must stay unique within a role so two
      personas of the same role (e.g. two case officers) are distinguishable at a glance. */
  tag: string;
  /** Plain display name, shown in the sidebar and in the "Acting as" banner. */
  name: string;
  label: string;
  description: string;
}

export const DEMO_IDENTITIES: DemoIdentity[] = [
  {
    role: "reporter",
    subject: "reporter-1",
    tag: "Reporter A",
    name: "Nguyen Van A (Reporter A)",
    label: "🕵️ Reporter A",
    description: "Whistleblower reporting procurement fraud; holds exclusive identity disclosure consent for their own case",
  },
  {
    role: "reporter",
    subject: "reporter-2",
    tag: "Reporter B",
    name: "Tran Thi B (Reporter B)",
    label: "🕵️ Reporter B",
    description: "A second, unrelated whistleblower — use to verify reporters can never see each other's cases",
  },
  {
    role: "case-officer",
    subject: "officer-1",
    tag: "Officer: Anh",
    name: "Tran Tuan Anh",
    label: "👔 Case Officer — Tran Tuan Anh",
    description: "Internal Inspection & Legal Affairs: receives, coordinates, and investigates reports",
  },
  {
    role: "case-officer",
    subject: "officer-2",
    tag: "Officer: Mai",
    name: "Nguyen Thi Mai",
    label: "👔 Case Officer — Nguyen Thi Mai",
    description: "Compliance & Audit Department: a second case officer, for testing per-officer claim and assignment visibility",
  },
  {
    role: "independent-reviewer",
    // Must match the "reviewer-a" roster entry's id in backend/src/store.ts (the real reviewer1
    // subject), not a placeholder — otherwise a case assigned via the roster dropdown never
    // matches this demo identity and silently disappears from the reviewer's case list.
    subject: "3058d433-f886-4b99-a110-601ca8f73763",
    tag: "Reviewer: Long",
    name: "Dr. Do Hoang Long",
    label: "⚖️ Independent Reviewer — Dr. Do Hoang Long",
    description: "Independent Bar Association & Integrity Oversight: decrypts E2EE evidence and approves case conclusions",
  },
  {
    role: "independent-reviewer",
    subject: "reviewer-b",
    tag: "Reviewer: Elena",
    name: "Elena Vu",
    label: "⚖️ Independent Reviewer — Elena Vu",
    description: "Financial Transparency Initiative: a second independent reviewer, for testing cross-case denial between reviewers",
  },
  {
    role: "admin",
    subject: "admin-1",
    tag: "Admin",
    name: "System Administrator",
    label: "🛡️ Administrator (Admin)",
    description: "System admin: assigns personnel, signs enclaves, CANNOT decrypt secret evidence",
  },
];

const DEFAULT_IDENTITY = DEMO_IDENTITIES[DEMO_IDENTITIES.length - 1]; // admin-1

export function DemoRoleSwitcher() {
  const [currentSubject, setCurrentSubject] = useState<string>(() => {
    return localStorage.getItem("trustvoice_demo_subject") || DEFAULT_IDENTITY.subject;
  });

  useEffect(() => {
    const saved = localStorage.getItem("trustvoice_demo_subject");
    if (!saved) {
      localStorage.setItem("trustvoice_demo_role", DEFAULT_IDENTITY.role);
      localStorage.setItem("trustvoice_demo_subject", DEFAULT_IDENTITY.subject);
      localStorage.setItem("trustvoice_demo_label", DEFAULT_IDENTITY.name);
    }
  }, []);

  function switchRole(item: DemoIdentity) {
    localStorage.setItem("trustvoice_demo_role", item.role);
    localStorage.setItem("trustvoice_demo_subject", item.subject);
    localStorage.setItem("trustvoice_demo_label", item.name);
    setCurrentSubject(item.subject);
    // Reload or dispatch event so useAppRoles and useApi pick it up immediately
    window.location.reload();
  }

  const activeIdentity = DEMO_IDENTITIES.find((i) => i.subject === currentSubject) || DEFAULT_IDENTITY;

  const roleGroups: { role: DemoIdentity["role"]; items: DemoIdentity[] }[] = [
    { role: "reporter", items: DEMO_IDENTITIES.filter((i) => i.role === "reporter") },
    { role: "case-officer", items: DEMO_IDENTITIES.filter((i) => i.role === "case-officer") },
    { role: "independent-reviewer", items: DEMO_IDENTITIES.filter((i) => i.role === "independent-reviewer") },
    { role: "admin", items: DEMO_IDENTITIES.filter((i) => i.role === "admin") },
  ];

  return (
    <div
      style={{
        background: "var(--gold-wash)",
        borderBottom: "1px solid var(--gold)",
        padding: "8px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 8,
        fontSize: "0.82rem",
        zIndex: 1000,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span
          style={{
            background: "var(--gold)",
            color: "var(--paper-raised)",
            padding: "2px 6px",
            borderRadius: 4,
            fontWeight: "bold",
            fontSize: "0.75rem",
          }}
        >
          Demo switcher
        </span>
        <span style={{ color: "var(--ink-dim)" }}>
          Acting as: <strong style={{ color: "var(--ink)" }}>{activeIdentity.label}</strong> ({activeIdentity.description})
        </span>
      </div>

      <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
        {roleGroups.map((group) => (
          <div key={group.role} style={{ display: "flex", gap: 4, alignItems: "center" }}>
            {group.items.map((item) => (
              <button
                key={item.subject}
                onClick={() => switchRole(item)}
                title={item.description}
                style={{
                  padding: "4px 8px",
                  fontSize: "0.78rem",
                  background: currentSubject === item.subject ? "var(--gold)" : "var(--paper-raised)",
                  color: currentSubject === item.subject ? "var(--paper-raised)" : "var(--ink-dim)",
                  border: "1px solid " + (currentSubject === item.subject ? "var(--gold)" : "var(--line-strong)"),
                  borderRadius: 4,
                  cursor: "pointer",
                }}
              >
                {item.label.split(" ")[0]} {item.tag}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
