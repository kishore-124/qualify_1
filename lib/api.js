import { NextResponse } from 'next/server';
import { getCurrentUser } from './auth';

export class ApiError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

export const json = (data, status = 200) => NextResponse.json(data, { status });

/** Ensures a user is logged in (and optionally has one of the given roles). */
export async function requireUser(...roles) {
  const user = await getCurrentUser();
  if (!user) throw new ApiError('Please log in to continue', 401);
  if (roles.length && !roles.includes(user.role)) {
    throw new ApiError('You do not have permission for this action', 403);
  }
  return user;
}

/** For instructor actions that change content or money. Suspended instructors are blocked. */
export async function requireActiveInstructor() {
  const user = await requireUser('INSTRUCTOR', 'ADMIN');
  if (user.role !== 'ADMIN' && user.status !== 'ACTIVE') {
    throw new ApiError(`Your instructor account is paused${user.statusReason ? `: ${user.statusReason}` : ''}. Contact support@qualify.dev.`, 403);
  }
  return user;
}

/** Wraps a route handler: resolves params and converts errors to JSON responses. */
export function route(fn) {
  return async (req, ctx) => {
    try {
      const params = ctx?.params ? await ctx.params : {};
      return await fn(req, params);
    } catch (e) {
      if (e instanceof ApiError) return json({ error: e.message }, e.status);
      if (typeof e?.type === 'string' && e.type.startsWith('Stripe')) {
        // Stripe SDK errors: explain them instead of a generic 500
        console.error('[stripe]', e.type, e.code, e.message);
        const auth = e.type === 'StripeAuthenticationError' || e.code === 'secret_key_required';
        return json({
          error: auth
            ? 'Payments are misconfigured: the Stripe secret key is invalid. STRIPE_SECRET_KEY must start with sk_test_ or sk_live_.'
            : e.type === 'StripeConnectionError'
              ? 'Couldn’t reach Stripe. Check your internet connection and try again.'
              : `Payment provider error: ${e.message}`,
        }, auth ? 500 : 502);
      }
      if (e?.code === 'P2002') return json({ error: 'That record already exists' }, 409);
      if (e?.code === 'P2025') return json({ error: 'Record not found' }, 404);
      console.error('[API ERROR]', e);
      return json({ error: 'Something went wrong. Please try again.' }, 500);
    }
  };
}

export async function readBody(req) {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

export function assertCourseOwner(course, user) {
  if (!course) throw new ApiError('Course not found', 404);
  if (course.instructorId !== user.id && user.role !== 'ADMIN') {
    throw new ApiError('You can only manage your own courses', 403);
  }
}

export function required(obj, fields) {
  for (const f of fields) {
    if (obj[f] === undefined || obj[f] === null || String(obj[f]).trim() === '') {
      throw new ApiError(`${f} is required`, 422);
    }
  }
}
