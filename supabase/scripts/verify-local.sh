#!/usr/bin/env bash
set -euo pipefail

# Runs the migration, seed and important RLS/Storage checks against a
# temporary local PostgreSQL cluster. It never contacts an external project.

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
PG_BIN="${PG_BIN:-/opt/homebrew/opt/postgresql@15/bin}"
if [[ ! -x "$PG_BIN/initdb" ]]; then
  PG_BIN="$(dirname "$(command -v initdb)")"
fi
for command_name in initdb pg_ctl psql; do
  if [[ ! -x "$PG_BIN/$command_name" ]]; then
    echo "找不到 PostgreSQL 指令：$command_name" >&2
    exit 1
  fi
done

TEMP_DIR="$(mktemp -d /tmp/txg-supabase-verify.XXXXXX)"
PORT="${TXG_VERIFY_PORT:-55439}"
SOCKET_DIR="$TEMP_DIR/socket"
mkdir -p "$SOCKET_DIR"

cleanup() {
  "$PG_BIN/pg_ctl" -D "$TEMP_DIR/data" -m fast stop >/dev/null 2>&1 || true
  rm -rf "$TEMP_DIR"
}
trap cleanup EXIT

"$PG_BIN/initdb" -D "$TEMP_DIR/data" -A trust --no-locale --encoding=UTF8 >/dev/null
"$PG_BIN/pg_ctl" -D "$TEMP_DIR/data" -o "-p $PORT -k $SOCKET_DIR" -l "$TEMP_DIR/postgres.log" -w start >/dev/null

PSQL=("$PG_BIN/psql" -X -v ON_ERROR_STOP=1 -h "$SOCKET_DIR" -p "$PORT" -d postgres)
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
  id uuid primary key default gen_random_uuid(),
  bucket_id text not null,
  name text not null,
  owner_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table storage.objects enable row level security;

create role app_user login;
create role anon_user login;
grant usage on schema public, auth, storage to app_user;
grant select, insert, update, delete on all tables in schema public to app_user;
grant select, insert, update, delete on all tables in schema auth, storage to app_user;
grant usage, select on all sequences in schema public to app_user;
grant execute on function auth.uid() to public;
SQL

"${PSQL[@]}" -f "$ROOT_DIR/supabase/migrations/001_initial.sql" >/dev/null
"${PSQL[@]}" -f "$ROOT_DIR/supabase/migrations/001_initial.sql" >/dev/null
"${PSQL[@]}" -f "$ROOT_DIR/supabase/seed.sql" >/dev/null
"${PSQL[@]}" >/dev/null <<'SQL'
grant select, insert, update, delete on all tables in schema public to app_user;
grant usage, select on all sequences in schema public to app_user;
grant execute on function public.reserve_contact_submission(text, text) to app_user;
do $$
begin
  if has_function_privilege('anon_user', 'public.is_media_path_in_use(text)', 'execute') then
    raise exception 'anonymous function execution must be revoked';
  end if;
  if not has_function_privilege('app_user', 'public.is_media_path_in_use(text)', 'execute') then
    raise exception 'app_user must execute media reference guard for Storage policy';
  end if;
end $$;
SQL

ADMIN_ID='11111111-1111-1111-1111-111111111111'
"${PSQL[@]}" >/dev/null <<SQL
insert into auth.users (id) values ('$ADMIN_ID');
insert into public.admin_users (user_id) values ('$ADMIN_ID');
insert into public.article_categories (name, type) values ('僅草稿分類', 'news');
insert into public.services (slug, name, summary, description, icon, sort_order, is_visible)
  values ('internal-only-service', '內部測試服務', '', '', 'lotus', 99, false);
SQL

# Anonymous visibility and write protection.
"${PSQL[@]}" >/dev/null <<'SQL'
set role app_user;
set request.jwt.claim.sub = '';
do $$
declare
  service_count integer;
  published_count integer;
begin
  select count(*) into service_count from public.services;
  if service_count <> 5 then raise exception 'anonymous service count expected 5, got %', service_count; end if;
  if exists (select 1 from public.services where slug = 'internal-only-service') then raise exception 'anonymous can see a hidden service'; end if;
  select count(*) into published_count from public.articles;
  if published_count <> 7 then raise exception 'anonymous article count expected 7, got %', published_count; end if;
  if exists (select 1 from public.articles where status <> 'published') then raise exception 'anonymous can see a draft'; end if;
  if exists (select 1 from public.article_categories where name = '僅草稿分類') then raise exception 'anonymous can see a draft-only category'; end if;
  if exists (select 1 from public.contact_messages) then raise exception 'anonymous can read messages'; end if;
  begin
    insert into public.contact_messages (name, phone, message) values ('越權', '000', '拒絕');
    raise exception 'anonymous inserted a message';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.services (slug, name) values ('anonymous-write', '越權');
    raise exception 'anonymous inserted a service';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
SQL

# The sole administrator can manage content. Storage metadata and in-use
# media guards remain enforced by policies.
"${PSQL[@]}" -v admin_id="$ADMIN_ID" >/dev/null <<'SQL'
set role app_user;
set request.jwt.claim.sub = :'admin_id';
do $$
declare
  message_count integer;
  media_id uuid;
begin
  insert into public.contact_messages (name, phone, message) values ('管理員測試', '0912000000', 'RLS test');
  select count(*) into message_count from public.contact_messages;
  if message_count <> 1 then raise exception 'admin cannot read messages'; end if;

  begin
    insert into storage.objects (bucket_id, name, metadata)
      values ('site-media', 'invalid.bin', '{"mimetype":"application/octet-stream","size":"1"}'::jsonb);
    raise exception 'invalid Storage metadata was accepted';
  exception when insufficient_privilege then null;
  end;
  insert into storage.objects (bucket_id, name, metadata)
    values ('site-media', 'valid.png', '{"mimetype":"image/png","size":"100"}'::jsonb);

  insert into public.media_assets (name, storage_path, mime_type, size_bytes)
    values ('body image', 'body-path.png', 'image/png', 100) returning id into media_id;
  update public.articles
    set body = '[{"type":"image","text":"body","url":"/media/body-path.png"}]'::jsonb
    where slug = 'healing-power-of-oils';
  delete from public.media_assets where id = media_id;
  if not exists (select 1 from public.media_assets where id = media_id) then raise exception 'body-referenced media was deleted'; end if;
end $$;
reset role;
SQL

# The server-side guard is atomic and does not expose its digest tables to an
# anonymous client. Verify duplicate and five-per-minute outcomes directly.
"${PSQL[@]}" >/dev/null <<'SQL'
insert into public.contact_submission_windows (client_key, window_started_at, attempt_count)
  values (repeat('f', 64), now() - interval '3 days', 1)
  on conflict (client_key) do update set window_started_at = excluded.window_started_at;
insert into public.contact_submission_duplicates (duplicate_key, last_submission_at)
  values (repeat('g', 64), now() - interval '3 days')
  on conflict (duplicate_key) do update set last_submission_at = excluded.last_submission_at;
SQL
"${PSQL[@]}" >/dev/null <<'SQL'
set role app_user;
do $$
declare
  first_result text;
  duplicate_result text;
  rate_result text;
begin
  first_result := public.reserve_contact_submission(repeat('a', 64), repeat('b', 64));
  if first_result <> 'ok' then raise exception 'submission guard first result was %', first_result; end if;
  duplicate_result := public.reserve_contact_submission(repeat('a', 64), repeat('b', 64));
  if duplicate_result <> 'duplicate' then raise exception 'submission guard duplicate result was %', duplicate_result; end if;
  for index in 0..4 loop
    if public.reserve_contact_submission(repeat('e', 64), lpad(index::text, 64, 'c')) <> 'ok' then
      raise exception 'submission guard expected allowed attempt %', index + 1;
    end if;
  end loop;
  rate_result := public.reserve_contact_submission(repeat('e', 64), repeat('d', 64));
  if rate_result <> 'rate_limited' then raise exception 'submission guard rate result was %', rate_result; end if;

  if public.reserve_contact_submission(repeat('1', 64), repeat('2', 64)) <> 'ok' then
    raise exception 'submission guard cleanup probe was rejected';
  end if;
  if exists (select 1 from public.contact_submission_windows where client_key = repeat('f', 64))
    or exists (select 1 from public.contact_submission_duplicates where duplicate_key = repeat('g', 64)) then
    raise exception 'expired submission guard rows were not pruned';
  end if;
end $$;
reset role;
SQL

"${PSQL[@]}" >/dev/null <<'SQL'
do $$
begin
  begin
    insert into public.services (slug, name, price, price_label) values ('invalid-price', '無效價格', 100, '洽詢');
    raise exception 'price/price_label constraint was not enforced';
  exception when check_violation then null;
  end;
  begin
    insert into public.articles (slug, type, title, body)
      values ('too-many-list-items', 'blog', '清單上限測試', jsonb_build_array(jsonb_build_object('type', 'list', 'text', 'many', 'items', (select jsonb_agg(to_jsonb(value::text)) from generate_series(1, 101) as values(value)))));
    raise exception 'article list item limit was not enforced';
  exception when check_violation then null;
  end;
  begin
    insert into public.services (slug, name, image_url) values ('unsafe-service-image', '危險圖片', 'javascript:alert(1)');
    raise exception 'unsafe service image URL was accepted';
  exception when check_violation then null;
  end;
  begin
    insert into public.articles (slug, type, title, cover_url, body)
      values ('unsafe-cover-url', 'blog', '危險封面', 'data:image/png;base64,abc', '[]'::jsonb);
    raise exception 'unsafe article cover URL was accepted';
  exception when check_violation then null;
  end;
  begin
    insert into public.articles (slug, type, title, body)
      values ('unsafe-body-image-url', 'blog', '危險正文圖片', '[{"type":"image","text":"bad","url":"http://example.com/bad.png"}]'::jsonb);
    raise exception 'http article image URL was accepted';
  exception when check_violation then null;
  end;
  begin
    update public.site_settings set line_url = 'http://line.me/ti/p/@unsafe';
    raise exception 'http LINE URL was accepted';
  exception when check_violation then null;
  end;
end $$;
select 'local migration, seed, RLS, Storage and media-reference checks passed' as result;
SQL
echo 'local migration, seed, RLS, Storage and media-reference checks passed'
