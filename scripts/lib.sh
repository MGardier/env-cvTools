#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
#  env-cvTools — shared helpers and project registry
#
#  Adding a new microservice:
#    1. Add its name to the PROJECTS array.
#    2. Fill the PROJECT_* maps below (dir, port, db cmd, start cmd).
#    3. Add its expected env vars in expected_env_for().
#    4. Add its services/profile in docker-compose.yml.
# ═══════════════════════════════════════════════════════════════════

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOGS_DIR="$ROOT_DIR/logs"
PIDS_DIR="$ROOT_DIR/.pids"
SERVER_START_TIMEOUT="${SERVER_START_TIMEOUT:-90}"

# ───────────────────────── Project registry ─────────────────────────

PROJECTS=(back ms-email ms-applications front)

declare -A PROJECT_DIR=(
  [back]="cvTools/back"
  [ms-email]="ms-email"
  [ms-applications]="ms-applications"
  [front]="cvTools/front"
)

# Fallback when PORT is not set in the project's .env
declare -A PROJECT_DEFAULT_PORT=(
  [back]=3000
  [ms-email]=3011
  [ms-applications]=3000
  [front]=5173
)

# Empty value → no database step for this project
declare -A PROJECT_DB_CMD=(
  [back]="pnpm prisma migrate deploy && pnpm prisma generate"
  [ms-email]="pnpm prisma migrate deploy && pnpm prisma generate && pnpm prisma db seed"
  [ms-applications]="pnpm prisma migrate deploy && pnpm prisma generate"
  [front]=""
)

declare -A PROJECT_START_CMD=(
  [back]="pnpm start:dev"
  [ms-email]="pnpm start:dev"
  [ms-applications]="pnpm start:dev"
  [front]="pnpm dev"
)

# Projects started for a given docker profile
projects_for_profile() {
  case "$1" in
    full) printf '%s\n' "${PROJECTS[@]}" ;;
    back) printf '%s\n' back ms-email ms-applications ;;
    ms-email) echo "ms-email" ;;
    ms-applications) echo "ms-applications" ;;
    *) die "Unknown profile '$1'. Valid profiles: full, back, ms-email, ms-applications" ;;
  esac
}

# Env vars each project must have to reach the central infrastructure.
# Values are built from the root .env (sourced in load_root_env).
expected_env_for() {
  case "$1" in
    back)
      cat <<EOF
DATABASE_URL=postgresql://${API_POSTGRES_USER}:${API_POSTGRES_PASSWORD}@localhost:5433/${API_POSTGRES_DB}
REDIS_URL=redis://localhost:6379
RABBITMQ_URL=amqp://${RABBITMQ_USER}:${RABBITMQ_PASSWORD}@localhost:5672
RABBITMQ_USER=${RABBITMQ_USER}
RABBITMQ_PASSWORD=${RABBITMQ_PASSWORD}
EOF
      ;;
    ms-email)
      cat <<EOF
DATABASE_URL=postgresql://${MS_EMAIL_POSTGRES_USER}:${MS_EMAIL_POSTGRES_PASSWORD}@localhost:5435/${MS_EMAIL_POSTGRES_DB}
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USER=${RABBITMQ_USER}
RABBITMQ_PASSWORD=${RABBITMQ_PASSWORD}
MAILPIT_HOST=localhost
MAILPIT_PORT=1025
EOF
      ;;
    ms-applications)
      cat <<EOF
DATABASE_URL=postgresql://${MS_APPLICATIONS_POSTGRES_USER}:${MS_APPLICATIONS_POSTGRES_PASSWORD}@localhost:5454/${MS_APPLICATIONS_POSTGRES_DB}
RABBITMQ_URL=amqp://${RABBITMQ_USER}:${RABBITMQ_PASSWORD}@localhost:5672
EOF
      ;;
  esac
}

# ───────────────────────── Output helpers ─────────────────────────

if [ -t 1 ]; then
  C_RED=$'\033[0;31m'; C_GREEN=$'\033[0;32m'; C_YELLOW=$'\033[0;33m'
  C_BLUE=$'\033[0;34m'; C_BOLD=$'\033[1m'; C_RESET=$'\033[0m'
else
  C_RED=""; C_GREEN=""; C_YELLOW=""; C_BLUE=""; C_BOLD=""; C_RESET=""
fi

info()    { echo "${C_BLUE}▸${C_RESET} $*"; }
ok()      { echo "${C_GREEN}✓${C_RESET} $*"; }
warn()    { echo "${C_YELLOW}⚠${C_RESET} $*"; }
section() { echo; echo "${C_BOLD}══ $* ══${C_RESET}"; }

die() {
  echo
  echo "${C_RED}${C_BOLD}✗ ERROR:${C_RESET} ${C_RED}$1${C_RESET}" >&2
  shift || true
  for line in "$@"; do echo "  ${C_RED}$line${C_RESET}" >&2; done
  exit 1
}

# ───────────────────────── Prerequisites ─────────────────────────

check_prerequisites() {
  command -v docker >/dev/null 2>&1 \
    || die "docker is not installed or not in PATH."
  docker info >/dev/null 2>&1 \
    || die "The docker daemon is not running." "Start it (e.g. 'sudo systemctl start docker') and retry."
  command -v pnpm >/dev/null 2>&1 \
    || die "pnpm is not installed or not in PATH."
}

load_root_env() {
  [ -f "$ROOT_DIR/.env" ] \
    || die "Missing $ROOT_DIR/.env" "Copy .env.example to .env and fill in the credentials."
  set -a
  # shellcheck disable=SC1091
  source "$ROOT_DIR/.env"
  set +a
}

# ───────────────────────── Docker helpers ─────────────────────────

compose() {
  docker compose --project-directory "$ROOT_DIR" "$@"
}

start_infrastructure() {
  local profile="$1"
  section "Docker infrastructure (profile: $profile)"
  if ! compose --profile "$profile" up -d --wait; then
    echo
    compose --profile "$profile" ps
    local failed
    failed=$(compose --profile "$profile" ps --format '{{.Service}} {{.Health}}' 2>/dev/null \
      | awk '$2 != "healthy" && $2 != "" {print $1}')
    for svc in $failed; do
      echo
      warn "Last logs of failing service '$svc':"
      compose logs --tail 20 "$svc" || true
    done
    die "Docker infrastructure failed to start (profile: $profile)." \
        "See the container logs above. Full logs: docker compose logs <service>"
  fi
  ok "All containers are up and healthy."
}

stop_infrastructure() {
  section "Docker infrastructure"
  compose --profile full --profile test down --remove-orphans \
    || die "Failed to stop the docker infrastructure." "Check 'docker compose ps' manually."
  ok "All containers stopped (volumes preserved)."
}

# ───────────────────────── .env sync ─────────────────────────

# Read the raw value of a key in an env file (last occurrence, quotes stripped)
read_env_var() {
  local file="$1" key="$2"
  grep -E "^[[:space:]]*${key}[[:space:]]*=" "$file" 2>/dev/null \
    | tail -1 \
    | sed -E "s/^[^=]*=[[:space:]]*//; s/^[\"']//; s/[\"'][[:space:]]*$//; s/[[:space:]]+$//"
}

# Ensure key=value in file: fix if different, append if missing. Reports changes.
ensure_env_var() {
  local file="$1" key="$2" value="$3"
  local current
  current="$(read_env_var "$file" "$key")"
  if [ "$current" = "$value" ]; then
    return 0
  fi
  if [ ! -f "${file}.bak" ]; then
    cp "$file" "${file}.bak"
  fi
  if grep -qE "^[[:space:]]*${key}[[:space:]]*=" "$file"; then
    KEY="$key" VALUE="$value" awk '
      BEGIN { key = ENVIRON["KEY"]; value = ENVIRON["VALUE"] }
      $0 ~ "^[[:space:]]*" key "[[:space:]]*=" { print key "=\"" value "\""; next }
      { print }
    ' "$file" > "${file}.tmp" && mv "${file}.tmp" "$file"
    warn "  $key: '$current' → '$value' (fixed)"
  else
    printf '\n%s="%s"\n' "$key" "$value" >> "$file"
    warn "  $key: missing → added"
  fi
  ENV_CHANGES=$((ENV_CHANGES + 1))
}

sync_project_env() {
  local name="$1"
  local dir="$ROOT_DIR/${PROJECT_DIR[$name]}"
  local env_file="$dir/.env"

  [ -d "$dir" ] || die "Project directory not found: $dir"

  if [ ! -f "$env_file" ]; then
    [ -f "$dir/.env.example" ] \
      || die "$name: no .env and no .env.example in $dir" "Cannot create the .env file."
    cp "$dir/.env.example" "$env_file"
    warn "$name: .env was missing — created from .env.example (review the placeholder values!)"
  fi

  ENV_CHANGES=0
  info "$name (${PROJECT_DIR[$name]}/.env)"
  while IFS='=' read -r key value; do
    [ -n "$key" ] || continue
    ensure_env_var "$env_file" "$key" "$value"
  done < <(expected_env_for "$name")

  if [ "$ENV_CHANGES" -eq 0 ]; then
    ok "  already in sync"
  else
    ok "  $ENV_CHANGES value(s) synchronized (backup: .env.bak)"
  fi
}

# ───────────────────────── Servers ─────────────────────────

project_port() {
  local name="$1"
  local env_file="$ROOT_DIR/${PROJECT_DIR[$name]}/.env"
  local port
  port="$(read_env_var "$env_file" "PORT")"
  echo "${port:-${PROJECT_DEFAULT_PORT[$name]}}"
}

port_is_open() {
  (exec 3<>"/dev/tcp/127.0.0.1/$1") 2>/dev/null && { exec 3>&- 3<&-; return 0; }
  return 1
}

run_db_setup() {
  local name="$1"
  local dir="$ROOT_DIR/${PROJECT_DIR[$name]}"
  if [ -z "${PROJECT_DB_CMD[$name]}" ]; then
    info "$name: no database step — skipped"
    return 0
  fi
  info "$name: ${PROJECT_DB_CMD[$name]}"
  if ! (cd "$dir" && eval "${PROJECT_DB_CMD[$name]}") > "$LOGS_DIR/$name-db.log" 2>&1; then
    echo
    tail -25 "$LOGS_DIR/$name-db.log" >&2
    die "$name: database setup failed (see output above)." \
        "Full log: $LOGS_DIR/$name-db.log"
  fi
  ok "$name: database ready (migrations applied, client generated)"
}

start_server() {
  local name="$1"
  local dir="$ROOT_DIR/${PROJECT_DIR[$name]}"
  local port pid_file log_file
  port="$(project_port "$name")"
  pid_file="$PIDS_DIR/$name.pid"
  log_file="$LOGS_DIR/$name.log"

  if [ -f "$pid_file" ] && kill -0 "$(cat "$pid_file")" 2>/dev/null; then
    warn "$name: already running (PID $(cat "$pid_file")) — skipped"
    return 0
  fi
  if port_is_open "$port"; then
    die "$name: port $port is already in use by another process." \
        "Stop it or change PORT in ${PROJECT_DIR[$name]}/.env, then retry."
  fi

  info "$name: starting '${PROJECT_START_CMD[$name]}' (port $port)"
  # setsid detaches the server into its own session/process group so the
  # whole tree (pnpm + node children) can be stopped with kill -- -PID.
  setsid bash -c "cd '$dir' && exec ${PROJECT_START_CMD[$name]}" \
    > "$log_file" 2>&1 < /dev/null &
  echo $! > "$pid_file"
  disown

  local waited=0
  while ! port_is_open "$port"; do
    if ! kill -0 "$(cat "$pid_file")" 2>/dev/null; then
      echo
      tail -25 "$log_file" >&2
      die "$name: the server process died during startup (see output above)." \
          "Full log: $log_file"
    fi
    if [ "$waited" -ge "$SERVER_START_TIMEOUT" ]; then
      echo
      tail -25 "$log_file" >&2
      die "$name: server did not answer on port $port after ${SERVER_START_TIMEOUT}s." \
          "Full log: $log_file"
    fi
    sleep 2; waited=$((waited + 2))
  done
  ok "$name: up on http://localhost:$port (log: logs/$name.log)"
}

stop_server() {
  local name="$1"
  local pid_file="$PIDS_DIR/$name.pid"
  [ -f "$pid_file" ] || { info "$name: not running (no PID file)"; return 0; }

  local pid
  pid="$(cat "$pid_file")"
  if kill -0 "$pid" 2>/dev/null; then
    kill -TERM -- "-$pid" 2>/dev/null || kill -TERM "$pid" 2>/dev/null || true
    local waited=0
    while kill -0 "$pid" 2>/dev/null && [ "$waited" -lt 15 ]; do
      sleep 1; waited=$((waited + 1))
    done
    if kill -0 "$pid" 2>/dev/null; then
      warn "$name: did not stop gracefully — killing"
      kill -KILL -- "-$pid" 2>/dev/null || kill -KILL "$pid" 2>/dev/null || true
    fi
    ok "$name: stopped"
  else
    info "$name: was not running (stale PID file)"
  fi
  rm -f "$pid_file"
}
