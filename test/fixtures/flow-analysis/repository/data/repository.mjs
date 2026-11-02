import { StorageFault } from '../domain/errors.mjs';

export class MemoryRepository {
  save(value) {
    if (value === 'broken') throw new StorageFault('storage rejected write');
    return value;
  }
}
