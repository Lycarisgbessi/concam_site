import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Resolves a persistent cryptographic session secret without falling back to a hardcoded string.
 */
export function getOrCreateSessionSecret(): string {
  const envSecret = process.env.SESSION_SECRET?.trim();
  if (envSecret && envSecret.length >= 24) {
    return envSecret;
  }
  const secretFile = path.join(process.cwd(), 'data', '.session_secret');
  fs.mkdirSync(path.dirname(secretFile), { recursive: true });
  try {
    if (fs.existsSync(secretFile)) {
      const existing = fs.readFileSync(secretFile, 'utf8').trim();
      if (existing.length >= 32) return existing;
    }
  } catch {
    // Regenerate below if unreadable
  }
  const generated = crypto.randomBytes(48).toString('hex');
  fs.writeFileSync(secretFile, generated, { mode: 0o600 });
  return generated;
}

export function generateTotpSecret(byteLength = 20): string {
  const bytes = crypto.randomBytes(byteLength);
  let bits = 0;
  let value = 0;
  let output = '';
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
}

function base32ToBuffer(base32: string): Buffer {
  const cleaned = base32.toUpperCase().replace(/=+$/g, '').replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (let i = 0; i < cleaned.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(cleaned[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

function computeHotp(secretBase32: string, counter: number): string {
  const key = base32ToBuffer(secretBase32);
  const counterBuf = Buffer.alloc(8);
  const high = Math.floor(counter / 0x100000000);
  const low = counter >>> 0;
  counterBuf.writeUInt32BE(high, 0);
  counterBuf.writeUInt32BE(low, 4);

  const hmac = crypto.createHmac('sha1', key).update(counterBuf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(code % 1_000_000).padStart(6, '0');
}

export function verifyTotpToken(secretBase32: string, rawToken: string, windowSteps = 1): boolean {
  const clean = String(rawToken || '').replace(/\s+/g, '');
  if (!/^\d{6}$/.test(clean) || !secretBase32) return false;

  const currentStep = Math.floor(Date.now() / 1000 / 30);
  const tokenBuf = Buffer.from(clean);

  for (let delta = -windowSteps; delta <= windowSteps; delta++) {
    const expected = computeHotp(secretBase32, currentStep + delta);
    const expectedBuf = Buffer.from(expected);
    if (expectedBuf.length === tokenBuf.length && crypto.timingSafeEqual(expectedBuf, tokenBuf)) {
      return true;
    }
  }
  return false;
}

export function buildTotpOtpAuthUri(email: string, secretBase32: string): string {
  const issuer = encodeURIComponent('CONCAM Admin');
  const label = encodeURIComponent(`CONCAM Admin:${email}`);
  return `otpauth://totp/${label}?secret=${secretBase32}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
}
