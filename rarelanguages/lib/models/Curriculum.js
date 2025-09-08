const { query, db } = require('../database');

class Curriculum {
  // Get all languages
  static async getLanguages() {
    const languages = await db.select('languages', { active: true }, 'name ASC');
    return languages;
  }

  // Get language by code
  static async getLanguageByCode(code) {
    const languages = await db.select('languages', { code, active: true });
    return languages[0] || null;
  }

  // Get skills for a language
  static async getSkillsByLanguage(languageId, includeInactive = false) {
    const conditions = { language_id: languageId };
    if (!includeInactive) {
      conditions.is_active = true;
    }

    const skills = await db.select('skills', conditions, 'position ASC');
    
    // Parse prerequisites JSON
    return skills.map(skill => ({
      ...skill,
      prerequisites: typeof skill.prerequisites === 'string' 
        ? JSON.parse(skill.prerequisites) 
        : skill.prerequisites || []
    }));
  }

  // Get skill by ID with full details
  static async getSkillById(skillId) {
    const skills = await db.select('skills', { id: skillId });
    if (skills.length === 0) return null;

    const skill = skills[0];
    skill.prerequisites = typeof skill.prerequisites === 'string' 
      ? JSON.parse(skill.prerequisites) 
      : skill.prerequisites || [];

    // Get lessons for this skill
    skill.lessons = await this.getLessonsBySkill(skillId);

    return skill;
  }

  // Get lessons for a skill
  static async getLessonsBySkill(skillId, includeInactive = false) {
    const conditions = { skill_id: skillId };
    if (!includeInactive) {
      conditions.is_active = true;
    }

    const lessons = await db.select('lessons', conditions, 'position ASC');
    
    // Parse prerequisites JSON
    return lessons.map(lesson => ({
      ...lesson,
      prerequisites: typeof lesson.prerequisites === 'string' 
        ? JSON.parse(lesson.prerequisites) 
        : lesson.prerequisites || []
    }));
  }

  // Get lesson by ID with content
  static async getLessonById(lessonId) {
    const lessons = await db.select('lessons', { id: lessonId });
    if (lessons.length === 0) return null;

    const lesson = lessons[0];
    lesson.prerequisites = typeof lesson.prerequisites === 'string' 
      ? JSON.parse(lesson.prerequisites) 
      : lesson.prerequisites || [];

    // Get content for this lesson
    lesson.content = await this.getContentByLesson(lessonId);

    // Get skill info
    const skills = await db.select('skills', { id: lesson.skill_id });
    lesson.skill = skills[0] || null;

    return lesson;
  }

  // Get content for a lesson
  static async getContentByLesson(lessonId) {
    const content = await db.select('lesson_content', { lesson_id: lessonId });
    
    return content.map(item => ({
      ...item,
      exercise_types: typeof item.exercise_types === 'string' 
        ? JSON.parse(item.exercise_types) 
        : item.exercise_types || ['flashcard']
    }));
  }

  // Get full curriculum structure for a language
  static async getFullCurriculum(languageId) {
    const skills = await this.getSkillsByLanguage(languageId);
    
    // Add lesson counts and content counts for each skill
    for (const skill of skills) {
      const lessons = await this.getLessonsBySkill(skill.id);
      skill.lesson_count = lessons.length;
      
      let totalContent = 0;
      for (const lesson of lessons) {
        const content = await this.getContentByLesson(lesson.id);
        totalContent += content.length;
      }
      skill.content_count = totalContent;
    }

    return skills;
  }

  // Check if skill prerequisites are met for a user
  static async checkSkillPrerequisites(userId, skillId) {
    const skill = await this.getSkillById(skillId);
    if (!skill || skill.prerequisites.length === 0) {
      return { met: true, missing: [] };
    }

    const result = await query(`
      SELECT 
        s.id,
        s.name,
        COALESCE(up.status, 'not_started') as status
      FROM skills s
      LEFT JOIN (
        SELECT DISTINCT 
          skill_id, 
          CASE WHEN COUNT(*) = COUNT(CASE WHEN status = 'completed' THEN 1 END) 
               THEN 'completed' 
               ELSE 'in_progress' 
          END as status
        FROM user_progress 
        WHERE user_id = $1
        GROUP BY skill_id
      ) up ON s.id = up.skill_id
      WHERE s.id = ANY($2)
    `, [userId, skill.prerequisites]);

    const prerequisiteStatuses = result.rows;
    const missing = prerequisiteStatuses.filter(p => p.status !== 'completed');

    return {
      met: missing.length === 0,
      missing: missing.map(p => ({ id: p.id, name: p.name }))
    };
  }

  // Check if lesson prerequisites are met for a user
  static async checkLessonPrerequisites(userId, lessonId) {
    const lesson = await this.getLessonById(lessonId);
    if (!lesson || lesson.prerequisites.length === 0) {
      return { met: true, missing: [] };
    }

    const result = await query(`
      SELECT 
        l.id,
        l.name,
        COALESCE(up.status, 'not_started') as status
      FROM lessons l
      LEFT JOIN user_progress up ON l.id = up.lesson_id AND up.user_id = $1
      WHERE l.id = ANY($2)
    `, [userId, lesson.prerequisites]);

    const prerequisiteStatuses = result.rows;
    const missing = prerequisiteStatuses.filter(p => p.status !== 'completed');

    return {
      met: missing.length === 0,
      missing: missing.map(p => ({ id: p.id, name: p.name }))
    };
  }

  // Get recommended next lessons for a user
  static async getRecommendedLessons(userId, languageId, limit = 5) {
    const result = await query(`
      SELECT DISTINCT
        l.id,
        l.name,
        l.difficulty_level,
        l.estimated_minutes,
        s.name as skill_name,
        s.position as skill_position,
        COALESCE(up.status, 'not_started') as progress_status,
        COALESCE(up.success_rate, 0) as success_rate,
        CASE 
          WHEN up.status IS NULL THEN 1
          WHEN up.status = 'in_progress' THEN 0
          ELSE 2
        END as priority_order
      FROM lessons l
      JOIN skills s ON l.skill_id = s.id
      LEFT JOIN user_progress up ON l.id = up.lesson_id AND up.user_id = $1
      WHERE s.language_id = $2 
        AND s.is_active = true 
        AND l.is_active = true
        AND (up.status IS NULL OR up.status != 'completed')
      ORDER BY priority_order ASC, s.position ASC, l.position ASC
      LIMIT $3
    `, [userId, languageId, limit]);

    return result.rows;
  }

  // Search content by phrase
  static async searchContent(searchTerm, languageId = null, limit = 20) {
    let queryText = `
      SELECT 
        lc.*,
        l.name as lesson_name,
        s.name as skill_name,
        s.language_id
      FROM lesson_content lc
      JOIN lessons l ON lc.lesson_id = l.id
      JOIN skills s ON l.skill_id = s.id
      WHERE (
        LOWER(lc.english_phrase) LIKE LOWER($1) OR 
        LOWER(lc.target_phrase) LIKE LOWER($1)
      )
    `;

    const params = [`%${searchTerm}%`];

    if (languageId) {
      queryText += ` AND s.language_id = $2`;
      params.push(languageId);
    }

    queryText += ` ORDER BY lc.difficulty_score ASC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await query(queryText, params);

    return result.rows.map(item => ({
      ...item,
      exercise_types: typeof item.exercise_types === 'string' 
        ? JSON.parse(item.exercise_types) 
        : item.exercise_types || ['flashcard']
    }));
  }
}

module.exports = Curriculum;