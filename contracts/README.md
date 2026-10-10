# @cvtools/contracts

API contracts shared between `cvTools/back` (NestJS) and `cvTools/front` (React), built with [oRPC](https://orpc.dev) (`@orpc/contract`) and Zod 4.

The contract is the single source of truth for every typed HTTP route: method, path, success status, input schema (body / query) and output schema.

## Layout

```
src/
├── shared/
│   ├── envelope.ts   # envelope(schema) → { success, status, message?, data, timestamp, path }
│   ├── errors.ts     # ErrorCode, DtoErrorCode, errorDataSchema ({ errors?, path, timestamp })
│   ├── enums.ts      # UserRole, UserStatus, ContractType, RemotePolicy, ExperienceLevel, Jobboard
│   └── input.ts      # strictInput(shape)
├── schemas/          # Zod request / response schemas, one file per domain
├── contracts/        # oc.route(...).input(...).output(...), one file per domain
└── index.ts          # `contract` router + re-exports
```

## Conventions

- **Validation messages are codes** (`DtoErrorCode`), The front translates them. A text message is an exception and must be justified.
- **Inputs use `strictInput(shape)`**: unknown fields are rejected with `FIELD_NOT_ALLOWED` , a non-object payload with `INPUT_INVALID`.
- **Outputs use `z.object`**: undeclared fields (password hash, tokens...) are stripped by the server before sending.
- **Success responses are wrapped** with `envelope(schema)`.
- **Errors** follow the oRPC format `{ defined, code, status, message, data }`, with `code` in `ErrorCode` and `data` matching `errorDataSchema`.
- OAuth redirect routes, `/health`, and the `offer` and `scraper` modules are intentionally **outside** the contract.
  The OAuth **return URL query string** is in the contract (`oauthSuccessQuerySchema`, `oauthErrorQuerySchema`):
  the back builds it, the front parses it. Its base URL stays environment config.

## Usage

```bash
pnpm install
pnpm build         # emits dist/ (required by back and front)
pnpm build:watch   # rebuild on change during development
pnpm openapi       # build + regenerate openapi.json (OpenAPI 3.1)
```

`openapi.json` documents every contract route (method, path, status, body/query, success envelope).
It can be imported in Postman / Insomnia / Swagger UI. Regenerate it after every contract change.
Error responses are not listed per route: they all follow the format described in *Conventions*.

Back and front depend on it through `"@cvtools/contracts": "file:../../contracts"`.

> ⚠️ pnpm **copies** a `file:` dependency into the consumer's `node_modules` (no symlink).
> After every change to the contract: `pnpm build` here, then `pnpm install` in `cvTools/back` **and** `cvTools/front`.

## Versioning

`@orpc/contract` is pinned to an exact version. Back and front must pin the same version for every `@orpc/*` package.
