import { useTideCloak } from "@tidecloak/react";

export function Landing() {
  const { login } = useTideCloak();
  return (
    <div className="center-page">
      <div style={{ maxWidth: 520 }}>
        <h1 style={{ marginBottom: 8 }}>TrustVoice</h1>
        <p style={{ color: "var(--text-dim)", marginBottom: 28 }}>
          Report misconduct and have it independently reviewed, without giving any single
          administrator the power to see your identity or suppress the case alone.
        </p>
        <button onClick={login}>Login with TideCloak</button>
      </div>
    </div>
  );
}
