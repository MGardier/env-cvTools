# env-cvTools — orchestration commands
#
#   make start                  → everything (infra + back + all ms + front)
#   make start PROFILE=back     → same without the front dev server
#   make start PROFILE=ms-email → only ms-email and its dependencies
#   make stop                   → stop servers + containers (data preserved)
#   make restart                → stop then start
#   make contracts              → rebuild @cvtools/contracts + openapi.json, refresh back/front copies

PROFILE ?= full

.PHONY: start stop restart contracts

start:
	@bash scripts/start.sh $(PROFILE)

stop:
	@bash scripts/stop.sh

restart:
	@bash scripts/restart.sh $(PROFILE)

contracts:
	@bash scripts/contracts.sh
