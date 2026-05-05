-- Add priority column to tasks table
alter table if exists public.tasks
  add column if not exists priority varchar(10) default 'Medium';

-- Add check constraint untuk priority
alter table if exists public.tasks
  add constraint tasks_priority_check 
  check (priority in ('High', 'Medium', 'Low'));

-- Index untuk priority (optional)
create index if not exists tasks_priority_idx on public.tasks(priority);
