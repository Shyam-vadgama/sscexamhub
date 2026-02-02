-- Migration: Create Analytics Views for Performance Queries
-- Purpose: Pre-computed views for faster analytics queries
-- Date: 2026-01-27

-- Drop existing views if they exist
DROP VIEW IF EXISTS user_performance_summary CASCADE;
DROP VIEW IF EXISTS user_subject_performance CASCADE;
DROP VIEW IF EXISTS test_leaderboard CASCADE;
DROP VIEW IF EXISTS daily_user_stats CASCADE;

-- 1. User Performance Summary View
CREATE VIEW user_performance_summary AS
SELECT 
  u.id as user_id,
  u.name,
  u.email,
  COUNT(DISTINCT ta.id) FILTER (WHERE ta.completed_at IS NOT NULL) as total_completed,
  COUNT(DISTINCT ta.test_id) FILTER (WHERE ta.completed_at IS NOT NULL) as total_tests,
  COALESCE(AVG(ta.score) FILTER (WHERE ta.completed_at IS NOT NULL), 0) as average_score,
  COALESCE(AVG(ta.accuracy) FILTER (WHERE ta.completed_at IS NOT NULL), 0) as average_accuracy,
  COALESCE(MAX(ta.score), 0) as best_score,
  (
    SELECT t.title 
    FROM test_attempts ta2 
    JOIN tests t ON ta2.test_id = t.id 
    WHERE ta2.user_id = u.id AND ta2.completed_at IS NOT NULL 
    ORDER BY ta2.score DESC 
    LIMIT 1
  ) as best_test_name,
  (
    SELECT ta2.test_id 
    FROM test_attempts ta2 
    WHERE ta2.user_id = u.id AND ta2.completed_at IS NOT NULL 
    ORDER BY ta2.score DESC 
    LIMIT 1
  ) as best_test_id,
  COALESCE(SUM(ta.total_questions) FILTER (WHERE ta.completed_at IS NOT NULL), 0) as total_questions_answered,
  COALESCE(SUM(ta.correct_answers) FILTER (WHERE ta.completed_at IS NOT NULL), 0) as total_correct_answers,
  COALESCE(SUM(ta.wrong_answers) FILTER (WHERE ta.completed_at IS NOT NULL), 0) as total_wrong_answers,
  COALESCE(SUM(ta.duration_seconds) FILTER (WHERE ta.completed_at IS NOT NULL) / 60.0, 0) as total_time_spent_minutes,
  MIN(ta.completed_at) FILTER (WHERE ta.completed_at IS NOT NULL) as first_test_date,
  MAX(ta.completed_at) FILTER (WHERE ta.completed_at IS NOT NULL) as last_test_date
FROM users u
LEFT JOIN test_attempts ta ON u.id = ta.user_id
GROUP BY u.id, u.name, u.email;

COMMENT ON VIEW user_performance_summary IS 'Aggregated performance metrics for each user';

-- 2. Subject-wise Performance View
-- Note: This assumes questions have a 'subject' column
-- If your schema is different, adjust accordingly
CREATE VIEW user_subject_performance AS
SELECT 
  ta.user_id,
  COALESCE(q.subject, 'Unknown') as subject,
  COUNT(*) as questions_attempted,
  SUM(CASE WHEN ua.is_correct = true THEN 1 ELSE 0 END) as correct_answers,
  SUM(CASE WHEN ua.is_correct = false THEN 1 ELSE 0 END) as wrong_answers,
  SUM(CASE WHEN ua.selected_answer IS NULL THEN 1 ELSE 0 END) as skipped,
  CASE 
    WHEN COUNT(*) > 0 THEN 
      ROUND((SUM(CASE WHEN ua.is_correct = true THEN 1 ELSE 0 END)::DECIMAL / COUNT(*)) * 100, 2)
    ELSE 0 
  END as accuracy,
  COALESCE(AVG(ua.time_spent_seconds), 0) as avg_time_per_question
FROM user_answers ua
JOIN test_attempts ta ON ua.attempt_id = ta.id
JOIN questions q ON ua.question_id = q.id
WHERE ua.selected_answer IS NOT NULL OR ua.is_correct IS NOT NULL
GROUP BY ta.user_id, q.subject;

COMMENT ON VIEW user_subject_performance IS 'Subject-wise accuracy and performance for each user';

-- 3. Test Leaderboard View (with ranking)
CREATE VIEW test_leaderboard AS
SELECT 
  ta.test_id,
  ta.id as attempt_id,
  ta.user_id,
  u.name as user_name,
  ta.score,
  ta.accuracy,
  ta.duration_seconds,
  ta.completed_at,
  ta.correct_answers,
  ta.wrong_answers,
  ta.skipped_questions,
  ta.rank,
  ta.percentile,
  ROW_NUMBER() OVER (
    PARTITION BY ta.test_id 
    ORDER BY ta.score DESC, ta.duration_seconds ASC, ta.completed_at ASC
  ) as leaderboard_rank,
  COUNT(*) OVER (PARTITION BY ta.test_id) as total_participants
FROM test_attempts ta
JOIN users u ON ta.user_id = u.id
WHERE ta.completed_at IS NOT NULL;

COMMENT ON VIEW test_leaderboard IS 'Ranked leaderboard for each test with participant count';

-- 4. Daily User Stats View (for streak calculation)
CREATE VIEW daily_user_stats AS
SELECT 
  user_id,
  DATE(completed_at) as activity_date,
  COUNT(*) as tests_completed,
  AVG(score) as avg_score,
  AVG(accuracy) as avg_accuracy,
  SUM(duration_seconds) as total_time_seconds
FROM test_attempts
WHERE completed_at IS NOT NULL
GROUP BY user_id, DATE(completed_at)
ORDER BY user_id, activity_date DESC;

COMMENT ON VIEW daily_user_stats IS 'Daily activity stats for streak calculation';

-- Grant select permissions on views
GRANT SELECT ON user_performance_summary TO authenticated;
GRANT SELECT ON user_subject_performance TO authenticated;
GRANT SELECT ON test_leaderboard TO authenticated;
GRANT SELECT ON daily_user_stats TO authenticated;
