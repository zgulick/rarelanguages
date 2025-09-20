-- Migration 009: Add Lesson Splitting Support
-- Adds parent-child lesson relationships and sub-lesson functionality
-- Generated: 2025-01-18

-- Check current lessons table structure before making changes
-- Uncomment to run analysis:
-- \d lessons;

-- Step 1: Add lesson hierarchy and splitting columns
ALTER TABLE lessons ADD COLUMN parent_lesson_id UUID REFERENCES lessons(id);
ALTER TABLE lessons ADD COLUMN sequence_number INTEGER DEFAULT 1;
ALTER TABLE lessons ADD COLUMN cards_per_lesson INTEGER DEFAULT 15;
ALTER TABLE lessons ADD COLUMN is_sub_lesson BOOLEAN DEFAULT FALSE;

-- Add helpful metadata columns
ALTER TABLE lessons ADD COLUMN total_sub_lessons INTEGER DEFAULT 1;
ALTER TABLE lessons ADD COLUMN lesson_group_name VARCHAR(300);

-- Step 2: Add constraints and validation
-- Ensure sequence numbers are positive
ALTER TABLE lessons ADD CONSTRAINT chk_sequence_number_positive
  CHECK (sequence_number > 0);

-- Ensure cards_per_lesson is reasonable (5-30 cards)
ALTER TABLE lessons ADD CONSTRAINT chk_cards_per_lesson_range
  CHECK (cards_per_lesson BETWEEN 5 AND 30);

-- Ensure parent lessons cannot reference themselves
ALTER TABLE lessons ADD CONSTRAINT chk_no_self_reference
  CHECK (parent_lesson_id != id);

-- Sub-lessons must have a parent
ALTER TABLE lessons ADD CONSTRAINT chk_sub_lesson_has_parent
  CHECK (
    (is_sub_lesson = FALSE AND parent_lesson_id IS NULL) OR
    (is_sub_lesson = TRUE AND parent_lesson_id IS NOT NULL)
  );

-- Step 3: Create performance indexes
-- Index for parent-child relationships
CREATE INDEX idx_lessons_parent_lesson_id ON lessons(parent_lesson_id)
  WHERE parent_lesson_id IS NOT NULL;

-- Index for sub-lesson queries
CREATE INDEX idx_lessons_is_sub_lesson ON lessons(is_sub_lesson)
  WHERE is_sub_lesson = TRUE;

-- Composite index for sub-lesson ordering
CREATE INDEX idx_lessons_parent_sequence ON lessons(parent_lesson_id, sequence_number)
  WHERE parent_lesson_id IS NOT NULL;

-- Index for lesson content counting (performance optimization)
CREATE INDEX idx_lesson_content_lesson_id_count ON lesson_content(lesson_id);

-- Step 4: Update existing lessons with default values
UPDATE lessons SET
  cards_per_lesson = 15,
  is_sub_lesson = FALSE,
  total_sub_lessons = 1,
  lesson_group_name = name
WHERE cards_per_lesson IS NULL;

-- Step 5: Create view to identify lessons that need splitting
CREATE VIEW v_lessons_needing_split AS
SELECT
  l.id,
  l.name,
  l.skill_id,
  COUNT(lc.id) as current_content_count,
  CEIL(COUNT(lc.id)::decimal / 15) as suggested_sub_lessons
FROM lessons l
LEFT JOIN lesson_content lc ON l.id = lc.lesson_id
WHERE l.is_sub_lesson = FALSE
GROUP BY l.id, l.name, l.skill_id
HAVING COUNT(lc.id) > 20
ORDER BY current_content_count DESC;

-- Step 6: Create helper function to get sub-lessons
CREATE OR REPLACE FUNCTION get_sub_lessons(parent_id UUID)
RETURNS TABLE(
  sub_lesson_id UUID,
  sub_lesson_name VARCHAR(200),
  sequence_number INTEGER,
  content_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id,
    l.name,
    l.sequence_number,
    COUNT(lc.id)
  FROM lessons l
  LEFT JOIN lesson_content lc ON l.id = lc.lesson_id
  WHERE l.parent_lesson_id = parent_id
    AND l.is_sub_lesson = TRUE
    AND l.is_active = TRUE
  GROUP BY l.id, l.name, l.sequence_number
  ORDER BY l.sequence_number;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create validation function for lesson hierarchy
CREATE OR REPLACE FUNCTION validate_lesson_hierarchy()
RETURNS TABLE(
  lesson_id UUID,
  lesson_name VARCHAR(200),
  issue_type TEXT,
  issue_description TEXT
) AS $$
BEGIN
  -- Check for orphaned sub-lessons
  RETURN QUERY
  SELECT
    l.id,
    l.name,
    'orphaned_sub_lesson'::TEXT,
    'Sub-lesson without valid parent'::TEXT
  FROM lessons l
  WHERE l.is_sub_lesson = TRUE
    AND (l.parent_lesson_id IS NULL OR
         l.parent_lesson_id NOT IN (SELECT id FROM lessons WHERE is_sub_lesson = FALSE));

  -- Check for parent lessons with no sub-lessons
  RETURN QUERY
  SELECT
    l.id,
    l.name,
    'parent_without_children'::TEXT,
    'Parent lesson marked but no sub-lessons found'::TEXT
  FROM lessons l
  WHERE l.parent_lesson_id IS NULL
    AND l.is_sub_lesson = FALSE
    AND EXISTS (SELECT 1 FROM lessons WHERE parent_lesson_id = l.id);

  -- Check for sequence number gaps
  RETURN QUERY
  WITH sequence_gaps AS (
    SELECT
      parent_lesson_id,
      sequence_number,
      LAG(sequence_number) OVER (PARTITION BY parent_lesson_id ORDER BY sequence_number) as prev_seq
    FROM lessons
    WHERE is_sub_lesson = TRUE
      AND parent_lesson_id IS NOT NULL
  )
  SELECT
    l.id,
    l.name,
    'sequence_gap'::TEXT,
    'Gap in sequence numbers detected'::TEXT
  FROM lessons l
  JOIN sequence_gaps sg ON l.parent_lesson_id = sg.parent_lesson_id
  WHERE sg.sequence_number - sg.prev_seq > 1;
END;
$$ LANGUAGE plpgsql;

-- Verification queries (run these after migration to verify success)
-- SELECT COUNT(*) as total_lessons, AVG(cards_per_lesson) as avg_cards_per_lesson FROM lessons;
-- SELECT * FROM v_lessons_needing_split LIMIT 5;
-- SELECT * FROM validate_lesson_hierarchy();

-- Migration complete
-- Next steps: Run Phase 2 lesson splitting script