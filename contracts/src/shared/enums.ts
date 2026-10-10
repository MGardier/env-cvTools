import { z } from 'zod';

/********* USER (mirrors Prisma enums) *********/

export const userRoleSchema = z.enum(['ADMIN', 'USER']);
export const UserRole = userRoleSchema.enum;
export type TUserRole = z.infer<typeof userRoleSchema>;

export const userStatusSchema = z.enum(['ALLOWED', 'PENDING', 'BANNED']);
export const UserStatus = userStatusSchema.enum;
export type TUserStatus = z.infer<typeof userStatusSchema>;

/********* OAUTH (OAuth providers of Prisma LoginMethod) *********/

export const oauthLoginMethodSchema = z.enum(['GOOGLE', 'GITHUB']);
export const OAuthLoginMethod = oauthLoginMethodSchema.enum;
export type TOAuthLoginMethod = z.infer<typeof oauthLoginMethodSchema>;

/********* JOB (mirrors back-end LLM types) *********/

export const contractTypeSchema = z.enum([
  'CDI',
  'CDD',
  'FREELANCE',
  'ALTERNANCE',
]);
export const ContractType = contractTypeSchema.enum;
export type TContractType = z.infer<typeof contractTypeSchema>;

export const remotePolicySchema = z.enum(['FULL', 'HYBRID', 'ONSITE']);
export const RemotePolicy = remotePolicySchema.enum;
export type TRemotePolicy = z.infer<typeof remotePolicySchema>;

export const experienceLevelSchema = z.enum(['JUNIOR', 'MID', 'SENIOR']);
export const ExperienceLevel = experienceLevelSchema.enum;
export type TExperienceLevel = z.infer<typeof experienceLevelSchema>;

export const jobboardSchema = z.enum([
  'LINKEDIN',
  'INDEED',
  'WTTJ',
  'FRANCE_TRAVAIL',
  'GLASSDOOR',
  'APEC',
  'HELLO_WORK',
  'METEO_JOB',
  'UNKNOW',
]);
export const Jobboard = jobboardSchema.enum;
export type TJobboard = z.infer<typeof jobboardSchema>;
