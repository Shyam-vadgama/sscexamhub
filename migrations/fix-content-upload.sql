-- 1. Add missing description columns
ALTER TABLE content 
ADD COLUMN IF NOT EXISTS description_en TEXT,
ADD COLUMN IF NOT EXISTS description_hi TEXT;

-- 2. Enable RLS on storage.objects if not already enabled (usually is by default)
-- But more importantly, create a policy to allow authenticated uploads to 'content' bucket
-- Note: You typically manage storage policies in the Storage UI, but this SQL helps if you want to do it via query.

-- Allow authenticated users (Admins) to upload to 'content' bucket
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'content' );

-- Allow public read access to 'content' bucket
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'content' );

-- 3. Reload schema cache
NOTIFY pgrst, 'reload schema';
