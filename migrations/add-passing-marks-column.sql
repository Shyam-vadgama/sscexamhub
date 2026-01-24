-- Add passing_marks column to tests table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tests' AND column_name = 'passing_marks') THEN
        ALTER TABLE tests ADD COLUMN passing_marks INTEGER DEFAULT 0;
    END IF;
END $$;
