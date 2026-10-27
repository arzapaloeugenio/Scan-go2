#!/usr/bin/env bash
# Verifica que Scan & Go 2 esté funcionando correctamente en Docker.
#
# Comprueba:
#   - Docker y Docker Compose disponibles
#   - .env.docker presente
#   - servicios db, backend y frontend en ejecución/sanos
#   - GET /api/health con database=connected
#   - GET /api/products con catálogo no vacío
#   - GET /api/products/7750123450013
#   - frontend disponible en el puerto 8000
#
# Sale con 0 solo si todas las comprobaciones pasan.
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
cd -- "${REPO_ROOT}"

ENV_FILE=".env.docker"
BACKEND_URL="${SCANGO_BACKEND_URL:-http://localhost:3000}"
FRONTEND_URL="${SCANGO_FRONTEND_URL:-http://localhost:8000}"
TIMEOUT_SECONDS="${SCANGO_TIMEOUT_SECONDS:-120}"

log() {
  printf '[docker-check] %s\n' "$*"
}

ok() {
  printf '[docker-check] OK: %s\n' "$*"
}

fail() {
  printf '[docker-check] ERROR: %s\n' "$*" >&2
  exit 1
}

compose() {
  docker compose --env-file "${ENV_FILE}" "$@"
}

command -v docker >/dev/null 2>&1 \
  || fail "Docker no está instalado o no está en el PATH."

docker compose version >/dev/null 2>&1 \
  || fail "Docker Compose (plugin 'docker compose') no está disponible."

docker info >/dev/null 2>&1 \
  || fail "No se puede acceder al demonio de Docker. Verifica que esté iniciado y que tu usuario tenga permisos."

command -v curl >/dev/null 2>&1 \
  || fail "curl no está instalado; es necesario para las comprobaciones HTTP."

[ -f "${ENV_FILE}" ] \
  || fail "No existe ${ENV_FILE}. Ejecuta primero ./scripts/docker-start.sh."

compose config --quiet >/dev/null 2>&1 \
  || fail "La configuración de Compose no es válida. Revisa ${ENV_FILE} (por ejemplo, POSTGRES_PASSWORD)."

log "Esperando a que db, backend y frontend estén en ejecución/sanos (máximo ${TIMEOUT_SECONDS}s)..."

services_ok=0
deadline=$((SECONDS + TIMEOUT_SECONDS))
while (( SECONDS < deadline )); do
  all_ok=1
  for service in db backend frontend; do
    container_id="$(compose ps -q "${service}" 2>/dev/null || true)"
    if [ -z "${container_id}" ]; then
      all_ok=0
      break
    fi

    state="$(docker inspect -f '{{.State.Status}}' "${container_id}" 2>/dev/null || true)"
    health="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "${container_id}" 2>/dev/null || true)"

    if [ "${state}" != "running" ]; then
      all_ok=0
      break
    fi
    if [ "${health}" != "none" ] && [ "${health}" != "healthy" ]; then
      all_ok=0
      break
    fi
  done

  if (( all_ok == 1 )); then
    services_ok=1
    break
  fi
  sleep 2
done

if (( services_ok == 0 )); then
  log "Estado actual de los servicios:"
  compose ps || true
  log "Últimos logs del backend:"
  compose logs --tail=50 backend || true
  fail "Los servicios no alcanzaron el estado running/healthy dentro del tiempo límite."
fi

# Estado final de los servicios.
for service in db backend frontend; do
  container_id="$(compose ps -q "${service}")"
  health="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "${container_id}")"
  ok "Servicio '${service}': running (health: ${health})"
done

# Health check de la API.
health_body="$(curl -fsS --max-time 10 "${BACKEND_URL}/api/health")" \
  || fail "GET /api/health no respondió correctamente."

[[ "${health_body}" == *'"success":true'* && "${health_body}" == *'"database":"connected"'* ]] \
  || fail "GET /api/health no devolvió success=true y database=connected."

ok "GET /api/health -> success=true, database=connected"

# Catálogo completo.
products_body="$(curl -fsS --max-time 10 "${BACKEND_URL}/api/products")" \
  || fail "GET /api/products no respondió correctamente."

[[ "${products_body}" == *'"success":true'* ]] \
  || fail "GET /api/products no devolvió success=true."

product_count="$(printf '%s' "${products_body}" | grep -o '"codigoBarras"' | wc -l | tr -d ' ' || true)"
(( product_count > 0 )) \
  || fail "GET /api/products devolvió un catálogo vacío."

ok "GET /api/products -> ${product_count} productos"

# Producto conocido.
product_body="$(curl -fsS --max-time 10 "${BACKEND_URL}/api/products/7750123450013")" \
  || fail "GET /api/products/7750123450013 no respondió correctamente."

[[ "${product_body}" == *'"success":true'* ]] \
  || fail "El producto 7750123450013 no devolvió success=true."

[[ "${product_body}" == *'"codigoBarras":"7750123450013"'* ]] \
  || fail "El producto 7750123450013 no devolvió el código esperado."

ok "GET /api/products/7750123450013 -> producto encontrado"

# Frontend.
frontend_body="$(curl -fsS --max-time 10 "${FRONTEND_URL}/")" \
  || fail "El frontend no respondió en ${FRONTEND_URL}/."

[[ "${frontend_body}" == *"<title>"* ]] \
  || fail "El frontend respondió, pero no parece ser index.html."

ok "Frontend disponible en ${FRONTEND_URL}/"

log "Todas las comprobaciones pasaron correctamente."
exit 0
