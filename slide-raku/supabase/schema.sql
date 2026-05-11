-- SlideRaku — Supabase Schema
-- Run in Supabase SQL Editor

-- ── Slides table ─────────────────────────────────────────────────────
create table if not exists slides (
  id          uuid primary key default gen_random_uuid(),
  title       text not null default 'Untitled Slide',
  fabric_json text not null default '{"version":"6.0.0","objects":[],"background":"#ffffff"}',
  thumbnail   text not null default '',
  position    integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger slides_updated_at
  before update on slides
  for each row execute procedure update_updated_at();

-- Index for ordering
create index if not exists slides_position_idx on slides(position);

-- ── Row Level Security ────────────────────────────────────────────────
-- Enable when auth is added (Sprint 2+)
-- alter table slides enable row level security;
