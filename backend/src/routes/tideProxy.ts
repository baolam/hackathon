import { Router } from "express";
import { authenticate, requireTideRealmAdmin } from "../auth/middleware.js";
import { loadTideConfig } from "../auth/tidecloakConfig.js";

export const tideProxyRouter = Router();
tideProxyRouter.use(authenticate);

/**
 * Forwards the CALLER's OWN verified token to TideCloak's realm admin REST API — exactly how the
 * TideCloak admin console itself authorizes, via the caller's `tide-realm-admin` client role, not
 * a separate service credential this backend would otherwise have to hold. If the caller does not
 * actually hold that role on the realm, TideCloak answers 403 itself; `requireRole("admin")` below
 * is only this app's own UI-role gate, not the real enforcement.
 */
function forwardToTide(path: string) {
  return async (req: import("express").Request, res: import("express").Response) => {
    try {
      const config = loadTideConfig();
      const base = config["auth-server-url"].replace(/\/+$/, "");
      const url = `${base}/admin/realms/${config.realm}${path}`;
      const upstream = await fetch(url, {
        headers: { Authorization: req.headers.authorization ?? "" },
      });
      const body = await upstream.text();
      res.status(upstream.status).type("application/json").send(body);
    } catch (err) {
      res.status(502).json({ error: err instanceof Error ? err.message : "TideCloak admin API unreachable" });
    }
  };
}

/** List realm users with their Tide public key, so an admin can pick a grant subject by username. */
tideProxyRouter.get("/users", requireTideRealmAdmin, async (req, res) => {
  try {
    const config = loadTideConfig();
    const base = config["auth-server-url"].replace(/\/+$/, "");
    const upstream = await fetch(`${base}/admin/realms/${config.realm}/users`, {
      headers: { Authorization: req.headers.authorization ?? "" },
    });
    if (!upstream.ok) {
      res.status(upstream.status).json({ error: `TideCloak answered ${upstream.status}` });
      return;
    }
    const users = (await upstream.json()) as Array<{
      id: string;
      username: string;
      attributes?: Record<string, string[]>;
    }>;
    res.json(
      users.map((u) => ({
        id: u.id,
        username: u.username,
        tideUserKey: u.attributes?.tideUserKey?.[0] ?? null,
      })),
    );
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : "TideCloak admin API unreachable" });
  }
});

/** The realm's `tide-realm-admin` role policy — the `adminPolicy` bytes `signRelationshipPolicy` needs. */
tideProxyRouter.get(
  "/admin-policy",
  requireTideRealmAdmin,
  forwardToTide("/iga/role-policies/name/tide-realm-admin"),
);
