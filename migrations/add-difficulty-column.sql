-- Add difficulty column to tests table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tests' AND column_name = 'difficulty') THEN
        ALTER TABLE tests ADD COLUMN difficulty TEXT DEFAULT 'medium';
    END IF;
END $$;
