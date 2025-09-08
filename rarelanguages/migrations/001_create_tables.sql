-- RareLanguages Database Schema
-- Phase 1: Core Infrastructure Tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Languages Table
CREATE TABLE languages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  native_name VARCHAR(100),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE,
  username VARCHAR(100) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  current_language UUID REFERENCES languages(id),
  preferences JSONB DEFAULT '{}'
);

-- 3. Skills Table
CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  language_id UUID NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  position INTEGER NOT NULL,
  prerequisites JSONB DEFAULT '[]',
  cefr_level VARCHAR(10) CHECK (cefr_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Lessons Table
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  position INTEGER NOT NULL,
  difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 10),
  estimated_minutes INTEGER DEFAULT 10,
  prerequisites JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Lesson Content Table
CREATE TABLE lesson_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  english_phrase TEXT NOT NULL,
  target_phrase TEXT NOT NULL,
  pronunciation_guide VARCHAR(500),
  cultural_context TEXT,
  difficulty_score INTEGER CHECK (difficulty_score BETWEEN 1 AND 10) DEFAULT 5,
  exercise_types JSONB DEFAULT '["flashcard"]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  validated_by UUID -- Future reference to validator/native speaker
);

-- 6. User Progress Table
CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  status VARCHAR(20) CHECK (status IN ('not_started', 'in_progress', 'completed', 'mastered')) DEFAULT 'not_started',
  completion_date TIMESTAMP,
  total_attempts INTEGER DEFAULT 0,
  success_rate DECIMAL(3,2) CHECK (success_rate BETWEEN 0 AND 1) DEFAULT 0,
  time_spent_minutes INTEGER DEFAULT 0,
  last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, lesson_id)
);

-- 7. Spaced Repetition Table
CREATE TABLE spaced_repetition (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES lesson_content(id) ON DELETE CASCADE,
  current_interval INTEGER DEFAULT 1, -- days until next review
  ease_factor DECIMAL(3,2) DEFAULT 2.5, -- spaced repetition ease factor
  repetitions INTEGER DEFAULT 0,
  last_reviewed TIMESTAMP,
  next_review TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_response_quality INTEGER CHECK (last_response_quality BETWEEN 1 AND 5),
  total_reviews INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, content_id)
);

-- 8. User Sessions Table
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP,
  lessons_completed INTEGER DEFAULT 0,
  exercises_attempted INTEGER DEFAULT 0,
  exercises_correct INTEGER DEFAULT 0,
  total_time_minutes INTEGER DEFAULT 0,
  session_type VARCHAR(20) CHECK (session_type IN ('lesson', 'review', 'practice')) DEFAULT 'lesson'
);

-- Create indexes for performance optimization
CREATE INDEX idx_languages_code ON languages(code);
CREATE INDEX idx_languages_active ON languages(active);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_current_language ON users(current_language);
CREATE INDEX idx_users_last_active ON users(last_active);

CREATE INDEX idx_skills_language_id ON skills(language_id);
CREATE INDEX idx_skills_position ON skills(position);
CREATE INDEX idx_skills_cefr_level ON skills(cefr_level);

CREATE INDEX idx_lessons_skill_id ON lessons(skill_id);
CREATE INDEX idx_lessons_position ON lessons(position);

CREATE INDEX idx_lesson_content_lesson_id ON lesson_content(lesson_id);
CREATE INDEX idx_lesson_content_difficulty_score ON lesson_content(difficulty_score);

CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_user_progress_lesson_id ON user_progress(lesson_id);
CREATE INDEX idx_user_progress_skill_id ON user_progress(skill_id);
CREATE INDEX idx_user_progress_status ON user_progress(status);
CREATE INDEX idx_user_progress_last_accessed ON user_progress(last_accessed);

CREATE INDEX idx_spaced_repetition_user_id ON spaced_repetition(user_id);
CREATE INDEX idx_spaced_repetition_content_id ON spaced_repetition(content_id);
CREATE INDEX idx_spaced_repetition_next_review ON spaced_repetition(next_review);
CREATE INDEX idx_spaced_repetition_last_reviewed ON spaced_repetition(last_reviewed);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_started_at ON user_sessions(started_at);
CREATE INDEX idx_user_sessions_session_type ON user_sessions(session_type);