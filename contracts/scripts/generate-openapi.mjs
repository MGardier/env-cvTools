// Generates openapi.json from the compiled contract (run `pnpm build` first).
// Usage: pnpm openapi
import { writeFile } from 'node:fs/promises';
import { OpenAPIGenerator } from '@orpc/openapi';
import { ZodToJsonSchemaConverter } from '@orpc/zod/zod4';
import { contract } from '../dist/index.js';

const OUTPUT_FILE = new URL('../openapi.json', import.meta.url);

const generator = new OpenAPIGenerator({
  schemaConverters: [new ZodToJsonSchemaConverter()],
});

const spec = await generator.generate(contract, {
  info: {
    title: 'cvTools API',
    version: '0.1.0',
    description:
      'Typed routes of @cvtools/contracts (auth, admin, city). ' +
      'Errors: { defined, code, status, message, data: { errors?, path, timestamp } }.',
  },
  servers: [{ url: 'http://localhost:3000' }],
});

await writeFile(OUTPUT_FILE, `${JSON.stringify(spec, null, 2)}\n`);
console.log(`OpenAPI spec written to ${OUTPUT_FILE.pathname}`);
