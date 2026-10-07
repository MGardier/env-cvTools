import { z } from 'zod';
import { DtoErrorCode } from '../shared/errors.js';
import { userRoleSchema, userStatusSchema } from '../shared/enums.js';
import { strictInput } from '../shared/input.js';

const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/;

/********* SHARED FIELDS *********/

export const emailField = z
  .string(DtoErrorCode.EMAIL_REQUIRED)
  .min(1, DtoErrorCode.EMAIL_REQUIRED)
  .pipe(z.email(DtoErrorCode.EMAIL_INVALID));

export const passwordField = z
  .string(DtoErrorCode.PASSWORD_REQUIRED)
  .min(1, DtoErrorCode.PASSWORD_REQUIRED)
  .min(8, DtoErrorCode.PASSWORD_MIN_LENGTH)
  .regex(PASSWORD_PATTERN, DtoErrorCode.PASSWORD_WEAK);

export const tokenField = z
  .string(DtoErrorCode.TOKEN_REQUIRED)
  .min(1, DtoErrorCode.TOKEN_REQUIRED);

/********* REQUEST *********/

export const signUpBodySchema = strictInput({
  email: emailField,
  password: passwordField,
});

export const signInBodySchema = strictInput({
  email: emailField,
  password: z
    .string(DtoErrorCode.PASSWORD_REQUIRED)
    .min(1, DtoErrorCode.PASSWORD_REQUIRED),
});

export const emailBodySchema = strictInput({
  email: emailField,
});

export const confirmAccountBodySchema = strictInput({
  token: tokenField,
});

export const resetPasswordBodySchema = strictInput({
  token: tokenField,
  password: passwordField,
});

/********* RESPONSE *********/

export const userSchema = z.object({
  id: z.number().int(),
  email: z.string(),
  status: userStatusSchema,
  roles: userRoleSchema,
});

export type TSignUpBody = z.infer<typeof signUpBodySchema>;
export type TSignInBody = z.infer<typeof signInBodySchema>;
export type TEmailBody = z.infer<typeof emailBodySchema>;
export type TConfirmAccountBody = z.infer<typeof confirmAccountBodySchema>;
export type TResetPasswordBody = z.infer<typeof resetPasswordBodySchema>;
export type TUser = z.infer<typeof userSchema>;
