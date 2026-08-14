#!/usr/bin/env sh
set -eu

environment="${1:-development}"
mode="${2:---dry-run}"
confirmation="${3:-}"
root="$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)"

case "$environment" in development|staging|production) ;; *) echo "Entorno inválido." >&2; exit 1;; esac

echo "Entorno: $environment"
find "$root/supabase/migrations" -maxdepth 1 -type f -name '*.sql' -print | sort

if [ "$mode" != "--apply" ]; then
  echo "DRY-RUN: no se modificó la base. Usa --apply para ejecutar."
  exit 0
fi

: "${SUPABASE_DB_URL:?Falta SUPABASE_DB_URL}"
command -v psql >/dev/null 2>&1 || { echo "psql no está instalado." >&2; exit 1; }

if [ "$environment" = "production" ]; then
  [ "$confirmation" = "APLICAR RED TECNICOS PRODUCCION" ] || { echo "Confirmación de producción incorrecta." >&2; exit 1; }
  [ "${SUPABASE_BACKUP_VERIFIED:-}" = "true" ] || { echo "Producción requiere SUPABASE_BACKUP_VERIFIED=true." >&2; exit 1; }
fi

find "$root/supabase/migrations" -maxdepth 1 -type f -name '*.sql' -print | sort | while IFS= read -r migration; do
  echo "Aplicando $(basename "$migration")..."
  psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f "$migration"
done

echo "Migraciones aplicadas correctamente."
