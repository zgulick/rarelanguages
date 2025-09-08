/**
 * API Client for Frontend Integration
 * Handles all communication between React components and the backend API
 */

const API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://your-app.vercel.app/api'  // Update this with your production URL
  : 'http://localhost:3000/api';

/**
 * Generic API request handler with error handling
 */
async function apiRequest(url, options = {}) {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  try {
    const response = await fetch(`${API_BASE}${url}`, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error (${url}):`, error);
    throw error;
  }
}

/**
 * API Client with all endpoint methods
 */
const apiClient = {
  /**
   * Authentication endpoints
   */
  auth: {
    async authenticateUser(userData) {
      return apiRequest('/auth/user', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
    }
  },

  /**
   * Lesson endpoints
   */
  lessons: {
    async getNextLesson(userId) {
      if (!userId) {
        throw new Error('User ID is required');
      }
      return apiRequest(`/lessons/next?userId=${encodeURIComponent(userId)}`);
    },

    async getLessonContent(lessonId) {
      if (!lessonId) {
        throw new Error('Lesson ID is required');
      }
      return apiRequest(`/lessons/${encodeURIComponent(lessonId)}`);
    }
  },

  /**
   * Progress tracking endpoints
   */
  progress: {
    async updateProgress(progressData) {
      const requiredFields = ['userId', 'contentId', 'lessonId', 'responseQuality', 'correct'];
      
      for (const field of requiredFields) {
        if (progressData[field] === undefined || progressData[field] === null) {
          throw new Error(`${field} is required for progress update`);
        }
      }

      return apiRequest('/progress/update', {
        method: 'POST',
        body: JSON.stringify(progressData)
      });
    }
  },

  /**
   * Review endpoints
   */
  review: {
    async getReviewQueue(userId, limit = 20) {
      if (!userId) {
        throw new Error('User ID is required');
      }
      
      const params = new URLSearchParams({
        userId: userId,
        limit: limit.toString()
      });
      
      return apiRequest(`/review/queue?${params}`);
    }
  },

  /**
   * Practice endpoints
   */
  practice: {
    async getPracticeContent(userId, topic) {
      if (!userId) {
        throw new Error('User ID is required');
      }
      if (!topic) {
        throw new Error('Topic is required');
      }

      const params = new URLSearchParams({ userId });
      return apiRequest(`/practice/${encodeURIComponent(topic)}?${params}`);
    }
  }
};

/**
 * Higher-level API methods that combine multiple endpoints
 */
const apiHelpers = {
  /**
   * Initialize user session - handles guest and registered users
   */
  async initializeUser(options = {}) {
    try {
      // Try to get existing user from localStorage first
      const savedUser = localStorage.getItem('rarelanguages_user');
      if (savedUser) {
        const user = JSON.parse(savedUser);
        // Validate saved user is still valid by making a quick API call
        try {
          await apiClient.lessons.getNextLesson(user.userId);
          return user;
        } catch (error) {
          // Saved user is invalid, continue with creating new user
          localStorage.removeItem('rarelanguages_user');
        }
      }

      // Create new user
      const userData = {
        email: options.email,
        guestId: options.guestId || `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        preferredName: options.preferredName || 'Learner'
      };

      const user = await apiClient.auth.authenticateUser(userData);
      
      // Save user to localStorage for persistence
      localStorage.setItem('rarelanguages_user', JSON.stringify(user));
      
      return user;
    } catch (error) {
      console.error('Error initializing user:', error);
      throw error;
    }
  },

  /**
   * Get comprehensive learning dashboard data
   */
  async getDashboardData(userId) {
    try {
      const [nextLesson, reviewQueue] = await Promise.all([
        apiClient.lessons.getNextLesson(userId),
        apiClient.review.getReviewQueue(userId, 5) // Get first 5 review items for dashboard
      ]);

      return {
        nextLesson,
        reviewQueue,
        hasReviews: reviewQueue.reviewItems && reviewQueue.reviewItems.length > 0
      };
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      throw error;
    }
  },

  /**
   * Handle exercise completion with progress tracking
   */
  async completeExercise(userId, exerciseData) {
    const { contentId, lessonId, exerciseType, responses = [] } = exerciseData;

    try {
      // Process all responses from the exercise
      const progressUpdates = responses.map(response => 
        apiClient.progress.updateProgress({
          userId,
          contentId: response.contentId || contentId,
          lessonId,
          exerciseType,
          responseQuality: response.quality || response.responseQuality,
          timeSpent: response.timeSpent || 0,
          correct: response.correct
        })
      );

      const results = await Promise.all(progressUpdates);
      
      return {
        success: true,
        results,
        totalResponses: responses.length,
        correctResponses: responses.filter(r => r.correct).length
      };
    } catch (error) {
      console.error('Error completing exercise:', error);
      throw error;
    }
  }
};

/**
 * Error handling utilities
 */
const apiErrors = {
  isNetworkError(error) {
    return error.message.includes('fetch') || error.message.includes('NetworkError');
  },

  isAuthError(error) {
    return error.message.includes('401') || error.message.includes('403');
  },

  isNotFoundError(error) {
    return error.message.includes('404') || error.message.includes('not found');
  },

  getUserFriendlyMessage(error) {
    if (this.isNetworkError(error)) {
      return 'Network connection error. Please check your internet connection and try again.';
    }
    
    if (this.isAuthError(error)) {
      return 'Authentication error. Please refresh the page and try again.';
    }
    
    if (this.isNotFoundError(error)) {
      return 'The requested content was not found. This might be a temporary issue.';
    }
    
    return 'Something went wrong. Please try again in a moment.';
  }
};

export default apiClient;
export { apiHelpers, apiErrors };