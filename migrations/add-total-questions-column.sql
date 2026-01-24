-- Add total_questions and total_attempts columns to tests table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tests' AND column_name = 'total_questions') THEN
        ALTER TABLE tests ADD COLUMN total_questions INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tests' AND column_name = 'total_attempts') THEN
        ALTER TABLE tests ADD COLUMN total_attempts INTEGER DEFAULT 0;
    END IF;
END $$;
