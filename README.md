# env-cvTools

Orchestration workspace for the cvTools ecosystem: it centralizes the docker
infrastructure (databases, RabbitMQ, Redis, Mailpit, pgAdmin) and the dev
servers of every project in a single place, driven by three commands.

Each project folder (`cvTools/`, `ms-email/`, ...) has its
own git repository and is ignored by this one — only the orchestration files
and the shared API contracts (`contracts/`) are versioned here.

## Prerequisites

- Docker (daemon running)
- `pnpm`
- `make`
- A root `.env` file: `cp .env.example .env` and fill in the credentials.

## Commands

| Command | What it does |
|---|---|
| `make start` | Starts everything: docker infra (waits until healthy), checks & syncs each project's `.env`, builds the API contracts and refreshes them in back/front, applies Prisma migrations + generates clients, then starts the dev servers and waits until each one answers HTTP 200 on its health URL (`/health` for the APIs, `/` for the front). |
| `make stop` | Stops the dev servers then the containers, and verifies the shutdown: each server port must stop answering and no container may remain. Data volumes are preserved. |
| `make restart` | `stop` then `start`, with both verifications. |
| `make contracts` | Rebuilds `@cvtools/contracts`, regenerates `contracts/openapi.json` and refreshes the contract in back and front. Run it after every contract change, then `make restart`. |

Every step reports success (`✓`) or failure (`✗`) explicitly; on failure the
command prints the faulty service/project with the last lines of its log.

### Profiles

Pick what to run with `make start PROFILE=<name>` (default: `full`):

| Profile | Infra | Dev servers |
|---|---|---|
| `full` | everything | back + ms-email + front |
| `back` | everything | back + ms-email |
| `ms-email` | its postgres, rabbitmq, mailpit | ms-email only |
| `test` | ephemeral test db + redis | none (used by cvTools/back tests, via `docker compose --profile test up -d`) |

## Services & ports

| Service | URL / port |
|---|---|
| cvTools front | http://localhost:5173 |
| cvTools back API | http://localhost:3000 |
| ms-email (health) | http://localhost:3011 |
| api-postgres (cv_tools) | localhost:5433 |
| ms-email-postgres | localhost:5435 |
| test-postgres (ephemeral) | localhost:5434 |
| RabbitMQ (AMQP / UI) | localhost:5672 / http://localhost:15672 |
| Redis | localhost:6379 |
| Mailpit (SMTP / UI) | localhost:1025 / http://localhost:8025 |
| pgAdmin | http://localhost:5050 |

## API contracts (`contracts/`)

`contracts/` holds `@cvtools/contracts`: the typed HTTP routes shared by
`cvTools/back` and `cvTools/front` (oRPC + Zod). Both consume it through
`"@cvtools/contracts": "file:../../contracts"`, so they must be cloned inside
this workspace. See `contracts/README.md` for its conventions.

pnpm **copies** a `file:` dependency into each consumer's `node_modules`:
after a contract change, the consumers must reinstall. `make start` does it
automatically; while the servers are running, use `make contracts` then
`make restart`.

`contracts/openapi.json` documents the contract routes (import it in
Postman / Insomnia / Swagger UI).

## Logs & runtime files

- Server logs: `logs/<project>.log` (e.g. `tail -f logs/back.log`)
- Database setup logs: `logs/<project>-db.log`
- Contracts build logs: `logs/contracts.log`
- PID files: `.pids/` (managed by the scripts, do not edit)

## .env synchronization

`make start` verifies that each project's `.env` points to the central
infrastructure (database URLs, RabbitMQ, Mailpit...). Wrong values are fixed
automatically — the original file is backed up as `.env.bak` and every change
is printed. A missing `.env` is created from the project's `.env.example`
(review the placeholder values afterwards!).

## Troubleshooting

- **"The docker daemon is not running"** → start Docker, retry.
- **"port XXXX is already in use"** → another process holds the port; stop it
  or change `PORT` in the project's `.env`.
- **A container is unhealthy** → the command prints its last logs; get more
  with `docker compose logs <service>`.
- **A server did not answer in time** → see `logs/<project>.log`; the timeout
  can be raised with `SERVER_START_TIMEOUT=180 make start`.
- **Type errors on `@cvtools/contracts` / stale contract** → run `make contracts`
  (see `logs/contracts.log`), then `make restart`.

## Adding a new microservice

1. `docker-compose.yml`: add its database (dedicated host port,
   `profiles: ["back", "full", "<ms-name>"]`) and add `<ms-name>` to the
   profiles of the shared services it needs (rabbitmq, mailpit...).
2. `scripts/lib.sh`: add the project to `PROJECTS` and the `PROJECT_*` maps
   (directory, default port, db command, start command), list its expected
   env vars in `expected_env_for()`, and add its profile in
   `projects_for_profile()`. Set `PROJECT_USES_CONTRACTS` if it depends on
   `@cvtools/contracts`.
3. Optional: register its database in `docker/pgadmin/servers.json`.
