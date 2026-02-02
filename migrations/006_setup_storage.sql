-- Migration: Setup Supabase Storage Bucket and Policies
-- Purpose: Configure storage bucket for PDF and media uploads
-- Date: 2026-01-27
-- NOTE: This SQL should be run via Supabase Dashboard or API as it uses storage schema

-- Create storage bucket for content if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('content', 'content', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Set up RLS policies for storage objects

-- 1. Public read access for all files in 'content' bucket
DROP POLICY IF EXISTS "Public read access for content" ON storage.objects;
CREATE POLICY "Public read access for content"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'content');

-- 2. Authenticated users can upload to content bucket
DROP POLICY IF EXISTS "Authenticated users can upload content" ON storage.objects;
CREATE POLICY "Authenticated users can upload content"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'content');

-- 3. Users can update their own uploads
DROP POLICY IF EXISTS "Users can update their uploads" ON storage.objects;
CREATE POLICY "Users can update their uploads"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'content' AND owner = auth.uid())
WITH CHECK (bucket_id = 'content' AND owner = auth.uid());

-- 4. Admins can delete any file in content bucket
DROP POLICY IF EXISTS "Admins can delete content" ON storage.objects;
CREATE POLICY "Admins can delete content"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'content' 
  AND (
    owner = auth.uid() 
    OR auth.jwt() ->> 'role' = 'admin'
  )
);

-- Create folder structure (optional, for organization)
-- Folders are created automatically when files are uploaded to these paths:
-- - content/pdfs/
-- - content/videos/
-- - content/images/
-- - content/documents/

COMMENT ON TABLE storage.buckets IS 'Storage buckets for file uploads';
