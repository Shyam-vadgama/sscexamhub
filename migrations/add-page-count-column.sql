-- Add page_count column
ALTER TABLE content 
ADD COLUMN IF NOT EXISTS page_count INTEGER DEFAULT 0;

-- Add file_size and file_url just in case they are missing too
ALTER TABLE content 
ADD COLUMN IF NOT EXISTS file_size INTEGER,
ADD COLUMN IF NOT EXISTS file_url TEXT;

-- Reload schema cache to ensure API sees the new column
NOTIFY pgrst, 'reload schema';
