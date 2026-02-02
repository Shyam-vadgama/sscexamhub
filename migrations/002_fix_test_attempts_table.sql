-- Migration: Fix Test Attempts Table - Add Ranking and Metrics Columns
-- Purpose: Add columns needed for ranking, percentile, and detailed metrics
-- Date: 2026-01-27

-- Add missing columns if they don't exist
ALTER TABLE test_attempts ADD COLUMN IF NOT EXISTS rank INTEGER;
ALTER TABLE test_attempts ADD COLUMN IF NOT EXISTS percentile DECIMAL(5,2);
ALTER TABLE test_attempts ADD COLUMN IF NOT EXISTS duration_seconds INTEGER DEFAULT 0;
ALTER TABLE test_attempts ADD COLUMN IF NOT EXISTS answers JSONB DEFAULT '{}';
ALTER TABLE test_attempts ADD COLUMN IF NOT EXISTS total_questions INTEGER DEFAULT 0;
ALTER TABLE test_attempts ADD COLUMN IF NOT EXISTS correct_answers INTEGER DEFAULT 0;
ALTER TABLE test_attempts ADD COLUMN IF NOT EXISTS wrong_answers INTEGER DEFAULT 0;
ALTER TABLE test_attempts ADD COLUMN IF NOT EXISTS skipped_questions INTEGER DEFAULT 0;
ALTER TABLE test_attempts ADD COLUMN IF NOT EXISTS time_per_question DECIMAL(10,2);
ALTER TABLE test_attempts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Ensure completed_at column exists
ALTER TABLE test_attempts ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for ranking queries (critical for performance)
CREATE INDEX IF NOT EXISTS idx_test_attempts_test_score ON test_attempts(test_id, score DESC, duration_seconds ASC);
CREATE INDEX IF NOT EXISTS idx_test_attempts_user ON test_attempts(user_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_test_attempts_completed ON test_attempts(completed_at DESC) WHERE completed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_test_attempts_rank ON test_attempts(test_id, rank) WHERE rank IS NOT NULL;

-- Add comments to columns
COMMENT ON COLUMN test_attempts.rank IS 'User rank for this test (1 = best)';
COMMENT ON COLUMN test_attempts.percentile IS 'Percentile score (0-100)';
COMMENT ON COLUMN test_attempts.duration_seconds IS 'Time taken to complete test in seconds';
COMMENT ON COLUMN test_attempts.answers IS 'JSON object with question IDs as keys and user answers';
COMMENT ON COLUMN test_attempts.total_questions IS 'Total number of questions in test';
COMMENT ON COLUMN test_attempts.correct_answers IS 'Number of correct answers';
COMMENT ON COLUMN test_attempts.wrong_answers IS 'Number of wrong answers';
COMMENT ON COLUMN test_attempts.skipped_questions IS 'Number of skipped questions';
COMMENT ON COLUMN test_attempts.time_per_question IS 'Average time per question in seconds';
