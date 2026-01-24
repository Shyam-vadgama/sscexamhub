-- Add subject column to questions table to match application expectations
-- The application expects a direct subject field rather than topic_id relationship

ALTER TABLE questions ADD COLUMN IF NOT EXISTS subject VARCHAR(100);

-- Update the subject column for existing questions if any exist
-- (You may want to run a data migration script if you have existing data)

-- Add an index for better query performance
CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions(subject);

-- Example of how to populate subject field from topics if you have existing data:
-- UPDATE questions 
-- SET subject = s.name 
-- FROM topics t 
-- JOIN subjects s ON t.subject_id = s.id 
-- WHERE questions.topic_id = t.id 
-- AND questions.subject IS NULL;