# env-cvTools

Orchestration workspace for the cvTools ecosystem: it centralizes the docker
infrastructure (databases, RabbitMQ, Redis, Mailpit, pgAdmin) and the dev
servers of every project in a single place, driven by three commands.

Each project folder (`cvTools/`, `ms-email/`, `ms-applications/`, ...) has its
own git repository and is ignored by this one — only the orchestration files
are versioned here.

## Prerequisites

- Docker (daemon running)
- `pnpm`
- `make`
- A root `.env` file: `cp .env.example .env` and fill in the credentials.

## Commands

| Command | What it does |
|---|---|
| `make start` | Starts everything: docker infra (waits until healthy), checks & syncs each project's `.env`, applies Prisma migrations + generates clients, then starts the dev servers. |
| `make stop` | Stops the dev servers, then the containers. Data volumes are preserved. |
| `make restart` | `stop` then `start`. |

Every step reports success (`✓`) or failure (`✗`) explicitly; on failure the
command prints the faulty service/project with the last lines of its log.

### Profiles

Pick what to run with `make start PROFILE=<name>` (default: `full`):

| Profile | Infra | Dev servers |
|---|---|---|
| `full` | everything | back + ms-email + ms-applications + front |
| `back` | everything | back + ms-email + ms-applications |
| `ms-email` | its postgres, rabbitmq, mailpit | ms-email only |
| `ms-applications` | its postgres, rabbitmq | ms-applications only |
| `test` | ephemeral test db + redis | none (used by cvTools/back tests, via `docker compose --profile test up -d`) |

## Services & ports

| Service | URL / port |
|---|---|
| cvTools front | http://localhost:5173 |
| cvTools back API | http://localhost:3000 |
| ms-email (health) | http://localhost:3011 |
| ms-applications | http://localhost:3001 (health: `/health`) |
| api-postgres (cv_tools) | localhost:5433 |
| ms-email-postgres | localhost:5435 |
| ms-applications-postgres | localhost:5454 |
| test-postgres (ephemeral) | localhost:5434 |
| RabbitMQ (AMQP / UI) | localhost:5672 / http://localhost:15672 |
| Redis | localhost:6379 |
| Mailpit (SMTP / UI) | localhost:1025 / http://localhost:8025 |
| pgAdmin | http://localhost:5050 |

## Logs & runtime files

- Server logs: `logs/<project>.log` (e.g. `tail -f logs/back.log`)
- Database setup logs: `logs/<project>-db.log`
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

## Adding a new microservice

1. `docker-compose.yml`: add its database (dedicated host port,
   `profiles: ["back", "full", "<ms-name>"]`) and add `<ms-name>` to the
   profiles of the shared services it needs (rabbitmq, mailpit...).
2. `scripts/lib.sh`: add the project to `PROJECTS` and the `PROJECT_*` maps
   (directory, default port, db command, start command), list its expected
   env vars in `expected_env_for()`, and add its profile in
   `projects_for_profile()`.
3. Optional: register its database in `docker/pgadmin/servers.json`.
