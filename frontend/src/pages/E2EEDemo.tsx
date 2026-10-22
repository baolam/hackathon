import { useState } from "react";
import { useTideCloak } from "@tidecloak/react";
import tcConfig from "../../public/tidecloak.json";
import {
  readSession,
  signRelationshipPolicy,
  encryptForRecord,
  decryptForRecord,
  type RelationshipAccess,
} from "../lib/tide/relationship";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:4000/api";

interface EvidenceItem {
  id: string;
  filename: string;
  ciphertext: string;
  uploadedBySubject: string;
  uploadedAt: string;
}

/**
 * The signature demo moment: evidence is encrypted/decrypted entirely in the browser via Tide's
 * threshold E2EE (RelationshipAttestation:1). This backend never sees plaintext and never holds a
 * key — it only stores the ciphertext and the signed policies. A platform administrator with full
 * API access and a valid, verified token still cannot decrypt unless the network itself holds a
 * policy naming them. That denial, when it happens below, comes from the Tide network, not a 403
 * from this app's own code.
 */
export function E2EEDemo() {
  const { IAMService, hasClientRole, getValueFromIdToken, isInitializing } = useTideCloak();
  const [recordId, setRecordId] = useState("demo-case-1");
  const [log, setLog] = useState<string[]>([]);

  function pushLog(line: string) {
    setLog((l) => [`${new Date().toLocaleTimeString()}  ${line}`, ...l]);
  }

  async function authedFetch(path: string, init: RequestInit = {}) {
    return IAMService.secureFetch(`${API_BASE}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
    });
  }

  const isTideRealmAdmin = hasClientRole?.("tide-realm-admin", "realm-management") ?? false;
  let session: ReturnType<typeof readSession> | null = null;
  let sessionError: string | null = null;
  if (!isInitializing) {
    try {
      session = readSession();
    } catch (e) {
      sessionError = e instanceof Error ? e.message : String(e);
    }
  }

  // --- admin: grant a relationship policy -----------------------------------------------------
  const [grantSubjectId, setGrantSubjectId] = useState("");
  const [grantAccess, setGrantAccess] = useState<RelationshipAccess>("read");
  const [granting, setGranting] = useState(false);

  async function handleGrant() {
    setGranting(true);
    try {
      const adminPolicyRes = await authedFetch("/tide/admin-policy");
      if (!adminPolicyRes.ok) {
        throw new Error(`Could not fetch the realm's admin policy (HTTP ${adminPolicyRes.status})`);
      }
      const adminPolicyJson = await adminPolicyRes.json();
      const policyField: string | undefined = adminPolicyJson.policy;
      if (!policyField) throw new Error("TideCloak returned no admin policy — is this account actually tide-realm-admin?");
      const adminPolicyBytes = Uint8Array.from(atob(policyField), (c) => c.charCodeAt(0));

      pushLog(`Opening the Tide enclave to sign a ${grantAccess} grant on "${recordId}" for ${grantSubjectId.slice(0, 16)}…`);
      const signedB64 = await signRelationshipPolicy(
        {
          vendorId: (tcConfig as { vendorId: string }).vendorId,
          subject: { type: "User", id: grantSubjectId },
          recordId,
          access: grantAccess,
        },
        adminPolicyBytes,
      );

      const storeRes = await authedFetch("/policies", {
        method: "POST",
        body: JSON.stringify({ subjectType: "User", subjectId: grantSubjectId, recordId, policyB64: signedB64, access: grantAccess }),
      });
      if (!storeRes.ok) throw new Error(`Backend refused to store the signed policy (HTTP ${storeRes.status})`);
      pushLog(`GRANTED: ${grantAccess} access on "${recordId}" — signed by the Tide network, approved in your enclave.`);
    } catch (e) {
      pushLog(`GRANT FAILED: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setGranting(false);
    }
  }

  // --- upload (encrypt) -------------------------------------------------------------------------
  const [evidenceText, setEvidenceText] = useState("");
  const [uploading, setUploading] = useState(false);

  async function handleUpload() {
    setUploading(true);
    try {
      const mineRes = await authedFetch(`/policies/${recordId}/mine`);
      if (!mineRes.ok) {
        throw new Error(
          "No signed policy names you for this record — an admin must grant you write access before you can encrypt anything for it.",
        );
      }
      const { policyB64 } = await mineRes.json();
      const ciphertext = await encryptForRecord(evidenceText, recordId, policyB64);
      const up = await authedFetch(`/cases/${recordId}/evidence`, {
        method: "POST",
        body: JSON.stringify({ filename: "evidence.txt", mimeType: "text/plain", ciphertext }),
      });
      if (!up.ok) throw new Error(`Upload failed (HTTP ${up.status})`);
      pushLog(`ENCRYPTED + UPLOADED evidence for "${recordId}". The server received ciphertext only.`);
      setEvidenceText("");
      await loadEvidence();
    } catch (e) {
      pushLog(`ENCRYPT FAILED (a real Tide network refusal, not a UI check): ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setUploading(false);
    }
  }

  // --- list + decrypt ----------------------------------------------------------------------------
  const [items, setItems] = useState<EvidenceItem[]>([]);

  async function loadEvidence() {
    const res = await authedFetch(`/cases/${recordId}/evidence`);
    setItems(res.ok ? await res.json() : []);
  }

  async function tryDecrypt(item: EvidenceItem) {
    try {
      const mineRes = await authedFetch(`/policies/${recordId}/mine`);
      if (!mineRes.ok) throw new Error("No signed policy names you for this record.");
      const { policyB64 } = await mineRes.json();
      const plaintext = await decryptForRecord(item.ciphertext, recordId, policyB64);
      pushLog(`DECRYPT SUCCEEDED for "${item.filename}": "${plaintext}"`);
      await authedFetch(`/cases/${recordId}/evidence/${item.id}/log-access`, {
        method: "POST",
        body: JSON.stringify({ outcome: "ALLOWED" }),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      pushLog(`DECRYPT DENIED for "${item.filename}" — refused by the Tide network: ${msg}`);
      await authedFetch(`/cases/${recordId}/evidence/${item.id}/log-access`, {
        method: "POST",
        body: JSON.stringify({ outcome: "DENIED", reasonCode: msg }),
      });
    }
  }

  if (isInitializing) return <p>Initializing TideCloak…</p>;
  if (sessionError) {
    return (
      <div className="banner denied">
        Could not read your Tide session: {sessionError}. Try logging out and back in.
      </div>
    );
  }
  if (!session) return <p>Loading session…</p>;

  return (
    <div>
      <h1>Evidence (threshold E2EE)</h1>
      <p style={{ color: "var(--text-dim)" }}>
        Evidence is encrypted and decrypted entirely in this browser via Tide's network
        (RelationshipAttestation:1). The backend only ever stores ciphertext. Nobody — including
        this account, even logged in as a real admin — can decrypt a record without a policy the
        network itself has verified and signed.
      </p>

      <div className="card">
        <label>Record / case id</label>
        <input value={recordId} onChange={(e) => setRecordId(e.target.value)} style={{ maxWidth: 320 }} />
        <p style={{ fontSize: "0.8rem", color: "var(--text-dim)", marginTop: 8 }}>
          Signed in as <strong>{getValueFromIdToken?.("preferred_username") ?? "unknown"}</strong> ·
          tideUserKey <code>{session.tideUserKey ? `${session.tideUserKey.slice(0, 20)}…` : "(none yet — sign in once more)"}</code>
          <br />
          Realm roles: {session.realmRoles.length ? session.realmRoles.join(", ") : "(none)"} ·{" "}
          <span className={session.canEncrypt ? "status-pill" : "status-pill denied"}>
            _tide_encryptor: {session.canEncrypt ? "yes" : "no"}
          </span>{" "}
          <span className={session.canDecrypt ? "status-pill" : "status-pill denied"}>
            _tide_decryptor: {session.canDecrypt ? "yes" : "no"}
          </span>
        </p>
      </div>

      {isTideRealmAdmin && (
        <div className="card">
          <h3>Admin: grant record access</h3>
          <p style={{ color: "var(--text-dim)" }}>
            Paste the grantee's <code>tideUserKey</code> (visible on their own screen above, once
            they have signed in at least once). Signing opens the Tide enclave in this browser —
            your own approval is the grant.
          </p>
          <label>Grantee tideUserKey</label>
          <input value={grantSubjectId} onChange={(e) => setGrantSubjectId(e.target.value)} />
          <label>Access</label>
          <select value={grantAccess} onChange={(e) => setGrantAccess(e.target.value as RelationshipAccess)}>
            <option value="read">read (reviewer)</option>
            <option value="write">write (intake only)</option>
            <option value="read-write">read-write (owner)</option>
          </select>
          <button onClick={handleGrant} disabled={granting || !grantSubjectId}>
            {granting ? "Opening enclave…" : "Sign & grant"}
          </button>
        </div>
      )}

      <div className="card">
        <h3>Encrypt &amp; upload evidence</h3>
        <textarea rows={3} value={evidenceText} onChange={(e) => setEvidenceText(e.target.value)} placeholder="Evidence narrative (plaintext stays in your browser)" />
        <button onClick={handleUpload} disabled={uploading || !evidenceText}>
          {uploading ? "Encrypting…" : "Encrypt & upload"}
        </button>
      </div>

      <div className="card">
        <h3>Stored evidence (ciphertext only)</h3>
        <button className="secondary" onClick={loadEvidence}>Refresh list</button>
        {items.map((it) => (
          <div key={it.id} className="timeline-item">
            <div>
              <strong>{it.filename}</strong>{" "}
              <span className="meta">by {it.uploadedBySubject} at {new Date(it.uploadedAt).toLocaleString()}</span>
            </div>
            <div className="meta" style={{ wordBreak: "break-all" }}>{it.ciphertext.slice(0, 60)}…</div>
            <button className="secondary" style={{ marginTop: 6 }} onClick={() => tryDecrypt(it)}>
              Attempt decrypt
            </button>
          </div>
        ))}
      </div>

      <div className="card">
        <h3>Live log</h3>
        {log.map((l, i) => (
          <div key={i} className="timeline-item">{l}</div>
        ))}
      </div>
    </div>
  );
}
