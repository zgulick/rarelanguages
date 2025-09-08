/**
 * Spaced Repetition Algorithm Implementation
 * Based on Duolingo's Half-Life Regression (HLR) Algorithm
 * Research: "A Trainable Spaced Repetition Model for Language Learning" (Settles & Meeder, 2016)
 */

const { db, query } = require('./database');

// Algorithm Configuration
const DEFAULT_CONFIG = {
  // Initial ease factor for new content
  initialEaseFactor: 2.5,
  
  // Minimum/maximum ease factors
  minEaseFactor: 1.3,
  maxEaseFactor: 4.0,
  
  // Ease factor adjustments based on performance
  easeFactorAdjustments: {
    1: -0.8,  // Failed recall
    2: -0.15, // Difficult recall
    3: 0.0,   // Normal recall
    4: 0.1,   // Easy recall
    5: 0.15   // Perfect recall
  },
  
  // Initial intervals (in hours)
  initialIntervals: {
    1: 1,     // Failed: review in 1 hour
    2: 6,     // Difficult: review in 6 hours
    3: 24,    // Normal: review in 1 day
    4: 72,    // Easy: review in 3 days
    5: 168    // Perfect: review in 1 week
  },
  
  // Target recall probability for scheduling
  targetRecallProbability: 0.8,
  
  // Maximum review interval (30 days in hours)
  maxInterval: 720, // 30 * 24 hours
  
  // Minimum review interval (10 minutes in hours)
  minInterval: 0.17 // 10/60 hours
};

// Gheg Albanian-Specific Configuration
const GHEG_ALBANIAN_CONFIG = {
  // Account for language-specific difficulty
  languageDifficultyMultiplier: 1.2,
  
  // Cultural context weighting
  culturalContextBonus: 0.1,
  
  // Audio vs visual exercise weighting
  exerciseTypeWeights: {
    flashcard: 1.0,
    audio: 1.2,      // Slightly harder
    conversation: 1.5, // Most challenging
    visual: 0.9       // Slightly easier
  }
};

/**
 * Calculate half-life for user+content pair using HLR algorithm
 * @param {Object} userHistory - User's interaction history with specific content
 * @param {number} contentDifficulty - Content difficulty score (1-10)
 * @param {Object} userStats - User's overall performance metrics
 * @returns {Object} - { halfLife: number (hours), confidence: number (0-1) }
 */
function calculateHalfLife(userHistory, contentDifficulty, userStats = {}) {
  // Base half-life calculation using user's historical performance
  const {
    repetitions = 0,
    successCount = 0,
    totalReviews = 1,
    lastResponseQuality = 3,
    easeFactor = DEFAULT_CONFIG.initialEaseFactor
  } = userHistory;

  // Calculate user's success rate for this content
  const successRate = totalReviews > 0 ? successCount / totalReviews : 0.5;
  
  // Base half-life starts with ease factor
  let baseHalfLife = easeFactor * 24; // Convert to hours
  
  // Adjust for content difficulty (1-10 scale)
  const difficultyMultiplier = 1 + ((contentDifficulty - 5) * 0.1);
  baseHalfLife *= difficultyMultiplier;
  
  // Adjust for user's success rate with this content
  const performanceMultiplier = 0.5 + (successRate * 1.5);
  baseHalfLife *= performanceMultiplier;
  
  // Adjust for number of successful repetitions (spacing effect)
  const repetitionMultiplier = Math.pow(1.3, Math.min(repetitions, 10));
  baseHalfLife *= repetitionMultiplier;
  
  // Apply Gheg Albanian language difficulty
  baseHalfLife *= GHEG_ALBANIAN_CONFIG.languageDifficultyMultiplier;
  
  // Confidence based on amount of data available
  const confidence = Math.min(totalReviews / 10, 1.0);
  
  // Clamp to reasonable bounds
  const halfLife = Math.max(
    DEFAULT_CONFIG.minInterval,
    Math.min(baseHalfLife, DEFAULT_CONFIG.maxInterval)
  );
  
  return {
    halfLife,
    confidence
  };
}

/**
 * Calculate current recall probability using forgetting curve
 * @param {number} halfLife - Predicted half-life in hours
 * @param {number} timeSinceReview - Hours since last review
 * @returns {Object} - { probability: number (0-1), recommendation: string }
 */
function getRecallProbability(halfLife, timeSinceReview) {
  // Forgetting curve: p = 2^(-Δt/h)
  const probability = Math.pow(2, -timeSinceReview / halfLife);
  
  // Determine recommendation based on probability
  let recommendation;
  if (probability < 0.7) {
    recommendation = 'review_now';
  } else if (probability < 0.85) {
    recommendation = 'review_soon';
  } else {
    recommendation = 'review_later';
  }
  
  return {
    probability: Math.max(0, Math.min(1, probability)),
    recommendation
  };
}

/**
 * Schedule next review based on current performance and half-life
 * @param {number} currentPerformance - User's performance (1-5 scale)
 * @param {number} halfLife - Current half-life calculation
 * @param {Object} currentRecord - Current spaced repetition record
 * @returns {Object} - { nextReview: Date, newEaseFactor: number, newInterval: number }
 */
function scheduleNextReview(currentPerformance, halfLife, currentRecord = {}) {
  // Handle null currentRecord
  const record = currentRecord || {};
  
  const {
    ease_factor = DEFAULT_CONFIG.initialEaseFactor,
    repetitions = 0,
    current_interval = 24
  } = record;
  
  const easeFactor = ease_factor;
  const currentInterval = current_interval;
  
  // Adjust ease factor based on performance
  const adjustment = DEFAULT_CONFIG.easeFactorAdjustments[currentPerformance] || 0;
  let newEaseFactor = easeFactor + adjustment;
  
  // Clamp ease factor to bounds
  newEaseFactor = Math.max(
    DEFAULT_CONFIG.minEaseFactor,
    Math.min(newEaseFactor, DEFAULT_CONFIG.maxEaseFactor)
  );
  
  // Calculate new interval
  let newInterval;
  
  if (currentPerformance === 1) {
    // Failed - use minimum interval
    newInterval = DEFAULT_CONFIG.initialIntervals[1];
  } else if (repetitions === 0) {
    // First successful review - use initial interval
    newInterval = DEFAULT_CONFIG.initialIntervals[currentPerformance] || 24;
  } else {
    // Calculate based on half-life and target recall probability
    // Schedule when recall probability would drop to target level
    const targetTime = halfLife * Math.log2(1 / DEFAULT_CONFIG.targetRecallProbability);
    newInterval = Math.max(targetTime, currentInterval * newEaseFactor);
  }
  
  // Ensure interval is a valid number
  if (isNaN(newInterval) || !isFinite(newInterval)) {
    newInterval = 24; // Default to 24 hours if calculation fails
  }
  
  // Clamp interval to bounds
  newInterval = Math.max(
    DEFAULT_CONFIG.minInterval,
    Math.min(newInterval, DEFAULT_CONFIG.maxInterval)
  );
  
  // Ensure ease factor is valid
  if (isNaN(newEaseFactor) || !isFinite(newEaseFactor)) {
    newEaseFactor = DEFAULT_CONFIG.initialEaseFactor;
  }
  
  // Calculate next review timestamp
  const nextReview = new Date(Date.now() + (newInterval * 60 * 60 * 1000));
  
  return {
    nextReview,
    newEaseFactor,
    newInterval
  };
}

/**
 * Update user performance and spaced repetition parameters
 * @param {string} userId - User ID
 * @param {string} contentId - Content ID
 * @param {number} responseQuality - Response quality (1-5)
 * @param {number} responseTime - Response time in seconds (optional)
 * @returns {Object} - Updated spaced repetition parameters
 */
async function updateUserPerformance(userId, contentId, responseQuality, responseTime = null) {
  try {
    // Get current spaced repetition record
    const currentRecord = await db.select('spaced_repetition', {
      user_id: userId,
      content_id: contentId
    });
    
    const existing = currentRecord[0] || null;
    
    // Get content difficulty
    const contentData = await db.select('lesson_content', { id: contentId });
    const contentDifficulty = contentData[0]?.difficulty_score || 5;
    
    // Calculate current half-life
    const userHistory = existing ? {
      repetitions: existing.repetitions,
      successCount: existing.success_count,
      totalReviews: existing.total_reviews,
      lastResponseQuality: existing.last_response_quality,
      easeFactor: existing.ease_factor
    } : {};
    
    const { halfLife } = calculateHalfLife(userHistory, contentDifficulty);
    
    // Schedule next review
    const scheduling = scheduleNextReview(responseQuality, halfLife, existing);
    
    // Prepare update data
    const updateData = {
      current_interval: scheduling.newInterval,
      ease_factor: scheduling.newEaseFactor,
      repetitions: responseQuality >= 3 ? (existing?.repetitions || 0) + 1 : existing?.repetitions || 0,
      last_reviewed: new Date(),
      next_review: scheduling.nextReview,
      last_response_quality: responseQuality,
      total_reviews: (existing?.total_reviews || 0) + 1,
      success_count: responseQuality >= 3 ? (existing?.success_count || 0) + 1 : existing?.success_count || 0
    };
    
    let result;
    
    if (existing) {
      // Update existing record
      result = await db.update('spaced_repetition', updateData, {
        user_id: userId,
        content_id: contentId
      });
    } else {
      // Create new record
      result = await db.insert('spaced_repetition', {
        user_id: userId,
        content_id: contentId,
        ...updateData,
        created_at: new Date()
      });
    }
    
    return {
      success: true,
      data: result,
      scheduling: scheduling,
      halfLife: halfLife
    };
    
  } catch (error) {
    console.error('Error updating user performance:', error);
    throw error;
  }
}

/**
 * Get prioritized review queue for user
 * @param {string} userId - User ID
 * @param {number} maxItems - Maximum number of items to return
 * @returns {Array} - Prioritized list of content to review
 */
async function getReviewQueue(userId, maxItems = 20) {
  try {
    const now = new Date();
    
    // Get all spaced repetition records for user with content data
    const queryText = `
      SELECT sr.*, lc.english_phrase, lc.target_phrase, lc.difficulty_score,
             lc.pronunciation_guide, lc.cultural_context, lc.exercise_types
      FROM spaced_repetition sr
      JOIN lesson_content lc ON sr.content_id = lc.id
      WHERE sr.user_id = $1
      ORDER BY 
        CASE 
          WHEN sr.next_review <= NOW() - INTERVAL '2 hours' * sr.current_interval THEN 1  -- Severely overdue
          WHEN sr.next_review <= NOW() THEN 2                                             -- Due now
          WHEN sr.next_review <= NOW() + INTERVAL '6 hours' THEN 3                       -- Due soon
          ELSE 4                                                                          -- Future
        END,
        sr.next_review ASC
      LIMIT $2
    `;
    
    const result = await query(queryText, [userId, maxItems]);
    const reviewItems = result.rows;
    
    // Calculate current recall probabilities
    const enrichedItems = reviewItems.map(item => {
      const timeSinceReview = item.last_reviewed 
        ? (now - new Date(item.last_reviewed)) / (1000 * 60 * 60) // Convert to hours
        : item.current_interval * 2; // Assume it's been twice the interval if never reviewed
      
      const userHistory = {
        repetitions: item.repetitions,
        successCount: item.success_count,
        totalReviews: item.total_reviews,
        lastResponseQuality: item.last_response_quality,
        easeFactor: item.ease_factor
      };
      
      const { halfLife } = calculateHalfLife(userHistory, item.difficulty_score);
      const { probability, recommendation } = getRecallProbability(halfLife, timeSinceReview);
      
      return {
        ...item,
        recall_probability: probability,
        recommendation,
        half_life: halfLife,
        time_since_review: timeSinceReview
      };
    });
    
    return enrichedItems;
    
  } catch (error) {
    console.error('Error getting review queue:', error);
    throw error;
  }
}

/**
 * Process user response and update all relevant data
 * @param {string} userId - User ID
 * @param {string} contentId - Content ID
 * @param {Object} responseData - { quality: number, time: number, exerciseType: string }
 * @returns {Object} - Complete response processing result
 */
async function processUserResponse(userId, contentId, responseData) {
  const { quality, time, exerciseType = 'flashcard' } = responseData;
  
  try {
    // Update spaced repetition parameters
    const srResult = await updateUserPerformance(userId, contentId, quality, time);
    
    // Apply exercise type weighting for future calculations
    const typeWeight = GHEG_ALBANIAN_CONFIG.exerciseTypeWeights[exerciseType] || 1.0;
    
    // Log session data (this would integrate with user_sessions table)
    const sessionData = {
      response_quality: quality,
      response_time: time,
      exercise_type: exerciseType,
      type_weight: typeWeight,
      half_life: srResult.halfLife,
      next_review: srResult.scheduling.nextReview
    };
    
    return {
      success: true,
      spacedRepetition: srResult,
      session: sessionData,
      performance: {
        quality,
        time,
        exerciseType,
        improvedRetention: quality >= 3
      }
    };
    
  } catch (error) {
    console.error('Error processing user response:', error);
    throw error;
  }
}

/**
 * Get content difficulty adjustment based on user population performance
 * @param {string} contentId - Content ID
 * @returns {Object} - Difficulty adjustment recommendation
 */
async function getDifficultyAdjustment(contentId) {
  try {
    // Get aggregated performance data for this content across all users
    const queryText = `
      SELECT 
        AVG(CAST(last_response_quality AS FLOAT)) as avg_quality,
        AVG(ease_factor) as avg_ease_factor,
        COUNT(*) as total_attempts,
        AVG(CAST(success_count AS FLOAT) / NULLIF(total_reviews, 0)) as avg_success_rate
      FROM spaced_repetition 
      WHERE content_id = $1 AND total_reviews > 0
    `;
    
    const result = await query(queryText, [contentId]);
    const stats = result.rows[0];
    
    if (!stats || stats.total_attempts < 5) {
      return {
        adjustment: 0,
        confidence: 'low',
        reason: 'insufficient_data'
      };
    }
    
    const avgQuality = parseFloat(stats.avg_quality) || 3;
    const avgSuccessRate = parseFloat(stats.avg_success_rate) || 0.5;
    
    let adjustment = 0;
    let reason = 'optimal';
    
    // If content is too easy (high success rate and quality)
    if (avgQuality > 4.2 && avgSuccessRate > 0.9) {
      adjustment = 1; // Increase difficulty
      reason = 'too_easy';
    }
    // If content is too hard (low success rate and quality)
    else if (avgQuality < 2.5 && avgSuccessRate < 0.4) {
      adjustment = -1; // Decrease difficulty
      reason = 'too_hard';
    }
    
    return {
      adjustment,
      confidence: stats.total_attempts >= 20 ? 'high' : 'medium',
      reason,
      stats: {
        avgQuality,
        avgSuccessRate,
        totalAttempts: parseInt(stats.total_attempts)
      }
    };
    
  } catch (error) {
    console.error('Error calculating difficulty adjustment:', error);
    throw error;
  }
}

module.exports = {
  calculateHalfLife,
  getRecallProbability,
  scheduleNextReview,
  updateUserPerformance,
  getReviewQueue,
  processUserResponse,
  getDifficultyAdjustment,
  DEFAULT_CONFIG,
  GHEG_ALBANIAN_CONFIG
};