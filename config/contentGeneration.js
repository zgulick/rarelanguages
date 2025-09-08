/**
 * Content Generation Configuration
 * Phase 1.3: OpenAI and batch processing settings
 */

module.exports = {
  openai: {
    model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 2000,
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.3
  },

  generation: {
    batchSize: parseInt(process.env.BATCH_SIZE) || 25,
    maxDailyCost: parseFloat(process.env.MAX_DAILY_COST) || 10.00,
    cacheResponses: process.env.CACHE_RESPONSES !== 'false',
    validateContent: process.env.VALIDATE_CONTENT !== 'false',
    maxConcurrentCalls: parseInt(process.env.MAX_CONCURRENT_CALLS) || 3,
    retryAttempts: parseInt(process.env.RETRY_ATTEMPTS) || 3,
    rateLimitDelay: parseInt(process.env.RATE_LIMIT_DELAY) || 1000
  },

  batchConfig: {
    translationBatchSize: 25,    // Phrases per API call
    maxConcurrentCalls: 3,       // Parallel API requests
    retryAttempts: 3,            // Failed request retries
    rateLimitDelay: 1000,        // ms between calls

    // Adjust based on API response times and costs
    optimizeBatchSize: (averageResponseTime, errorRate) => {
      if (errorRate > 0.1) {
        module.exports.batchConfig.translationBatchSize = Math.max(5, 
          module.exports.batchConfig.translationBatchSize - 5
        );
      }
      if (averageResponseTime > 10000) {
        module.exports.batchConfig.maxConcurrentCalls = 1;
      }
    }
  },

  ghegSpecific: {
    dialectEmphasis: "Focus on Kosovo Gheg dialect, not Standard Albanian",
    culturalContext: "Family-oriented, respectful, conversational tone",
    avoidFormalisms: "Use colloquial expressions appropriate for family settings",
    
    // Common cultural contexts for batching
    contexts: {
      familyTerms: "Family introductions, informal tone, Kosovo family dynamics",
      greetings: "Daily greetings, conversational tone, respectful address",
      cardGames: "Card game terminology, friendly competition, social bonding",
      coffee: "Coffee culture, social gathering, casual conversation",
      food: "Meal preparation, dining together, hospitality traditions",
      children: "Speaking to or about children, family activities",
      compliments: "Giving praise, appreciation, positive social interaction",
      apologies: "Apologizing, showing respect, social courtesy"
    }
  },

  exerciseTypes: [
    'flashcard',
    'multiple_choice', 
    'conversation',
    'audio_repeat',
    'fill_blank',
    'cultural_note'
  ],

  validation: {
    minTranslationLength: 1,
    maxTranslationLength: 500,
    requiredExerciseTypes: ['flashcard', 'multiple_choice'],
    maxCulturalNoteLength: 200,
    allowedCharacters: /^[\p{L}\p{N}\p{P}\p{Z}\p{S}]*$/u // Unicode letters, numbers, punctuation, separators, symbols
  },

  cache: {
    directory: process.env.CONTENT_CACHE_DIR || './cache',
    enabled: process.env.CACHE_RESPONSES !== 'false',
    maxAge: parseInt(process.env.CACHE_MAX_AGE) || 86400000 // 24 hours in ms
  },

  progress: {
    saveInterval: 10, // Save progress every N operations
    resumeFromFile: true,
    progressDirectory: './progress'
  }
};