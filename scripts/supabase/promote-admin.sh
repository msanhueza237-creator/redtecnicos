#!/usr/bin/env sh
set -eu

: "${SUPABASE_DB_URL:?Falta SUPABASE_DB_URL}"
[ "$#" -eq 2 ] || { echo "Uso: promote-admin.sh correo motivo" >&2; exit 1; }
command -v psql >/dev/null 2>&1 || { echo "psql no está instalado." >&2; exit 1; }

root="$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)"
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 \
  -v "admin_email=$1" -v "reason=$2" \
  -f "$root/supabase/roles/bootstrap-admin.sql"

echo "Rol superadmin asignado y auditado. La contraseña continúa administrada por Supabase Auth."
