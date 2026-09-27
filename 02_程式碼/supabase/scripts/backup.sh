#!/usr/bin/env bash
set -euo pipefail

# Create a portable PostgreSQL backup for the Supabase project.
# Usage: SUPABASE_DB_URL='postgresql://...' ./supabase/scripts/backup.sh [output-dir]

if [[ -z "${SUPABASE_DB_URL:-}" ]]; then
  echo "SUPABASE_DB_URL is required (use the Supabase direct database connection string)." >&2
  exit 1
fi

output_dir="${1:-backups}"
mkdir -p "$output_dir"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
backup_file="$output_dir/tian-xin-ge-${timestamp}.dump"

pg_dump "$SUPABASE_DB_URL" \
  --format=custom \
  --no-owner \
  --no-privileges \
  --file="$backup_file"

if command -v sha256sum >/dev/null 2>&1; then
  sha256sum "$backup_file" > "${backup_file}.sha256"
elif command -v shasum >/dev/null 2>&1; then
  shasum -a 256 "$backup_file" > "${backup_file}.sha256"
else
  echo "Neither sha256sum nor shasum is available; cannot write a checksum." >&2
  exit 1
fi
echo "Database backup written to $backup_file"
echo "Checksum written to ${backup_file}.sha256"
