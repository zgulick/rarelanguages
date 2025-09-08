const { query, db } = require('../database');
const { v4: uuidv4 } = require('uuid');

class Progress {
  // Start a lesson for a user
  static async startLesson(userId, lessonId) {
    // Get lesson and skill info
    const lessonResult = await query(`
      SELECT l.*, s.id as skill_id 
      FROM lessons l 
      JOIN skills s ON l.skill_id = s.id 
      WHERE l.id = $1
    `, [lessonId]);

    if (lessonResult.rows.length === 0) {
      throw new Error('Lesson not found');
    }

    const lesson = lessonResult.rows[0];

    // Check if progress already exists
    const existing = await db.select('user_progress', { 
      user_id: userId, 
      lesson_id: lessonId 
    });

    if (existing.length > 0) {
      // Update existing progress
      return await db.update(
        'user_progress',
        { 
          status: 'in_progress',
          last_accessed: new Date()
        },
        { user_id: userId, lesson_id: lessonId }
      );
    }

    // Create new progress entry
    const progressData = {
      id: uuidv4(),
      user_id: userId,
      lesson_id: lessonId,
      skill_id: lesson.skill_id,
      status: 'in_progress',
      last_accessed: new Date(),
      total_attempts: 0,
      success_rate: 0,
      time_spent_minutes: 0
    };

    return await db.insert('user_progress', progressData);
  }

  // Update lesson progress
  static async updateLessonProgress(userId, lessonId, progressData) {
    const updateData = {
      last_accessed: new Date(),
      ...progressData
    };

    const result = await db.update(
      'user_progress',
      updateData,
      { user_id: userId, lesson_id: lessonId }
    );

    return result;
  }

  // Complete a lesson
  static async completeLesson(userId, lessonId, sessionData = {}) {
    const updateData = {
      status: 'completed',
      completion_date: new Date(),
      last_accessed: new Date(),
      total_attempts: sessionData.attempts || 0,
      success_rate: sessionData.success_rate || 0,
      time_spent_minutes: sessionData.time_spent || 0
    };

    // Update progress
    const progress = await db.update(
      'user_progress',
      updateData,
      { user_id: userId, lesson_id: lessonId }
    );

    // Check if this completes the skill
    await this.checkSkillCompletion(userId, progress.skill_id);

    return progress;
  }

  // Check and update skill completion status
  static async checkSkillCompletion(userId, skillId) {
    const result = await query(`
      SELECT 
        COUNT(*) as total_lessons,
        COUNT(CASE WHEN up.status = 'completed' THEN 1 END) as completed_lessons
      FROM lessons l
      LEFT JOIN user_progress up ON l.id = up.lesson_id AND up.user_id = $1
      WHERE l.skill_id = $2 AND l.is_active = true
    `, [userId, skillId]);

    const { total_lessons, completed_lessons } = result.rows[0];

    if (parseInt(total_lessons) === parseInt(completed_lessons) && parseInt(total_lessons) > 0) {
      // Skill is complete - update any skill-level progress tracking if implemented
      console.log(`User ${userId} completed skill ${skillId}`);
      
      // Could add skill completion rewards, achievements, etc. here
      return true;
    }

    return false;
  }

  // Get user's progress for a specific skill
  static async getSkillProgress(userId, skillId) {
    const result = await query(`
      SELECT 
        s.id,
        s.name,
        s.position,
        s.cefr_level,
        COUNT(l.id) as total_lessons,
        COUNT(CASE WHEN up.status = 'completed' THEN 1 END) as completed_lessons,
        COUNT(CASE WHEN up.status = 'in_progress' THEN 1 END) as in_progress_lessons,
        AVG(CASE WHEN up.success_rate > 0 THEN up.success_rate END) as avg_success_rate,
        SUM(COALESCE(up.time_spent_minutes, 0)) as total_time_spent,
        MAX(up.last_accessed) as last_accessed
      FROM skills s
      LEFT JOIN lessons l ON s.id = l.skill_id AND l.is_active = true
      LEFT JOIN user_progress up ON l.id = up.lesson_id AND up.user_id = $1
      WHERE s.id = $2
      GROUP BY s.id, s.name, s.position, s.cefr_level
    `, [userId, skillId]);

    if (result.rows.length === 0) return null;

    const skillProgress = result.rows[0];
    
    // Calculate completion percentage
    const totalLessons = parseInt(skillProgress.total_lessons) || 0;
    const completedLessons = parseInt(skillProgress.completed_lessons) || 0;
    skillProgress.completion_percentage = totalLessons > 0 
      ? Math.round((completedLessons / totalLessons) * 100) 
      : 0;

    return skillProgress;
  }

  // Get user's progress for all skills in a language
  static async getLanguageProgress(userId, languageId) {
    const result = await query(`
      SELECT 
        s.id,
        s.name,
        s.position,
        s.cefr_level,
        COUNT(l.id) as total_lessons,
        COUNT(CASE WHEN up.status = 'completed' THEN 1 END) as completed_lessons,
        COUNT(CASE WHEN up.status = 'in_progress' THEN 1 END) as in_progress_lessons,
        AVG(CASE WHEN up.success_rate > 0 THEN up.success_rate END) as avg_success_rate,
        SUM(COALESCE(up.time_spent_minutes, 0)) as total_time_spent,
        MAX(up.last_accessed) as last_accessed
      FROM skills s
      LEFT JOIN lessons l ON s.id = l.skill_id AND l.is_active = true
      LEFT JOIN user_progress up ON l.id = up.lesson_id AND up.user_id = $1
      WHERE s.language_id = $2 AND s.is_active = true
      GROUP BY s.id, s.name, s.position, s.cefr_level
      ORDER BY s.position ASC
    `, [userId, languageId]);

    return result.rows.map(skill => {
      const totalLessons = parseInt(skill.total_lessons) || 0;
      const completedLessons = parseInt(skill.completed_lessons) || 0;
      return {
        ...skill,
        completion_percentage: totalLessons > 0 
          ? Math.round((completedLessons / totalLessons) * 100) 
          : 0
      };
    });
  }

  // Get user's recent activity
  static async getRecentActivity(userId, limit = 10) {
    const result = await query(`
      SELECT 
        up.lesson_id,
        up.status,
        up.last_accessed,
        up.success_rate,
        up.time_spent_minutes,
        l.name as lesson_name,
        s.name as skill_name,
        s.id as skill_id
      FROM user_progress up
      JOIN lessons l ON up.lesson_id = l.id
      JOIN skills s ON l.skill_id = s.id
      WHERE up.user_id = $1
      ORDER BY up.last_accessed DESC
      LIMIT $2
    `, [userId, limit]);

    return result.rows;
  }

  // Get user's lesson statistics
  static async getLessonStats(userId, lessonId) {
    const stats = await db.select('user_progress', { 
      user_id: userId, 
      lesson_id: lessonId 
    });

    if (stats.length === 0) {
      return {
        status: 'not_started',
        total_attempts: 0,
        success_rate: 0,
        time_spent_minutes: 0,
        last_accessed: null,
        completion_date: null
      };
    }

    return stats[0];
  }

  // Record a learning session
  static async recordSession(userId, sessionData) {
    const session = {
      id: uuidv4(),
      user_id: userId,
      started_at: sessionData.started_at || new Date(),
      ended_at: sessionData.ended_at || new Date(),
      lessons_completed: sessionData.lessons_completed || 0,
      exercises_attempted: sessionData.exercises_attempted || 0,
      exercises_correct: sessionData.exercises_correct || 0,
      total_time_minutes: sessionData.total_time_minutes || 0,
      session_type: sessionData.session_type || 'lesson'
    };

    return await db.insert('user_sessions', session);
  }

  // Get user's daily/weekly/monthly statistics
  static async getTimeBasedStats(userId, period = 'week') {
    let dateFilter;
    switch (period) {
      case 'day':
        dateFilter = "DATE(last_accessed) = CURRENT_DATE";
        break;
      case 'week':
        dateFilter = "last_accessed >= CURRENT_DATE - INTERVAL '7 days'";
        break;
      case 'month':
        dateFilter = "last_accessed >= CURRENT_DATE - INTERVAL '30 days'";
        break;
      default:
        dateFilter = "last_accessed >= CURRENT_DATE - INTERVAL '7 days'";
    }

    const result = await query(`
      SELECT 
        COUNT(DISTINCT lesson_id) as lessons_studied,
        COUNT(DISTINCT skill_id) as skills_touched,
        SUM(time_spent_minutes) as total_time,
        AVG(success_rate) as avg_success_rate,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as lessons_completed
      FROM user_progress
      WHERE user_id = $1 AND ${dateFilter}
    `, [userId]);

    return result.rows[0] || {
      lessons_studied: 0,
      skills_touched: 0,
      total_time: 0,
      avg_success_rate: 0,
      lessons_completed: 0
    };
  }

  // Get user's achievements/milestones
  static async getAchievements(userId) {
    const result = await query(`
      SELECT 
        COUNT(DISTINCT CASE WHEN status = 'completed' THEN lesson_id END) as lessons_completed,
        COUNT(DISTINCT CASE WHEN status = 'completed' THEN skill_id END) as skills_completed,
        SUM(time_spent_minutes) as total_study_time,
        MAX(last_accessed) as last_study_date,
        MIN(last_accessed) as first_study_date
      FROM user_progress
      WHERE user_id = $1
    `, [userId]);

    const baseStats = result.rows[0];

    // Calculate study streak (from User model, but included here for completeness)
    const streakResult = await query(`
      SELECT DISTINCT DATE(last_accessed) as study_date
      FROM user_progress 
      WHERE user_id = $1 
        AND last_accessed >= CURRENT_DATE - INTERVAL '30 days'
      ORDER BY study_date DESC
    `, [userId]);

    let currentStreak = 0;
    if (streakResult.rows.length > 0) {
      let expectedDate = new Date();
      expectedDate.setHours(0, 0, 0, 0);

      for (const row of streakResult.rows) {
        const studyDate = new Date(row.study_date);
        studyDate.setHours(0, 0, 0, 0);

        if (studyDate.getTime() === expectedDate.getTime()) {
          currentStreak++;
          expectedDate.setDate(expectedDate.getDate() - 1);
        } else if (studyDate.getTime() < expectedDate.getTime() - (24 * 60 * 60 * 1000)) {
          break;
        }
      }
    }

    return {
      ...baseStats,
      current_streak: currentStreak,
      achievements: this.calculateAchievements(baseStats, currentStreak)
    };
  }

  // Calculate achievement badges based on stats
  static calculateAchievements(stats, streak) {
    const achievements = [];

    // Lesson completion achievements
    const lessonsCompleted = parseInt(stats.lessons_completed) || 0;
    if (lessonsCompleted >= 1) achievements.push({ name: 'First Lesson', description: 'Completed your first lesson' });
    if (lessonsCompleted >= 10) achievements.push({ name: 'Getting Started', description: 'Completed 10 lessons' });
    if (lessonsCompleted >= 50) achievements.push({ name: 'Dedicated Learner', description: 'Completed 50 lessons' });
    if (lessonsCompleted >= 100) achievements.push({ name: 'Language Master', description: 'Completed 100 lessons' });

    // Skill completion achievements
    const skillsCompleted = parseInt(stats.skills_completed) || 0;
    if (skillsCompleted >= 1) achievements.push({ name: 'Skill Unlocked', description: 'Completed your first skill' });
    if (skillsCompleted >= 5) achievements.push({ name: 'Multi-Skilled', description: 'Completed 5 skills' });

    // Time-based achievements
    const totalHours = Math.floor((parseInt(stats.total_study_time) || 0) / 60);
    if (totalHours >= 1) achievements.push({ name: 'First Hour', description: 'Studied for 1+ hours total' });
    if (totalHours >= 10) achievements.push({ name: 'Committed', description: 'Studied for 10+ hours total' });
    if (totalHours >= 50) achievements.push({ name: 'Language Enthusiast', description: 'Studied for 50+ hours total' });

    // Streak achievements
    if (streak >= 3) achievements.push({ name: 'On a Roll', description: '3-day study streak' });
    if (streak >= 7) achievements.push({ name: 'Week Warrior', description: '7-day study streak' });
    if (streak >= 30) achievements.push({ name: 'Monthly Master', description: '30-day study streak' });

    return achievements;
  }
}

module.exports = Progress;