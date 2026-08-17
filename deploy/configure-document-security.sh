#!/usr/bin/env sh
set -eu

APPLICATION_ID="${DOKPLOY_APPLICATION_ID:-c8ZXIr6aHFknfH7lFIqE-}"
APPLICATION_SERVICE="${DOKPLOY_APPLICATION_SERVICE:-redtecnicos-9ev0vo}"
APP_ENV_FILE="${DOKPLOY_APP_ENV_FILE:-/etc/dokploy/applications/redtecnicos-9ev0vo/code/.env}"
SUPABASE_ENV_FILE="${SUPABASE_ENV_FILE:-/etc/dokploy/compose/red-tecnicos-refrigeracion-de-chile-supabase-yawo00/code/.env}"
BACKUP_DIR="${BACKUP_DIR:-/root/backups/redtecnicos}"
DOKPLOY_DB_SERVICE="${DOKPLOY_DB_SERVICE:-dokploy-postgres}"
DOKPLOY_DB_CONTAINER="${DOKPLOY_DB_CONTAINER:-}"

if [ -z "$DOKPLOY_DB_CONTAINER" ]; then
  DOKPLOY_DB_CONTAINER="$(docker ps \
    --filter "label=com.docker.swarm.service.name=$DOKPLOY_DB_SERVICE" \
    --format '{{.Names}}' \
    | head -n 1)"
fi

if [ -z "$DOKPLOY_DB_CONTAINER" ]; then
  echo "No se encontró el contenedor PostgreSQL activo de Dokploy." >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
backup_file="$BACKUP_DIR/dokploy-app-env-before-document-security-$timestamp.txt"
working_file="$(mktemp)"
trap 'rm -f "$working_file"' EXIT HUP INT TERM

service_role_key="$(sed -n 's/^SERVICE_ROLE_KEY=//p' "$SUPABASE_ENV_FILE" | head -n 1)"
if [ -z "$service_role_key" ]; then
  echo "No se encontró SERVICE_ROLE_KEY en la configuración privada de Supabase." >&2
  exit 1
fi

docker exec "$DOKPLOY_DB_CONTAINER" \
  psql -U dokploy -d dokploy -At \
  -c "select coalesce(env, '') from application where \"applicationId\" = '$APPLICATION_ID'" \
  > "$backup_file"
chmod 600 "$backup_file"

if [ ! -s "$backup_file" ]; then
  echo "No se encontró la aplicación de Red Técnicos en Dokploy." >&2
  exit 1
fi

grep -v '^SUPABASE_SERVICE_ROLE_KEY=' "$backup_file" > "$working_file" || true
printf '\nSUPABASE_SERVICE_ROLE_KEY=%s\n' "$service_role_key" >> "$working_file"
chmod 600 "$working_file"

encoded_env="$(base64 -w 0 "$working_file")"
docker exec "$DOKPLOY_DB_CONTAINER" \
  psql -v ON_ERROR_STOP=1 -U dokploy -d dokploy \
  -c "update application set env = convert_from(decode('$encoded_env', 'base64'), 'UTF8') where \"applicationId\" = '$APPLICATION_ID'" \
  >/dev/null

install -m 600 "$working_file" "$APP_ENV_FILE"

docker service update \
  --env-add "SUPABASE_SERVICE_ROLE_KEY=$service_role_key" \
  --detach=true \
  "$APPLICATION_SERVICE" >/dev/null

configured="$(docker exec "$DOKPLOY_DB_CONTAINER" \
  psql -U dokploy -d dokploy -At \
  -c "select env from application where \"applicationId\" = '$APPLICATION_ID'" \
  | grep -c '^SUPABASE_SERVICE_ROLE_KEY=' || true)"

if [ "$configured" -ne 1 ]; then
  echo "La llave privada no quedó configurada exactamente una vez en Dokploy." >&2
  exit 1
fi

echo "Llave privada de Supabase configurada sin exponer su valor."
echo "Respaldo cifrable/privado guardado en: $backup_file"
