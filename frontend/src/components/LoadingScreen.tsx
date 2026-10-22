import { useEffect, useState } from "react";

type Slide = {
  icon: string;
  accent: string;
  title: string;
  body: string;
};

const SLIDES: Slide[] = [
  {
    icon: "🛡️",
    accent: "var(--glow-teal)",
    title: "TrustVoice",
    body: "Protected, independently reviewed whistleblowing — no single administrator or organization holds unilateral control.",
  },
  {
    icon: "🤝",
    accent: "var(--glow-violet)",
    title: "Safe Escalation Without Conflict of Interest",
    body: "External independent reviewers access strictly assigned cases — never the organization's entire internal dataset.",
  },
  {
    icon: "🔐",
    accent: "var(--glow-amber)",
    title: "Threshold End-to-End Encryption",
    body: "Evidence is encrypted directly inside the browser. Servers only store ciphertext — root DB admins cannot read it.",
  },
  {
    icon: "🪪",
    accent: "var(--glow-pink)",
    title: "DPoP — Cryptographically Bound Tokens",
    body: "Access tokens are bound to browser private keys (RFC 9449). Stolen tokens cannot be replayed.",
  },
  {
    icon: "⚖️",
    accent: "var(--glow-teal)",
    title: "Governance via Tide Enclave",
    body: "All privilege changes must be signed inside the Tide enclave — preventing unilateral tampering or cover-ups by admins.",
  },
  {
    icon: "🎭",
    accent: "var(--glow-violet)",
    title: "3 Demo Personas",
    body: "reporter1 submits & encrypts evidence · admin is cryptographically denied decryption (by design) · reviewer1 is delegated and decrypts successfully.",
  },
];

const SLIDE_MS = 4200;

export function LoadingScreen() {
  const [index, setIndex] = useState(0);
  const [dotKey, setDotKey] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
      setDotKey((k) => k + 1);
    }, SLIDE_MS);
    return () => clearInterval(t);
  }, []);

  const slide = SLIDES[index];

  return (
    <div className="boot-screen" role="status" aria-live="polite">
      <div className="boot-orb boot-orb-1" />
      <div className="boot-orb boot-orb-2" />
      <div className="boot-orb boot-orb-3" />

      <div className="boot-content">
        <div className="boot-logo">
          <span className="boot-logo-ring" />
          <span className="boot-logo-emoji">🛰️</span>
        </div>
        <h1 className="boot-title">
          Trust<span className="boot-title-accent">Voice</span>
        </h1>
        <p className="boot-subtitle">Establishing secure connection with TideCloak…</p>

        <div className="boot-slide" key={index} style={{ "--slide-accent": slide.accent } as React.CSSProperties}>
          <div className="boot-slide-icon">{slide.icon}</div>
          <div>
            <div className="boot-slide-title">{slide.title}</div>
            <div className="boot-slide-body">{slide.body}</div>
          </div>
        </div>

        <div className="boot-dots">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              className={"boot-dot" + (i === index ? " boot-dot-active" : "")}
              aria-label={`Slide ${i + 1}`}
              onClick={() => {
                setIndex(i);
                setDotKey((k) => k + 1);
              }}
            >
              {i === index && <span className="boot-dot-fill" key={dotKey} style={{ animationDuration: `${SLIDE_MS}ms` }} />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
