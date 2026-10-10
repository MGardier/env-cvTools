import { z } from 'zod';
import { oauthLoginMethodSchema } from '../shared/enums.js';
import { errorCodeSchema } from '../shared/errors.js';

// OAuth flows end with a browser redirect from the back to the front.
// The base URLs are environment config (FRONT_URL_OAUTH_CALLBACK_SUCCESS / _ERROR);
// the contract is the query string the back writes and the front reads.

/** Success redirect: `?loginMethod=GOOGLE` */
export const oauthSuccessQuerySchema = z.object({
  loginMethod: oauthLoginMethodSchema,
});

/** Error redirect: `?errorCode=GOOGLE_COMPLETED_OAUTH_FAILED` */
export const oauthErrorQuerySchema = z.object({
  errorCode: errorCodeSchema,
});

export type TOAuthSuccessQuery = z.infer<typeof oauthSuccessQuerySchema>;
export type TOAuthErrorQuery = z.infer<typeof oauthErrorQuerySchema>;
