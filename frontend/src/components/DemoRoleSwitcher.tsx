import { useEffect, useState } from "react";

export interface DemoIdentity {
  role: "reporter" | "case-officer" | "independent-reviewer" | "admin";
  subject: string;
  label: string;
  description: string;
}

export const DEMO_IDENTITIES: DemoIdentity[] = [
  {
    role: "reporter",
    subject: "reporter-1",
    label: "🕵️ Reporter",
    description: "Whistleblower reporting misconduct; holds exclusive identity disclosure consent",
  },
  {
    role: "case-officer",
    subject: "officer-1",
    label: "👔 Case Officer",
    description: "Tran Tuan Anh - Internal Inspection: receives, coordinates, and investigates reports",
  },
  {
    role: "independent-reviewer",
    subject: "reviewer-a",
    label: "⚖️ Independent Reviewer",
    description: "Dr. Do Hoang Long - Bar Association: decrypts E2EE evidence and approves case conclusions",
  },
  {
    role: "admin",
    subject: "admin-1",
    label: "🛡️ Administrator (Admin)",
    description: "System admin: assigns personnel, signs enclaves, CANNOT decrypt secret evidence",
  },
];

export function DemoRoleSwitcher() {
  const [currentRole, setCurrentRole] = useState<string>(() => {
    return localStorage.getItem("trustvoice_demo_role") || "admin";
  });

  useEffect(() => {
    const saved = localStorage.getItem("trustvoice_demo_role");
    if (!saved) {
      localStorage.setItem("trustvoice_demo_role", "admin");
      localStorage.setItem("trustvoice_demo_subject", "admin-1");
    }
  }, []);

  function switchRole(item: DemoIdentity) {
    localStorage.setItem("trustvoice_demo_role", item.role);
    localStorage.setItem("trustvoice_demo_subject", item.subject);
    setCurrentRole(item.role);
    // Reload or dispatch event so useAppRoles and useApi pick it up immediately
    window.location.reload();
  }

  const activeIdentity = DEMO_IDENTITIES.find((i) => i.role === currentRole) || DEMO_IDENTITIES[3];

  return (
    <div
      style={{
        background: "linear-gradient(90deg, #1e293b 0%, #0f172a 100%)",
        borderBottom: "1px solid #334155",
        padding: "8px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        fontSize: "0.82rem",
        zIndex: 1000,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span
          style={{
            background: "#3b82f6",
            color: "#fff",
            padding: "2px 6px",
            borderRadius: 4,
            fontWeight: "bold",
            fontSize: "0.75rem",
          }}
        >
          DEMO SWITCHER
        </span>
        <span style={{ color: "#94a3b8" }}>
          Acting as: <strong style={{ color: "#f8fafc" }}>{activeIdentity.label}</strong> ({activeIdentity.description})
        </span>
      </div>

      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <span style={{ color: "#64748b" }}>Switch role:</span>
        {DEMO_IDENTITIES.map((item) => (
          <button
            key={item.role}
            onClick={() => switchRole(item)}
            style={{
              padding: "4px 8px",
              fontSize: "0.78rem",
              background: currentRole === item.role ? "#3b82f6" : "#1e293b",
              color: currentRole === item.role ? "#fff" : "#cbd5e1",
              border: "1px solid " + (currentRole === item.role ? "#60a5fa" : "#475569"),
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            {item.label.split(" ")[0]} {item.role}
          </button>
        ))}
      </div>
    </div>
  );
}
