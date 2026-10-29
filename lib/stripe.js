import Stripe from 'stripe';
import { ApiError } from './api';

let client;

const secretKey = () => (process.env.STRIPE_SECRET_KEY || '').trim();

/** True when a Stripe key is configured. Without it, checkout runs in demo mode. */
export function stripeEnabled() {
  return !!secretKey();
}

/**
 * Explains a misconfigured key in plain words. The most common mistake is pasting the
 * publishable key (pk_…) — that one is only for browsers and can't create payments.
 */
export function stripeKeyProblem() {
  const key = secretKey();
  if (!key) return null;
  if (key.startsWith('pk_')) {
    return 'STRIPE_SECRET_KEY contains a publishable key (pk_…). Use the secret key that starts with sk_test_ (or sk_live_), from Stripe Dashboard → Developers → API keys.';
  }
  if (!/^(sk|rk)_(test|live)_/.test(key)) {
    return 'STRIPE_SECRET_KEY doesn’t look like a Stripe secret key. It should start with sk_test_ or sk_live_.';
  }
  return null;
}

export function getStripe() {
  if (!stripeEnabled()) return null;
  const problem = stripeKeyProblem();
  if (problem) throw new ApiError(`Payments are misconfigured: ${problem}`, 500);
  if (!client) client = new Stripe(secretKey(), { appInfo: { name: 'Qualify' } });
  return client;
}

/** Turns a Stripe SDK error into a clear ApiError (and keeps the details in the server log). */
export function stripeError(e, doing = 'talk to Stripe') {
  if (e instanceof ApiError) return e;
  console.error(`[stripe] could not ${doing}:`, e?.type, e?.code, e?.message);
  if (e?.type === 'StripeAuthenticationError' || e?.code === 'secret_key_required') {
    return new ApiError('Payments are misconfigured: the Stripe secret key is invalid. Check STRIPE_SECRET_KEY (it must start with sk_test_ or sk_live_).', 500);
  }
  if (e?.type === 'StripeConnectionError') return new ApiError('Couldn’t reach Stripe. Check your internet connection and try again.', 502);
  if (e?.type === 'StripeInvalidRequestError') return new ApiError(`Stripe rejected the request: ${e.message}`, 400);
  return new ApiError(`Payment provider error: ${e?.message || 'unknown error'}`, 502);
}

/** All prices on Qualify are in US dollars. */
export const CURRENCY = 'usd';

/** Converts dollars (e.g. 14.99) to Stripe's smallest unit (1499 cents). */
export function toMinor(amount) {
  return Math.round(amount * 100);
}

/** Qualify's commission on every sale, in percent. The instructor earns the rest. */
export const PLATFORM_FEE_PERCENT = Math.min(100, Math.max(0, Number(process.env.PLATFORM_FEE_PERCENT ?? 30)));

const round2 = (n) => Math.round(n * 100) / 100;

export function splitRevenue(price) {
  const platformFee = round2((price * PLATFORM_FEE_PERCENT) / 100);
  return { platformFee, instructorEarning: round2(price - platformFee) };
}

/** Public base URL used for Stripe redirect links. */
export function appUrl(req) {
  // APP_URL is read at runtime (Docker); NEXT_PUBLIC_APP_URL is baked in at build time
  return (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin).replace(/\/$/, '');
}
