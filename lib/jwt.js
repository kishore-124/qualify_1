// Edge-safe JWT helpers (used by middleware and API routes)
import { SignJWT, jwtVerify } from 'jose';

export const COOKIE_NAME = 'qf_token';

const getSecret = () =>
  new TextEncoder().encode(process.env.JWT_SECRET || 'dev-insecure-secret-change-me');

export async function signToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret());
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload;
  } catch {
    return null;
  }
}
