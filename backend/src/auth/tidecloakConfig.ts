import { readFileSync } from "fs";
import { join } from "path";

export interface TidecloakConfig {
  realm: string;
  "auth-server-url": string;
  "ssl-required": string;
  resource: string;
  "public-client": boolean;
  "confidential-port": number;
  jwk: { keys: unknown[] }; // Required: embedded JWKS for local, offline-capable verification.
  vendorId?: string;
  homeOrkUrl?: string;
}

// Lazy-loaded (see tideJWT.ts) so the server can start before bootstrap has produced this file.
export function loadTideConfig(): TidecloakConfig {
  if (process.env.CLIENT_ADAPTER) {
    return JSON.parse(process.env.CLIENT_ADAPTER);
  }

  const relPath = process.env.TIDECLOAK_ADAPTER_PATH || "../frontend/public/tidecloak.json";
  const configPath = join(process.cwd(), relPath);
  const config = JSON.parse(readFileSync(configPath, "utf-8"));

  if (!config.jwk) {
    throw new Error(
      "Adapter JSON missing jwk field. This field is required for Tide JWT verification. " +
        "Export via the Tide-specific endpoint (providerId=keycloak-oidc-keycloak-json), not a generic Keycloak adapter.",
    );
  }

  return config;
}
