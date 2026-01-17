-- Create tracker_completions table to track user schedule progress
create table if not exists public.tracker_completions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  schedule_id uuid references public.schedules(id) on delete cascade not null,
  completed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, schedule_id)
);

-- RLS policies
alter table public.tracker_completions enable row level security;

-- Users can view all completions (for the community view)
create policy "Users can view all completions"
  on public.tracker_completions for select
  using (true);

-- Users can insert their own completions
create policy "Users can insert their own completions"
  on public.tracker_completions for insert
  with check (auth.uid() = user_id);

-- Users can delete their own completions
create policy "Users can delete their own completions"
  on public.tracker_completions for delete
  using (auth.uid() = user_id);
