import { Buffer } from 'node:buffer';

const decoder = Buffer;
export class SessionValidationError extends Error {}

export async function transaction(input, ports, trace) {
  await ports.begin(); trace.push('begin');
  trace.push('validate');
  if (input.correlation !== input.expected) throw new Error('correlation mismatch');
  await ports.switchAccount(); trace.push('switch');
  return renew(ports, trace);
}

export async function renew(ports, trace) {
  try {
    trace.push('renew');
    return await ports.renew();
  } catch (error) {
    trace.push('classify');
    if (error instanceof SessionValidationError) return 'authentication_required';
    throw error;
  }
}

export async function providerFailure(parseError, trace) {
  const parsed = await parseError(); trace.push('parsed');
  trace.push('throw');
  throw parsed.error;
}

export function captureDefaults(event = {}) {
  return { board: event.board ?? '', post: event.post ?? 0, key: event.key ?? 'CAPTURE' };
}

export function writeDefaults(event = {}) {
  return { board: event.board ?? '', post: event.post ?? 0, subject: event.subject ?? '' };
}

export function decode(value) {
  return decoder.from(value, 'base64');
}

export function resolveGuest(existing) {
  if (existing && existing.providers.includes('guest')) return { created: false };
  return { created: true };
}

export function guestResponse(existing) {
  const result = resolveGuest(existing);
  return { created: result.created, status: result.created ? 201 : 200 };
}
