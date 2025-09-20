-- Migration 010 Part 1: Create lesson structure tables

-- Add lesson section management
CREATE TABLE IF NOT EXISTS lesson_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    section_type VARCHAR(50) NOT NULL, -- 'introduction', 'vocabulary', 'pronunciation', 'grammar', 'sentences', 'practice'
    section_order INTEGER NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    estimated_minutes INTEGER DEFAULT 5,
    is_required BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add content ordering and categorization to existing lesson_content
ALTER TABLE lesson_content
ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES lesson_sections(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS content_order INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS content_section_type VARCHAR(50) DEFAULT 'vocabulary',
ADD COLUMN IF NOT EXISTS difficulty_progression INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS is_key_concept BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS prerequisites TEXT[],
ADD COLUMN IF NOT EXISTS learning_objective VARCHAR(500);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_lesson_content_order ON lesson_content(lesson_id, section_id, content_order);
CREATE INDEX IF NOT EXISTS idx_lesson_sections_order ON lesson_sections(lesson_id, section_order);

-- Add lesson progression metadata
ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS lesson_structure_version INTEGER DEFAULT 2,
ADD COLUMN IF NOT EXISTS pedagogical_approach VARCHAR(100) DEFAULT 'structured_progression',
ADD COLUMN IF NOT EXISTS content_focus TEXT[],
ADD COLUMN IF NOT EXISTS prerequisite_skills TEXT[],
ADD COLUMN IF NOT EXISTS learning_outcomes TEXT[];