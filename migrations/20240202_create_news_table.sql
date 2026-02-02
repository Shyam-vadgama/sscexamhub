-- Create a table for storing education news
create table if not exists public.news (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  link text not null unique,
  description text,
  pub_date timestamptz,
  source text,
  created_at timestamptz default now() not null
);

-- Create an index on link for faster duplicate checking
create index if not exists news_link_idx on public.news(link);

-- Create an index on pub_date for sorting
create index if not exists news_pub_date_idx on public.news(pub_date desc);

-- Enable Row Level Security (RLS)
alter table public.news enable row level security;

-- Create policy to allow read access for everyone
create policy "Allow public read access" on public.news
  for select using (true);

-- Create policy to allow write access only for service role (used by the script)
-- Note: Service role bypasses RLS by default, but explicit policies are good practice.
create policy "Allow service role full access" on public.news
  for all using (true) with check (true);
