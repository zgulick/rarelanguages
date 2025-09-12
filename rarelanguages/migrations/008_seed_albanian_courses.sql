-- Seed Albanian 1-4 Course Structure
-- This creates the academic course progression for Gheg Albanian

-- Insert Albanian courses (levels 1-4)
WITH albanian_lang AS (
  SELECT id FROM languages WHERE code = 'gheg-al' LIMIT 1
)
INSERT INTO courses (language_id, name, code, description, level, cefr_level, learning_objectives, estimated_hours)
SELECT 
  albanian_lang.id,
  course_data.name,
  course_data.code,
  course_data.description,
  course_data.level,
  course_data.cefr_level,
  course_data.learning_objectives::jsonb,
  course_data.estimated_hours
FROM albanian_lang,
(VALUES 
  -- Albanian 1 (Beginner)
  ('Albanian 1: Foundations', 'ALB101', 
   'Introduction to Gheg Albanian focusing on family integration, basic conversations, and everyday vocabulary essential for family life in Albanian-speaking communities.',
   1, 'A1', 
   '["Master basic greetings and introductions", "Learn essential family vocabulary", "Understand basic sentence structure", "Navigate simple daily conversations", "Develop cultural awareness for family settings"]',
   40),
   
  -- Albanian 2 (Elementary)
  ('Albanian 2: Family Life', 'ALB102',
   'Building on foundations with focus on family dynamics, household management, and community integration. Emphasis on practical communication for family situations.',
   2, 'A2',
   '["Express needs and preferences in family contexts", "Understand and use past tenses", "Manage household conversations", "Participate in community activities", "Navigate Albanian cultural expectations"]',
   45),
   
  -- Albanian 3 (Intermediate)
  ('Albanian 3: Community Integration', 'ALB201',
   'Advanced family and community interactions, cultural competency, and complex conversations. Focus on integration into Albanian-speaking communities.',
   3, 'B1',
   '["Handle complex family discussions", "Understand cultural nuances and expectations", "Express opinions and emotions", "Navigate formal and informal situations", "Manage conflicts and misunderstandings"]',
   50),
   
  -- Albanian 4 (Upper-Intermediate)
  ('Albanian 4: Cultural Fluency', 'ALB202',
   'Fluency in family and cultural contexts, idiomatic expressions, and advanced cultural competency for deep family integration.',
   4, 'B2',
   '["Achieve near-native fluency in family settings", "Master idiomatic expressions and cultural references", "Handle emotional and sensitive conversations", "Understand regional variations and dialects", "Mentor others in cultural integration"]',
   55)
) AS course_data(name, code, description, level, cefr_level, learning_objectives, estimated_hours);

-- Set course prerequisites (each course requires the previous one)
WITH course_levels AS (
  SELECT id, level FROM courses 
  WHERE language_id = (SELECT id FROM languages WHERE code = 'gheg-al' LIMIT 1)
)
UPDATE courses 
SET prerequisites = CASE 
  WHEN level = 1 THEN '[]'::jsonb
  WHEN level = 2 THEN (
    SELECT jsonb_build_array(prev.id) 
    FROM course_levels prev 
    WHERE prev.level = courses.level - 1
  )
  WHEN level = 3 THEN (
    SELECT jsonb_build_array(prev.id) 
    FROM course_levels prev 
    WHERE prev.level = courses.level - 1
  )
  WHEN level = 4 THEN (
    SELECT jsonb_build_array(prev.id) 
    FROM course_levels prev 
    WHERE prev.level = courses.level - 1
  )
END
WHERE language_id = (SELECT id FROM languages WHERE code = 'gheg-al' LIMIT 1);

-- Create units for Albanian 1
WITH alb1_course AS (
  SELECT c.id as course_id FROM courses c
  JOIN languages l ON c.language_id = l.id
  WHERE l.code = 'gheg-al' AND c.level = 1
  LIMIT 1
)
INSERT INTO course_units (course_id, name, description, position, learning_objectives, estimated_hours)
SELECT 
  alb1_course.course_id,
  unit_data.name,
  unit_data.description,
  unit_data.position,
  unit_data.learning_objectives::jsonb,
  unit_data.estimated_hours
FROM alb1_course,
(VALUES 
  ('Unit 1: Essential Foundations', 
   'Basic greetings, introductions, and fundamental vocabulary for family integration.',
   1,
   '["Master greeting family members", "Introduce yourself and others", "Use basic courtesy expressions", "Understand family relationship terms"]',
   8.0),
   
  ('Unit 2: Family Vocabulary',
   'Comprehensive family terminology and basic household conversations.',
   2, 
   '["Identify all family members", "Describe family relationships", "Ask about family members", "Use possessive forms with family terms"]',
   8.0),
   
  ('Unit 3: Daily Interactions',
   'Common daily conversations and basic needs expression.',
   3,
   '["Express basic needs and wants", "Ask for help politely", "Understand simple instructions", "Make basic requests"]',
   8.0),
   
  ('Unit 4: Time and Scheduling', 
   'Time expressions, days, months, and basic scheduling for family activities.',
   4,
   '["Tell time accurately", "Discuss daily schedules", "Plan family activities", "Use time expressions naturally"]',
   8.0),
   
  ('Unit 5: Food and Meals',
   'Food vocabulary and meal-time conversations essential for family life.',
   5,
   '["Navigate meal conversations", "Express food preferences", "Understand cooking instructions", "Participate in food preparation discussions"]',
   8.0)
) AS unit_data(name, description, position, learning_objectives, estimated_hours);

-- Link existing Albanian skills to courses and units
-- First, let's organize skills by course level based on their current CEFR level and position

-- Albanian 1 skills (A1 level, positions 1-6 approximately)
WITH alb1_course AS (
  SELECT c.id as course_id FROM courses c
  JOIN languages l ON c.language_id = l.id
  WHERE l.code = 'gheg-al' AND c.level = 1
  LIMIT 1
),
basic_skills AS (
  SELECT s.id as skill_id FROM skills s
  JOIN languages l ON s.language_id = l.id
  WHERE l.code = 'gheg-al' 
    AND s.cefr_level = 'A1' 
    AND s.position <= 10
    AND s.is_active = true
  ORDER BY s.position
)
INSERT INTO course_skills (course_id, skill_id, position, estimated_hours)
SELECT 
  alb1_course.course_id,
  basic_skills.skill_id,
  ROW_NUMBER() OVER (ORDER BY s.position) as position,
  2.5
FROM alb1_course, basic_skills
JOIN skills s ON basic_skills.skill_id = s.id;

-- Create sample assessments for Albanian 1
WITH alb1_course AS (
  SELECT c.id as course_id FROM courses c
  JOIN languages l ON c.language_id = l.id
  WHERE l.code = 'gheg-al' AND c.level = 1
  LIMIT 1
)
INSERT INTO assessments (course_id, name, assessment_type, max_score, passing_score, time_limit_minutes, instructions)
SELECT 
  alb1_course.course_id,
  assessment_data.name,
  assessment_data.assessment_type,
  assessment_data.max_score,
  assessment_data.passing_score,
  assessment_data.time_limit_minutes,
  assessment_data.instructions
FROM alb1_course,
(VALUES 
  ('Albanian 1 Midterm Assessment', 'quiz', 100, 75, 30, 
   'Comprehensive assessment covering Units 1-3. Focus on family vocabulary, basic conversations, and cultural understanding.'),
   
  ('Albanian 1 Final Assessment', 'exam', 100, 80, 45,
   'Final assessment covering all Albanian 1 content. Includes speaking, listening, and cultural competency components.'),
   
  ('Albanian 1 Oral Assessment', 'oral', 100, 70, 15,
   'One-on-one conversation assessment focusing on family integration scenarios and basic daily interactions.')
) AS assessment_data(name, assessment_type, max_score, passing_score, time_limit_minutes, instructions);

-- Add helpful views for course management
CREATE VIEW v_course_overview AS
SELECT 
  c.id as course_id,
  c.name as course_name,
  c.code as course_code,
  c.level,
  c.cefr_level,
  l.name as language_name,
  l.code as language_code,
  COUNT(DISTINCT cs.skill_id) as total_skills,
  COUNT(DISTINCT cu.id) as total_units,
  COUNT(DISTINCT a.id) as total_assessments,
  c.estimated_hours,
  c.is_active
FROM courses c
JOIN languages l ON c.language_id = l.id
LEFT JOIN course_skills cs ON c.id = cs.course_id
LEFT JOIN course_units cu ON c.id = cu.course_id
LEFT JOIN assessments a ON c.id = a.course_id
GROUP BY c.id, c.name, c.code, c.level, c.cefr_level, l.name, l.code, c.estimated_hours, c.is_active
ORDER BY l.name, c.level;

-- Create view for user course progress
CREATE VIEW v_user_course_progress AS
SELECT 
  up.user_id,
  u.email,
  u.username,
  c.id as course_id,
  c.name as course_name,
  c.code as course_code,
  c.level,
  cp.status as course_status,
  cp.enrollment_date,
  cp.completion_date,
  cp.total_hours_spent,
  cp.skills_completed,
  cp.skills_total,
  ROUND((cp.skills_completed::decimal / NULLIF(cp.skills_total, 0) * 100), 1) as completion_percentage,
  cp.overall_score,
  cp.certificate_issued
FROM course_progress cp
JOIN users u ON cp.user_id = u.id
JOIN courses c ON cp.course_id = c.id
LEFT JOIN user_progress up ON u.id = up.user_id
ORDER BY u.email, c.level;