#!/usr/bin/env bash
# Inicia Scan & Go 2 con Docker Compose.
#
# - Crea .env.docker desde .env.docker.example solo si no existe.
# - Nunca sobrescribe un .env.docker existente.
# - No crea backend/.env: dentro de Docker las variables las provee compose.yaml.
# - No imprime secretos.
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
cd -- "${REPO_ROOT}"

ENV_FILE=".env.docker"
ENV_EXAMPLE=".env.docker.example"

log() {
  printf '[docker-start] %s\n' "$*"
}

fail() {
  printf '[docker-start] ERROR: %s\n' "$*" >&2
  exit 1
}

command -v docker >/dev/null 2>&1 \
  || fail "Docker no está instalado o no está en el PATH."

docker compose version >/dev/null 2>&1 \
  || fail "Docker Compose (plugin 'docker compose') no está disponible."

docker info >/dev/null 2>&1 \
  || fail "No se puede acceder al demonio de Docker. Verifica que esté iniciado y que tu usuario tenga permisos."

[ -f "compose.yaml" ] \
  || fail "No se encontró compose.yaml en ${REPO_ROOT}."

[ -f "${ENV_EXAMPLE}" ] \
  || fail "No se encontró ${ENV_EXAMPLE} en ${REPO_ROOT}."

if [ ! -e "${ENV_FILE}" ]; then
  cp -- "${ENV_EXAMPLE}" "${ENV_FILE}"
  chmod 600 "${ENV_FILE}"
  log "Creado ${ENV_FILE} a partir de ${ENV_EXAMPLE}."
else
  log "${ENV_FILE} ya existe; no se sobrescribe."
fi

log "ADVERTENCIA: si ${ENV_FILE} conserva la contraseña de ejemplo, es SOLO para evaluación/demostración local."
log "Cámbiala antes de usar el proyecto fuera de una prueba local."

log "Construyendo imágenes y levantando servicios..."
docker compose --env-file "${ENV_FILE}" up --build -d

log "Estado de los servicios:"
docker compose --env-file "${ENV_FILE}" ps

cat <<'EOF'

[docker-start] Servicios iniciados.

  Frontend:  http://localhost:8000
  Backend:   http://localhost:3000
  Health:    http://localhost:3000/api/health
  Producto:  http://localhost:3000/api/products/7750123450013

  Verificación:  ./scripts/docker-check.sh
  Estado:        docker compose --env-file .env.docker ps
  Logs:          docker compose --env-file .env.docker logs --tail=100

  ADVERTENCIA: no ejecutes "docker compose --env-file .env.docker down -v"
  salvo que quieras borrar el volumen persistente y los datos de PostgreSQL.

EOF
