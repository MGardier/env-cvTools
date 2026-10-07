import { z } from 'zod';
import { DtoErrorCode } from '../shared/errors.js';
import { strictInput } from '../shared/input.js';
import { passwordField, tokenField } from './auth.schema.js';

/********* REQUEST *********/

// Token presence is checked by the service (401 TOKEN_INVALID).
export const validateInvitationQuerySchema = strictInput({
  token: z.string(DtoErrorCode.TOKEN_INVALID).optional(),
});

// Classic (password) admin registration only.
// OAuth registration goes through the dedicated /auth/admin/oauth routes.
export const registerAdminBodySchema = strictInput({
  token: tokenField.pipe(z.uuid(DtoErrorCode.TOKEN_INVALID)),
  password: passwordField,
});

/********* RESPONSE *********/

export const validateInvitationSchema = z.object({
  email: z.string(),
});

export type TValidateInvitationQuery = z.infer<
  typeof validateInvitationQuerySchema
>;
export type TRegisterAdminBody = z.infer<typeof registerAdminBodySchema>;
export type TValidateInvitation = z.infer<typeof validateInvitationSchema>;
