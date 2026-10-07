import { oc } from '@orpc/contract';
import { z } from 'zod';
import { envelope } from '../shared/envelope.js';
import {
  confirmAccountBodySchema,
  emailBodySchema,
  resetPasswordBodySchema,
  signInBodySchema,
  signUpBodySchema,
  userSchema,
} from '../schemas/auth.schema.js';

// OAuth routes (/auth/google, /auth/github and their callbacks) are browser
// redirects and stay outside the contract.
export const authContract = {
  /********* AUTHENTIFICATION *********/

  signUp: oc
    .route({ method: 'POST', path: '/auth/signUp', successStatus: 201 })
    .input(signUpBodySchema)
    .output(envelope(userSchema)),

  signIn: oc
    .route({ method: 'POST', path: '/auth/signIn', successStatus: 201 })
    .input(signInBodySchema)
    .output(envelope(userSchema)),

  me: oc
    .route({ method: 'GET', path: '/auth/me' })
    .output(envelope(userSchema)),

  logout: oc.route({
    method: 'DELETE',
    path: '/auth/logout',
    successStatus: 204,
  }),

  refresh: oc
    .route({ method: 'POST', path: '/auth/refresh', successStatus: 201 })
    .output(envelope(userSchema)),

  /********* ACCOUNT MANAGEMENT *********/

  resendConfirmAccount: oc
    .route({
      method: 'POST',
      path: '/auth/resendConfirmAccount',
      successStatus: 201,
    })
    .input(emailBodySchema)
    .output(envelope(userSchema)),

  confirmAccount: oc
    .route({ method: 'PATCH', path: '/auth/confirmAccount' })
    .input(confirmAccountBodySchema)
    .output(envelope(z.undefined())),

  /********* PASSWORD *********/

  forgotPassword: oc
    .route({ method: 'POST', path: '/auth/forgotPassword', successStatus: 201 })
    .input(emailBodySchema)
    .output(envelope(userSchema)),

  resetPassword: oc
    .route({ method: 'PATCH', path: '/auth/resetPassword' })
    .input(resetPasswordBodySchema)
    .output(envelope(z.undefined())),
};
