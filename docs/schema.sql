-- FlexyFlow Database Schema
-- Supabase (PostgreSQL) — prefix ff_
-- Run in Supabase SQL Editor

-- ────────────────────────────────────────────────────────────────────────────
-- Projects
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists ff_projects (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────────────────────
-- Layouts
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists ff_layouts (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references ff_projects(id) on delete cascade,
  name       text not null,
  config     jsonb not null default '{}'::jsonb,
  -- config shape: { gridCols, gridRows, colWidths[], rowHeights[], gap }
  slots      jsonb not null default '[]'::jsonb,
  -- slots shape: [{ id, name, label, row, col, rowSpan, colSpan }]
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ff_layouts_project_id_idx on ff_layouts(project_id);

-- ────────────────────────────────────────────────────────────────────────────
-- Pages
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists ff_pages (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references ff_projects(id) on delete cascade,
  name         text not null,
  slug         text not null,
  layout_id    uuid references ff_layouts(id) on delete set null,
  content      jsonb not null default '{}'::jsonb,
  -- content shape: { [slotName]: [{ widgetId, order }] }
  is_published boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique(project_id, slug)
);

create index if not exists ff_pages_project_id_idx on ff_pages(project_id);

-- ────────────────────────────────────────────────────────────────────────────
-- Widgets
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists ff_widgets (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references ff_projects(id) on delete cascade,
  name       text not null,
  elements   jsonb not null default '[]'::jsonb,
  -- elements shape: [{ id, type, label, props, styles, children, workflows }]
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ff_widgets_project_id_idx on ff_widgets(project_id);

-- ────────────────────────────────────────────────────────────────────────────
-- Workflows
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists ff_workflows (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references ff_projects(id) on delete cascade,
  name       text not null,
  trigger    text not null,
  -- trigger: onClick | onSubmit | onInit | onChange | onHover | onPageLoad | onWidgetMount
  steps      jsonb not null default '[]'::jsonb,
  -- steps shape: [{ id, type, config, conditions, onSuccess, onError }]
  widget_id  uuid references ff_widgets(id) on delete set null,
  page_id    uuid references ff_pages(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ff_workflows_project_id_idx on ff_workflows(project_id);
create index if not exists ff_workflows_widget_id_idx  on ff_workflows(widget_id);
create index if not exists ff_workflows_page_id_idx    on ff_workflows(page_id);

-- ────────────────────────────────────────────────────────────────────────────
-- Custom Actions
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists ff_custom_actions (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references ff_projects(id) on delete cascade,
  name        text not null,
  description text,
  code        text not null default '',
  inputs      jsonb not null default '[]'::jsonb,
  -- inputs shape: [{ key, label, type, required, placeholder }]
  outputs     jsonb not null default '[]'::jsonb,
  -- outputs shape: [{ key, label, type }]
  created_at  timestamptz not null default now()
);

create index if not exists ff_custom_actions_project_id_idx on ff_custom_actions(project_id);

-- ────────────────────────────────────────────────────────────────────────────
-- Auto-update updated_at trigger
-- ────────────────────────────────────────────────────────────────────────────
create or replace function ff_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger ff_projects_updated_at
  before update on ff_projects
  for each row execute function ff_set_updated_at();

create or replace trigger ff_layouts_updated_at
  before update on ff_layouts
  for each row execute function ff_set_updated_at();

create or replace trigger ff_pages_updated_at
  before update on ff_pages
  for each row execute function ff_set_updated_at();

create or replace trigger ff_widgets_updated_at
  before update on ff_widgets
  for each row execute function ff_set_updated_at();

create or replace trigger ff_workflows_updated_at
  before update on ff_workflows
  for each row execute function ff_set_updated_at();

-- ────────────────────────────────────────────────────────────────────────────
-- RLS (Row Level Security) — enable for production
-- ────────────────────────────────────────────────────────────────────────────
-- alter table ff_projects       enable row level security;
-- alter table ff_layouts        enable row level security;
-- alter table ff_pages          enable row level security;
-- alter table ff_widgets        enable row level security;
-- alter table ff_workflows      enable row level security;
-- alter table ff_custom_actions enable row level security;

-- Example policy (allow all for authenticated users):
-- create policy "all for auth users" on ff_projects for all to authenticated using (true) with check (true);
