-- Migration to ensure questions table has correct structure for admin panel
-- This checks if the questions table exists with the expected columns

-- Check and display current table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'questions' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- The questions table should have these columns based on the schema:
-- - correct_answer (not correct_option) 
-- - question_text (may need to map to text_en in application)
-- - question_text_hi (may need to map to text_hi in application)

-- If you see differences, you may need to:
-- 1. Add missing columns
-- 2. Rename columns to match what the application expects

-- Example fixes if needed:
-- ALTER TABLE questions ADD COLUMN IF NOT EXISTS text_en TEXT;
-- ALTER TABLE questions ADD COLUMN IF NOT EXISTS text_hi TEXT;
-- UPDATE questions SET text_en = question_text WHERE text_en IS NULL;
-- UPDATE questions SET text_hi = question_text_hi WHERE text_hi IS NULL;