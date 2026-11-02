// Compatibility wrapper retaining the fixture repository root for existing tests.
import { repositoryRoot } from './validate-artifact.mjs';
import { validateDocumentation as validate } from '../../validation/validate-documentation.mjs';
export const validateDocumentation = (data, options) => validate(data, { sourceRoot: repositoryRoot, ...options });
