/**
 * Lesson Generator V2 - Core Structure
 * Implements textbook-quality lesson generation with multi-stage process
 * Chunks 2.1 & 2.2 of the masterplan
 */

const { OpenAIClient } = require('../openai');
const { query } = require('../database');
const { GrammarEngine } = require('./GrammarEngine');
const { ExerciseBuilder } = require('./ExerciseBuilder');
const {
  vocabularySchema,
  lessonOverviewSchema,
  lessonIntroductionSchema,
  patternRecognitionSchema,
  culturalNotesSchema,
  lessonSummarySchema
} = require('../schemas/lessonSchemas');

class LessonGeneratorV2 {
  constructor() {
    this.generationStats = {
      totalGenerations: 0,
      averageTime: 0,
      successRate: 0
    };
    this.grammarEngine = new GrammarEngine();
    this.exerciseBuilder = new ExerciseBuilder();
    this.openaiClient = new OpenAIClient();
  }

  /**
   * Main generation function - creates complete textbook-quality lesson
   */
  async generateCore(lessonPlan) {
    console.log(`🎯 Generating textbook-quality lesson: "${lessonPlan.title}"`);
    const startTime = Date.now();

    try {
      // Stage 1: Generate overview and introduction
      console.log('📊 Stage 1: Overview & Introduction');
      const overview = await this.generateLessonOverview(lessonPlan);
      const introduction = await this.generateIntroduction(lessonPlan, overview);

      // Stage 2: Generate vocabulary with patterns
      console.log('📚 Stage 2: Vocabulary Section');
      const vocabulary = await this.generateVocabularySection(
        lessonPlan.content_groups,
        lessonPlan.focus_patterns
      );

      // Stage 3: Generate grammar explanations
      console.log('🔤 Stage 3: Grammar Section');
      const grammar = await this.generateGrammarSection(
        lessonPlan.content_groups,
        lessonPlan.focus_patterns
      );

      // Stage 4: Generate pattern recognition section
      console.log('🧠 Stage 4: Pattern Recognition');
      const patterns = await this.generatePatternRecognition(
        lessonPlan.focus_patterns,
        lessonPlan.content_groups
      );

      // Stage 5: Generate cultural notes
      console.log('🏛️ Stage 5: Cultural Notes');
      const cultural = await this.generateCulturalNotes(lessonPlan);

      // Stage 6: Generate comprehensive summary
      console.log('📝 Stage 6: Summary');
      const summary = await this.generateSummary({
        overview,
        vocabulary,
        grammar,
        patterns
      });

      // Stage 7: Generate exercises with ExerciseBuilder
      console.log('🏋️ Stage 7: Interactive Exercises');
      const baseLesson = {
        title: lessonPlan.title,
        vocabulary,
        grammar,
        pattern_recognition: patterns,
        cultural_notes: cultural
      };

      const lessonWithExercises = await this.exerciseBuilder.addExercises(
        baseLesson,
        overview.difficulty_level <= 2 ? 'beginner' : 'intermediate'
      );

      // Combine all sections
      const lesson = {
        lesson_number: lessonPlan.lesson_number,
        title: lessonPlan.title,
        content: {
          overview,
          introduction,
          vocabulary,
          grammar,
          pattern_recognition: patterns,
          exercises: lessonWithExercises.exercises,
          cultural_notes: cultural,
          summary
        },
        metadata: {
          generated_at: new Date(),
          version: 2,
          pattern_focus: lessonPlan.focus_patterns,
          generation_time: Date.now() - startTime,
          exercise_count: this.exerciseBuilder.getTotalExerciseCount(lessonWithExercises.exercises)
        }
      };

      // Validate lesson quality
      const validation = this.validateLessonQuality(lesson);
      if (!validation.passed) {
        console.warn('⚠️ Lesson quality validation failed:', validation.checks);
      }

      console.log(`✅ Lesson generated in ${Math.round((Date.now() - startTime) / 1000)}s`);
      return lesson;

    } catch (error) {
      console.error('❌ Lesson generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate comprehensive lesson overview
   */
  async generateLessonOverview(lessonPlan) {
    const prompt = `Create a comprehensive lesson overview for: ${lessonPlan.title}

Include:
1. 3-5 specific learning objectives (what students WILL be able to do)
2. Clear prerequisites if any
3. Realistic time estimate (single number between 10-20)
4. Difficulty level (single number 1-5) with justification
5. 2-3 key takeaways

Make objectives measurable and specific.`;

    const messages = [{ role: 'user', content: prompt }];
    const response = await this.openaiClient.makeStructuredRequest(messages, lessonOverviewSchema, 'lesson_overview');

    return response.content;
  }

  /**
   * Generate engaging lesson introduction
   */
  async generateIntroduction(lessonPlan, overview) {
    const prompt = `Create an engaging introduction for lesson: ${lessonPlan.title}

Requirements:
1. Start with a real-world scenario relevant to Kosovo/Albanian culture
2. Explain why this content matters for daily communication
3. Connect to previous lessons if applicable
4. Set expectations for what they'll achieve
5. Include cultural context that makes it memorable
6. Keep it conversational and motivating

Length: 150-200 words`;

    const messages = [{ role: 'user', content: prompt }];
    const response = await this.openaiClient.makeStructuredRequest(messages, lessonIntroductionSchema, 'lesson_introduction');

    return response.content;
  }

  /**
   * Generate rich vocabulary presentation with multi-stage process
   */
  async generateVocabularySection(content, patterns) {
    console.log('📚 Generating vocabulary with patterns...');

    // Stage 1: Organize vocabulary by theme/pattern
    const organized = await this.organizeVocabulary(content);

    // Stage 2: Generate detailed entries for each word
    const detailed = await this.generateDetailedVocabulary(organized);

    // Stage 3: Add memory aids and associations
    const enriched = await this.addMemoryAids(detailed);

    // Stage 4: Identify and explain patterns
    const withPatterns = await this.addPatternExplanations(enriched, patterns);

    return withPatterns;
  }

  async organizeVocabulary(content) {
    const allWords = content.flatMap(group =>
      group.content.map(item => ({
        english: item.english_phrase,
        target: item.target_phrase,
        word_type: item.word_type,
        grammar_category: item.grammar_category,
        pronunciation_guide: item.pronunciation_guide
      }))
    );

    return { words: allWords, themes: [] };
  }

  async generateDetailedVocabulary(organized) {
    // Process all words at once with structured output - no more chunking needed!
    console.log(`📚 Processing ${organized.words.length} words with structured JSON schema`);

    const prompt = `Create detailed vocabulary entries for these Albanian words:
${organized.words.map(w => `"${w.english}" → "${w.target}"`).join(', ')}

For each word, provide comprehensive linguistic information including pronunciation, memory aids, usage notes, example sentences, and related words.`;

    try {
      const messages = [{ role: 'user', content: prompt }];
      const response = await this.openaiClient.makeStructuredRequest(messages, vocabularySchema, 'vocabulary_generation');

      console.log(`✅ Successfully processed all ${organized.words.length} words with structured output`);
      return response.content;

    } catch (error) {
      console.error(`❌ Structured vocabulary generation failed, using fallback:`, error);

      // Fallback to simple word list if structured output fails
      const fallbackWords = organized.words.map(word => ({
        english: word.english,
        target: word.target,
        pronunciation: {
          ipa: `/${word.target?.toLowerCase()}/`,
          sounds_like: word.target,
          syllables: "1-2 syllables",
          stress: "standard"
        },
        memory_aid: `Remember "${word.target}" means "${word.english}"`,
        usage_notes: `Basic usage of ${word.target}`,
        example_sentence: {
          target: word.target,
          english: word.english,
          literal: word.english
        },
        related_words: []
      }));

      return {
        words: fallbackWords,
        patterns_identified: ["basic vocabulary"]
      };
    }
  }

  async addMemoryAids(detailed) {
    // Enhance existing memory aids with more creative techniques
    const enhanced = { ...detailed };

    // Handle case where detailed might not have words array due to JSON parsing errors
    if (enhanced.words && Array.isArray(enhanced.words)) {
      enhanced.words = enhanced.words.map(word => ({
        ...word,
        memory_aid: word.memory_aid || `Remember "${word.target}" by thinking of "${word.english}"`
      }));
    } else {
      // Fallback if words array is missing
      enhanced.words = [];
    }

    return enhanced;
  }

  async addPatternExplanations(enriched, patterns) {
    if (!patterns || patterns.length === 0) return enriched;

    // Simply add pattern explanations directly without LLM call to avoid complexity
    const patternExplanations = patterns.map(pattern => `Pattern: ${pattern} - evident in the vocabulary structure`);

    return {
      ...enriched,
      pattern_explanations: patternExplanations
    };
  }

  /**
   * Generate comprehensive grammar explanations using GrammarEngine
   */
  async generateGrammarSection(content, patterns) {
    console.log('🔤 Generating grammar section with Grammar Engine integration');

    try {
      // Use the Grammar Engine for sophisticated analysis
      return await this.grammarEngine.generateGrammarSectionForLesson(content, patterns);
    } catch (error) {
      console.error('❌ Grammar Engine failed, falling back to basic generation:', error);

      // Fallback to basic grammar generation
      const prompt = `Create a grammar section for Albanian language content.
Content includes: ${JSON.stringify(content.slice(0, 2), null, 2)}
Patterns: ${patterns?.join(', ') || 'No specific patterns'}

Required elements:
1. Main grammar rule with clear explanation
2. Visual representation (describe a table/chart structure)
3. Pattern identification with examples
4. Common mistakes and how to avoid them
5. Comparison with English patterns
6. 3-5 example sentences showing the rule

Make it clear and accessible for beginners.
Include conjugation tables if relevant.

Format as JSON:
{
  "focus": "main grammar topic",
  "rules": [
    {
      "rule": "rule description",
      "examples": ["example1", "example2"],
      "exceptions": ["exception1"]
    }
  ],
  "conjugations": {},
  "common_mistakes": [
    {
      "mistake": "common error",
      "correct": "correct form"
    }
  ],
  "visual_aids": "description of helpful charts/tables"
}`;

      const messages = [{ role: 'user', content: prompt }];
      const response = await this.openaiClient.makeRequest(messages, 'grammar_fallback', {
        max_tokens: 1200,
        temperature: 0.6
      });

      return this.cleanJsonResponse(response);
    }
  }

  /**
   * Generate pattern recognition section
   */
  async generatePatternRecognition(patterns, content) {
    const prompt = `Create a pattern recognition section that explicitly teaches these linguistic patterns: ${patterns?.join(', ') || 'general patterns'}

Content context: ${JSON.stringify(content.slice(0, 1), null, 2)}

Make patterns explicit and teachable. Focus on Albanian language patterns.`;

    const messages = [{ role: 'user', content: prompt }];
    const response = await this.openaiClient.makeStructuredRequest(messages, patternRecognitionSchema, 'pattern_recognition');

    return response.content;
  }

  /**
   * Generate cultural notes
   */
  async generateCulturalNotes(lessonPlan) {
    const prompt = `Add 2-3 cultural notes relevant to: ${lessonPlan.title}
Focus on Kosovo/Albanian culture.

Include:
1. How this language element is used in daily life
2. Cultural differences from English usage
3. Common social situations where this applies
4. Any gestures or non-verbal elements
5. Regional variations if relevant

Keep each note 50-75 words.
Make them practical and interesting.`;

    const messages = [{ role: 'user', content: prompt }];
    const response = await this.openaiClient.makeStructuredRequest(messages, culturalNotesSchema, 'cultural_notes');

    return response.content.notes;
  }

  /**
   * Generate comprehensive lesson summary
   */
  async generateSummary(lesson) {
    const prompt = `Create a comprehensive lesson summary based on this lesson content:
Overview: ${JSON.stringify(lesson.overview, null, 2)}
Vocabulary count: ${lesson.vocabulary?.words?.length || 0} words
Grammar topics: ${lesson.grammar?.focus || 'various'}

Create a summary with key points, quick reference guide, self-assessment questions, and preview of next lesson.`;

    const messages = [{ role: 'user', content: prompt }];
    const response = await this.openaiClient.makeStructuredRequest(messages, lessonSummarySchema, 'lesson_summary');

    return response.content;
  }

  /**
   * Clean and parse JSON responses from LLM
   */
  cleanJsonResponse(response) {
    try {
      // Handle OpenAI API response object vs string
      let content = typeof response === 'object' && response.content ? response.content : response;

      if (typeof content !== 'string') {
        console.error('❌ Unexpected response type:', typeof content);
        return { error: 'Invalid response format', raw_response: response };
      }

      // Check if response is markdown instead of JSON
      if (content.startsWith('**') || content.includes('\n**')) {
        console.log('🔄 Response appears to be markdown, creating fallback JSON structure');
        return {
          error: 'Response was markdown instead of JSON',
          markdown_content: content,
          fallback: true
        };
      }

      // Detect truncated responses (common signs of incomplete JSON)
      const truncationSigns = [
        content.includes('...'), // Truncation indicator
        content.endsWith('"'), // Ends mid-string
        !content.includes('}') && content.includes('{'), // Incomplete object
        content.includes('unterminated'), // Error message
      ];

      if (truncationSigns.some(Boolean)) {
        console.warn('🚧 Detected potentially truncated response, attempting repair');
        // Try to repair common truncation issues
        content = this.attemptJsonRepair(content);
      }

      // Extract JSON from response that might have explanatory text
      let jsonMatch = content.match(/```json\s*\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        content = jsonMatch[1];
      } else {
        // Handle responses that start with explanatory text like "Certainly! Here is..."
        const jsonStart = content.indexOf('{');
        const jsonArrayStart = content.indexOf('[');

        if (jsonStart !== -1 || jsonArrayStart !== -1) {
          const startIndex = jsonStart === -1 ? jsonArrayStart :
                           (jsonArrayStart === -1 ? jsonStart : Math.min(jsonStart, jsonArrayStart));
          content = content.substring(startIndex);
        }
      }

      // Remove common formatting issues
      let cleaned = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .replace(/^\s*[\r\n]/gm, '')
        .trim();

      // Try to find JSON in the text if it starts with explanatory text
      if (!cleaned.startsWith('{') && !cleaned.startsWith('[')) {
        const jsonStart = cleaned.indexOf('{');
        const jsonArrayStart = cleaned.indexOf('[');
        const startIndex = jsonStart === -1 ? jsonArrayStart : (jsonArrayStart === -1 ? jsonStart : Math.min(jsonStart, jsonArrayStart));

        if (startIndex !== -1) {
          cleaned = cleaned.substring(startIndex);
        }
      }

      // Handle ranges like "15-20" in numbers and fields
      cleaned = cleaned.replace(/"(\d+)-(\d+)"/g, '"$1"');
      // Fix unquoted ranges like estimated_minutes": 15-20 (with proper quotes)
      cleaned = cleaned.replace(/:\s*(\d+)-(\d+)([,\}])/g, ': $1$3');
      // Fix any remaining unquoted numbers followed by text
      cleaned = cleaned.replace(/:\s*(\d+)\s*-\s*(\d+)/g, ': $1');

      // Fix trailing commas
      cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');

      return JSON.parse(cleaned);
    } catch (error) {
      console.error('❌ JSON parsing error:', error);
      console.error('Raw response content preview:', typeof response === 'object' ? response.content?.substring(0, 200) : response?.substring(0, 200));

      // Return fallback structure with better error info
      return {
        error: 'Failed to parse LLM response',
        error_type: error.name,
        error_message: error.message,
        raw_response: response
      };
    }
  }

  attemptJsonRepair(content) {
    try {
      // Remove incomplete trailing strings that cause "unterminated string" errors
      let repaired = content;

      // If ends with incomplete string, try to close it
      if (repaired.match(/"[^"]*$/)) {
        console.log('🔧 Attempting to close unterminated string');
        repaired = repaired.replace(/"[^"]*$/, '""');
      }

      // If missing closing braces, try to add them
      const openBraces = (repaired.match(/{/g) || []).length;
      const closeBraces = (repaired.match(/}/g) || []).length;
      const openArrays = (repaired.match(/\[/g) || []).length;
      const closeArrays = (repaired.match(/]/g) || []).length;

      if (openBraces > closeBraces) {
        const missingClosing = openBraces - closeBraces;
        console.log(`🔧 Adding ${missingClosing} missing closing braces`);
        repaired += '}'.repeat(missingClosing);
      }

      if (openArrays > closeArrays) {
        const missingClosing = openArrays - closeArrays;
        console.log(`🔧 Adding ${missingClosing} missing closing brackets`);
        repaired += ']'.repeat(missingClosing);
      }

      // Remove trailing comma before closing
      repaired = repaired.replace(/,(\s*[}\]])/, '$1');

      return repaired;
    } catch (error) {
      console.warn('🔧 JSON repair failed, returning original content');
      return content;
    }
  }

  /**
   * Validate lesson quality against success criteria
   */
  validateLessonQuality(lesson) {
    const checks = {
      has_all_sections: lesson.content && Object.keys(lesson.content).length >= 7,
      vocabulary_count: lesson.content?.vocabulary?.words?.length >= 5,
      has_patterns: lesson.content?.pattern_recognition?.patterns?.length > 0,
      has_grammar: lesson.content?.grammar?.rules?.length > 0,
      has_cultural: lesson.content?.cultural_notes?.length >= 1,
      has_summary: lesson.content?.summary?.key_points?.length >= 3,
      has_overview: lesson.content?.overview?.learning_objectives?.length >= 3
    };

    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.values(checks).length;

    return {
      passed: passed >= total * 0.8, // 80% pass rate
      score: `${passed}/${total}`,
      checks
    };
  }

  /**
   * Get generation statistics
   */
  getStats() {
    return this.generationStats;
  }
}

module.exports = { LessonGeneratorV2 };