import { InvalidRecord } from './errors.mjs';

export const standardPolicy = { transform(value) { return value.trim(); } };
export const strictPolicy = {
  transform(value) {
    if (value === '!') throw new InvalidRecord('policy rejected input');
    return value.trim().toUpperCase();
  },
};
export const unusedPolicy = { transform() { return 'never selected'; } };
export function policyFor(mode) {
  return mode === 'strict' ? strictPolicy : standardPolicy;
}
