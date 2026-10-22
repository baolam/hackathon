import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    env: {
      TRUSTVOICE_DEV_MODE: "true",
      CLIENT_APP_URL: "http://localhost:5173",
    },
  },
});
