import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "fs";
import { resolve } from "path";

/**
 * Serves public/tide_dpop_auth.html for every /tide_dpop/iss/<hex>/aud/<hex>/tide_dpop_auth.html
 * request, with the headers the Tide enclave requires. Vite has no file-based router for this —
 * without this plugin, its SPA history-fallback serves index.html at that path instead, the
 * enclave gets the wrong content, and login fails with TIDE-SWE-UNHANDLED. The Next.js
 * rewrite/header pattern in canon/troubleshooting.md T-26 is the same requirement; this is the
 * Vite-dev-server equivalent (no ready-made one ships in the pack for Vite).
 */
function tideDpopRelay() {
  const filePath = resolve(__dirname, "public/tide_dpop_auth.html");
  return {
    name: "tide-dpop-relay",
    configureServer(server: { middlewares: { use: (fn: (req: { url?: string }, res: { setHeader: (k: string, v: string) => void; end: (b: Buffer) => void }, next: () => void) => void) => void } }) {
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.startsWith("/tide_dpop/")) {
          const html = readFileSync(filePath);
          // Order matters only in a real header-merge (next.config style); here there is only
          // one rule, so just set exactly what the relay needs.
          res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'unsafe-inline'");
          res.setHeader("Allow-CSP-From", "*");
          res.setHeader("Content-Type", "text/html");
          res.end(html);
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tideDpopRelay()],
});
