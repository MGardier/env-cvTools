import { oc } from '@orpc/contract';
import { envelope } from '../shared/envelope.js';
import { userSchema } from '../schemas/auth.schema.js';
import {
  registerAdminBodySchema,
  validateInvitationQuerySchema,
  validateInvitationSchema,
} from '../schemas/admin.schema.js';

// Admin OAuth routes (/auth/admin/oauth/*) are browser redirects and stay
// outside the contract.
export const adminContract = {
  validateInvitation: oc
    .route({ method: 'GET', path: '/auth/admin/invitation/validate' })
    .input(validateInvitationQuerySchema)
    .output(envelope(validateInvitationSchema)),

  register: oc
    .route({ method: 'POST', path: '/auth/admin/register', successStatus: 201 })
    .input(registerAdminBodySchema)
    .output(envelope(userSchema)),
};
