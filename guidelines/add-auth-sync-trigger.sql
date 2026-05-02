create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (
    id,
    email,
    role,
    name,
    password_hash,
    created_at
  )
  values (
    new.id,
    new.email,
    coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'user'::user_role),
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    'managed-by-supabase-auth',
    now()
  )
  on conflict (id) do update set
    email = excluded.email,
    role = excluded.role,
    name = excluded.name,
    password_hash = excluded.password_hash,
    created_at = excluded.created_at;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();