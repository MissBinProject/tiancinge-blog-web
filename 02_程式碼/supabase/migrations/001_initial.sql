create extension if not exists "pgcrypto";

create table if not exists site_settings (
  id uuid primary key default gen_random_uuid(), brand_name text not null default '天心閣養生會館' constraint site_settings_brand_name_length check (char_length(brand_name) between 1 and 120),
  tagline text not null default '', logo_url text, phone text, line_id text, line_url text,
  address text, business_hours text, map_embed_url text, social jsonb not null default '{}'::jsonb,
  hero_title text, hero_subtitle text, hero_description text, hero_background_url text,
  services_title text, services_subtitle text, services_note text, services_background_url text,
  pricing_title text, pricing_subtitle text, pricing_background_url text,
  news_title text, news_subtitle text, news_background_url text,
  blog_title text, blog_subtitle text, blog_background_url text,
  contact_title text, contact_lead text, contact_background_url text, benefits jsonb not null default '[]'::jsonb, pricing_benefits jsonb not null default '[]'::jsonb,
  privacy_text text, terms_text text, seo_title text, seo_description text, og_image_url text,
  updated_at timestamptz not null default now()
);
create table if not exists services (
  id uuid primary key default gen_random_uuid(), slug text unique not null check (char_length(slug) between 1 and 120 and slug ~ '^[A-Za-z0-9]+(-[A-Za-z0-9]+)*$'), name text not null check (char_length(name) between 1 and 120), summary text not null default '' check (char_length(summary) <= 240),
  description text not null default '' check (char_length(description) <= 2000), image_url text, icon text not null default 'lotus', duration_minutes integer check (duration_minutes is null or duration_minutes between 0 and 1440),
  price integer check (price is null or price between 0 and 10000000), price_label text constraint services_price_label_length check (price_label is null or char_length(price_label) <= 80), constraint services_price_label_exclusive check (price is null or price_label is null), sort_order integer not null default 0, is_visible boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists article_categories (id uuid primary key default gen_random_uuid(), name text unique not null check (char_length(name) between 1 and 80), type text not null check(type in ('news','blog')));
create table if not exists articles (
  id uuid primary key default gen_random_uuid(), slug text unique not null check (char_length(slug) between 1 and 160 and slug ~ '^[A-Za-z0-9]+(-[A-Za-z0-9]+)*$'), type text not null check(type in ('news','blog')),
  category_id uuid references article_categories(id) on delete restrict, title text not null check (char_length(title) <= 160), excerpt text not null default '' check (char_length(excerpt) <= 1000),
  seo_title text, seo_description text, cover_url text, body jsonb not null default '[]'::jsonb, published_at date not null default current_date,
  status text not null default 'draft' check(status in ('draft','published')), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table articles add column if not exists seo_title text;
alter table articles add column if not exists seo_description text;
alter table site_settings add column if not exists pricing_benefits jsonb not null default '[]'::jsonb;
create table if not exists media_assets (id uuid primary key default gen_random_uuid(), name text not null, storage_path text not null unique, alt text not null default '' check (char_length(alt) <= 160), mime_type text not null check (mime_type in ('image/jpeg','image/png','image/webp')), size_bytes integer not null default 0 check (size_bytes between 0 and 10485760), width integer check (width is null or width between 1 and 50000), height integer check (height is null or height between 1 and 50000), created_at timestamptz not null default now());
alter table media_assets add column if not exists width integer;
alter table media_assets add column if not exists height integer;
create table if not exists contact_messages (id uuid primary key default gen_random_uuid(), name text not null check (char_length(name) between 1 and 80), phone text not null check (char_length(phone) between 1 and 40), email text check (email is null or char_length(email) <= 254), message text not null check (char_length(message) between 1 and 2000), status text not null default 'unread' check(status in ('unread','handled')), note text check (note is null or char_length(note) <= 2000), created_at timestamptz not null default now());
-- Internal API guard state. Keys are SHA-256 digests, so visitor contact details
-- are never copied into the throttling tables.
create table if not exists contact_submission_windows (
  client_key text primary key check (char_length(client_key) = 64),
  window_started_at timestamptz not null default now(),
  attempt_count integer not null default 0 check (attempt_count between 0 and 1000)
);
create table if not exists contact_submission_duplicates (
  duplicate_key text primary key check (char_length(duplicate_key) = 64),
  last_submission_at timestamptz not null default now()
);
create table if not exists admin_users (user_id uuid primary key references auth.users(id) on delete cascade, created_at timestamptz not null default now());

create index if not exists services_visible_sort_order_idx on services (is_visible, sort_order);
create index if not exists articles_type_status_published_idx on articles (type, status, published_at desc);
create index if not exists articles_category_idx on articles (category_id);
create index if not exists contact_messages_status_created_idx on contact_messages (status, created_at desc);
create index if not exists contact_submission_windows_started_idx on contact_submission_windows (window_started_at);
create index if not exists contact_submission_duplicates_last_idx on contact_submission_duplicates (last_submission_at);
create index if not exists media_assets_created_idx on media_assets (created_at desc);

create or replace function public.is_safe_image_url(value text) returns boolean
language sql immutable
as $$
  select value is null
    or (
      char_length(value) <= 2048
      and value !~* '^(javascript|data|vbscript):'
      and value !~ '[[:space:]]'
      and (value ~* '^https://[^[:space:]]+$' or value ~ '^/([^/].*)?$')
    );
$$;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'services_slug_format') then alter table services add constraint services_slug_format check (slug ~ '^[A-Za-z0-9]+(-[A-Za-z0-9]+)*$'); end if;
  if not exists (select 1 from pg_constraint where conname = 'services_slug_length') then alter table services add constraint services_slug_length check (char_length(slug) between 1 and 120); end if;
  if not exists (select 1 from pg_constraint where conname = 'articles_slug_format') then alter table articles add constraint articles_slug_format check (slug ~ '^[A-Za-z0-9]+(-[A-Za-z0-9]+)*$'); end if;
  if not exists (select 1 from pg_constraint where conname = 'articles_slug_length') then alter table articles add constraint articles_slug_length check (char_length(slug) between 1 and 160); end if;
  if not exists (select 1 from pg_constraint where conname = 'article_categories_name_length') then alter table article_categories add constraint article_categories_name_length check (char_length(name) between 1 and 80); end if;
  if not exists (select 1 from pg_constraint where conname = 'site_settings_brand_name_length') then alter table site_settings add constraint site_settings_brand_name_length check (char_length(brand_name) between 1 and 120); end if;
  if not exists (select 1 from pg_constraint where conname = 'services_price_label_exclusive') then alter table services add constraint services_price_label_exclusive check (price is null or price_label is null); end if;
  if not exists (select 1 from pg_constraint where conname = 'services_price_label_length') then alter table services add constraint services_price_label_length check (price_label is null or char_length(price_label) <= 80); end if;
  if not exists (select 1 from pg_constraint where conname = 'services_icon_allowed') then alter table services add constraint services_icon_allowed check (icon in ('lotus','oil','stone','foot','flower')); end if;
  if not exists (select 1 from pg_constraint where conname = 'media_assets_mime_type') then alter table media_assets add constraint media_assets_mime_type check (mime_type in ('image/jpeg','image/png','image/webp')); end if;
  if not exists (select 1 from pg_constraint where conname = 'media_assets_size_limit') then alter table media_assets add constraint media_assets_size_limit check (size_bytes between 0 and 10485760); end if;
  if not exists (select 1 from pg_constraint where conname = 'media_assets_width_limit') then alter table media_assets add constraint media_assets_width_limit check (width is null or width between 1 and 50000); end if;
  if not exists (select 1 from pg_constraint where conname = 'media_assets_height_limit') then alter table media_assets add constraint media_assets_height_limit check (height is null or height between 1 and 50000); end if;
  if not exists (select 1 from pg_constraint where conname = 'contact_messages_email_length') then alter table contact_messages add constraint contact_messages_email_length check (email is null or char_length(email) <= 254); end if;
  if not exists (select 1 from pg_constraint where conname = 'contact_messages_note_length') then alter table contact_messages add constraint contact_messages_note_length check (note is null or char_length(note) <= 2000); end if;
  if not exists (select 1 from pg_constraint where conname = 'services_image_url_safe') then alter table services add constraint services_image_url_safe check (public.is_safe_image_url(image_url)); end if;
  if not exists (select 1 from pg_constraint where conname = 'articles_cover_url_safe') then alter table articles add constraint articles_cover_url_safe check (public.is_safe_image_url(cover_url)); end if;
  if not exists (select 1 from pg_constraint where conname = 'site_settings_image_urls_safe') then alter table site_settings add constraint site_settings_image_urls_safe check (public.is_safe_image_url(logo_url) and public.is_safe_image_url(hero_background_url) and public.is_safe_image_url(services_background_url) and public.is_safe_image_url(pricing_background_url) and public.is_safe_image_url(news_background_url) and public.is_safe_image_url(blog_background_url) and public.is_safe_image_url(contact_background_url) and public.is_safe_image_url(og_image_url)); end if;
  if not exists (select 1 from pg_constraint where conname = 'site_settings_map_url_safe') then alter table site_settings add constraint site_settings_map_url_safe check (map_embed_url is null or (map_embed_url ~* '^https://[^[:space:]]+$' and map_embed_url !~ '[[:space:]]')); end if;
  if not exists (select 1 from pg_constraint where conname = 'site_settings_line_url_safe') then alter table site_settings add constraint site_settings_line_url_safe check (line_url is null or (line_url ~* '^https://[^[:space:]]+$' and line_url !~ '[[:space:]]')); end if;
end $$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.admin_users where user_id = auth.uid()) $$;

-- Atomically reserve a contact submission before the API writes the message.
-- This keeps the five-per-minute and thirty-second duplicate rules consistent
-- across serverless instances. The API passes SHA-256 digests only.
create or replace function public.reserve_contact_submission(client_key text, duplicate_key text) returns text
language plpgsql security definer set search_path = public
as $$
declare
  current_window public.contact_submission_windows%rowtype;
  current_duplicate public.contact_submission_duplicates%rowtype;
  now_at timestamptz := now();
begin
  if client_key is null or client_key !~ '^[0-9a-f]{64}$' or duplicate_key is null or duplicate_key !~ '^[0-9a-f]{64}$' then
    return 'invalid';
  end if;

  -- Serialize concurrent requests for the same client and duplicate digest.
  -- Advisory locks are transaction-scoped and leave no visitor data behind.
  perform pg_advisory_xact_lock(hashtextextended(client_key, 0));
  perform pg_advisory_xact_lock(hashtextextended('duplicate:' || duplicate_key, 0));

  -- Guard rows only need to survive the longest active window. Keep the
  -- implementation tables bounded without retaining visitor-derived digests
  -- indefinitely.
  delete from public.contact_submission_windows
    where window_started_at < now_at - interval '2 days';
  delete from public.contact_submission_duplicates
    where last_submission_at < now_at - interval '2 days';

  select * into current_window
    from public.contact_submission_windows
    where contact_submission_windows.client_key = reserve_contact_submission.client_key
    for update;
  if not found or now_at - current_window.window_started_at >= interval '1 minute' then
    insert into public.contact_submission_windows (client_key, window_started_at, attempt_count)
      values (reserve_contact_submission.client_key, now_at, 1)
      on conflict on constraint contact_submission_windows_pkey do update set window_started_at = excluded.window_started_at, attempt_count = excluded.attempt_count;
  elsif current_window.attempt_count >= 5 then
    return 'rate_limited';
  else
    update public.contact_submission_windows
      set attempt_count = current_window.attempt_count + 1
      where contact_submission_windows.client_key = reserve_contact_submission.client_key;
  end if;

  select * into current_duplicate
    from public.contact_submission_duplicates
    where contact_submission_duplicates.duplicate_key = reserve_contact_submission.duplicate_key
    for update;
  if found and now_at - current_duplicate.last_submission_at < interval '30 seconds' then
    return 'duplicate';
  end if;
  insert into public.contact_submission_duplicates (duplicate_key, last_submission_at)
    values (reserve_contact_submission.duplicate_key, now_at)
    on conflict on constraint contact_submission_duplicates_pkey do update set last_submission_at = excluded.last_submission_at;
  return 'ok';
end;
$$;

-- These tables are implementation details. No anonymous or authenticated
-- client can read or write them; the server-role API invokes the function.
alter table contact_submission_windows enable row level security;
alter table contact_submission_duplicates enable row level security;
revoke execute on function public.reserve_contact_submission(text, text) from public;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.reserve_contact_submission(text, text) to service_role;
  end if;
end $$;

create or replace function public.is_media_path_in_use(path text) returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.services s where coalesce(s.image_url, '') = path or coalesce(s.image_url, '') like '%' || path)
    or exists (select 1 from public.articles a where coalesce(a.cover_url, '') = path or coalesce(a.cover_url, '') like '%' || path)
    or exists (
      select 1
      from public.articles a
      cross join lateral jsonb_array_elements(case when jsonb_typeof(a.body) = 'array' then a.body else '[]'::jsonb end) as block(value)
      where block.value->>'type' = 'image'
        and (coalesce(block.value->>'url', '') = path or coalesce(block.value->>'url', '') like '%' || path)
    )
    or exists (select 1 from public.site_settings ss where concat_ws(' ', ss.logo_url, ss.hero_background_url, ss.services_background_url, ss.pricing_background_url, ss.news_background_url, ss.blog_background_url, ss.contact_background_url, ss.og_image_url) like '%' || path);
$$;

-- This helper is used by authenticated delete policies. Do not expose its
-- reference lookup as an anonymous PostgREST function.
revoke execute on function public.is_media_path_in_use(text) from public;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant execute on function public.is_media_path_in_use(text) to authenticated;
  end if;
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.is_media_path_in_use(text) to service_role;
  end if;
  if exists (select 1 from pg_roles where rolname = 'app_user') then
    grant execute on function public.is_media_path_in_use(text) to app_user;
  end if;
end $$;

create or replace function public.is_allowed_media_metadata(metadata jsonb) returns boolean
language sql immutable
as $$
  select coalesce(metadata->>'mimetype', metadata->>'mimeType', '') in ('image/jpeg', 'image/png', 'image/webp')
    and case when coalesce(metadata->>'size', '0') ~ '^[0-9]+$'
      then coalesce(metadata->>'size', '0')::bigint between 0 and 10485760
      else false end;
$$;

create or replace function public.is_valid_article_body(body jsonb) returns boolean
language plpgsql immutable
as $$
declare
  block jsonb;
  block_type text;
  block_url text;
begin
  if jsonb_typeof(body) is distinct from 'array' or jsonb_array_length(body) > 100 then return false; end if;
  for block in select value from jsonb_array_elements(body) loop
    if jsonb_typeof(block) is distinct from 'object'
      or jsonb_typeof(block->'type') is distinct from 'string'
      or jsonb_typeof(block->'text') is distinct from 'string'
      or char_length(block->>'text') > 10000 then
      return false;
    end if;
    block_type := block->>'type';
    if block_type not in ('heading', 'paragraph', 'list', 'link', 'image') then return false; end if;
    if block_type = 'list' then
      if jsonb_typeof(block->'items') is distinct from 'array'
        or jsonb_array_length(block->'items') > 100
        or exists (select 1 from jsonb_array_elements(block->'items') as item(value) where jsonb_typeof(item.value) is distinct from 'string' or char_length(item.value #>> '{}') > 1000) then
        return false;
      end if;
    elsif block_type = 'link' then
      block_url := block->>'url';
      if block_url is null or char_length(block_url) > 2048 or block_url ~* '^(javascript|data|vbscript):' or block_url !~* '^(https?://[^[:space:]]+|mailto:[^[:space:]]+|tel:[^[:space:]]+|/($|[^/])|#)' then return false; end if;
    elsif block_type = 'image' then
      block_url := block->>'url';
      if block_url is null or char_length(block_url) > 2048 or block_url ~* '^(javascript|data|vbscript):' or block_url !~* '^(https://[^[:space:]]+|/($|[^/]))' then return false; end if;
      if block ? 'alt' and jsonb_typeof(block->'alt') is distinct from 'string' then return false; end if;
      if char_length(coalesce(block->>'alt', '')) > 160 then return false; end if;
    end if;
  end loop;
  return true;
exception when others then
  return false;
end;
$$;

create or replace function public.is_valid_benefits(value jsonb) returns boolean
language sql immutable
as $$
  select case when jsonb_typeof(value) <> 'array' then false else
    jsonb_array_length(value) <= 4
    and not exists (
      select 1 from jsonb_array_elements(value) as item(value)
      where jsonb_typeof(item.value) is distinct from 'object'
        or jsonb_typeof(item.value->'title') is distinct from 'string'
        or jsonb_typeof(item.value->'caption') is distinct from 'string'
        or char_length(item.value->>'title') > 120
        or char_length(item.value->>'caption') > 240
    ) end;
$$;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'articles_body_schema') then
    alter table articles add constraint articles_body_schema check (public.is_valid_article_body(body));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'articles_published_body_nonempty') then
    alter table articles add constraint articles_published_body_nonempty check (status <> 'published' or jsonb_array_length(body) > 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'site_settings_benefits_schema') then
    alter table site_settings add constraint site_settings_benefits_schema check (public.is_valid_benefits(benefits));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'site_settings_pricing_benefits_schema') then
    alter table site_settings add constraint site_settings_pricing_benefits_schema check (public.is_valid_benefits(pricing_benefits));
  end if;
end $$;

create or replace function public.enforce_single_admin() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  -- Serialize concurrent inserts/updates so two transactions cannot both
  -- observe an empty table and create separate administrators.
  perform pg_advisory_xact_lock(hashtextextended('tian-xin-ge-admin-singleton', 0));
  if exists (select 1 from public.admin_users where user_id <> new.user_id) then
    raise exception 'only one administrator is allowed';
  end if;
  return new;
end;
$$;
drop trigger if exists only_one_admin on public.admin_users;
create trigger only_one_admin before insert or update on public.admin_users for each row execute function public.enforce_single_admin();

create or replace function public.enforce_single_site_settings() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  -- Keep the one-row settings invariant safe under concurrent upserts.
  perform pg_advisory_xact_lock(hashtextextended('tian-xin-ge-settings-singleton', 0));
  if exists (select 1 from public.site_settings where id <> new.id) then
    raise exception 'only one site settings record is allowed';
  end if;
  return new;
end;
$$;
drop trigger if exists only_one_site_settings on public.site_settings;
create trigger only_one_site_settings before insert or update on public.site_settings for each row execute function public.enforce_single_site_settings();

-- Keep the editorial boundary enforced even when an administrator writes via
-- SQL or another client instead of using the category selector in the UI.
create or replace function public.enforce_article_category_type() returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  category_type text;
begin
  if new.category_id is null then return new; end if;
  select type into category_type from public.article_categories where id = new.category_id;
  if category_type is null then
    raise exception 'article category does not exist';
  end if;
  if category_type <> new.type then
    raise exception 'article type must match category type';
  end if;
  return new;
end;
$$;
drop trigger if exists articles_category_type on public.articles;
create trigger articles_category_type before insert or update of category_id, type on public.articles for each row execute function public.enforce_article_category_type();

alter table site_settings enable row level security; alter table services enable row level security; alter table article_categories enable row level security; alter table articles enable row level security; alter table media_assets enable row level security; alter table contact_messages enable row level security; alter table admin_users enable row level security;
alter table storage.objects enable row level security;
drop policy if exists "public read visible services" on services;
drop policy if exists "public read published articles" on articles;
drop policy if exists "public read article categories" on article_categories;
drop policy if exists "public read settings" on site_settings;
drop policy if exists "admin manage services" on services;
drop policy if exists "admin manage articles" on articles;
drop policy if exists "admin manage categories" on article_categories;
drop policy if exists "admin read media" on media_assets;
drop policy if exists "admin insert media" on media_assets;
drop policy if exists "admin update media" on media_assets;
drop policy if exists "admin delete unused media" on media_assets;
drop policy if exists "admin manage settings" on site_settings;
drop policy if exists "admin manage contact" on contact_messages;
drop policy if exists "admin read own record" on admin_users;
drop policy if exists "public read site media" on storage.objects;
drop policy if exists "admin upload site media" on storage.objects;
drop policy if exists "admin update site media" on storage.objects;
drop policy if exists "admin delete unused site media" on storage.objects;
create policy "public read visible services" on services for select using (is_visible = true or public.is_admin());
create policy "public read published articles" on articles for select using (status = 'published' or public.is_admin());
create policy "public read article categories" on article_categories for select using (
  public.is_admin()
  or exists (
    select 1 from public.articles a
    where a.category_id = article_categories.id and a.status = 'published'
  )
);
create policy "public read settings" on site_settings for select using (true);
create policy "admin manage services" on services for all using (public.is_admin()) with check (public.is_admin());
create policy "admin manage articles" on articles for all using (public.is_admin()) with check (public.is_admin());
create policy "admin manage categories" on article_categories for all using (public.is_admin()) with check (public.is_admin());
create policy "admin read media" on media_assets for select using (public.is_admin());
create policy "admin insert media" on media_assets for insert with check (public.is_admin());
create policy "admin update media" on media_assets for update using (public.is_admin()) with check (public.is_admin());
create policy "admin delete unused media" on media_assets for delete using (public.is_admin() and not public.is_media_path_in_use(storage_path));
create policy "admin manage settings" on site_settings for all using (public.is_admin()) with check (public.is_admin());
create policy "admin manage contact" on contact_messages for all using (public.is_admin()) with check (public.is_admin());
create policy "admin read own record" on admin_users for select using (user_id = auth.uid());

insert into storage.buckets (id, name, public) values ('site-media', 'site-media', true) on conflict (id) do update set public = true;
create policy "public read site media" on storage.objects for select using (bucket_id = 'site-media');
create policy "admin upload site media" on storage.objects for insert with check (bucket_id = 'site-media' and public.is_admin() and public.is_allowed_media_metadata(metadata));
create policy "admin update site media" on storage.objects for update using (bucket_id = 'site-media' and public.is_admin()) with check (bucket_id = 'site-media' and public.is_admin() and public.is_allowed_media_metadata(metadata));
create policy "admin delete unused site media" on storage.objects for delete using (bucket_id = 'site-media' and public.is_admin() and not public.is_media_path_in_use(name));
