// Compatibility imports for M1 tests; production and tests use the same validator.
import { fileURLToPath } from 'node:url';
import { validateArtifact as validate } from '../../validation/validate-artifact.mjs';
export { schema, validateStructure } from '../../validation/validate-artifact.mjs';
export const repositoryRoot = fileURLToPath(new URL('../../', import.meta.url));
export const validateArtifact = (data, options) => validate(data, { sourceRoot: repositoryRoot, ...options });
