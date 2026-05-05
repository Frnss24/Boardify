-- Add start_date column to tasks to support task duration (start..due)
alter table if exists public.tasks
  add column if not exists start_date date;

-- Optional: backfill start_date with created_at date if null
update public.tasks
set start_date = created_at::date
where start_date is null and created_at is not null;

-- Index for start_date (optional)
create index if not exists tasks_start_date_idx on public.tasks(start_date);
