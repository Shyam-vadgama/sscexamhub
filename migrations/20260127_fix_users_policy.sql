-- Fix for "only showing admin user" issue
-- This policy allows users with plan='admin' to view all records in the users table.

-- Run the following SQL in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

create policy "Admins can view all users"
on "public"."users"
for select
to authenticated
using (
  (select plan from public.users where id = auth.uid()) = 'admin'
);
