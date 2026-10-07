#!/usr/bin/env bash
# Rebuild @cvtools/contracts after a change: build, regenerate openapi.json,
# then refresh its copy in every consumer (pnpm copies file: dependencies).
# Restart the running dev servers afterwards (make restart) to load the new contract.
#
# Usage: scripts/contracts.sh

source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

mkdir -p "$LOGS_DIR"
command -v pnpm >/dev/null 2>&1 || die "pnpm is not installed or not in PATH."

section "API contracts (@cvtools/contracts)"
mapfile -t CONTRACT_CONSUMERS < <(contract_consumers "${PROJECTS[@]}")
prepare_contracts "${CONTRACT_CONSUMERS[@]}"

info "contracts: pnpm openapi"
if ! (cd "$CONTRACTS_DIR" && pnpm openapi) >> "$LOGS_DIR/contracts.log" 2>&1; then
  echo
  tail -25 "$LOGS_DIR/contracts.log" >&2
  die "contracts: openapi.json generation failed (see output above)." \
      "Full log: $LOGS_DIR/contracts.log"
fi
ok "contracts: openapi.json regenerated (contracts/openapi.json)"

echo
echo "  Restart the dev servers to load the new contract:   make restart"
