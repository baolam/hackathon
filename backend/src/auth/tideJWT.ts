import { jwtVerify, createLocalJWKSet } from "jose";
import type { JWTVerifyOptions } from "jose";
import { loadTideConfig, type TidecloakConfig } from "./tidecloakConfig.js";
import type { AppRole, TideJwtPayload } from "../types.js";

// Lazy initialization — do NOT load config at module level, so the API can start (and fail health
// checks loudly, rather than crash) before the realm has been bootstrapped.
let _jwks: ReturnType<typeof createLocalJWKSet> | null = null;
let _config: TidecloakConfig | null = null;

function getConfig() {
  if (!_config) {
    _config = loadTideConfig();
    _jwks = createLocalJWKSet(_config.jwk as Parameters<typeof createLocalJWKSet>[0]);
  }
  return { config: _config, JWKS: _jwks! };
}

export async function verifyTideJWT(token: string): Promise<TideJwtPayload> {
  const { config, JWKS } = getConfig();
  const options: JWTVerifyOptions = {
    issuer: `${config["auth-server-url"].replace(/\/+$/, "")}/realms/${config.realm}`,
  };

  const { payload } = await jwtVerify(token, JWKS, options);

  // TideCloak access tokens use azp (authorized party) for the client ID; aud is typically "account".
  if (payload.azp !== config.resource) {
    throw new Error("Token azp does not match client");
  }

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) throw new Error("Token expired");
  if (payload.iat && payload.iat > now + 60) throw new Error("Token issued in future");

  return payload as unknown as TideJwtPayload;
}

/** `tide-realm-admin` is a CLIENT role on `realm-management` — never check it as a realm role (AP). */
export function hasRealmRole(payload: TideJwtPayload, role: string): boolean {
  return payload.realm_access?.roles?.includes(role) ?? false;
}

export function hasClientRole(payload: TideJwtPayload, role: string, client: string): boolean {
  return payload.resource_access?.[client]?.roles?.includes(role) ?? false;
}

const APP_ROLES: AppRole[] = ["reporter", "case-officer", "independent-reviewer", "admin"];

/** TrustVoice's own roles are plain realm roles — never the `_tide_*` namespace (AP-18). */
export function appRolesOf(payload: TideJwtPayload): AppRole[] {
  const roles = payload.realm_access?.roles ?? [];
  return APP_ROLES.filter((r) => roles.includes(r));
}

export function extractToken(authHeader: string | undefined | null): string {
  if (!authHeader) throw new Error("Missing Authorization header");
  if (authHeader.startsWith("Bearer ")) return authHeader.slice(7);
  if (authHeader.startsWith("DPoP ")) return authHeader.slice(5);
  throw new Error("Invalid Authorization header format");
}
