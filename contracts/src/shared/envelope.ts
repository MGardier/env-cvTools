import { z } from 'zod';

/**
 * Success envelope returned by every contract route.
 * Mirrors the historical back-end ResponseInterceptor shape.
 */
export const envelope = <T extends z.ZodType>(data: T) =>
  z.object({
    success: z.literal(true),
    status: z.number().int(),
    message: z.string().optional(),
    data,
    timestamp: z.iso.datetime(),
    path: z.string(),
  });

export type TEnvelope<T> = {
  success: true;
  status: number;
  message?: string;
  data: T;
  timestamp: string;
  path: string;
};
