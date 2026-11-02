import { InvalidRecord } from '../domain/errors.mjs';

export function createEntry(service) {
  return function submit(input) {
    try {
      return service.process(input);
    } catch (error) {
      if (error instanceof InvalidRecord) return { status: 'invalid' };
      throw error;
    }
  };
}
