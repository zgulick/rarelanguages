/**
 * OpenAI API Configuration and Cost Tracking
 * Phase 1.3: Content Generation Infrastructure
 */

const OpenAI = require('openai');

class ContentGenerationError extends Error {
  constructor(message, type, retryable = false) {
    super(message);
    this.type = type;
    this.retryable = retryable;
  }
}

class CostTracker {
  constructor() {
    this.totalCosts = 0;
    this.apiCalls = 0;
    this.operations = {};
  }

  estimateTokens(text) {
    // Rough token estimation for cost prediction (GPT uses ~4 chars per token)
    return Math.ceil(text.length / 4);
  }

  calculateCost(inputTokens, outputTokens, model = 'gpt-3.5-turbo') {
    const rates = {
      'gpt-3.5-turbo': { input: 0.0015, output: 0.002 }, // per 1K tokens (updated rates)
      'gpt-4': { input: 0.03, output: 0.06 },
      'gpt-4-turbo': { input: 0.01, output: 0.03 }
    };

    const rate = rates[model] || rates['gpt-3.5-turbo'];
    return (inputTokens / 1000 * rate.input) + (outputTokens / 1000 * rate.output);
  }

  logUsage(cost, operation, inputTokens = 0, outputTokens = 0) {
    this.totalCosts += cost;
    this.apiCalls += 1;
    
    if (!this.operations[operation]) {
      this.operations[operation] = { calls: 0, cost: 0, tokens: 0 };
    }
    this.operations[operation].calls += 1;
    this.operations[operation].cost += cost;
    this.operations[operation].tokens += inputTokens + outputTokens;

    console.log(`💸 ${operation}: $${cost.toFixed(4)} (Total: $${this.totalCosts.toFixed(2)})`);
  }

  getSummary() {
    return {
      totalCost: this.totalCosts,
      totalCalls: this.apiCalls,
      operations: this.operations,
      averageCostPerCall: this.apiCalls > 0 ? this.totalCosts / this.apiCalls : 0
    };
  }

  checkBudget(maxCost) {
    if (this.totalCosts > maxCost) {
      throw new ContentGenerationError(
        `Budget exceeded: $${this.totalCosts.toFixed(2)} > $${maxCost}`,
        'BUDGET_EXCEEDED',
        false
      );
    }
  }
}

class OpenAIClient {
  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    this.config = {
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 2000,
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.3,
      maxDailyCost: parseFloat(process.env.MAX_DAILY_COST) || 10.00
    };

    this.costTracker = new CostTracker();
    this.rateLimitDelay = parseInt(process.env.RATE_LIMIT_DELAY) || 1000;
  }

  async executeWithRetry(operation, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        console.error(`Attempt ${attempt} failed:`, error.message);
        
        // Check if error is retryable
        const isRetryable = error.code === 'rate_limit_exceeded' || 
                           error.code === 'server_error' ||
                           error.type === 'server_error' ||
                           (error.status >= 500 && error.status < 600);

        if (attempt === maxRetries || !isRetryable) {
          throw new ContentGenerationError(
            error.message,
            error.code || 'API_ERROR',
            isRetryable
          );
        }

        // Exponential backoff with jitter
        const baseDelay = Math.pow(2, attempt) * 1000;
        const jitter = Math.random() * 1000;
        const delay = baseDelay + jitter;
        
        console.log(`⚠️  Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  async makeRequest(messages, operationName, options = {}) {
    // Check budget before making request
    this.costTracker.checkBudget(this.config.maxDailyCost);

    const requestConfig = {
      model: options.model || this.config.model,
      messages,
      max_tokens: options.max_tokens || this.config.max_tokens,
      temperature: options.temperature || this.config.temperature,
      ...options
    };

    // Estimate cost before request
    const estimatedInputTokens = this.costTracker.estimateTokens(
      JSON.stringify(messages)
    );

    return this.executeWithRetry(async () => {
      const response = await this.client.chat.completions.create(requestConfig);
      
      // Calculate actual cost
      const usage = response.usage;
      const actualCost = this.costTracker.calculateCost(
        usage.prompt_tokens,
        usage.completion_tokens,
        requestConfig.model
      );

      // Log usage
      this.costTracker.logUsage(
        actualCost,
        operationName,
        usage.prompt_tokens,
        usage.completion_tokens
      );

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay));

      return {
        content: response.choices[0].message.content,
        usage: response.usage,
        cost: actualCost
      };
    });
  }

  async batchTranslate(phrases, culturalContext, operationName = 'translation') {
    const messages = [
      {
        role: 'system',
        content: `You are an expert translator specializing in Gheg Albanian (Kosovo dialect). 
        Focus on conversational, family-friendly language that Kosovo Albanian families would actually use. 
        Avoid formal or literary Albanian - use colloquial expressions.`
      },
      {
        role: 'user',
        content: `Translate the following English phrases to Gheg Albanian (Kosovo dialect).

Cultural Context: ${culturalContext}

Guidelines:
- Use Gheg Albanian specifically (not Standard Albanian)
- Focus on conversational, family-friendly language
- Consider Kosovo cultural expressions
- Provide natural, colloquial translations

English phrases:
${phrases.map((phrase, i) => `${i+1}. ${phrase}`).join('\n')}

Return as JSON array with format:
[
  {
    "english": "original phrase",
    "gheg": "translation", 
    "cultural_note": "brief cultural context if relevant"
  }
]`
      }
    ];

    return this.makeRequest(messages, operationName);
  }

  async generateExercises(phrase, translation, exerciseTypes, operationName = 'exercises') {
    const messages = [
      {
        role: 'system',
        content: `You are an expert language learning content creator specializing in Gheg Albanian. 
        Create engaging, culturally relevant exercises that help English speakers learn Kosovo Albanian phrases in context.`
      },
      {
        role: 'user', 
        content: `Create learning exercises for this Gheg Albanian phrase:
English: "${phrase}"
Gheg Albanian: "${translation}"

Generate exercises for these types: ${exerciseTypes.join(', ')}

For each exercise type, create:

FLASHCARD:
- front: English phrase
- back: Gheg translation
- hint: optional memory aid

MULTIPLE_CHOICE:
- question: "How do you say '${phrase}' in Gheg Albanian?"
- correct_answer: "${translation}"
- distractors: 3 plausible wrong answers in Gheg Albanian

CONVERSATION:
- scenario: realistic family/social context where phrase would be used
- setup: context description
- expected_response: what someone might say back

AUDIO_REPEAT:
- syllables: phrase broken into syllables
- stress: indicate primary stress
- notes: pronunciation tips

FILL_BLANK:
- sentence: sentence with blank where phrase goes
- answer: the phrase
- hint: contextual clue

CULTURAL_NOTE:
- context: when/how this phrase is used
- cultural_significance: why it matters in Kosovo Albanian culture

Return as structured JSON with this exact format:
{
  "exercises": [
    {
      "type": "flashcard",
      "data": { "front": "...", "back": "...", "hint": "..." }
    }
  ]
}`
      }
    ];

    return this.makeRequest(messages, operationName, { max_tokens: 3000 });
  }

  async generatePronunciation(ghegPhrase, operationName = 'pronunciation') {
    const messages = [
      {
        role: 'system',
        content: `You are a pronunciation expert for Gheg Albanian (Kosovo dialect). 
        Help English speakers pronounce Albanian sounds correctly using familiar English sound approximations.`
      },
      {
        role: 'user',
        content: `Create a pronunciation guide for this Gheg Albanian phrase: "${ghegPhrase}"

Provide:
1. Phonetic breakdown using English-like sounds
2. Syllable separation with stress marks  
3. Audio description for difficult sounds

Format:
{
  "phrase": "${ghegPhrase}",
  "phonetic": "pronunciation using English sounds",
  "syllables": "syl-la-ble break-down",
  "stress": "indicate PRIMARY stress", 
  "notes": "tips for difficult sounds"
}

Focus on helping English speakers pronounce Albanian sounds correctly.`
      }
    ];

    return this.makeRequest(messages, operationName);
  }

  getCostSummary() {
    return this.costTracker.getSummary();
  }
}

module.exports = {
  OpenAIClient,
  CostTracker,
  ContentGenerationError
};