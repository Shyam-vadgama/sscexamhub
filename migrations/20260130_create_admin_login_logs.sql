-- Create admin_login_logs table
create table if not exists admin_login_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id) on delete cascade not null,
  ip_address text,
  location jsonb,
  user_agent text,
  login_time timestamptz default now()
);

-- Enable Row Level Security
alter table admin_login_logs enable row level security;

-- Create policies
create policy "Admins can view login logs"
  on admin_login_logs for select
  using (
    exists (
      select 1 from users
      where users.id = auth.uid()
      and users.plan = 'admin'
    )
  );

create policy "Users can insert their own login logs"
  on admin_login_logs for insert
  with check (
    auth.uid() = user_id
  );
