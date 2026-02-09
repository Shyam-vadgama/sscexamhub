create table if not exists audit_logs (
  id uuid default gen_random_uuid() primary key,
  action text not null,
  table_name text,
  record_id uuid,
  details jsonb,
  user_id uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table audit_logs enable row level security;

-- Policy: Admins can view logs (using the is_admin() function)
create policy "Admins can view audit logs"
  on audit_logs for select
  using (
    is_admin()
  );

-- Policy: Anyone (authenticated) can insert logs
create policy "Authenticated users can insert audit logs"
  on audit_logs for insert
  with check (auth.role() = 'authenticated');