-- ============================================================
-- NEET Command — Supabase database schema
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- ─── user_profiles ───────────────────────────────────────────────────────────
create table if not exists user_profiles (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null,
  username              text not null,
  full_name             text,
  avatar_url            text,
  target_year           numeric,
  target_score          numeric,
  daily_goal_hours      numeric default 8,
  study_streak          numeric default 0,
  longest_streak        numeric default 0,
  xp                    numeric default 0,
  level                 numeric default 1,
  total_study_hours     numeric default 0,
  mcqs_solved           numeric default 0,
  mcqs_correct          numeric default 0,
  theme                 text default 'dark' check (theme in ('dark','light')),
  accent_color          text default 'purple',
  notifications_enabled boolean default true,
  last_active           date,
  badges                text[] default '{}',
  bio                   text,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

-- ─── chapters ────────────────────────────────────────────────────────────────
create table if not exists chapters (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null,
  name             text not null,
  subject          text not null check (subject in ('Physics','Chemistry','Biology')),
  description      text,
  difficulty       text default 'Medium' check (difficulty in ('Easy','Medium','Hard')),
  completion       numeric default 0 check (completion >= 0 and completion <= 100),
  revision_status  text default 'not_started'
                     check (revision_status in ('not_started','in_progress','completed','needs_revision')),
  mcqs_solved      numeric default 0,
  mcqs_correct     numeric default 0,
  is_weak          boolean default false,
  last_revised     date,
  next_revision    date,
  notes_count      numeric default 0,
  "order"          numeric default 0,
  tags             text[] default '{}',
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- ─── notes ───────────────────────────────────────────────────────────────────
create table if not exists notes (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null,
  title        text not null,
  content      text,
  subject      text check (subject in ('Physics','Chemistry','Biology','General')),
  chapter_id   text,
  chapter_name text,
  is_pinned    boolean default false,
  is_starred   boolean default false,
  color        text default 'purple',
  tags         text[] default '{}',
  word_count   numeric default 0,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ─── formulas ────────────────────────────────────────────────────────────────
create table if not exists formulas (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid,                        -- null for admin formulas
  title            text not null,
  formula_text     text,
  latex            text,
  description      text,
  subject          text not null check (subject in ('Physics','Chemistry','Biology')),
  chapter          text,
  chapter_id       text,
  is_important     boolean default false,
  is_pinned        boolean default false,
  tags             text[] default '{}',
  created_by       text,
  is_admin_formula boolean default false,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- ─── error_notes ─────────────────────────────────────────────────────────────
create table if not exists error_notes (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null,
  question       text not null,
  topic          text,
  subject        text not null check (subject in ('Physics','Chemistry','Biology')),
  chapter        text,
  error_type     text default 'concept_error'
                   check (error_type in ('concept_error','formula_error','calculation_error',
                                         'guess','silly_mistake','time_management')),
  reason         text,
  correct_answer text,
  my_answer      text,
  is_revised     boolean default false,
  revision_count numeric default 0,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

-- ─── goals ───────────────────────────────────────────────────────────────────
create table if not exists goals (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null,
  title           text not null,
  description     text,
  goal_type       text default 'daily' check (goal_type in ('daily','weekly','monthly','target')),
  target_value    numeric not null,
  current_value   numeric default 0,
  unit            text,
  subject         text,
  deadline        date,
  is_completed    boolean default false,
  completion_date date,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ─── bookmarks ───────────────────────────────────────────────────────────────
create table if not exists bookmarks (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null,
  item_type  text not null check (item_type in ('formula','pyq','note','resource')),
  item_id    text not null,
  item_title text,
  subject    text,
  created_at timestamptz default now()
);

-- ─── resources ───────────────────────────────────────────────────────────────
create table if not exists resources (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null,
  title            text not null,
  description      text,
  file_url         text not null,
  file_type        text check (file_type in ('pdf','image','zip','docx','other')),
  file_size        numeric,
  subject          text check (subject in ('Physics','Chemistry','Biology','General')),
  chapter          text,
  category         text check (category in ('notes','textbook','question_bank','video_notes','other')),
  downloads        numeric default 0,
  is_admin_content boolean default false,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- ─── pyqs ────────────────────────────────────────────────────────────────────
create table if not exists pyqs (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  year             numeric not null,
  exam_name        text default 'NEET',
  subject          text not null check (subject in ('Physics','Chemistry','Biology','All')),
  chapter          text,
  difficulty       text check (difficulty in ('Easy','Medium','Hard')),
  language         text default 'English' check (language in ('English','Hindi','Both')),
  description      text,
  thumbnail_url    text,
  pdf_url          text,
  total_marks      numeric,
  total_questions  numeric,
  views            numeric default 0,
  downloads        numeric default 0,
  is_published     boolean default true,
  is_admin_content boolean default false,
  created_by       text,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- ─── mock_tests ──────────────────────────────────────────────────────────────
create table if not exists mock_tests (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null,
  test_name         text,
  date              date not null,
  physics_marks     numeric default 0,
  chemistry_marks   numeric default 0,
  biology_marks     numeric default 0,
  total_marks       numeric default 0,
  max_marks         numeric default 720,
  physics_correct   numeric default 0,
  chemistry_correct numeric default 0,
  biology_correct   numeric default 0,
  physics_wrong     numeric default 0,
  chemistry_wrong   numeric default 0,
  biology_wrong     numeric default 0,
  time_taken        numeric,
  accuracy          numeric default 0,
  percentile        numeric,
  notes             text,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- ─── revision_tasks ──────────────────────────────────────────────────────────
create table if not exists revision_tasks (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null,
  chapter_id      text not null,
  chapter_name    text,
  subject         text check (subject in ('Physics','Chemistry','Biology')),
  revision_number numeric default 1,
  scheduled_date  date not null,
  completed_date  date,
  status          text default 'pending'
                    check (status in ('pending','completed','skipped','overdue')),
  interval_days   numeric,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ─── study_sessions ──────────────────────────────────────────────────────────
create table if not exists study_sessions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null,
  date             date not null,
  subject          text check (subject in ('Physics','Chemistry','Biology','General')),
  chapter          text,
  duration_minutes numeric default 0,
  session_type     text default 'custom'
                     check (session_type in ('pomodoro','custom','revision','mock_test')),
  xp_earned        numeric default 0,
  notes            text,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- ─── announcements ───────────────────────────────────────────────────────────
create table if not exists announcements (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  content    text not null,
  type       text default 'info' check (type in ('info','warning','success','urgent')),
  is_pinned  boolean default false,
  is_active  boolean default true,
  created_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── daily_quotes ────────────────────────────────────────────────────────────
create table if not exists daily_quotes (
  id             uuid primary key default gen_random_uuid(),
  quote          text not null,
  author         text,
  category       text default 'motivation'
                   check (category in ('motivation','science','success','study')),
  scheduled_date date,
  is_active      boolean default true,
  created_at     timestamptz default now()
);

-- ─── profiles (used by Admin page as db.entities.User) ───────────────────────
create table if not exists profiles (
  id         uuid primary key,   -- matches auth.users.id exactly
  email      text,
  full_name  text,
  role       text default 'user',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-populate profiles when a new user signs up
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    'user'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ─── Row Level Security ───────────────────────────────────────────────────────
alter table user_profiles  enable row level security;
alter table chapters       enable row level security;
alter table notes          enable row level security;
alter table formulas       enable row level security;
alter table error_notes    enable row level security;
alter table goals          enable row level security;
alter table bookmarks      enable row level security;
alter table resources      enable row level security;
alter table pyqs           enable row level security;
alter table mock_tests     enable row level security;
alter table revision_tasks enable row level security;
alter table study_sessions enable row level security;
alter table announcements  enable row level security;
alter table daily_quotes   enable row level security;
alter table profiles       enable row level security;

-- user_id = uuid columns, auth.uid() = uuid — no cast needed
create policy "users manage own profile"
  on user_profiles for all using (user_id = auth.uid());

create policy "users manage own chapters"
  on chapters for all using (user_id = auth.uid());

create policy "users manage own notes"
  on notes for all using (user_id = auth.uid());

create policy "users manage own error_notes"
  on error_notes for all using (user_id = auth.uid());

create policy "users manage own goals"
  on goals for all using (user_id = auth.uid());

create policy "users manage own bookmarks"
  on bookmarks for all using (user_id = auth.uid());

create policy "users manage own resources"
  on resources for all using (user_id = auth.uid());

create policy "users manage own mock_tests"
  on mock_tests for all using (user_id = auth.uid());

create policy "users manage own revision_tasks"
  on revision_tasks for all using (user_id = auth.uid());

create policy "users manage own study_sessions"
  on study_sessions for all using (user_id = auth.uid());

-- formulas: own rows OR admin formulas readable by all authenticated users
create policy "read own or admin formulas"
  on formulas for select
  using (user_id = auth.uid() or is_admin_formula = true);

create policy "users manage own formulas"
  on formulas for all using (user_id = auth.uid());

-- pyqs: all published ones are public reads
create policy "anyone reads published pyqs"
  on pyqs for select using (is_published = true);

-- announcements and daily_quotes: public reads
create policy "anyone reads active announcements"
  on announcements for select using (is_active = true);

create policy "anyone reads active quotes"
  on daily_quotes for select using (is_active = true);

-- profiles: each user reads their own row
create policy "users read own profile row"
  on profiles for select using (id = auth.uid());
