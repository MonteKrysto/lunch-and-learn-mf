# ==============================================================================
# Module Federation Lunch & Learn — docker orchestration
#
# The interesting target is `deploy`: it simulates ONE team's CI pipeline by
# rebuilding and rolling out a single app while everything else keeps running.
# Watch http://localhost:3100 while you do it — that's the whole lesson.
#
#   make up                     stand up the full "production" stack
#   make deploy app=claims      one team ships; nobody else redeploys
#   make ps                     who deployed recently?
# ==============================================================================

COMPOSE   := docker compose
SERVICES  := shell uikit claims worklist claims-api
SHELL_URL := http://localhost:3100

.DEFAULT_GOAL := help

.PHONY: help up down restart ps logs build deploy open ports clean dev install

help: ## Show available targets
	@echo ""
	@echo "  Module Federation demo — make targets"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-10s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "  apps: $(SERVICES)"
	@echo "  examples: make deploy app=claims · make logs app=claims-api"
	@echo ""

up: ## Build and start the full "production" stack (5 containers, dev-identical ports)
	$(COMPOSE) up -d --build
	@echo ""
	@echo "  Stack is up — every app its own container behind its own nginx:"
	@echo "    shell     $(SHELL_URL)"
	@echo "    uikit     http://localhost:3101"
	@echo "    claims    http://localhost:3102"
	@echo "    worklist  http://localhost:3103"
	@echo "    api       http://localhost:4100/health"
	@echo ""
	@echo "  (stop 'pnpm dev' first if ports were busy — same ports by design)"

down: ## Stop and remove the stack
	$(COMPOSE) down

restart: down up ## Full bounce of the stack

ps: ## Show containers with uptime — spot who deployed recently
	@docker ps --filter "label=com.docker.compose.project=lunch-and-learn-mfe" \
		--format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'

logs: ## Tail logs — all services, or one: make logs app=claims-api
	$(COMPOSE) logs -f $(app)

build: ## Build image(s) without rolling anything out — all, or one: make build app=claims
	$(COMPOSE) build $(app)

deploy: ## Simulate ONE team's CI: rebuild + roll out a single app (make deploy app=claims)
	@if [ -z "$(app)" ]; then \
		echo "usage: make deploy app=<one of: $(SERVICES)>"; exit 1; fi
	@case "$(app)" in \
		shell|uikit|claims|worklist|claims-api) ;; \
		*) echo "unknown app '$(app)' — pick one of: $(SERVICES)"; exit 1;; \
	esac
	@echo ""
	@echo "── $(app) team CI ─────────────────────────────────────────────"
	@echo "→ building the $(app) release (its own pipeline; no other team involved)"
	$(COMPOSE) build $(app)
	@echo "→ rolling out $(app) (only this container is replaced)"
	$(COMPOSE) up -d --no-deps $(app)
	@echo ""
	@echo "── deployed ───────────────────────────────────────────────────"
	@$(MAKE) --no-print-directory ps
	@echo ""
	@echo "  Note the ages above: $(app) is seconds old, everyone else untouched."
	@echo "  Pages already open still run the OLD $(app) — a deploy never yanks"
	@echo "  code out of a live session. Reload $(SHELL_URL) and the host"
	@echo "  composes the new release at runtime. The host was never redeployed."
	@echo ""

open: ## Open the composed app in your browser
	open $(SHELL_URL)

ports: ## Show what's listening on the demo ports (3100-3103, 4100)
	@for p in 3100 3101 3102 3103 4100; do \
		holder=$$(lsof -nP -iTCP:$$p -sTCP:LISTEN 2>/dev/null | awk 'NR==2 {print $$1}'); \
		echo "  $$p: $${holder:-free}"; \
	done

clean: ## Tear down and remove the built images
	$(COMPOSE) down --rmi local --remove-orphans

dev: ## Run everything in dev mode instead (turbo + HMR — not docker)
	pnpm dev

install: ## Install workspace dependencies
	pnpm install
