/**
 * Database Query Functions for Phase 4.1 API Endpoints
 * Handles all database operations with proper error handling
 */

const { query, db } = require('../database');
const { getReviewQueue, processUserResponse } = require('../spacedRepetition');

/**
 * Lesson-related database queries
 */
const lessonQueries = {
  /**
   * Get next lesson for user based on their progress and spaced repetition algorithm
   */
  async getNextLesson(userId) {
    try {
      // First check for overdue reviews using spaced repetition
      const overdueReviews = await getReviewQueue(userId, 1);
      
      if (overdueReviews.length > 0 && overdueReviews[0].next_review <= new Date()) {
        return {
          type: 'review',
          lesson: {
            id: `review_${overdueReviews[0].content_id}`,
            title: 'Review Session',
            description: 'Time to review what you\'ve learned',
            skill_name: 'Review',
            position: -1,
            estimated_minutes: 5,
            content_count: overdueReviews.length,
            is_review: true
          }
        };
      }

      // Get user's current progress
      const progressQuery = `
        SELECT 
          MAX(CASE WHEN up.completed = true THEN l.position ELSE -1 END) as last_completed_position,
          COUNT(CASE WHEN up.completed = true THEN 1 END) as total_completed
        FROM user_progress up
        RIGHT JOIN lessons l ON up.lesson_id = l.id
        WHERE up.user_id = $1 OR up.user_id IS NULL
      `;
      
      const progressResult = await query(progressQuery, [userId]);
      const userProgress = progressResult.rows[0];
      const lastPosition = userProgress?.last_completed_position || -1;

      // Get next lesson in curriculum sequence
      const nextLessonQuery = `
        SELECT l.*, s.name as skill_name,
               (SELECT COUNT(*) FROM lesson_content WHERE lesson_id = l.id) as content_count
        FROM lessons l
        JOIN skills s ON l.skill_id = s.id
        WHERE l.position > $1
          AND l.position <= $2
        ORDER BY l.position ASC
        LIMIT 1
      `;
      
      const nextLessonResult = await query(nextLessonQuery, [lastPosition, lastPosition + 1]);
      
      if (nextLessonResult.rows.length === 0) {
        // No more lessons available
        return {
          type: 'completed',
          message: 'Congratulations! You\'ve completed all available lessons.'
        };
      }

      const lesson = nextLessonResult.rows[0];
      
      return {
        type: 'lesson',
        lesson: {
          id: lesson.id,
          title: lesson.title,
          description: lesson.description,
          skill_name: lesson.skill_name,
          position: lesson.position,
          estimated_minutes: lesson.estimated_minutes,
          content_count: parseInt(lesson.content_count),
          is_review: false
        }
      };

    } catch (error) {
      console.error('Error getting next lesson:', error);
      throw error;
    }
  },

  /**
   * Get complete lesson content including all phrases and exercises
   */
  async getLessonContent(lessonId) {
    try {
      // Get lesson details
      const lessonQuery = `
        SELECT l.*, s.name as skill_name
        FROM lessons l
        JOIN skills s ON l.skill_id = s.id
        WHERE l.id = $1
      `;
      
      const lessonResult = await query(lessonQuery, [lessonId]);
      
      if (lessonResult.rows.length === 0) {
        throw new Error('Lesson not found');
      }

      const lesson = lessonResult.rows[0];

      // Get lesson content (phrases)
      const contentQuery = `
        SELECT 
          id,
          english_phrase,
          target_phrase,
          pronunciation_guide,
          cultural_context,
          difficulty_score,
          exercise_types,
          created_at
        FROM lesson_content
        WHERE lesson_id = $1
        ORDER BY created_at ASC
      `;
      
      const contentResult = await query(contentQuery, [lessonId]);

      return {
        lesson: {
          id: lesson.id,
          title: lesson.title,
          description: lesson.description,
          theory_snippet: lesson.theory_snippet,
          skill_name: lesson.skill_name,
          position: lesson.position,
          estimated_minutes: lesson.estimated_minutes,
          content: contentResult.rows.map(content => ({
            id: content.id,
            english_phrase: content.english_phrase,
            target_phrase: content.target_phrase,
            pronunciation_guide: content.pronunciation_guide,
            cultural_context: content.cultural_context,
            difficulty_score: content.difficulty_score,
            exercise_types: content.exercise_types || ['flashcard', 'audio', 'conversation', 'visual']
          }))
        }
      };

    } catch (error) {
      console.error('Error getting lesson content:', error);
      throw error;
    }
  },

  /**
   * Get user's overall progress summary
   */
  async getUserProgress(userId) {
    try {
      const progressQuery = `
        SELECT 
          COUNT(*) as total_lessons,
          COUNT(CASE WHEN up.completed = true THEN 1 END) as completed_lessons,
          AVG(CASE WHEN up.completed = true THEN up.accuracy ELSE NULL END) as avg_accuracy,
          SUM(up.time_spent_minutes) as total_time_spent,
          MAX(up.last_accessed) as last_activity
        FROM lessons l
        LEFT JOIN user_progress up ON l.id = up.lesson_id AND up.user_id = $1
      `;
      
      const result = await query(progressQuery, [userId]);
      const progress = result.rows[0];

      return {
        total_lessons: parseInt(progress.total_lessons) || 0,
        completed_lessons: parseInt(progress.completed_lessons) || 0,
        avg_accuracy: parseFloat(progress.avg_accuracy) || 0,
        total_time_spent: parseInt(progress.total_time_spent) || 0,
        last_activity: progress.last_activity
      };

    } catch (error) {
      console.error('Error getting user progress:', error);
      throw error;
    }
  }
};

/**
 * Progress tracking database queries
 */
const progressQueries = {
  /**
   * Update user's lesson progress and exercise performance
   */
  async updateUserProgress(userId, progressData) {
    try {
      const { contentId, lessonId, exerciseType, responseQuality, timeSpent, correct } = progressData;

      // Process spaced repetition first
      const srResult = await processUserResponse(userId, contentId, {
        quality: responseQuality,
        time: timeSpent / 1000, // Convert milliseconds to seconds
        exerciseType
      });

      // Update or create user_progress record
      const existingProgress = await db.select('user_progress', {
        user_id: userId,
        lesson_id: lessonId
      });

      const progressUpdate = {
        total_attempts: (existingProgress[0]?.total_attempts || 0) + 1,
        success_rate: correct ? 
          ((existingProgress[0]?.success_count || 0) + 1) / ((existingProgress[0]?.total_attempts || 0) + 1) :
          (existingProgress[0]?.success_count || 0) / ((existingProgress[0]?.total_attempts || 0) + 1),
        time_spent_minutes: (existingProgress[0]?.time_spent_minutes || 0) + (timeSpent / 60000),
        last_accessed: new Date(),
        success_count: correct ? (existingProgress[0]?.success_count || 0) + 1 : (existingProgress[0]?.success_count || 0)
      };

      let progressResult;
      if (existingProgress[0]) {
        progressResult = await db.update('user_progress', progressUpdate, {
          user_id: userId,
          lesson_id: lessonId
        });
      } else {
        progressResult = await db.insert('user_progress', {
          user_id: userId,
          lesson_id: lessonId,
          completed: false,
          accuracy: correct ? 100 : 0,
          ...progressUpdate,
          created_at: new Date()
        });
      }

      // Check if lesson should be marked complete (example: 80% accuracy with at least 10 attempts)
      const shouldComplete = progressResult.success_rate >= 0.8 && progressResult.total_attempts >= 10;
      
      if (shouldComplete && !progressResult.completed) {
        await db.update('user_progress', { completed: true }, {
          user_id: userId,
          lesson_id: lessonId
        });
      }

      return {
        success: true,
        spacedRepetition: {
          nextReview: srResult.spacedRepetition.scheduling.nextReview,
          currentInterval: srResult.spacedRepetition.scheduling.newInterval,
          totalReviews: srResult.spacedRepetition.data.total_reviews
        },
        lessonProgress: {
          completed: shouldComplete || progressResult.completed,
          exercisesCompleted: progressResult.total_attempts,
          totalExercises: 20, // This could be calculated based on lesson content
          accuracy: progressResult.success_rate
        }
      };

    } catch (error) {
      console.error('Error updating user progress:', error);
      throw error;
    }
  },

  /**
   * Get practice content filtered by topic/skill
   */
  async getPracticeContent(userId, topic) {
    try {
      // First, get the skill/topic information
      const skillQuery = `
        SELECT id, name, description 
        FROM skills 
        WHERE name ILIKE $1 OR id = $1
        LIMIT 1
      `;
      
      const skillResult = await query(skillQuery, [`%${topic}%`]);
      
      if (skillResult.rows.length === 0) {
        throw new Error('Topic not found');
      }

      const skill = skillResult.rows[0];

      // Get content from completed lessons in this skill
      const contentQuery = `
        SELECT 
          lc.*,
          sr.ease_factor,
          sr.success_count,
          sr.total_reviews,
          COALESCE(sr.success_count::float / NULLIF(sr.total_reviews, 0), 0) as mastery_level,
          sr.last_reviewed
        FROM lesson_content lc
        JOIN lessons l ON lc.lesson_id = l.id
        JOIN user_progress up ON l.id = up.lesson_id AND up.user_id = $1
        LEFT JOIN spaced_repetition sr ON lc.id = sr.content_id AND sr.user_id = $1
        WHERE l.skill_id = $2 AND up.completed = true
        ORDER BY sr.last_reviewed DESC NULLS LAST, lc.created_at
        LIMIT 50
      `;
      
      const contentResult = await query(contentQuery, [userId, skill.id]);

      // Get topic stats
      const statsQuery = `
        SELECT 
          COUNT(DISTINCT lc.id) as words_learned,
          MAX(sr.last_reviewed) as last_practiced
        FROM lesson_content lc
        JOIN lessons l ON lc.lesson_id = l.id
        JOIN user_progress up ON l.id = up.lesson_id AND up.user_id = $1
        LEFT JOIN spaced_repetition sr ON lc.id = sr.content_id AND sr.user_id = $1
        WHERE l.skill_id = $2 AND up.completed = true
      `;
      
      const statsResult = await query(statsQuery, [userId, skill.id]);
      const stats = statsResult.rows[0];

      return {
        topic: {
          name: skill.name,
          description: skill.description,
          wordsLearned: parseInt(stats.words_learned) || 0,
          lastPracticed: stats.last_practiced
        },
        content: contentResult.rows.map(item => ({
          contentId: item.id,
          english_phrase: item.english_phrase,
          target_phrase: item.target_phrase,
          pronunciation_guide: item.pronunciation_guide,
          cultural_context: item.cultural_context,
          masteryLevel: parseFloat(item.mastery_level) || 0,
          exerciseTypes: item.exercise_types || ['flashcard', 'audio']
        }))
      };

    } catch (error) {
      console.error('Error getting practice content:', error);
      throw error;
    }
  }
};

/**
 * Authentication and user management queries
 */
const authQueries = {
  /**
   * Create or authenticate user
   */
  async createOrAuthenticateUser(userData) {
    try {
      const { email, guestId, preferredName } = userData;

      let user;

      if (email) {
        // Check for existing user by email
        const existingUsers = await db.select('users', { email });
        
        if (existingUsers.length > 0) {
          user = existingUsers[0];
          // Update last active
          await db.update('users', { last_active: new Date() }, { id: user.id });
        } else {
          // Create new user with email (using existing schema)
          user = await db.insert('users', {
            email,
            username: preferredName || email.split('@')[0],
            created_at: new Date(),
            last_active: new Date()
          });
        }
      } else if (guestId) {
        // For guest users, create a user with a unique username based on guestId
        // Check for existing user with this username pattern
        const guestUsername = `guest_${guestId}`;
        const existingGuests = await db.select('users', { username: guestUsername });
        
        if (existingGuests.length > 0) {
          user = existingGuests[0];
          // Update last active
          await db.update('users', { last_active: new Date() }, { id: user.id });
        } else {
          // Create new guest user (using existing schema)
          user = await db.insert('users', {
            username: guestUsername,
            created_at: new Date(),
            last_active: new Date()
          });
        }
      } else {
        throw new Error('Email or guestId required');
      }

      // Use existing user preferences field or defaults
      const preferences = user.preferences || {
        current_language: 'gheg-al',
        pronunciation_shown: true,
        cultural_context_shown: true
      };

      return {
        userId: user.id,
        isGuest: !user.email, // Consider guest if no email
        email: user.email,
        username: user.username,
        preferences: {
          currentLanguage: preferences.current_language || 'gheg-al',
          pronunciationShown: preferences.pronunciation_shown !== false,
          culturalContextShown: preferences.cultural_context_shown !== false
        },
        progress: {
          totalLessonsCompleted: 0, // Simplified for now
          currentStreak: 0,
          totalTimeSpent: 0
        }
      };

    } catch (error) {
      console.error('Error creating/authenticating user:', error);
      throw error;
    }
  }
};

module.exports = {
  lessonQueries,
  progressQueries,
  authQueries
};