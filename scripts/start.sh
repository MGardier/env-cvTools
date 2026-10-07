#!/usr/bin/env bash
# Start the whole environment: docker infrastructure, .env sync,
# API contracts build, database migrations, then the dev servers.
#
# Usage: scripts/start.sh [profile]   (default: full)
#   full            → infra + back + ms-email + front
#   back            → same as full, without the front dev server
#   ms-email        → its infra + ms-email server only

source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

PROFILE="${1:-full}"
mapfile -t ACTIVE_PROJECTS < <(projects_for_profile "$PROFILE")

mkdir -p "$LOGS_DIR" "$PIDS_DIR"
check_prerequisites
load_root_env

start_infrastructure "$PROFILE"

section "Checking & synchronizing project .env files"
for project in "${ACTIVE_PROJECTS[@]}"; do
  sync_project_env "$project"
done

section "API contracts (@cvtools/contracts)"
mapfile -t CONTRACT_CONSUMERS < <(contract_consumers "${ACTIVE_PROJECTS[@]}")
prepare_contracts "${CONTRACT_CONSUMERS[@]}"

section "Databases (migrations & client generation)"
for project in "${ACTIVE_PROJECTS[@]}"; do
  run_db_setup "$project"
done

section "Dev servers"
for project in "${ACTIVE_PROJECTS[@]}"; do
  start_server "$project"
done

section "Environment ready"
ok "Profile '$PROFILE' is fully up."
echo
echo "  Servers:"
for project in "${ACTIVE_PROJECTS[@]}"; do
  printf '    %-16s http://localhost:%s   (logs/%s.log)\n' "$project" "$(project_port "$project")" "$project"
done
echo
echo "  Infrastructure:"
echo "    rabbitmq UI      http://localhost:15672"
if [ "$PROFILE" = "full" ] || [ "$PROFILE" = "back" ]; then
  echo "    pgadmin          http://localhost:5050"
fi
echo "    mailpit UI       http://localhost:8025"
echo
echo "  Stop everything:   make stop"
echo "  Restart:           make restart"
