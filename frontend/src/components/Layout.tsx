import { NavLink } from "react-router-dom";
import { useTideCloak } from "@tidecloak/react";
import type { AppRole } from "../lib/types";
import { APP_ROLES } from "../lib/useApi";
import { DemoRoleSwitcher } from "./DemoRoleSwitcher";

export function useAppRoles(): AppRole[] {
  const { hasRealmRole } = useTideCloak();
  const realmRoles = APP_ROLES.filter((r) => hasRealmRole?.(r));
  if (realmRoles.length > 0) return realmRoles;

  // Fallback for dev / demo mode:
  const demoRole = (localStorage.getItem("trustvoice_demo_role") || "admin") as AppRole;
  if (APP_ROLES.includes(demoRole)) {
    return [demoRole];
  }
  return ["admin"];
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { logout, getValueFromIdToken, authenticated } = useTideCloak();
  const roles = useAppRoles();
  const username =
    getValueFromIdToken?.("preferred_username") ??
    (localStorage.getItem("trustvoice_demo_label") || localStorage.getItem("trustvoice_demo_subject") || "Demo User");

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* The Demo Switcher is a stand-in for a session that doesn't exist yet — once a real
          Tide session is active, roles come from the real token and this has no effect, so
          don't show it (see useApi.ts / backend middleware.ts for the matching auth logic). */}
      {!authenticated && <DemoRoleSwitcher />}
      <div className="shell" style={{ flex: 1 }}>
        <aside className="sidebar">
          <div className="brand">TrustVoice</div>
          <div className="brand-sub">Independent case resolution</div>

          <nav style={{ marginTop: 20 }}>
            <div style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-dim)", padding: "4px 12px" }}>
              Public Portal
            </div>
            <NavLink to="/anonymous-report" className="nav-link">
              🛡️ Anonymous Report
            </NavLink>
            <NavLink to="/track" className="nav-link">
              🔍 Track Case
            </NavLink>

            <div style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-dim)", padding: "16px 12px 4px" }}>
              Workspace
            </div>
            <NavLink to="/cases" className="nav-link">
              📋 Case List
            </NavLink>
            <NavLink to="/submit" className="nav-link">
              📑 Submit Protected Report
            </NavLink>
            <NavLink to="/evidence" className="nav-link">
              🔐 E2EE Showcase
            </NavLink>
          </nav>

          <div style={{ marginTop: "auto", paddingTop: 32, fontSize: "0.75rem", color: "var(--text-dim)" }}>
            <div style={{ marginBottom: 4, fontWeight: "bold" }}>{username}</div>
            <div style={{ marginBottom: 12 }}>
              {roles.map((r) => (
                <span key={r} className="role-badge">
                  {r}
                </span>
              ))}
            </div>
            {logout ? (
              <button className="secondary" onClick={logout} style={{ fontSize: "0.75rem", padding: "4px 8px" }}>
                Log out
              </button>
            ) : null}
          </div>
        </aside>
        <main className="main">{children}</main>
      </div>
    </div>
  );
}
