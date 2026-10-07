import { z } from 'zod';
import { DtoErrorCode } from '../shared/errors.js';
import { strictInput } from '../shared/input.js';

const DEFAULT_CITY_LIMIT = 10;

/********* REQUEST *********/

export const searchCityQuerySchema = strictInput({
  city: z
    .string(DtoErrorCode.CITY_OR_POSTAL_CODE_REQUIRED)
    .max(100, DtoErrorCode.CITY_TOO_LONG)
    .optional(),
  postalCode: z
    .string(DtoErrorCode.CITY_OR_POSTAL_CODE_REQUIRED)
    .max(10, DtoErrorCode.CITY_POSTAL_CODE_TOO_LONG)
    .optional(),
  // Query strings arrive as strings: missing or non-numeric → default limit.
  limit: z
    .union([z.number(), z.string()], {
      error: DtoErrorCode.CITY_LIMIT_INVALID,
    })
    .optional()
    .transform((value) =>
      value === undefined || Number.isNaN(Number(value))
        ? DEFAULT_CITY_LIMIT
        : Number(value),
    )
    .pipe(
      z
        .number()
        .int(DtoErrorCode.CITY_LIMIT_INVALID)
        .positive(DtoErrorCode.CITY_LIMIT_INVALID),
    ),
}).refine((query) => query.city || query.postalCode, {
  message: DtoErrorCode.CITY_OR_POSTAL_CODE_REQUIRED,
});

/********* RESPONSE *********/

export const citySearchItemSchema = z.object({
  code: z.string(),
  name: z.string(),
  postalCodes: z.array(z.string()),
  departmentCode: z.string().optional(),
  regionCode: z.string().optional(),
  population: z.number().optional(),
});

export type TSearchCityQuery = z.infer<typeof searchCityQuerySchema>;
export type TCitySearchItem = z.infer<typeof citySearchItemSchema>;
