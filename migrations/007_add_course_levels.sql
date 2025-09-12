-- Add Course Level Organization for Academic Progression
-- This extends the existing skills-based system to support university course levels

-- 1. Create courses table for course-level organization (Albanian 1, 2, 3, 4)
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  language_id UUID NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL, -- e.g., "Albanian 1", "Welsh 1"
  code VARCHAR(50) NOT NULL,  -- e.g., "ALB101", "WEL101"
  description TEXT,
  level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 4), -- Course level 1-4
  cefr_level VARCHAR(10) CHECK (cefr_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  prerequisites JSONB DEFAULT '[]', -- Course IDs that must be completed first
  learning_objectives JSONB DEFAULT '[]',
  estimated_hours INTEGER DEFAULT 40, -- Total course hours
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(language_id, level) -- One course per level per language
);

-- 2. Create course_skills junction table to link skills to courses
CREATE TABLE course_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  position INTEGER NOT NULL, -- Order within the course
  is_required BOOLEAN DEFAULT true,
  estimated_hours DECIMAL(4,2) DEFAULT 2.0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(course_id, skill_id),
  UNIQUE(course_id, position)
);

-- 3. Extend user_progress table to track course-level progress
ALTER TABLE user_progress ADD COLUMN course_id UUID REFERENCES courses(id) ON DELETE CASCADE;
CREATE INDEX idx_user_progress_course_id ON user_progress(course_id);

-- 4. Create course_progress table for high-level course tracking
CREATE TABLE course_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  status VARCHAR(20) CHECK (status IN ('not_started', 'in_progress', 'completed', 'certified')) DEFAULT 'not_started',
  enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  start_date TIMESTAMP,
  completion_date TIMESTAMP,
  total_hours_spent DECIMAL(6,2) DEFAULT 0,
  skills_completed INTEGER DEFAULT 0,
  skills_total INTEGER DEFAULT 0,
  overall_score DECIMAL(4,2), -- Overall course score 0-100
  certificate_issued BOOLEAN DEFAULT false,
  certificate_id VARCHAR(100), -- External certificate reference
  last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, course_id)
);

-- 5. Create course_units table for further organization within courses
CREATE TABLE course_units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL, -- e.g., "Unit 1: Family Basics", "Unit 2: Daily Routines"
  description TEXT,
  position INTEGER NOT NULL,
  learning_objectives JSONB DEFAULT '[]',
  estimated_hours DECIMAL(4,2) DEFAULT 8.0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(course_id, position)
);

-- 6. Create unit_skills junction table
CREATE TABLE unit_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID NOT NULL REFERENCES course_units(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(unit_id, skill_id),
  UNIQUE(unit_id, position)
);

-- 7. Create assessment table for course-level assessments
CREATE TABLE assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES course_units(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  assessment_type VARCHAR(50) CHECK (assessment_type IN ('quiz', 'exam', 'oral', 'project', 'portfolio')) DEFAULT 'quiz',
  max_score INTEGER DEFAULT 100,
  passing_score INTEGER DEFAULT 70,
  time_limit_minutes INTEGER,
  instructions TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Create user_assessments table to track assessment attempts
CREATE TABLE user_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  attempt_number INTEGER DEFAULT 1,
  score DECIMAL(5,2),
  max_score INTEGER DEFAULT 100,
  passed BOOLEAN DEFAULT false,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  time_spent_minutes INTEGER,
  responses JSONB DEFAULT '[]', -- Store user responses for review
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_courses_language_id ON courses(language_id);
CREATE INDEX idx_courses_level ON courses(level);
CREATE INDEX idx_courses_active ON courses(is_active);

CREATE INDEX idx_course_skills_course_id ON course_skills(course_id);
CREATE INDEX idx_course_skills_skill_id ON course_skills(skill_id);
CREATE INDEX idx_course_skills_position ON course_skills(position);

CREATE INDEX idx_course_progress_user_id ON course_progress(user_id);
CREATE INDEX idx_course_progress_course_id ON course_progress(course_id);
CREATE INDEX idx_course_progress_status ON course_progress(status);
CREATE INDEX idx_course_progress_completion_date ON course_progress(completion_date);

CREATE INDEX idx_course_units_course_id ON course_units(course_id);
CREATE INDEX idx_course_units_position ON course_units(position);

CREATE INDEX idx_unit_skills_unit_id ON unit_skills(unit_id);
CREATE INDEX idx_unit_skills_skill_id ON unit_skills(skill_id);

CREATE INDEX idx_assessments_course_id ON assessments(course_id);
CREATE INDEX idx_assessments_unit_id ON assessments(unit_id);
CREATE INDEX idx_assessments_skill_id ON assessments(skill_id);

CREATE INDEX idx_user_assessments_user_id ON user_assessments(user_id);
CREATE INDEX idx_user_assessments_assessment_id ON user_assessments(assessment_id);
CREATE INDEX idx_user_assessments_completed_at ON user_assessments(completed_at);