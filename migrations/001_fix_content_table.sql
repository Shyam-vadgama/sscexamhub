-- Migration: Fix Content Table - Add Missing Columns for PDF Metadata
-- Purpose: Ensure content table has all required columns for proper PDF handling
-- Date: 2026-01-27

-- Add missing columns if they don't exist
ALTER TABLE content ADD COLUMN IF NOT EXISTS page_count INTEGER DEFAULT 0;
ALTER TABLE content ADD COLUMN IF NOT EXISTS file_size_mb DECIMAL(10,2) DEFAULT 0;
ALTER TABLE content ADD COLUMN IF NOT EXISTS file_path TEXT;
ALTER TABLE content ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE content ADD COLUMN IF NOT EXISTS duration_seconds INTEGER DEFAULT 0; -- for video content
ALTER TABLE content ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE content ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en';
ALTER TABLE content ADD COLUMN IF NOT EXISTS category VARCHAR(100);

-- Ensure is_free column exists
ALTER TABLE content ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT true;

-- Add updated_at column if not exists
ALTER TABLE content ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_content_type ON content(type);
CREATE INDEX IF NOT EXISTS idx_content_is_free ON content(is_free);
CREATE INDEX IF NOT EXISTS idx_content_created_at ON content(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_category ON content(category);
CREATE INDEX IF NOT EXISTS idx_content_language ON content(language);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS update_content_updated_at ON content;
CREATE TRIGGER update_content_updated_at
    BEFORE UPDATE ON content
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comment to table
COMMENT ON TABLE content IS 'Unified content table for PDFs, formulas, current affairs, videos, etc.';
COMMENT ON COLUMN content.page_count IS 'Number of pages (for PDFs)';
COMMENT ON COLUMN content.file_size_mb IS 'File size in megabytes';
COMMENT ON COLUMN content.file_path IS 'Storage path in Supabase storage';
COMMENT ON COLUMN content.thumbnail_url IS 'URL to thumbnail/preview image';
COMMENT ON COLUMN content.duration_seconds IS 'Duration in seconds (for videos)';
COMMENT ON COLUMN content.metadata IS 'Additional metadata in JSON format';

-- Update RLS policies to allow public read for free content
DROP POLICY IF EXISTS "Public read access for free content" ON content;
CREATE POLICY "Public read access for free content"
ON content FOR SELECT
TO public
USING (is_free = true);

-- Allow authenticated users to read all content
DROP POLICY IF EXISTS "Authenticated users can read all content" ON content;
CREATE POLICY "Authenticated users can read all content"
ON content FOR SELECT
TO authenticated
USING (true);

-- Allow admin users to insert/update/delete content
DROP POLICY IF EXISTS "Admins can manage content" ON content;
CREATE POLICY "Admins can manage content"
ON content FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin')
WITH CHECK (auth.jwt() ->> 'role' = 'admin');
