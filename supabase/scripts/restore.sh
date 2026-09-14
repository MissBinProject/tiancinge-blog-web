#!/usr/bin/env bash
set -euo pipefail

# Restore a custom-format PostgreSQL backup.
# This replaces objects in the target database. Require an explicit confirmation:
# CONFIRM_RESTORE=YES SUPABASE_DB_URL='postgresql://...' ./supabase/scripts/restore.sh backups/file.dump

if [[ "${CONFIRM_RESTORE:-}" != "YES" ]]; then
  echo "Refusing to restore. Set CONFIRM_RESTORE=YES after verifying the target database and backup." >&2
  exit 1
fi
if [[ -z "${SUPABASE_DB_URL:-}" ]]; then
  echo "SUPABASE_DB_URL is required (use the Supabase direct database connection string)." >&2
  exit 1
fi
if [[ $# -ne 1 || ! -f "$1" ]]; then
  echo "Usage: CONFIRM_RESTORE=YES SUPABASE_DB_URL='postgresql://...' $0 path/to/backup.dump" >&2
  exit 1
fi

backup_file="$1"
if [[ -f "${backup_file}.sha256" ]]; then
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum -c "${backup_file}.sha256"
  elif command -v shasum >/dev/null 2>&1; then
    expected="$(awk '{print $1}' "${backup_file}.sha256")"
    actual="$(shasum -a 256 "$backup_file" | awk '{print $1}')"
    [[ "$expected" == "$actual" ]] || { echo "Checksum mismatch for $backup_file" >&2; exit 1; }
  else
    echo "Neither sha256sum nor shasum is available; cannot verify the checksum." >&2
    exit 1
  fi
fi

pg_restore --dbname="$SUPABASE_DB_URL" \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  "$backup_file"

echo "Restore completed. Run the smoke and permission checks in supabase/backup-restore.md."
