const { query, db } = require('../database');
const spacedRepetitionAlgo = require('../spacedRepetition');
const { v4: uuidv4 } = require('uuid');

class SpacedRepetition {
  // Initialize spaced repetition for a user's lesson content
  static async initializeContent(userId, contentIds) {
    const existingItems = await query(`
      SELECT content_id FROM spaced_repetition 
      WHERE user_id = $1 AND content_id = ANY($2)
    `, [userId, contentIds]);

    const existingContentIds = new Set(existingItems.rows.map(item => item.content_id));
    const newContentIds = contentIds.filter(id => !existingContentIds.has(id));

    const insertPromises = newContentIds.map(contentId => {
      const item = {
        id: uuidv4(),
        user_id: userId,
        content_id: contentId,
        current_interval: 1, // Start with 1 day
        ease_factor: 2.5, // Default ease factor
        repetitions: 0,
        next_review: new Date(), // Available immediately
        total_reviews: 0,
        success_count: 0
      };

      return db.insert('spaced_repetition', item);
    });

    await Promise.all(insertPromises);
    return newContentIds.length;
  }

  // Get items due for review using advanced HLR algorithm
  static async getDueItems(userId, limit = 20) {
    return await spacedRepetitionAlgo.getReviewQueue(userId, limit);
  }

  // Legacy method for backward compatibility
  static async getDueItemsBasic(userId, limit = 20) {
    const result = await query(`
      SELECT 
        sr.*,
        lc.english_phrase,
        lc.target_phrase,
        lc.pronunciation_guide,
        lc.cultural_context,
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
    `, [userId, limit]);

    return result.rows.map(item => ({
      ...item,
      exercise_types: typeof item.exercise_types === 'string' 
        ? JSON.parse(item.exercise_types) 
        : item.exercise_types || ['flashcard']
    }));
  }

  // Record a review attempt using advanced HLR algorithm
  static async recordReview(userId, contentId, responseQuality, responseTime = null, exerciseType = 'flashcard') {
    return await spacedRepetitionAlgo.updateUserPerformance(userId, contentId, responseQuality, responseTime);
  }

  // Process complete user response with all context
  static async processUserResponse(userId, contentId, responseData) {
    return await spacedRepetitionAlgo.processUserResponse(userId, contentId, responseData);
  }

  // Legacy method for simple review recording
  static async recordReviewBasic(userId, contentId, responseQuality) {
    // Validate response quality (1-5 scale)
    if (responseQuality < 1 || responseQuality > 5) {
      throw new Error('Response quality must be between 1 and 5');
    }

    const current = await db.select('spaced_repetition', {
      user_id: userId,
      content_id: contentId
    });

    if (current.length === 0) {
      throw new Error('Spaced repetition item not found');
    }

    const item = current[0];
    
    // Update based on Half-Life Regression inspired algorithm
    const newParams = this.calculateNewParameters(item, responseQuality);

    const updateData = {
      current_interval: newParams.interval,
      ease_factor: newParams.easeFactor,
      repetitions: newParams.repetitions,
      last_reviewed: new Date(),
      next_review: newParams.nextReview,
      last_response_quality: responseQuality,
      total_reviews: item.total_reviews + 1,
      success_count: item.success_count + (responseQuality >= 3 ? 1 : 0)
    };

    const updated = await db.update(
      'spaced_repetition',
      updateData,
      { user_id: userId, content_id: contentId }
    );

    return updated;
  }

  // Calculate new spaced repetition parameters
  static calculateNewParameters(item, responseQuality) {
    let interval = item.current_interval;
    let easeFactor = item.ease_factor;
    let repetitions = item.repetitions;

    if (responseQuality >= 3) {
      // Successful review
      repetitions += 1;

      if (repetitions === 1) {
        interval = 1;
      } else if (repetitions === 2) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }

      // Adjust ease factor based on performance
      easeFactor = easeFactor + (0.1 - (5 - responseQuality) * (0.08 + (5 - responseQuality) * 0.02));
    } else {
      // Failed review - reset but maintain some memory
      repetitions = 0;
      interval = 1;
      easeFactor = Math.max(1.3, easeFactor - 0.2); // Don't let ease factor go too low
    }

    // Ensure minimum ease factor
    easeFactor = Math.max(1.3, easeFactor);
    
    // Calculate next review date
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + interval);

    return {
      interval,
      easeFactor: Math.round(easeFactor * 100) / 100, // Round to 2 decimal places
      repetitions,
      nextReview
    };
  }

  // Get user's spaced repetition statistics
  static async getStats(userId) {
    const result = await query(`
      SELECT 
        COUNT(*) as total_items,
        COUNT(CASE WHEN next_review <= CURRENT_TIMESTAMP THEN 1 END) as due_now,
        COUNT(CASE WHEN next_review <= CURRENT_TIMESTAMP + INTERVAL '1 day' THEN 1 END) as due_tomorrow,
        AVG(ease_factor) as avg_ease_factor,
        AVG(current_interval) as avg_interval,
        SUM(total_reviews) as total_reviews,
        SUM(success_count) as total_successes,
        AVG(CASE WHEN total_reviews > 0 THEN success_count::float / total_reviews ELSE 0 END) as success_rate
      FROM spaced_repetition
      WHERE user_id = $1
    `, [userId]);

    const stats = result.rows[0];
    
    // Get review counts by interval ranges
    const intervalStats = await query(`
      SELECT 
        CASE 
          WHEN current_interval = 1 THEN 'new'
          WHEN current_interval <= 7 THEN 'learning'
          WHEN current_interval <= 30 THEN 'young'
          ELSE 'mature'
        END as interval_group,
        COUNT(*) as count
      FROM spaced_repetition
      WHERE user_id = $1
      GROUP BY interval_group
    `, [userId]);

    const intervalBreakdown = {};
    intervalStats.rows.forEach(row => {
      intervalBreakdown[row.interval_group] = parseInt(row.count);
    });

    return {
      ...stats,
      interval_breakdown: intervalBreakdown
    };
  }

  // Get upcoming review schedule
  static async getUpcomingReviews(userId, days = 7) {
    const result = await query(`
      SELECT 
        DATE(next_review) as review_date,
        COUNT(*) as items_due
      FROM spaced_repetition
      WHERE user_id = $1 
        AND next_review >= CURRENT_DATE
        AND next_review < CURRENT_DATE + INTERVAL '${days} days'
      GROUP BY DATE(next_review)
      ORDER BY review_date ASC
    `, [userId]);

    return result.rows;
  }

  // Get performance trends for content difficulty
  static async getPerformanceTrends(userId, limit = 100) {
    const result = await query(`
      SELECT 
        lc.difficulty_score,
        AVG(CASE WHEN sr.total_reviews > 0 THEN sr.success_count::float / sr.total_reviews ELSE 0 END) as success_rate,
        AVG(sr.ease_factor) as avg_ease_factor,
        COUNT(*) as item_count
      FROM spaced_repetition sr
      JOIN lesson_content lc ON sr.content_id = lc.id
      WHERE sr.user_id = $1
      GROUP BY lc.difficulty_score
      ORDER BY lc.difficulty_score ASC
    `, [userId]);

    return result.rows;
  }

  // Reset an item (if user wants to start over)
  static async resetItem(userId, contentId) {
    const resetData = {
      current_interval: 1,
      ease_factor: 2.5,
      repetitions: 0,
      last_reviewed: null,
      next_review: new Date(),
      last_response_quality: null,
      total_reviews: 0,
      success_count: 0
    };

    return await db.update(
      'spaced_repetition',
      resetData,
      { user_id: userId, content_id: contentId }
    );
  }

  // Batch process reviews for multiple items
  static async batchReview(userId, reviews) {
    const results = [];
    
    for (const review of reviews) {
      const { contentId, responseQuality, responseTime, exerciseType } = review;
      try {
        const result = await this.recordReview(userId, contentId, responseQuality, responseTime, exerciseType);
        results.push({ contentId, success: true, result });
      } catch (error) {
        results.push({ contentId, success: false, error: error.message });
      }
    }

    return results;
  }

  // Get items that need initialization for a lesson
  static async getUninitializedContent(userId, lessonId) {
    const result = await query(`
      SELECT lc.id
      FROM lesson_content lc
      LEFT JOIN spaced_repetition sr ON lc.id = sr.content_id AND sr.user_id = $1
      WHERE lc.lesson_id = $2 AND sr.id IS NULL
    `, [userId, lessonId]);

    return result.rows.map(row => row.id);
  }

  // Advanced: Get optimal review batch size based on user performance
  static async getOptimalBatchSize(userId) {
    const stats = await this.getStats(userId);
    const successRate = parseFloat(stats.success_rate) || 0;

    // Suggest batch size based on success rate
    if (successRate >= 0.8) return 25; // High performer
    if (successRate >= 0.6) return 20; // Average performer  
    if (successRate >= 0.4) return 15; // Struggling a bit
    return 10; // New user or having difficulty
  }

  // Get spaced repetition data for specific user+content pair
  static async getSpacedRepetitionData(userId, contentId) {
    const result = await db.select('spaced_repetition', {
      user_id: userId,
      content_id: contentId
    });
    return result[0] || null;
  }

  // Get user's overall performance statistics
  static async getUserPerformanceStats(userId) {
    return await this.getStats(userId);
  }

  // Get content difficulty statistics across all users
  static async getContentDifficultyStats(contentId) {
    return await spacedRepetitionAlgo.getDifficultyAdjustment(contentId);
  }

  // Create new spaced repetition record with HLR initial parameters
  static async createSpacedRepetitionRecord(userId, contentId, initialParams = {}) {
    const defaultParams = {
      user_id: userId,
      content_id: contentId,
      current_interval: initialParams.interval || 24, // 1 day in hours
      ease_factor: initialParams.easeFactor || 2.5,
      repetitions: 0,
      next_review: initialParams.nextReview || new Date(),
      total_reviews: 0,
      success_count: 0,
      created_at: new Date()
    };

    return await db.insert('spaced_repetition', defaultParams);
  }

  // Update spaced repetition record with new parameters
  static async updateSpacedRepetitionRecord(userId, contentId, newParams) {
    return await db.update('spaced_repetition', newParams, {
      user_id: userId,
      content_id: contentId
    });
  }

  // Get user's review queue with HLR prioritization
  static async getUserReviewQueue(userId, limit = 20) {
    return await this.getDueItems(userId, limit);
  }
}

module.exports = SpacedRepetition;