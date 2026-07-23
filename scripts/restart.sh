#!/usr/bin/env bash
# Restart everything: full stop, then start.
#
# Usage: scripts/restart.sh [profile]   (default: full)

SCRIPT_DIR="$(dirname "${BASH_SOURCE[0]}")"

bash "$SCRIPT_DIR/stop.sh"
bash "$SCRIPT_DIR/start.sh" "${1:-full}"
