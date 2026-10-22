import type { NextFunction, Request, Response } from "express";
import { verifyTideJWT, extractToken, appRolesOf, hasClientRole } from "./tideJWT.js";
import { verifyDpop, DpopError } from "./verifyDpop.js";
import type { AppRole, TideJwtPayload } from "../types.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: TideJwtPayload;
      userRoles?: AppRole[];
      /** "tide" = verified TideCloak JWT + DPoP. "dev" = local dev-mode bypass (see below). */
      authMode?: "tide" | "dev";
    }
  }
}

/**
 * Local development mode (PROJECT_OVERVIEW.md section 10): before a TideCloak realm is bootstrapped
 * there is no adapter JSON and no real JWT to verify. This bypass lets the vertical slice run end to
 * end anyway, but it is NEVER silently treated as the real thing: every response carries
 * `authMode: "dev"`, every CaseEvent records it, and it refuses to turn on unless the operator
 * explicitly sets TRUSTVOICE_DEV_MODE=true. Do not deploy with this set.
 */
const DEV_MODE = process.env.TRUSTVOICE_DEV_MODE === "true";

function devModeUser(req: Request): TideJwtPayload | null {
  const subject = req.header("x-dev-subject");
  const role = req.header("x-dev-role") as AppRole | undefined;
  if (!subject || !role) return null;
  return {
    sub: subject,
    realm_access: { roles: [role] },
  };
}

function expressReqAsFetchLike(req: Request) {
  const proto = req.protocol;
  const host = req.get("host") ?? "localhost";
  return {
    url: `${proto}://${host}${req.originalUrl}`,
    method: req.method,
    headers: {
      get: (name: string) => {
        const v = req.headers[name.toLowerCase()];
        if (Array.isArray(v)) return v[0] ?? null;
        return v ?? null;
      },
    },
  };
}

/**
 * Verifies the JWT and, for sender-constrained (DPoP) tokens, the DPoP proof. Fails closed.
 *
 * A real bearer token is ALWAYS verified for real, regardless of TRUSTVOICE_DEV_MODE — a
 * genuinely logged-in caller's identity must never be silently swapped for the dev-mode one.
 * The dev-mode header bypass only applies when there is NO bearer token at all: the Demo
 * Switcher stands in for a session that doesn't exist yet, it never overrides one that does.
 */
export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (req.headers.authorization) {
    try {
      const token = extractToken(req.headers.authorization);
      const jwt = await verifyTideJWT(token);

      // The realm template issues DPoP-bound tokens by default (dpop.bound.access.tokens=true).
      // An unbound token here is a downgrade attempt or a misconfigured client — reject it (I-12).
      if (!jwt.cnf?.jkt) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      await verifyDpop(expressReqAsFetchLike(req), token, jwt);

      req.user = jwt;
      req.userRoles = appRolesOf(jwt);
      req.authMode = "tide";
      next();
      return;
    } catch (err) {
      if (err instanceof DpopError) console.warn(`[auth] DPoP check failed: ${err.message}`);
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
  }

  if (DEV_MODE) {
    const user = devModeUser(req);
    if (!user) {
      res.status(401).json({ error: "dev-mode auth requires x-dev-subject and x-dev-role headers" });
      return;
    }
    req.user = user;
    req.userRoles = appRolesOf(user);
    req.authMode = "dev";
    next();
    return;
  }

  res.status(401).json({ error: "Unauthorized" });
}

export function requireRole(...roles: AppRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userRoles = req.userRoles ?? [];
    if (!roles.some((r) => userRoles.includes(r))) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };
}

/**
 * Gates on the REAL TideCloak client role `tide-realm-admin` on `realm-management` — the actual
 * authority that may grant records (see role-policy-matrix). This is deliberately separate from
 * `requireRole`, which only checks TrustVoice's own app-level realm roles; those are a different,
 * unrelated namespace from Tide's governance role (AP-18).
 */
export function requireTideRealmAdmin(req: Request, res: Response, next: NextFunction): void {
  if (req.authMode === "dev") {
    // dev-mode has no real tide-realm-admin concept; treat the "admin" dev role as a stand-in.
    if (!(req.userRoles ?? []).includes("admin")) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
    return;
  }
  if (!req.user || !hasClientRole(req.user, "tide-realm-admin", "realm-management")) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
}
