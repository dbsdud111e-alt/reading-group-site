-- Database Schema for Math Reading Group Platform

-- 1. Users table (Extends Supabase Auth)
create table users (
  id uuid references auth.users not null primary key,
  display_name text,
  avatar_url text,
  role text default 'teacher',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Books table
create table books (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  author text,
  publisher text,
  cover_url text,
  description text,
  isbn text,
  toc text, -- Table of Contents
  status text check (status in ('want', 'reading', 'completed')),
  tags text[], -- Math subject tags
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Reading Schedules
create table schedules (
  id uuid default gen_random_uuid() primary key,
  book_id uuid references books(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  range_text text, -- e.g., "Chapters 1-2"
  team_progress integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Journals (Dual Journaling)
create table journals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id) on delete cascade,
  book_id uuid references books(id) on delete cascade,
  category text check (category in ('memo', 'summary', 'question', 'feeling', 'idea')),
  content text not null, -- Supports Markdown + LaTeX
  is_private boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Comments (For Questions and Ideas)
create table comments (
  id uuid default gen_random_uuid() primary key,
  journal_id uuid references journals(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Lesson Contents (Materials Library)
create table lesson_contents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id) on delete cascade,
  title text not null,
  description text,
  file_url text,
  file_type text check (file_type in ('hwp', 'ppt', 'pdf', 'link', 'other')),
  is_finished boolean default false,
  tags text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
