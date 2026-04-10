-- Migration: Create car_notes_local and car_features_local tables for feature management
-- This separates notes from extracted vehicle features data
-- Run this in Supabase SQL Editor

-- ===== TABLE 1: car_notes_local (Development - mirrors original car_notes structure) =====
create table public.car_notes_local (
  id uuid not null default gen_random_uuid (),
  car_id text not null,
  text text null,
  color text null,
  created_at timestamp without time zone null default now(),
  updated_at timestamp without time zone null default now(),
  sync_hash text null,
  constraint car_notes_local_pkey primary key (id),
  constraint car_notes_local_car_id_key unique (car_id)
) TABLESPACE pg_default;

create index car_notes_local_car_id_idx on public.car_notes_local (car_id);

-- ===== TABLE 2: car_features_local (Development - stores extracted features) =====
create table public.car_features_local (
  id uuid not null default gen_random_uuid (),
  car_id text not null,
  features jsonb null,
  confirmed boolean default false,
  sort integer null,
  created_at timestamp without time zone null default now(),
  updated_at timestamp without time zone null default now(),
  constraint car_features_local_pkey primary key (id),
  constraint car_features_local_car_id_key unique (car_id)
) TABLESPACE pg_default;

create index car_features_local_car_id_idx on public.car_features_local (car_id);

-- Enable RLS (Row Level Security) if needed
alter table public.car_notes_local enable row level security;
alter table public.car_features_local enable row level security;

-- ===== TABLE COMMENTS =====
comment on table public.car_notes_local is 'Development table: Stores user notes per car listing (mirrors car_notes)';
comment on column public.car_notes_local.car_id is 'Unique identifier for the car listing (from mobile.de or otomoto.pl)';
comment on column public.car_notes_local.text is 'User note text';
comment on column public.car_notes_local.color is 'Note color (hex code)';

comment on table public.car_features_local is 'Development table: Stores extracted vehicle features per car listing';
comment on column public.car_features_local.car_id is 'Unique identifier for the car listing (from mobile.de or otomoto.pl)';
comment on column public.car_features_local.features is 'JSON object with feature states: {featureName: true/false/null}';
comment on column public.car_features_local.confirmed is 'Whether features have been manually verified (true) or just parsed (false)';
comment on column public.car_features_local.sort is 'Sort category: 0=Red, 1=Orange, 2=Green, 3=Blue';
