-- Test Script for Migration 009: Lesson Splitting Support
-- Run this after applying the migration to verify everything works

-- Test 1: Verify all new columns exist
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'lessons'
  AND column_name IN (
    'parent_lesson_id',
    'sequence_number',
    'cards_per_lesson',
    'is_sub_lesson',
    'total_sub_lessons',
    'lesson_group_name'
  )
ORDER BY column_name;

-- Test 2: Verify constraints exist
SELECT
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'lessons'
  AND constraint_name LIKE 'chk_%'
ORDER BY constraint_name;

-- Test 3: Verify indexes exist
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'lessons'
  AND indexname LIKE 'idx_lessons_%'
ORDER BY indexname;

-- Test 4: Check data integrity - all lessons should have valid defaults
SELECT
  COUNT(*) as total_lessons,
  COUNT(*) FILTER (WHERE cards_per_lesson IS NOT NULL) as lessons_with_cards_per_lesson,
  COUNT(*) FILTER (WHERE is_sub_lesson IS NOT NULL) as lessons_with_sub_lesson_flag,
  AVG(cards_per_lesson) as avg_cards_per_lesson,
  COUNT(*) FILTER (WHERE is_sub_lesson = TRUE) as sub_lessons_count,
  COUNT(*) FILTER (WHERE is_sub_lesson = FALSE) as parent_lessons_count
FROM lessons;

-- Test 5: Check lessons needing split view
SELECT
  'v_lessons_needing_split' as view_name,
  COUNT(*) as lessons_needing_split
FROM v_lessons_needing_split;

-- Show top 5 lessons that need splitting
SELECT
  name,
  current_content_count,
  suggested_sub_lessons
FROM v_lessons_needing_split
LIMIT 5;

-- Test 6: Verify helper functions exist and work
SELECT
  proname as function_name,
  pronargs as num_args
FROM pg_proc
WHERE proname IN ('get_sub_lessons', 'validate_lesson_hierarchy');

-- Test 7: Run validation function (should return no issues initially)
SELECT * FROM validate_lesson_hierarchy();

-- Test 8: Test constraint enforcement
-- This should fail with constraint violation (uncomment to test):
-- INSERT INTO lessons (skill_id, name, sequence_number, cards_per_lesson)
-- VALUES ((SELECT id FROM skills LIMIT 1), 'Test Lesson', -1, 50);

-- Test 9: Verify foreign key constraint on parent_lesson_id
-- This should work:
-- INSERT INTO lessons (skill_id, name, parent_lesson_id, is_sub_lesson, sequence_number)
-- VALUES (
--   (SELECT id FROM skills LIMIT 1),
--   'Test Sub Lesson',
--   (SELECT id FROM lessons WHERE is_sub_lesson = FALSE LIMIT 1),
--   TRUE,
--   1
-- );

-- Test 10: Performance test for sub-lesson queries
EXPLAIN ANALYZE
SELECT l.*, COUNT(lc.id) as content_count
FROM lessons l
LEFT JOIN lesson_content lc ON l.id = lc.lesson_id
WHERE l.is_sub_lesson = FALSE
GROUP BY l.id
ORDER BY l.position
LIMIT 10;

-- Summary report
SELECT
  'Migration 009 Test Summary' as test_name,
  CASE
    WHEN (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'parent_lesson_id') = 1
      AND (SELECT COUNT(*) FROM information_schema.table_constraints WHERE table_name = 'lessons' AND constraint_name LIKE 'chk_%') >= 4
      AND (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'lessons' AND indexname LIKE 'idx_lessons_%') >= 3
      AND (SELECT COUNT(*) FROM pg_proc WHERE proname IN ('get_sub_lessons', 'validate_lesson_hierarchy')) = 2
      AND (SELECT COUNT(*) FROM information_schema.views WHERE table_name = 'v_lessons_needing_split') = 1
    THEN 'PASS - All components created successfully'
    ELSE 'FAIL - Some components missing'
  END as result;