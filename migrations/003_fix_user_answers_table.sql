-- Migration: Fix User Answers Table - Add Metadata Columns
-- Purpose: Add columns for time tracking and correctness validation
-- Date: 2026-01-27

-- Add missing columns if they don't exist
ALTER TABLE user_answers ADD COLUMN IF NOT EXISTS time_spent_seconds INTEGER DEFAULT 0;
ALTER TABLE user_answers ADD COLUMN IF NOT EXISTS is_correct BOOLEAN;
ALTER TABLE user_answers ADD COLUMN IF NOT EXISTS is_marked_for_review BOOLEAN DEFAULT false;
ALTER TABLE user_answers ADD COLUMN IF NOT EXISTS attempt_number INTEGER DEFAULT 1;
ALTER TABLE user_answers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_user_answers_attempt ON user_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_user_answers_question ON user_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_user_answers_correct ON user_answers(is_correct) WHERE is_correct IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_answers_created ON user_answers(created_at DESC);

-- Add comments
COMMENT ON COLUMN user_answers.time_spent_seconds IS 'Time spent on this question in seconds';
COMMENT ON COLUMN user_answers.is_correct IS 'Whether the answer was correct (null if not answered)';
COMMENT ON COLUMN user_answers.is_marked_for_review IS 'Whether user marked this question for review';
COMMENT ON COLUMN user_answers.attempt_number IS 'If user attempted multiple times (for practice mode)';
