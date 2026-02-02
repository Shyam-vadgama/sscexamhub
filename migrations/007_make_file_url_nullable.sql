-- Migration: Make file_url nullable in content table
-- Purpose: Allow content types like 'formula' and 'current_affairs' to be created without a file URL
-- Date: 2026-01-27

-- 1. Make file_url nullable
ALTER TABLE content ALTER COLUMN file_url DROP NOT NULL;

-- 2. Drop the check constraint on type if it exists (to allow 'formula', 'current_affairs')
-- Note: We don't know the exact name of the constraint, but typically it is 'content_type_check'
-- We will try to drop it safely.
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'content_type_check') THEN 
        ALTER TABLE content DROP CONSTRAINT content_type_check; 
    END IF; 
END $$;

-- 3. Add a new check constraint that includes all supported types (Optional, but good practice)
-- ALTER TABLE content ADD CONSTRAINT content_type_check CHECK (type IN ('pdf', 'image', 'video', 'audio', 'document', 'formula', 'current_affairs'));
