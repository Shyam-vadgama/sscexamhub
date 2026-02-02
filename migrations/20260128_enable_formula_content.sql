-- Migration: Enable Formula Content Support
-- Purpose: Consolidate changes to support 'formula' content type with null file_url and text content
-- Context: Fixes issue with inserting formula data like "Area of Rectangle" where file_url is null

-- 1. Make file_url nullable (from 007_make_file_url_nullable.sql)
ALTER TABLE content ALTER COLUMN file_url DROP NOT NULL;

-- 2. Update type constraint to allow 'formula' (from 007_make_file_url_nullable.sql)
-- First drop the existing constraint. We handle potential naming variations.
DO $$
BEGIN
    -- Try to drop common constraint names
    BEGIN
        ALTER TABLE content DROP CONSTRAINT IF EXISTS content_type_check;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE content DROP CONSTRAINT IF EXISTS content_type_check1;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
END $$;

-- Re-add the constraint with 'formula' and 'current_affairs' included
ALTER TABLE content ADD CONSTRAINT content_type_check 
    CHECK (type IN ('pdf', 'image', 'video', 'audio', 'document', 'formula', 'current_affairs'));

-- 3. Add content_text column (from add-content-text-column.sql)
ALTER TABLE content ADD COLUMN IF NOT EXISTS content_text TEXT;

-- 4. Add description columns (from fix-content-upload.sql)
ALTER TABLE content ADD COLUMN IF NOT EXISTS description_en TEXT;
ALTER TABLE content ADD COLUMN IF NOT EXISTS description_hi TEXT;

-- 5. Ensure metadata is JSONB (it usually is, but ensuring it exists for stability)
ALTER TABLE content ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- 6. Reload schema cache to ensure API sees the new column structure
NOTIFY pgrst, 'reload schema';
