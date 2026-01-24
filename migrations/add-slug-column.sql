-- Add slug column to tests table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tests' AND column_name = 'slug') THEN
        ALTER TABLE tests ADD COLUMN slug TEXT;
        -- Optional: Make it unique if you want to enforce unique slugs
        -- ALTER TABLE tests ADD CONSTRAINT tests_slug_key UNIQUE (slug);
    END IF;
END $$;
