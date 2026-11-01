import crypto from "crypto";

// Server-only secret - NEVER VITE_ prefixed and NEVER exposed to client
export const AUTH_SECRET = process.env.AUTH_SECRET || "hireforce_server_auth_secret_k8f9a2b4c6e8d1";

export function createSessionToken(tenantId: string, expiresInHours = 12): string {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    tenantId,
    userId: tenantId,
    iat: now,
    exp: now + (expiresInHours * 3600),
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", AUTH_SECRET).update(payloadB64).digest("base64url");
  return `hf_${payloadB64}.${sig}`;
}

export async function verifyAuth(req: any): Promise<{ userId: string; tenantId: string } | null> {
  const authHeader = req.headers?.["authorization"] || req.headers?.["Authorization"];
  if (!authHeader || typeof authHeader !== "string") {
    return null;
  }
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token || !token.startsWith("hf_")) return null;

  try {
    const rest = token.substring(3);
    const [payloadB64, sig] = rest.split(".");
    if (!payloadB64 || !sig) return null;

    const expectedSig = crypto.createHmac("sha256", AUTH_SECRET).update(payloadB64).digest("base64url");
    const sigBuf = Buffer.from(sig);
    const expectedBuf = Buffer.from(expectedSig);

    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
    const now = Math.floor(Date.now() / 1000);
    if (!payload.exp || payload.exp < now) {
      return null; // Expired
    }

    const effectiveId = payload.tenantId || payload.userId;
    if (!effectiveId) return null;

    return {
      userId: String(effectiveId),
      tenantId: String(effectiveId),
    };
  } catch {
    return null;
  }
}
