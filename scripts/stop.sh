#!/usr/bin/env bash
# Stop everything: dev servers first, then the docker infrastructure.
# Data volumes are preserved.
#
# Usage: scripts/stop.sh

source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

mkdir -p "$PIDS_DIR"
check_prerequisites

section "Dev servers"
for project in "${PROJECTS[@]}"; do
  stop_server "$project"
done

stop_infrastructure

section "Environment stopped"
ok "All servers and containers are down. Start again with: make start"
