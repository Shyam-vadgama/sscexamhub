-- Migration: Create Ranking Calculation Functions
-- Purpose: Automatic rank and percentile calculation for test attempts
-- Date: 2026-01-27

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS calculate_rank(UUID);
DROP FUNCTION IF EXISTS calculate_percentile(UUID);
DROP FUNCTION IF EXISTS calculate_current_streak(UUID);
DROP FUNCTION IF EXISTS update_test_rankings();
DROP TRIGGER IF EXISTS trigger_update_rankings ON test_attempts;

-- 1. Function to calculate rank for a specific attempt
CREATE OR REPLACE FUNCTION calculate_rank(attempt_id_param UUID) 
RETURNS INTEGER AS $$
DECLARE
  user_score DECIMAL;
  user_time INTEGER;
  user_completed_at TIMESTAMP;
  test_id_param UUID;
  rank_value INTEGER;
BEGIN
  -- Get attempt details
  SELECT score, duration_seconds, test_id, completed_at
  INTO user_score, user_time, test_id_param, user_completed_at
  FROM test_attempts 
  WHERE id = attempt_id_param;
  
  -- If attempt not found or not completed, return NULL
  IF test_id_param IS NULL OR user_completed_at IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Calculate rank (1 = best)
  -- Rank is based on: 1) Higher score 2) Lower time 3) Earlier completion
  SELECT COUNT(*) + 1 INTO rank_value
  FROM test_attempts
  WHERE test_id = test_id_param
    AND completed_at IS NOT NULL
    AND (
      score > user_score 
      OR (score = user_score AND duration_seconds < user_time)
      OR (score = user_score AND duration_seconds = user_time AND completed_at < user_completed_at)
    );
  
  RETURN rank_value;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_rank IS 'Calculate rank for a test attempt based on score, time, and completion date';

-- 2. Function to calculate percentile for a specific attempt
CREATE OR REPLACE FUNCTION calculate_percentile(attempt_id_param UUID) 
RETURNS DECIMAL AS $$
DECLARE
  user_score DECIMAL;
  test_id_param UUID;
  total_attempts INTEGER;
  lower_score_attempts INTEGER;
  percentile_value DECIMAL;
BEGIN
  -- Get attempt details
  SELECT score, test_id 
  INTO user_score, test_id_param
  FROM test_attempts 
  WHERE id = attempt_id_param;
  
  -- If attempt not found, return NULL
  IF test_id_param IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Count total completed attempts for this test
  SELECT COUNT(*) INTO total_attempts
  FROM test_attempts
  WHERE test_id = test_id_param AND completed_at IS NOT NULL;
  
  -- If no other attempts, return 100 (top percentile)
  IF total_attempts <= 1 THEN
    RETURN 100.0;
  END IF;
  
  -- Count attempts with LOWER score (user scored better than these)
  SELECT COUNT(*) INTO lower_score_attempts
  FROM test_attempts
  WHERE test_id = test_id_param 
    AND completed_at IS NOT NULL
    AND score < user_score;
  
  -- Calculate percentile: (count of lower scores / total attempts) * 100
  percentile_value := (lower_score_attempts::DECIMAL / total_attempts::DECIMAL) * 100;
  
  RETURN ROUND(percentile_value, 2);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_percentile IS 'Calculate percentile (0-100) for a test attempt';

-- 3. Function to calculate current streak for a user
CREATE OR REPLACE FUNCTION calculate_current_streak(user_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
  streak_count INTEGER := 0;
  check_date DATE := CURRENT_DATE;
  has_activity BOOLEAN;
BEGIN
  -- Check each day going backwards from today
  LOOP
    -- Check if user has any test completion on this date
    SELECT EXISTS(
      SELECT 1 
      FROM test_attempts 
      WHERE user_id = user_id_param 
        AND DATE(completed_at) = check_date
        AND completed_at IS NOT NULL
    ) INTO has_activity;
    
    -- If no activity on this day, break the streak
    IF NOT has_activity THEN
      EXIT;
    END IF;
    
    -- Increment streak and check previous day
    streak_count := streak_count + 1;
    check_date := check_date - INTERVAL '1 day';
    
    -- Safety limit: don't calculate beyond 1 year
    IF streak_count >= 365 THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN streak_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_current_streak IS 'Calculate current consecutive days streak for a user';

-- 4. Trigger function to auto-update rankings when test is completed
CREATE OR REPLACE FUNCTION update_test_rankings()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update rankings when a test is completed (completed_at changes from NULL to a value)
  IF NEW.completed_at IS NOT NULL AND (OLD.completed_at IS NULL OR OLD.completed_at IS DISTINCT FROM NEW.completed_at) THEN
    -- Calculate and update rank
    NEW.rank := calculate_rank(NEW.id);
    
    -- Calculate and update percentile
    NEW.percentile := calculate_percentile(NEW.id);
    
    -- Calculate time per question if not already set
    IF NEW.total_questions > 0 AND NEW.time_per_question IS NULL THEN
      NEW.time_per_question := NEW.duration_seconds::DECIMAL / NEW.total_questions::DECIMAL;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_test_rankings IS 'Trigger function to automatically update rank and percentile when test is completed';

-- 5. Create trigger on test_attempts table
CREATE TRIGGER trigger_update_rankings
  BEFORE UPDATE ON test_attempts
  FOR EACH ROW
  EXECUTE FUNCTION update_test_rankings();

COMMENT ON TRIGGER trigger_update_rankings ON test_attempts IS 'Automatically calculate rank and percentile when test is completed';

-- 6. Function to recalculate rankings for all attempts of a specific test
-- (useful when you want to refresh rankings after data correction)
CREATE OR REPLACE FUNCTION recalculate_test_rankings(test_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER := 0;
  attempt_record RECORD;
BEGIN
  -- Loop through all completed attempts for this test
  FOR attempt_record IN 
    SELECT id FROM test_attempts 
    WHERE test_id = test_id_param AND completed_at IS NOT NULL
  LOOP
    -- Update rank and percentile for each attempt
    UPDATE test_attempts
    SET 
      rank = calculate_rank(attempt_record.id),
      percentile = calculate_percentile(attempt_record.id)
    WHERE id = attempt_record.id;
    
    updated_count := updated_count + 1;
  END LOOP;
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION recalculate_test_rankings IS 'Manually recalculate rankings for all attempts of a test';
