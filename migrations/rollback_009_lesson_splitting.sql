-- Rollback Script for Migration 009: Lesson Splitting Support
-- WARNING: This will remove all lesson splitting functionality
-- Make sure to backup your database before running this rollback

-- Confirm rollback intent (uncomment the line below to proceed)
-- DO $$BEGIN RAISE NOTICE 'Starting rollback of lesson splitting migration...'; END$$;

-- Step 1: Drop helper functions
DROP FUNCTION IF EXISTS get_sub_lessons(UUID);
DROP FUNCTION IF EXISTS validate_lesson_hierarchy();

-- Step 2: Drop views
DROP VIEW IF EXISTS v_lessons_needing_split;

-- Step 3: Drop indexes (in reverse order of creation)
DROP INDEX IF EXISTS idx_lesson_content_lesson_id_count;
DROP INDEX IF EXISTS idx_lessons_parent_sequence;
DROP INDEX IF EXISTS idx_lessons_is_sub_lesson;
DROP INDEX IF EXISTS idx_lessons_parent_lesson_id;

-- Step 4: Drop constraints (in reverse order of creation)
ALTER TABLE lessons DROP CONSTRAINT IF EXISTS chk_sub_lesson_has_parent;
ALTER TABLE lessons DROP CONSTRAINT IF EXISTS chk_no_self_reference;
ALTER TABLE lessons DROP CONSTRAINT IF EXISTS chk_cards_per_lesson_range;
ALTER TABLE lessons DROP CONSTRAINT IF EXISTS chk_sequence_number_positive;

-- Step 5: Drop columns (in reverse order of creation)
-- Note: PostgreSQL doesn't support IF EXISTS for DROP COLUMN, so we use exception handling
DO $$
BEGIN
    BEGIN
        ALTER TABLE lessons DROP COLUMN lesson_group_name;
    EXCEPTION
        WHEN undefined_column THEN NULL;
    END;

    BEGIN
        ALTER TABLE lessons DROP COLUMN total_sub_lessons;
    EXCEPTION
        WHEN undefined_column THEN NULL;
    END;

    BEGIN
        ALTER TABLE lessons DROP COLUMN is_sub_lesson;
    EXCEPTION
        WHEN undefined_column THEN NULL;
    END;

    BEGIN
        ALTER TABLE lessons DROP COLUMN cards_per_lesson;
    EXCEPTION
        WHEN undefined_column THEN NULL;
    END;

    BEGIN
        ALTER TABLE lessons DROP COLUMN sequence_number;
    EXCEPTION
        WHEN undefined_column THEN NULL;
    END;

    BEGIN
        ALTER TABLE lessons DROP COLUMN parent_lesson_id;
    EXCEPTION
        WHEN undefined_column THEN NULL;
    END;
END$$;

-- Step 6: Verify rollback completion
-- Check that all lesson splitting columns are removed
SELECT
  COUNT(*) as remaining_lesson_splitting_columns
FROM information_schema.columns
WHERE table_name = 'lessons'
  AND column_name IN (
    'parent_lesson_id',
    'sequence_number',
    'cards_per_lesson',
    'is_sub_lesson',
    'total_sub_lessons',
    'lesson_group_name'
  );

-- Check that all lesson splitting constraints are removed
SELECT
  COUNT(*) as remaining_lesson_splitting_constraints
FROM information_schema.table_constraints
WHERE table_name = 'lessons'
  AND constraint_name LIKE 'chk_%';

-- Check that all lesson splitting indexes are removed
SELECT
  COUNT(*) as remaining_lesson_splitting_indexes
FROM pg_indexes
WHERE tablename = 'lessons'
  AND indexname LIKE 'idx_lessons_%';

-- Final verification
SELECT
  CASE
    WHEN (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'lessons' AND column_name IN ('parent_lesson_id', 'sequence_number', 'cards_per_lesson', 'is_sub_lesson', 'total_sub_lessons', 'lesson_group_name')) = 0
      AND (SELECT COUNT(*) FROM information_schema.table_constraints WHERE table_name = 'lessons' AND constraint_name LIKE 'chk_%') = 0
      AND (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'lessons' AND indexname LIKE 'idx_lessons_%') = 0
      AND (SELECT COUNT(*) FROM pg_proc WHERE proname IN ('get_sub_lessons', 'validate_lesson_hierarchy')) = 0
      AND (SELECT COUNT(*) FROM information_schema.views WHERE table_name = 'v_lessons_needing_split') = 0
    THEN 'SUCCESS - Lesson splitting migration fully rolled back'
    ELSE 'WARNING - Some components may still exist'
  END as rollback_status;

-- Rollback complete
-- The lessons table should now be in its original state before migration 009