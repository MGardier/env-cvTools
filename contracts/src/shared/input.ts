import { z } from 'zod';
import { DtoErrorCode } from './errors.js';

/**
 * Strict input object: unknown fields are rejected (FIELD_NOT_ALLOWED) and a
 * non-object payload is rejected (INPUT_INVALID). Field-level messages are untouched.
 */
export const strictInput = <T extends z.core.$ZodLooseShape>(shape: T) =>
  z.strictObject(shape, {
    error: (issue) =>
      issue.code === 'unrecognized_keys'
        ? DtoErrorCode.FIELD_NOT_ALLOWED
        : DtoErrorCode.INPUT_INVALID,
  });
