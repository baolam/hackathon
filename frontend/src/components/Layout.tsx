import { NavLink } from "react-router-dom";
import { useTideCloak } from "@tidecloak/react";
import type { AppRole } from "../lib/types";
import { APP_ROLES } from "../lib/useApi";

export function useAppRoles(): AppRole[] {
  const { hasRealmRole } = useTideCloak();
  // hasRealmRole() is UI gating only (see README "Security model"). It decides what the person
  // SEES; every action is re-checked server-side against the verified JWT regardless of this list.
  return APP_ROLES.filter((r) => hasRealmRole(r));
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { logout, getValueFromIdToken } = useTideCloak();
  const roles = useAppRoles();
  const username = getValueFromIdToken?.("preferred_username") ?? "signed in";

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">TrustVoice</div>
        <div className="brand-sub">Independent case resolution</div>

        <nav>
          <NavLink to="/" className="nav-link">Overview</NavLink>
          {roles.includes("reporter") && (
            <NavLink to="/submit" className="nav-link">Submit a report</NavLink>
          )}
          <NavLink to="/evidence" className="nav-link">Evidence (E2EE)</NavLink>
        </nav>

        <div style={{ marginTop: 32, fontSize: "0.75rem", color: "var(--text-dim)" }}>
          <div style={{ marginBottom: 8 }}>{username}</div>
          <div style={{ marginBottom: 12 }}>
            {roles.length === 0 ? (
              <span className="role-badge">no role</span>
            ) : (
              roles.map((r) => <span key={r} className="role-badge">{r}</span>)
            )}
          </div>
          <button className="secondary" onClick={logout}>Log out</button>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
