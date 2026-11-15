# =============================================================================
# Makefile — Comandos Rápidos de Desarrollo y Testing (Sistema Posgrado UTN)
# Diseñado para entornos Linux, macOS y Windows (WSL / Git Bash).
# En Windows nativo (PowerShell/CMD), utilizar comandos docker compose directos.
# =============================================================================

.PHONY: help up down restart logs status test test-cov db-shell clean

# Colorines para terminal
CYAN  := \033[36m
GREEN := \033[32m
RESET := \033[0m

help: ## Muestra este menú de ayuda con los comandos disponibles
	@echo "$(CYAN)Sistema de Posgrado UTN FRLP — Comandos Disponibles:$(RESET)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-15s$(RESET) %s\n", $$1, $$2}'

up: ## Levanta todos los servicios en segundo plano con Docker Compose
	docker compose up -d

down: ## Detiene y remueve los contenedores de la red
	docker compose down

restart: ## Reinicia los contenedores de desarrollo
	docker compose restart

logs: ## Sigue los logs en tiempo real de todos los servicios
	docker compose logs -f

status: ## Verifica el estado y healthcheck de los contenedores
	docker compose ps

test: ## Ejecuta la suite de pruebas automatizadas Pytest dentro del backend
	docker compose exec backend pytest -v

test-cov: ## Ejecuta las pruebas con reporte de cobertura de código
	docker compose exec backend pytest --cov=src --cov-report=term-missing

db-shell: ## Abre una terminal interactiva de PostgreSQL (psql)
	docker compose exec db psql -U postgrado_user -d postgrado_dev

clean: ## Detiene contenedores y elimina volúmenes de datos (RESET COMPLETO)
	docker compose down -v

