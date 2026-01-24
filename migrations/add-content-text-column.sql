-- Add content_text column to content table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content' AND column_name = 'content_text') THEN
        ALTER TABLE content ADD COLUMN content_text TEXT;
    END IF;
END $$;

-- Reload schema cache to ensure API sees the new column
NOTIFY pgrst, 'reload schema';
