# Phase 1: Database Schema Changes - Detailed Plan
## Sub-lesson Support Implementation

### Overview
This phase adds the necessary database columns and constraints to support breaking large lessons into smaller, manageable sub-lessons. The approach maintains data integrity while enabling parent-child lesson relationships.

---

## Step 1.1: Create Migration File (30 minutes)

### File: `migrations/009_add_lesson_splitting.sql`

#### 1.1.1: Schema Analysis
**Before making changes, verify current lessons table structure:**
```sql
-- Check current lessons table structure
\d lessons;

-- Count current lessons and their content
SELECT
  l.id,
  l.name,
  COUNT(lc.id) as content_count
FROM lessons l
LEFT JOIN lesson_content lc ON l.id = lc.lesson_id
GROUP BY l.id, l.name
ORDER BY content_count DESC
LIMIT 10;
```

#### 1.1.2: Column Additions
```sql
-- Add lesson hierarchy and splitting columns
ALTER TABLE lessons ADD COLUMN parent_lesson_id UUID REFERENCES lessons(id);
ALTER TABLE lessons ADD COLUMN sequence_number INTEGER DEFAULT 1;
ALTER TABLE lessons ADD COLUMN cards_per_lesson INTEGER DEFAULT 15;
ALTER TABLE lessons ADD COLUMN is_sub_lesson BOOLEAN DEFAULT FALSE;

-- Add helpful metadata columns
ALTER TABLE lessons ADD COLUMN total_sub_lessons INTEGER DEFAULT 1;
ALTER TABLE lessons ADD COLUMN lesson_group_name VARCHAR(300);
```

#### 1.1.3: Constraints and Validation
```sql
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
```

---

## Step 1.2: Create Performance Indexes (15 minutes)

```sql
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
```

---

## Step 1.3: Update Existing Data (30 minutes)

#### 1.3.1: Set Default Values
```sql
-- Update existing lessons with default values
UPDATE lessons SET
  cards_per_lesson = 15,
  is_sub_lesson = FALSE,
  total_sub_lessons = 1,
  lesson_group_name = name
WHERE cards_per_lesson IS NULL;

-- Verify updates
SELECT
  COUNT(*) as total_lessons,
  AVG(cards_per_lesson) as avg_cards_per_lesson,
  COUNT(*) FILTER (WHERE is_sub_lesson = TRUE) as sub_lessons_count
FROM lessons;
```

#### 1.3.2: Identify Large Lessons for Future Splitting
```sql
-- Create a view to identify lessons that need splitting
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

-- Check which lessons will be split
SELECT * FROM v_lessons_needing_split;
```

---

## Step 1.4: Create Helper Functions (30 minutes)

#### 1.4.1: Function to Get Lesson Hierarchy
```sql
-- Function to get all sub-lessons for a parent lesson
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
```

#### 1.4.2: Function to Validate Lesson Hierarchy
```sql
-- Function to validate lesson splitting integrity
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
```

---

## Step 1.5: Verification and Testing (15 minutes)

#### 1.5.1: Run Validation Checks
```sql
-- Verify all constraints are working
INSERT INTO lessons (skill_id, name, sequence_number) VALUES
  ((SELECT id FROM skills LIMIT 1), 'Test Lesson', -1);
-- Should fail with constraint violation

-- Verify indexes are created
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'lessons'
  AND indexname LIKE 'idx_lessons_%';

-- Run hierarchy validation
SELECT * FROM validate_lesson_hierarchy();
```

#### 1.5.2: Performance Testing
```sql
-- Test query performance for sub-lesson retrieval
EXPLAIN ANALYZE
SELECT l.*, COUNT(lc.id) as content_count
FROM lessons l
LEFT JOIN lesson_content lc ON l.id = lc.lesson_id
WHERE l.parent_lesson_id = (SELECT id FROM lessons WHERE is_sub_lesson = FALSE LIMIT 1)
GROUP BY l.id
ORDER BY l.sequence_number;
```

---

## Step 1.6: Documentation and Rollback Plan (15 minutes)

#### 1.6.1: Create Rollback Script
**File: `migrations/rollback_009_lesson_splitting.sql`**
```sql
-- Rollback script for lesson splitting changes
-- Run this if migration needs to be reversed

-- Drop helper functions
DROP FUNCTION IF EXISTS get_sub_lessons(UUID);
DROP FUNCTION IF EXISTS validate_lesson_hierarchy();

-- Drop views
DROP VIEW IF EXISTS v_lessons_needing_split;

-- Drop indexes
DROP INDEX IF EXISTS idx_lessons_parent_lesson_id;
DROP INDEX IF EXISTS idx_lessons_is_sub_lesson;
DROP INDEX IF EXISTS idx_lessons_parent_sequence;
DROP INDEX IF EXISTS idx_lesson_content_lesson_id_count;

-- Drop constraints
ALTER TABLE lessons DROP CONSTRAINT IF EXISTS chk_sequence_number_positive;
ALTER TABLE lessons DROP CONSTRAINT IF EXISTS chk_cards_per_lesson_range;
ALTER TABLE lessons DROP CONSTRAINT IF EXISTS chk_no_self_reference;
ALTER TABLE lessons DROP CONSTRAINT IF EXISTS chk_sub_lesson_has_parent;

-- Drop columns
ALTER TABLE lessons DROP COLUMN IF EXISTS parent_lesson_id;
ALTER TABLE lessons DROP COLUMN IF EXISTS sequence_number;
ALTER TABLE lessons DROP COLUMN IF EXISTS cards_per_lesson;
ALTER TABLE lessons DROP COLUMN IF EXISTS is_sub_lesson;
ALTER TABLE lessons DROP COLUMN IF EXISTS total_sub_lessons;
ALTER TABLE lessons DROP COLUMN IF EXISTS lesson_group_name;
```

#### 1.6.2: Update Database Documentation
**Add to existing schema documentation:**
```markdown
## Lesson Splitting Schema

### New Columns:
- `parent_lesson_id`: References parent lesson for sub-lesson hierarchy
- `sequence_number`: Order of sub-lessons within a parent lesson
- `cards_per_lesson`: Target number of cards per lesson (default 15)
- `is_sub_lesson`: Boolean flag indicating if this is a sub-lesson
- `total_sub_lessons`: Total number of sub-lessons for a parent lesson
- `lesson_group_name`: Display name for the lesson group

### Constraints:
- Sub-lessons must have a parent lesson
- Sequence numbers must be positive
- Cards per lesson must be between 5-30
- No self-referencing parent relationships
```

---

## Success Criteria Checklist

### ✅ Schema Changes
- [ ] All new columns added successfully
- [ ] Constraints created and working
- [ ] Indexes created for performance
- [ ] Existing data updated with defaults

### ✅ Helper Functions
- [ ] `get_sub_lessons()` function working
- [ ] `validate_lesson_hierarchy()` function working
- [ ] View `v_lessons_needing_split` created

### ✅ Validation
- [ ] No constraint violations in existing data
- [ ] Query performance acceptable
- [ ] Rollback script tested and documented

### ✅ Documentation
- [ ] Migration file documented
- [ ] Rollback procedure documented
- [ ] Schema changes documented

---

## Estimated Timeline: 2 hours
- **Step 1.1**: Create Migration File (30 min)
- **Step 1.2**: Create Indexes (15 min)
- **Step 1.3**: Update Existing Data (30 min)
- **Step 1.4**: Create Helper Functions (30 min)
- **Step 1.5**: Verification (15 min)
- **Step 1.6**: Documentation (15 min)

---

## Next Phase Dependencies
This phase must be completed successfully before:
- Phase 2: Lesson Splitting Script (depends on new schema)
- Phase 3: API Updates (depends on helper functions)
- Phase 4: UI Updates (depends on sub-lesson structure)

---

*Generated: 2025-01-18*
*Status: Ready for implementation*