-- Fix infinite recursion in Admin Policy

-- 1. Drop the problematic recursive policy if it exists
drop policy if exists "Admins can view all users" on "public"."users";

-- 2. Create a secure function to check admin status without triggering RLS loops
-- This function runs with "security definer" privileges, bypassing the RLS check on the users table itself.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.users
    where id = auth.uid()
    and plan = 'admin'
  );
$$;

-- 3. Re-create the Admin policy using the new secure function
create policy "Admins can view all users"
on "public"."users"
for select
to authenticated
using (
  is_admin()
);

-- 4. Ensure the basic "view own profile" policy exists and is correct
-- We drop it first to avoid the "already exists" error you saw.
drop policy if exists "Users can view own profile" on "public"."users";

create policy "Users can view own profile"
on "public"."users"
for select
to authenticated
using (
  auth.uid() = id
);
