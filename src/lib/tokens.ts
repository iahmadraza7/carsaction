import { createHash, randomBytes } from "crypto";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Creates a password-reset token. The raw token is emailed to the user; only
 * its SHA-256 hash is stored, so a database leak cannot be used to reset accounts.
 */
export function createResetToken() {
  const token = randomBytes(32).toString("hex");
  return {
    token,
    tokenHash: hashToken(token),
    expires: new Date(Date.now() + RESET_TOKEN_TTL_MS),
  };
}
