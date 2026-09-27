#!/usr/bin/env bash
set -euo pipefail

# Exercise the custom-format backup and restore scripts against a temporary
# local PostgreSQL cluster. This never contacts a production Supabase project.

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
PG_BIN="${PG_BIN:-/opt/homebrew/opt/postgresql@15/bin}"
if [[ ! -x "$PG_BIN/initdb" ]]; then
  PG_BIN="$(dirname "$(command -v initdb)")"
fi
for command_name in initdb pg_ctl psql pg_dump pg_restore; do
  if [[ ! -x "$PG_BIN/$command_name" ]]; then
    echo "找不到 PostgreSQL 指令：$command_name" >&2
    exit 1
  fi
done

TEMP_DIR="$(mktemp -d /tmp/txg-supabase-backup.XXXXXX)"
PORT="${TXG_BACKUP_VERIFY_PORT:-55440}"
SOCKET_DIR="$TEMP_DIR/socket"
BACKUP_DIR="$TEMP_DIR/backups"
mkdir -p "$SOCKET_DIR" "$BACKUP_DIR"

cleanup() {
  "$PG_BIN/pg_ctl" -D "$TEMP_DIR/data" -m fast stop >/dev/null 2>&1 || true
  rm -rf "$TEMP_DIR"
}
trap cleanup EXIT

"$PG_BIN/initdb" -D "$TEMP_DIR/data" -A trust --no-locale --encoding=UTF8 >/dev/null
"$PG_BIN/pg_ctl" -D "$TEMP_DIR/data" -o "-p $PORT -k $SOCKET_DIR" -l "$TEMP_DIR/postgres.log" -w start >/dev/null

PSQL=("$PG_BIN/psql" -X -v ON_ERROR_STOP=1 -h "$SOCKET_DIR" -p "$PORT" -d postgres)
DB_URL="postgresql://$USER@localhost:$PORT/postgres?host=$SOCKET_DIR"
export PGOPTIONS="-c client_min_messages=warning"

"${PSQL[@]}" >/dev/null <<'SQL'
create schema auth;
create table auth.users (id uuid primary key);
create or replace function auth.uid() returns uuid
language sql stable
as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create schema storage;
create table storage.buckets (id text primary key, name text not null, public boolean not null default false);
create table storage.objects (
  id uuid primary key default gen_random_uuid(), bucket_id text not null, name text not null,
  owner_id uuid, metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table storage.objects enable row level security;
SQL

"${PSQL[@]}" -f "$ROOT_DIR/supabase/migrations/001_initial.sql" >/dev/null
"${PSQL[@]}" -f "$ROOT_DIR/supabase/seed.sql" >/dev/null

before_services="$("${PSQL[@]}" -Atqc 'select count(*) from public.services')"
before_articles="$("${PSQL[@]}" -Atqc "select count(*) from public.articles where status = 'published'")"
[[ "$before_services" == "5" && "$before_articles" == "7" ]] || { echo "seed verification failed" >&2; exit 1; }

SUPABASE_DB_URL="$DB_URL" "$ROOT_DIR/supabase/scripts/backup.sh" "$BACKUP_DIR" >/dev/null
backup_file="$(find "$BACKUP_DIR" -maxdepth 1 -name '*.dump' -type f -print -quit)"
[[ -n "$backup_file" ]] || { echo "backup file was not created" >&2; exit 1; }

"${PSQL[@]}" >/dev/null <<'SQL'
delete from public.articles;
delete from public.services;
SQL

after_mutation="$("${PSQL[@]}" -Atqc 'select count(*) from public.services')"
[[ "$after_mutation" == "0" ]] || { echo "mutation verification failed" >&2; exit 1; }

CONFIRM_RESTORE=YES SUPABASE_DB_URL="$DB_URL" "$ROOT_DIR/supabase/scripts/restore.sh" "$backup_file" >/dev/null

restored_services="$("${PSQL[@]}" -Atqc 'select count(*) from public.services')"
restored_articles="$("${PSQL[@]}" -Atqc "select count(*) from public.articles where status = 'published'")"
[[ "$restored_services" == "$before_services" && "$restored_articles" == "$before_articles" ]] || {
  echo "restore verification failed: services=$restored_services articles=$restored_articles" >&2
  exit 1
}

echo "local backup and restore drill passed (services=$restored_services, published_articles=$restored_articles)"
