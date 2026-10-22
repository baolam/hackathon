import { createApp } from "./app.js";

const PORT = Number(process.env.PORT) || 4000;
const app = createApp();

app.listen(PORT, () => {
  const devMode = process.env.TRUSTVOICE_DEV_MODE === "true";
  console.log(`TrustVoice API listening on http://localhost:${PORT}`);
  if (devMode) {
    console.warn(
      "TRUSTVOICE_DEV_MODE=true — auth is a local bypass (x-dev-subject / x-dev-role headers), NOT verified TideCloak enforcement. Do not deploy with this set.",
    );
  }
});
