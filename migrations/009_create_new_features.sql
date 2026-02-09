-- 1. Reports System
create table if not exists user_reports (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  type text not null check (type in ('question_error', 'test_issue', 'bug', 'feedback', 'other')),
  target_id uuid, -- Optional: ID of the question or test being reported
  message text not null,
  status text default 'pending' check (status in ('pending', 'investigating', 'resolved', 'ignored')),
  admin_note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Reports
alter table user_reports enable row level security;

-- Admin read/write policy (using is_admin() function)
create policy "Admins can do everything on user_reports"
  on user_reports for all
  using (
    is_admin()
  );

-- User insert policy (Users can report)
create policy "Users can insert reports"
  on user_reports for insert
  with check (auth.role() = 'authenticated');

-- User view own reports
create policy "Users can view own reports"
  on user_reports for select
  using (auth.uid() = user_id);


-- 2. Banners/Sliders Manager
create table if not exists app_banners (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  image_url text not null,
  target_type text default 'none', -- e.g., 'link', 'test', 'video'
  target_value text, -- e.g., 'https://google.com' or 'test_id_123'
  display_order integer default 0,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Banners
alter table app_banners enable row level security;

-- Admin policy (using is_admin() function)
create policy "Admins can manage banners"
  on app_banners for all
  using (
    is_admin()
  );

-- Public read policy (App needs to read these)
create policy "Public can read active banners"
  on app_banners for select
  using (true);


-- 3. Notifications (Database Driven)
create table if not exists app_notifications (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  message text not null,
  type text default 'info', -- 'info', 'alert', 'promo'
  target_audience text default 'all', -- 'all', 'free', 'pro'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone -- Optional auto-cleanup
);

-- Enable RLS for Notifications
alter table app_notifications enable row level security;

-- Admin policy (using is_admin() function)
create policy "Admins can manage notifications"
  on app_notifications for all
  using (
    is_admin()
  );

-- Public read policy (Users need to fetch these)
create policy "Users can read notifications"
  on app_notifications for select
  using (true);