import { z } from 'zod';

/********* BUSINESS ERROR CODES *********/

export const errorCodeSchema = z.enum([
  'INTERNAL_SERVER_ERROR',
  'VALIDATION_ERROR',

  //UNICITY CONSTRAINT
  'DEFAULT_ALREADY_EXISTS_ERROR',
  'EMAIL_ALREADY_EXISTS_ERROR',
  'CLASSIC_ACCOUNT_ALREADY_EXISTS_ERROR',
  'OAUTH_ACCOUNT_ALREADY_EXISTS_ERROR',
  'GOOGLE_ACCOUNT_ALREADY_LINK_ERROR',

  //TOKEN
  'TOKEN_EXPIRED',
  'TOKEN_INVALID',

  //NOT FOUND
  'DEFAULT_NOT_FOUND_ERROR',
  'USER_NOT_FOUND_ERROR',

  //OAUTH
  'GITHUB_COMPLETED_OAUTH_FAILED',
  'GOOGLE_COMPLETED_OAUTH_FAILED',
  'OAUTH_LOGIN_FAILED',
  'OAUTH_EMAIL_MISMATCH',
  'OAUTH_EMAIL_NOT_VERIFIED',
  'OAUTH_EMAIL_NOT_AVAILABLE',

  //ADMIN INVITATION
  'ADMIN_INVITATION_TOKEN_MISSING',
  'ADMIN_INVITATION_SESSION_LOST',

  //AUTH
  'INVALID_CREDENTIALS',
  'ACCOUNT_PENDING',
  'USER_BANNED',
  'ACCOUNT_ALREADY_CONFIRM',

  //SCRAPER
  'SCRAPER_EXTRACTION_FAILED_ERROR',
  'SCRAPER_URL_TOO_LONG',
  'SCRAPER_URL_INVALID',
  'SCRAPER_URL_DOMAIN_NOT_SUPPORTED',

  //LLM
  'LLM_STRUCTURING_FAILED_ERROR',
  'LLM_FETCH_AND_MAP_FAILED_ERROR',

  //FRANCE TRAVAIL
  'FRANCE_TRAVAIL_INVALID_PAYLOAD',
  'FRANCE_TRAVAIL_INVALID_CREDENTIALS',
  'FRANCE_TRAVAIL_RATE_LIMIT',
  'FRANCE_TRAVAIL_API_UNAVAILABLE',

  //RATE LIMIT
  'RATE_LIMIT_EXCEEDED',
]);

export const ErrorCode = errorCodeSchema.enum;
export type TErrorCode = z.infer<typeof errorCodeSchema>;

/********* VALIDATION ERROR CODES *********/

export const dtoErrorCodeSchema = z.enum([
  /********* INPUT *********/
  'INPUT_INVALID',
  'FIELD_NOT_ALLOWED',

  /********* TOKEN *********/
  'TOKEN_REQUIRED',
  'TOKEN_INVALID',

  /********* EMAIL *********/
  'EMAIL_INVALID',
  'EMAIL_REQUIRED',

  /********* PASSWORD *********/
  'PASSWORD_REQUIRED',
  'PASSWORD_MIN_LENGTH',
  'PASSWORD_WEAK',

  /********* KEYWORD *********/
  'KEYWORD_REQUIRED',
  'KEYWORD_TOO_LONG',

  /********* CITY *********/
  'CITY_OR_POSTAL_CODE_REQUIRED',
  'CITY_TOO_LONG',
  'CITY_POSTAL_CODE_TOO_LONG',
  'CITY_LIMIT_INVALID',

  /********* GEO CODES (INSEE) *********/
  'CITY_CODE_INVALID',
  'DEPARTMENT_CODE_INVALID',
  'REGION_CODE_INVALID',
]);

export const DtoErrorCode = dtoErrorCodeSchema.enum;
export type TDtoErrorCode = z.infer<typeof dtoErrorCodeSchema>;

/********* ERROR PAYLOAD *********/

/**
 * `data` carried by every error response (oRPC error format:
 * `{ defined, code, status, message, data }`).
 */
export const errorDataSchema = z.object({
  errors: z.array(z.string()).optional(),
  path: z.string(),
  timestamp: z.iso.datetime(),
});

export type TErrorData = z.infer<typeof errorDataSchema>;
