const { query, db } = require('../database');
const { v4: uuidv4 } = require('uuid');

class User {
  constructor(data) {
    this.id = data.id;
    this.email = data.email;
    this.username = data.username;
    this.created_at = data.created_at;
    this.last_active = data.last_active;
    this.current_language = data.current_language;
    this.preferences = typeof data.preferences === 'string' 
      ? JSON.parse(data.preferences) 
      : data.preferences || {};
  }

  // Create a new user
  static async create(userData) {
    const user = {
      id: uuidv4(),
      email: userData.email,
      username: userData.username,
      current_language: userData.current_language,
      preferences: JSON.stringify(userData.preferences || {}),
      last_active: new Date()
    };

    const result = await db.insert('users', user);
    return new User(result);
  }

  // Find user by ID
  static async findById(id) {
    const users = await db.select('users', { id });
    return users.length > 0 ? new User(users[0]) : null;
  }

  // Find user by email
  static async findByEmail(email) {
    const users = await db.select('users', { email });
    return users.length > 0 ? new User(users[0]) : null;
  }

  // Find user by username
  static async findByUsername(username) {
    const users = await db.select('users', { username });
    return users.length > 0 ? new User(users[0]) : null;
  }

  // Update user's last active timestamp
  async updateLastActive() {
    const updated = await db.update(
      'users', 
      { last_active: new Date() }, 
      { id: this.id }
    );
    this.last_active = updated.last_active;
    return this;
  }

  // Update user preferences
  async updatePreferences(newPreferences) {
    const preferences = { ...this.preferences, ...newPreferences };
    const updated = await db.update(
      'users',
      { preferences: JSON.stringify(preferences) },
      { id: this.id }
    );
    this.preferences = preferences;
    return this;
  }

  // Set current language
  async setCurrentLanguage(languageId) {
    const updated = await db.update(
      'users',
      { current_language: languageId },
      { id: this.id }
    );
    this.current_language = updated.current_language;
    return this;
  }

  // Get user's progress summary
  async getProgressSummary() {
    const result = await query(`
      SELECT 
        COUNT(DISTINCT up.skill_id) as total_skills_started,
        COUNT(DISTINCT CASE WHEN up.status = 'completed' THEN up.skill_id END) as skills_completed,
        COUNT(DISTINCT up.lesson_id) as total_lessons_attempted,
        COUNT(DISTINCT CASE WHEN up.status = 'completed' THEN up.lesson_id END) as lessons_completed,
        SUM(up.time_spent_minutes) as total_time_spent,
        AVG(up.success_rate) as average_success_rate
      FROM user_progress up
      WHERE up.user_id = $1
    `, [this.id]);

    return result.rows[0] || {
      total_skills_started: 0,
      skills_completed: 0,
      total_lessons_attempted: 0,
      lessons_completed: 0,
      total_time_spent: 0,
      average_success_rate: 0
    };
  }

  // Get current learning streak (consecutive days of activity)
  async getLearningStreak() {
    const result = await query(`
      SELECT 
        DATE(last_accessed) as activity_date,
        COUNT(*) as activities
      FROM user_progress 
      WHERE user_id = $1 
        AND last_accessed >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(last_accessed)
      ORDER BY activity_date DESC
    `, [this.id]);

    if (result.rows.length === 0) return 0;

    let streak = 0;
    let expectedDate = new Date();
    expectedDate.setHours(0, 0, 0, 0);

    for (const row of result.rows) {
      const activityDate = new Date(row.activity_date);
      activityDate.setHours(0, 0, 0, 0);

      if (activityDate.getTime() === expectedDate.getTime()) {
        streak++;
        expectedDate.setDate(expectedDate.getDate() - 1);
      } else if (activityDate.getTime() < expectedDate.getTime() - (24 * 60 * 60 * 1000)) {
        // Gap in streak
        break;
      }
    }

    return streak;
  }

  // Get spaced repetition items due for review
  async getDueForReview(limit = 20) {
    const result = await query(`
      SELECT 
        sr.*,
        lc.english_phrase,
        lc.target_phrase,
        lc.pronunciation_guide,
        lc.difficulty_score,
        l.name as lesson_name,
        s.name as skill_name
      FROM spaced_repetition sr
      JOIN lesson_content lc ON sr.content_id = lc.id
      JOIN lessons l ON lc.lesson_id = l.id
      JOIN skills s ON l.skill_id = s.id
      WHERE sr.user_id = $1 
        AND sr.next_review <= CURRENT_TIMESTAMP
      ORDER BY sr.next_review ASC
      LIMIT $2
    `, [this.id, limit]);

    return result.rows;
  }

  // Get next lesson to study
  async getNextLesson() {
    // Get user's current language
    if (!this.current_language) {
      return null;
    }

    const result = await query(`
      SELECT DISTINCT
        l.*,
        s.name as skill_name,
        s.position as skill_position,
        COALESCE(up.status, 'not_started') as progress_status
      FROM lessons l
      JOIN skills s ON l.skill_id = s.id
      LEFT JOIN user_progress up ON l.id = up.lesson_id AND up.user_id = $1
      WHERE s.language_id = $2 
        AND s.is_active = true 
        AND l.is_active = true
        AND (up.status IS NULL OR up.status != 'completed')
      ORDER BY s.position ASC, l.position ASC
      LIMIT 1
    `, [this.id, this.current_language]);

    return result.rows[0] || null;
  }

  // Get user's recent sessions
  async getRecentSessions(limit = 10) {
    const sessions = await db.select(
      'user_sessions',
      { user_id: this.id },
      'started_at DESC',
      limit
    );

    return sessions;
  }

  // Serialize for JSON response
  toJSON() {
    return {
      id: this.id,
      email: this.email,
      username: this.username,
      created_at: this.created_at,
      last_active: this.last_active,
      current_language: this.current_language,
      preferences: this.preferences
    };
  }
}

module.exports = User;