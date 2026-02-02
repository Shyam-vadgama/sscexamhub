-- ============================================
-- DIAGNOSTIC SCRIPT: Check Database State
-- Run this BEFORE creating views to understand your schema
-- ============================================

-- ============================================
-- 1. Check if required tables exist
-- ============================================
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'test_attempts', 'user_answers', 'questions', 'tests')
ORDER BY table_name;

-- Expected: Should see all 5 tables
-- If missing any, the views will fail!

-- ============================================
-- 2. Check users table columns
-- ============================================
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- Expected: Should include 'id', 'name', 'email'

-- ============================================
-- 3. Check test_attempts table columns
-- ============================================
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'test_attempts'
ORDER BY ordinal_position;

-- Expected: Should include:
-- - user_id, test_id, score, accuracy, duration_seconds
-- - completed_at, rank, percentile
-- - total_questions, correct_answers, wrong_answers, skipped_questions

-- ============================================
-- 4. Check user_answers table columns
-- ============================================
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_answers'
ORDER BY ordinal_position;

-- Expected: Should include:
-- - attempt_id, question_id, selected_answer
-- - is_correct, time_spent_seconds, is_marked_for_review

-- ============================================
-- 5. Check questions table columns
-- ============================================
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'questions'
ORDER BY ordinal_position;

-- Expected: Should include 'id', 'subject'

-- ============================================
-- 6. Check if columns from migrations exist
-- ============================================

-- From 002_fix_test_attempts_table.sql
SELECT 
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'test_attempts' AND column_name = 'rank'
  ) THEN '✅ rank exists' ELSE '❌ rank missing - run 002 migration' END as rank_check,
  
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'test_attempts' AND column_name = 'percentile'
  ) THEN '✅ percentile exists' ELSE '❌ percentile missing - run 002 migration' END as percentile_check,
  
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'test_attempts' AND column_name = 'duration_seconds'
  ) THEN '✅ duration_seconds exists' ELSE '❌ duration_seconds missing - run 002 migration' END as duration_check;

-- From 003_fix_user_answers_table.sql
SELECT 
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_answers' AND column_name = 'is_correct'
  ) THEN '✅ is_correct exists' ELSE '❌ is_correct missing - run 003 migration' END as correct_check,
  
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_answers' AND column_name = 'time_spent_seconds'
  ) THEN '✅ time_spent_seconds exists' ELSE '❌ time_spent_seconds missing - run 003 migration' END as time_check;

-- ============================================
-- 7. Check if you have any data
-- ============================================
SELECT 
  (SELECT COUNT(*) FROM users) as users_count,
  (SELECT COUNT(*) FROM tests) as tests_count,
  (SELECT COUNT(*) FROM test_attempts) as attempts_count,
  (SELECT COUNT(*) FROM user_answers) as answers_count,
  (SELECT COUNT(*) FROM questions) as questions_count;

-- If all are 0, views will work but return no data

-- ============================================
-- 8. Sample data from each table
-- ============================================
SELECT 'users' as table_name, id, name, email FROM users LIMIT 2;
SELECT 'test_attempts' as table_name, id, user_id, test_id, score, completed_at FROM test_attempts LIMIT 2;
SELECT 'user_answers' as table_name, id, attempt_id, question_id, is_correct FROM user_answers LIMIT 2;

-- ============================================
-- 9. Check existing views
-- ============================================
SELECT table_name, view_definition 
FROM information_schema.views 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Shows any views that currently exist
