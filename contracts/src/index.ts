import type {
  ContractRouterClient,
  InferContractRouterInputs,
  InferContractRouterOutputs,
} from '@orpc/contract';
import { adminContract } from './contracts/admin.contract.js';
import { authContract } from './contracts/auth.contract.js';
import { cityContract } from './contracts/city.contract.js';

export const contract = {
  auth: authContract,
  admin: adminContract,
  city: cityContract,
};

export type TContract = typeof contract;
export type TContractInputs = InferContractRouterInputs<TContract>;
export type TContractOutputs = InferContractRouterOutputs<TContract>;
export type TContractClient = ContractRouterClient<TContract>;

export * from './shared/envelope.js';
export * from './shared/errors.js';
export * from './shared/enums.js';
export * from './shared/input.js';
export * from './schemas/auth.schema.js';
export * from './schemas/admin.schema.js';
export * from './schemas/city.schema.js';
