import express from "express";
import cors from "cors";
import helmet from "helmet";
import { casesRouter } from "./routes/cases.js";
import { disclosureRouter } from "./routes/disclosure.js";
import { eventsRouter } from "./routes/events.js";
import { evidenceRouter } from "./routes/evidence.js";
import { policiesRouter } from "./routes/policies.js";
import { tideProxyRouter } from "./routes/tideProxy.js";

export function createApp() {
  const app = express();
  const CLIENT_APP_URL = process.env.CLIENT_APP_URL || "http://localhost:5173";

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          frameSrc: ["'self'", "*"],
        },
      },
    }),
  );
  app.use(cors({ origin: CLIENT_APP_URL }));
  app.use(express.json({ limit: "2mb" }));

  app.get("/health", (_req, res) => {
    res.json({ ok: true, devMode: process.env.TRUSTVOICE_DEV_MODE === "true" });
  });

  app.use("/api/cases", casesRouter);
  app.use("/api/cases", disclosureRouter);
  app.use("/api/cases", eventsRouter);
  app.use("/api/cases", evidenceRouter);
  app.use("/api/policies", policiesRouter);
  app.use("/api/tide", tideProxyRouter);

  return app;
}
