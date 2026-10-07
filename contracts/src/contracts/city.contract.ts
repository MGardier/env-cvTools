import { oc } from '@orpc/contract';
import { z } from 'zod';
import { envelope } from '../shared/envelope.js';
import {
  citySearchItemSchema,
  searchCityQuerySchema,
} from '../schemas/city.schema.js';

export const cityContract = {
  search: oc
    .route({ method: 'GET', path: '/city/search' })
    .input(searchCityQuerySchema)
    .output(envelope(z.array(citySearchItemSchema))),
};
