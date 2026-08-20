/**
 * Pattern Analyzer Service
 * Analyzes raw lesson content to extract linguistic patterns for intelligent lesson generation
 *
 * This service provides the linguistic intelligence layer that transforms basic content
 * into pedagogically structured lessons by identifying Albanian language patterns.
 */

const { OpenAI } = require('openai');
const { query } = require('../database');

class PatternAnalyzer {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    this.analysisCache = new Map(); // Cache pattern analysis results
    this.processingStats = {
      totalAnalyses: 0,
      cacheHits: 0,
      patternExtractionCalls: 0,
      averageProcessingTime: 0
    };
  }

  /**
   * Main entry point: Analyze content for a specific skill and extract patterns
   * @param {string} skillId - UUID of the skill to analyze
   * @returns {Object} Pattern analysis object with content groups and patterns
   */
  async analyzeContentForSkill(skillId) {
    console.log(`🔍 Starting pattern analysis for skill: ${skillId}`);
    const startTime = Date.now();

    try {
      // Check cache first
      const cacheKey = `skill_${skillId}`;
      if (this.analysisCache.has(cacheKey)) {
        console.log(`💾 Using cached analysis for skill: ${skillId}`);
        this.processingStats.cacheHits++;
        return this.analysisCache.get(cacheKey);
      }

      // 1. Fetch raw content for this skill
      const content = await this.fetchSkillContent(skillId);
      console.log(`📊 Analyzing ${content.length} content items`);

      if (content.length === 0) {
        throw new Error(`No content found for skill ${skillId}`);
      }

      // 2. Extract linguistic patterns
      const patterns = await this.extractAllPatterns(content);
      console.log(`🎯 Extracted patterns: ${Object.keys(patterns).join(', ')}`);

      // 3. Group content based on patterns
      const contentGroups = await this.groupContentPedagogically(content, patterns);
      console.log(`📚 Created ${contentGroups.length} pedagogical groups`);

      // 4. Create analysis result
      const analysis = {
        skill_id: skillId,
        total_items: content.length,
        patterns,
        content_groups: contentGroups,
        difficulty_progression: this.calculateDifficultyProgression(contentGroups),
        pattern_summary: this.generatePatternSummary(patterns),
        analysis_metadata: {
          analyzed_at: new Date().toISOString(),
          processing_time_ms: Date.now() - startTime,
          content_types: this.analyzeContentTypes(content)
        }
      };

      // Cache the result
      this.analysisCache.set(cacheKey, analysis);

      // Update stats
      this.processingStats.totalAnalyses++;
      this.processingStats.averageProcessingTime =
        ((this.processingStats.averageProcessingTime * (this.processingStats.totalAnalyses - 1)) +
         (Date.now() - startTime)) / this.processingStats.totalAnalyses;

      console.log(`✅ Pattern analysis complete in ${Date.now() - startTime}ms`);
      return analysis;

    } catch (error) {
      console.error(`❌ Pattern analysis failed for skill ${skillId}:`, error);
      throw error;
    }
  }

  /**
   * Fetch cleaned content for a skill from the database
   * @param {string} skillId - UUID of the skill
   * @returns {Array} Array of content objects
   */
  async fetchSkillContent(skillId) {
    const contentQuery = `
      SELECT
        lc.*,
        l.name as lesson_name,
        l.difficulty_level,
        l.position as lesson_position,
        s.name as skill_name
      FROM lesson_content lc
      JOIN lessons l ON lc.lesson_id = l.id
      JOIN skills s ON l.skill_id = s.id
      WHERE s.id = $1
      AND lc.word_type IS NOT NULL
      AND lc.grammar_category IS NOT NULL
      AND lc.target_phrase IS NOT NULL
      AND LENGTH(lc.target_phrase) > 0
      ORDER BY l.position, lc.content_order, lc.id
    `;

    const result = await query(contentQuery, [skillId]);
    return result.rows;
  }

  /**
   * Extract all linguistic patterns from content
   * @param {Array} content - Array of content objects
   * @returns {Object} Object containing all extracted patterns
   */
  async extractAllPatterns(content) {
    console.log(`🎯 Extracting patterns from ${content.length} items`);

    const patterns = {
      numbers: await this.extractNumberPatterns(content),
      verbs: await this.extractVerbPatterns(content),
      grammar: await this.extractGrammarPatterns(content),
      pronunciation: await this.extractPronunciationPatterns(content)
    };

    return patterns;
  }

  /**
   * Extract number patterns and logical groupings
   * @param {Array} content - Content array
   * @returns {Object} Number patterns object
   */
  async extractNumberPatterns(content) {
    const numberContent = content.filter(item =>
      item.grammar_category === 'numbers' ||
      /\b(një|dy|tre|katër|pesë|gjashtë|shtatë|tetë|nëntë|dhjetë|\d+)\b/i.test(item.target_phrase)
    );

    if (numberContent.length === 0) {
      return { patterns_found: false, reason: 'No number content detected' };
    }

    console.log(`🔢 Analyzing ${numberContent.length} number-related items`);

    // Extract numbers using LLM for pattern recognition
    const prompt = `Analyze these Albanian number expressions and identify patterns:

${numberContent.map((item, i) => `${i+1}. "${item.target_phrase}" (English: "${item.english_phrase}")`).join('\n')}

Identify:
1. Basic numbers (1-10): Find unique, foundational numbers
2. Teen numbers (11-20): Look for addition patterns (10 + X)
3. Tens/Hundreds: Multiplication patterns
4. Compound numbers: Complex formation rules
5. Ordinal vs cardinal patterns
6. Any irregular or exception numbers

Return JSON:
{
  "unique_numbers": {"range": "1-10", "items": [...]},
  "pattern_based": {
    "teens": {"pattern": "compound rule", "examples": [...], "albanian_rule": "rule description"},
    "tens": {"pattern": "multiplication rule", "examples": [...], "albanian_rule": "rule description"}
  },
  "suggested_grouping": [
    {"range": "1-10", "lesson_num": 1, "difficulty": 1, "pedagogical_focus": "foundation"},
    {"range": "11-20", "lesson_num": 2, "difficulty": 2, "pedagogical_focus": "patterns"}
  ],
  "pronunciation_patterns": ["phonetic patterns found"],
  "cultural_notes": ["when/how these numbers are used"]
}`;

    try {
      this.processingStats.patternExtractionCalls++;
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert Albanian linguist specializing in pedagogical pattern analysis. Focus on finding teachable patterns that help students learn systematically. ALWAYS return valid JSON only, no explanatory text before or after."
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 2000
      });

      const patternsText = response.choices[0].message.content.trim();
      const cleanedText = this.cleanJsonResponse(patternsText);

      return JSON.parse(cleanedText);

    } catch (error) {
      console.error('❌ Number pattern extraction failed:', error);
      return this.fallbackNumberPatterns(numberContent);
    }
  }

  /**
   * Extract verb conjugation patterns
   * @param {Array} content - Content array
   * @returns {Object} Verb patterns object
   */
  async extractVerbPatterns(content) {
    const verbContent = content.filter(item =>
      item.word_type === 'verb' ||
      item.grammar_category === 'verbs' ||
      /\b(jam|kam|bëj|shkoj|ha|pi|flas|punoj|studoj|lexoj)\b/i.test(item.target_phrase)
    );

    if (verbContent.length === 0) {
      return { patterns_found: false, reason: 'No verb content detected' };
    }

    console.log(`🔤 Analyzing ${verbContent.length} verb-related items`);

    const prompt = `Analyze these Albanian verbs and identify conjugation patterns:

${verbContent.map((item, i) => `${i+1}. "${item.target_phrase}" (English: "${item.english_phrase}")`).join('\n')}

Identify:
1. Regular verb patterns: Common ending patterns (-oj, -aj, etc.)
2. Irregular verbs: Verbs that don't follow standard patterns
3. Tense patterns: Present, past, future formations
4. Person/number agreements: How verbs change with subject
5. Infinitive forms vs conjugated forms
6. High-frequency vs low-frequency verbs

Return JSON:
{
  "infinitives_found": ["list of base forms"],
  "conjugation_patterns": {
    "regular": {
      "first_group": {"ending": "-oj", "examples": [...], "conjugation_rule": "description"},
      "second_group": {"ending": "-aj", "examples": [...], "conjugation_rule": "description"}
    },
    "irregular": [{"verb": "jam", "pattern": "highly irregular", "note": "to be"}]
  },
  "tense_patterns": {
    "present": {"formation": "stem + ending", "examples": [...]},
    "past": {"formation": "pattern description", "examples": [...]}
  },
  "suggested_grouping": [
    {"group": "essential_irregular", "verbs": [...], "difficulty": 1},
    {"group": "regular_first_conjugation", "verbs": [...], "difficulty": 2}
  ]
}`;

    try {
      this.processingStats.patternExtractionCalls++;
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert Albanian linguist. Identify verb patterns that will help students learn Albanian conjugation systematically. ALWAYS return valid JSON only, no explanatory text before or after."
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 2000
      });

      const patternsText = response.choices[0].message.content.trim();
      const cleanedText = this.cleanJsonResponse(patternsText);

      return JSON.parse(cleanedText);

    } catch (error) {
      console.error('❌ Verb pattern extraction failed:', error);
      return this.fallbackVerbPatterns(verbContent);
    }
  }

  /**
   * Extract general grammar patterns from content
   * @param {Array} content - Content array
   * @returns {Object} Grammar patterns object
   */
  async extractGrammarPatterns(content) {
    console.log(`📖 Analyzing grammar patterns across ${content.length} items`);

    const prompt = `Analyze this Albanian language content and identify grammar patterns:

${content.slice(0, 30).map((item, i) =>
  `${i+1}. "${item.target_phrase}" → "${item.english_phrase}" (${item.word_type}, ${item.grammar_category})`
).join('\n')}${content.length > 30 ? `\n... and ${content.length - 30} more items` : ''}

Identify:
1. Word order patterns: How Albanian sentences are structured
2. Gender/case patterns: Noun declension indicators
3. Article usage: Definite/indefinite article patterns
4. Adjective agreement: How adjectives change with nouns
5. Preposition usage: Common preposition patterns
6. Question formation: How questions are formed

Return JSON:
{
  "word_order": {"pattern": "SVO/SOV/etc", "examples": [...], "exceptions": [...]},
  "case_patterns": {
    "nominative": {"markers": [...], "usage": "description"},
    "accusative": {"markers": [...], "usage": "description"}
  },
  "article_patterns": {
    "definite": {"pattern": "description", "examples": [...]},
    "indefinite": {"pattern": "description", "examples": [...]}
  },
  "agreement_patterns": {
    "adjective_noun": {"rule": "description", "examples": [...]}
  },
  "pedagogical_sequence": [
    {"concept": "word order", "difficulty": 1, "prerequisite": null},
    {"concept": "basic cases", "difficulty": 2, "prerequisite": "word order"}
  ]
}`;

    try {
      this.processingStats.patternExtractionCalls++;
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert Albanian grammar specialist. Focus on identifying teachable patterns that build systematically. ALWAYS return valid JSON only, no explanatory text before or after."
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 2000
      });

      const patternsText = response.choices[0].message.content.trim();
      const cleanedText = this.cleanJsonResponse(patternsText);

      return JSON.parse(cleanedText);

    } catch (error) {
      console.error('❌ Grammar pattern extraction failed:', error);
      return this.fallbackGrammarPatterns(content);
    }
  }

  /**
   * Extract pronunciation patterns
   * @param {Array} content - Content array
   * @returns {Object} Pronunciation patterns object
   */
  async extractPronunciationPatterns(content) {
    const itemsWithPronunciation = content.filter(item =>
      item.pronunciation_guide && item.pronunciation_guide.length > 0
    );

    if (itemsWithPronunciation.length === 0) {
      return { patterns_found: false, reason: 'No pronunciation data available' };
    }

    console.log(`🗣️ Analyzing ${itemsWithPronunciation.length} pronunciation guides`);

    // Basic pattern analysis without LLM for now
    const patterns = {
      stressed_syllables: [],
      common_sounds: [],
      difficult_sounds_for_english: [],
      rhythm_patterns: []
    };

    return patterns;
  }

  /**
   * Group content into pedagogically coherent lessons using intelligent linguistic rules
   * @param {Array} content - Content array
   * @param {Object} patterns - Extracted patterns object (now used for reference only)
   * @returns {Array} Array of content groups for lessons
   */
  async groupContentPedagogically(content, patterns) {
    console.log(`📚 Grouping ${content.length} items using intelligent linguistic rules`);

    const groups = [];

    // 1. NUMBERS: Use deterministic linguistic rules instead of LLM guessing
    const numberGroups = this.createIntelligentNumberGroups(content);
    groups.push(...numberGroups);

    // 2. DAYS & TIME: Separate time concepts from numbers
    const timeGroups = this.createTimeAndDayGroups(content);
    groups.push(...timeGroups);

    // 3. REMAINING CONTENT: Group by semantic category
    const usedContent = [...numberGroups, ...timeGroups].flatMap(g => g.content);
    const remainingContent = content.filter(item => !usedContent.includes(item));
    const categoryGroups = this.createCategoryGroups(remainingContent);
    groups.push(...categoryGroups);

    console.log(`📚 Created ${groups.length} pedagogical groups`);

    // 4. PRIORITIZE FOUNDATION CONTENT: Ensure Numbers 1-10 always comes first
    const prioritizedGroups = this.prioritizeFoundationContent(groups);
    console.log(`🎯 Reordered groups with foundation content first`);

    return prioritizedGroups;
  }

  /**
   * Prioritize foundation content to ensure proper learning progression
   */
  prioritizeFoundationContent(groups) {
    // Define priority order for pedagogical progression
    const priorityOrder = [
      'Albanian Numbers: 1-10',        // Foundation - absolute first
      'Albanian Numbers: 11-20',       // Building on foundation
      'Albanian Days of the Week',     // Basic vocabulary
      'Albanian Time Expressions',     // Practical usage
      'Albanian Day Expressions',      // Sentence construction
      'Albanian Questions',            // Interactive skills
      'Albanian General Vocabulary'    // Supporting vocabulary
    ];

    // Sort groups based on priority, with fallback to original order
    const sortedGroups = groups.sort((a, b) => {
      const priorityA = priorityOrder.indexOf(a.theme);
      const priorityB = priorityOrder.indexOf(b.theme);

      // If both are in priority list, sort by priority
      if (priorityA !== -1 && priorityB !== -1) {
        return priorityA - priorityB;
      }

      // If only one is in priority list, prioritized one comes first
      if (priorityA !== -1) return -1;
      if (priorityB !== -1) return 1;

      // If neither is in priority list, maintain original order
      return 0;
    });

    // Ensure Numbers 1-10 has correct prerequisites and difficulty
    const numbers1to10 = sortedGroups.find(g => g.theme === 'Albanian Numbers: 1-10');
    if (numbers1to10) {
      numbers1to10.difficulty = 1;
      numbers1to10.prerequisites = [];
      numbers1to10.pattern_focus = 'foundation';
    }

    return sortedGroups;
  }

  /**
   * Create intelligent number groups with proper sequencing and deduplication
   */
  createIntelligentNumberGroups(content) {
    const groups = [];

    // Define number vocabularies with explicit mappings for precise matching
    const basicNumbers = {
      'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
      'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
    };

    const teenNumbers = {
      'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
      'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19, 'twenty': 20
    };

    // Extract and deduplicate numbers 1-10 with proper sequencing
    const numbers1to10 = this.extractAndSortNumbers(content, basicNumbers);
    if (numbers1to10.length > 0) {
      console.log(`📊 Created number group "1-10" with ${numbers1to10.length} items:`);
      numbers1to10.slice(0, 5).forEach(item => {
        console.log(`   - "${item.english_phrase}" → "${item.target_phrase}"`);
      });

      groups.push({
        group_id: groups.length + 1,
        theme: `Albanian Numbers: 1-10`,
        description: `Master basic Albanian numbers 1-10 with proper sequencing`,
        difficulty: 1,
        pattern_focus: 'foundation',
        content: numbers1to10,
        content_ids: numbers1to10.map(c => c.id),
        prerequisites: [],
        estimated_items: numbers1to10.length,
        learning_objectives: [
          `Learn Albanian numbers 1-10 in correct order`,
          `Recognize number patterns in Albanian`,
          `Use basic numbers in everyday contexts`
        ]
      });
    }

    // Extract and deduplicate numbers 11-20 with proper sequencing
    const numbers11to20 = this.extractAndSortNumbers(content, teenNumbers);
    if (numbers11to20.length > 0) {
      console.log(`📊 Created number group "11-20" with ${numbers11to20.length} items:`);
      numbers11to20.slice(0, 5).forEach(item => {
        console.log(`   - "${item.english_phrase}" → "${item.target_phrase}"`);
      });

      groups.push({
        group_id: groups.length + 1,
        theme: `Albanian Numbers: 11-20`,
        description: `Learn compound Albanian numbers 11-20 and formation patterns`,
        difficulty: 2,
        pattern_focus: 'patterns',
        content: numbers11to20,
        content_ids: numbers11to20.map(c => c.id),
        prerequisites: ['Numbers: 1-10'],
        estimated_items: numbers11to20.length,
        learning_objectives: [
          `Master Albanian numbers 11-20`,
          `Understand compound number formation (10 + units)`,
          `Apply number patterns to new vocabulary`
        ]
      });
    }

    return groups;
  }

  /**
   * Extract and sort numbers using deterministic linguistic rules
   */
  extractAndSortNumbers(content, numberMap) {
    // Find all content matching the number words (exact matches only)
    const numberContent = content.filter(item => {
      const english = item.english_phrase.toLowerCase().trim();
      return numberMap.hasOwnProperty(english) && !this.isTimeExpression(item.english_phrase);
    });

    // Deduplicate by keeping the first occurrence of each number
    const deduplicatedNumbers = [];
    const seenNumbers = new Set();

    for (const item of numberContent) {
      const english = item.english_phrase.toLowerCase().trim();
      if (!seenNumbers.has(english)) {
        seenNumbers.add(english);
        deduplicatedNumbers.push(item);
      }
    }

    // Sort numerically using the number map (1,2,3... not random order)
    return deduplicatedNumbers.sort((a, b) => {
      const numA = numberMap[a.english_phrase.toLowerCase().trim()];
      const numB = numberMap[b.english_phrase.toLowerCase().trim()];
      return numA - numB;
    });
  }

  /**
   * Check if a phrase is a time expression rather than a pure number
   */
  isTimeExpression(phrase) {
    return /o'clock|past|quarter|half|time|morning|afternoon|evening|hour|minute/.test(phrase.toLowerCase());
  }

  /**
   * Create time and day-related groups
   */
  createTimeAndDayGroups(content) {
    const groups = [];

    // Days of the week - extract pure day names only, sorted chronologically
    const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const pureDayContent = content.filter(item => {
      const phrase = item.english_phrase.toLowerCase().trim();
      // Only pure day names, not sentences like "Today is Monday"
      return dayOrder.includes(phrase) && !phrase.includes(' ');
    });

    // Sort days chronologically (Monday → Sunday)
    const sortedDayContent = pureDayContent.sort((a, b) => {
      const dayA = dayOrder.indexOf(a.english_phrase.toLowerCase().trim());
      const dayB = dayOrder.indexOf(b.english_phrase.toLowerCase().trim());
      return dayA - dayB;
    });

    if (sortedDayContent.length > 0) {
      groups.push({
        group_id: groups.length + 1,
        theme: `Albanian Days of the Week`,
        description: `Learn pure day names in chronological order`,
        difficulty: 1,
        pattern_focus: 'vocabulary_building',
        content: sortedDayContent,
        content_ids: sortedDayContent.map(c => c.id),
        prerequisites: [],
        estimated_items: sortedDayContent.length,
        learning_objectives: [
          `Master Albanian days of the week`,
          `Use day names in practical contexts`,
          `Understand Albanian calendar expressions`
        ]
      });
    }

    // Day-related sentences (separate from pure day names)
    const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const daySentenceContent = content.filter(item => {
      const phrase = item.english_phrase.toLowerCase();
      return dayNames.some(day => phrase.includes(day)) && phrase.includes(' ') &&
             !this.isTimeExpression(item.english_phrase);
    });

    if (daySentenceContent.length > 0) {
      groups.push({
        group_id: groups.length + 1,
        theme: `Albanian Day Expressions`,
        description: `Learn to use day names in sentences and expressions`,
        difficulty: 2,
        pattern_focus: 'vocabulary_building',
        content: daySentenceContent,
        content_ids: daySentenceContent.map(c => c.id),
        prerequisites: ['Days of the Week'],
        estimated_items: daySentenceContent.length,
        learning_objectives: [
          `Use day names in complete sentences`,
          `Express when things happen`,
          `Talk about past, present, and future days`
        ]
      });
    }

    // Time expressions (o'clock, quarter past, etc.)
    const timeContent = content.filter(item =>
      this.isTimeExpression(item.english_phrase) && !dayNames.some(day => item.english_phrase.toLowerCase().includes(day))
    );

    if (timeContent.length > 0) {
      groups.push({
        group_id: groups.length + 1,
        theme: `Albanian Time Expressions`,
        description: `Learn to tell time in Albanian`,
        difficulty: 2,
        pattern_focus: 'vocabulary_building',
        content: timeContent,
        content_ids: timeContent.map(c => c.id),
        prerequisites: ['Numbers: 1-10', 'Numbers: 11-20'],
        estimated_items: timeContent.length,
        learning_objectives: [
          `Tell time in Albanian`,
          `Use time expressions in conversation`,
          `Understand time-related vocabulary`
        ]
      });
    }

    return groups;
  }

  /**
   * Create groups for remaining content by semantic category
   */
  createCategoryGroups(remainingContent) {
    const groups = [];

    if (remainingContent.length === 0) return groups;

    // Group remaining content by type or create general vocabulary group
    const questionsContent = remainingContent.filter(item =>
      item.english_phrase.toLowerCase().includes('what') ||
      item.english_phrase.toLowerCase().includes('how') ||
      item.english_phrase.toLowerCase().includes('?')
    );

    if (questionsContent.length > 0) {
      groups.push({
        group_id: groups.length + 1,
        theme: `Albanian Questions`,
        description: `Learn to ask and answer questions in Albanian`,
        difficulty: 2,
        pattern_focus: 'vocabulary_building',
        content: questionsContent,
        content_ids: questionsContent.map(c => c.id),
        prerequisites: [],
        estimated_items: questionsContent.length,
        learning_objectives: [
          `Form questions in Albanian`,
          `Understand question patterns`,
          `Respond appropriately to common questions`
        ]
      });
    }

    // Remaining general vocabulary
    const usedInQuestions = questionsContent;
    const generalContent = remainingContent.filter(item => !usedInQuestions.includes(item));

    if (generalContent.length > 0) {
      groups.push({
        group_id: groups.length + 1,
        theme: `Albanian General Vocabulary`,
        description: `Essential Albanian vocabulary for daily communication`,
        difficulty: 1,
        pattern_focus: 'vocabulary_building',
        content: generalContent,
        content_ids: generalContent.map(c => c.id),
        prerequisites: [],
        estimated_items: generalContent.length,
        learning_objectives: [
          `Master essential Albanian vocabulary`,
          `Use vocabulary in practical contexts`,
          `Build foundation for advanced lessons`
        ]
      });
    }

    return groups;
  }

  /**
   * Generate human-readable pattern summary for LLM prompts
   * @param {Object} patterns - Extracted patterns object
   * @returns {string} Formatted pattern summary
   */
  generatePatternSummary(patterns) {
    let summary = "LINGUISTIC PATTERNS IDENTIFIED:\n\n";

    if (patterns.numbers.patterns_found !== false) {
      summary += "NUMBERS:\n";
      if (patterns.numbers.unique_numbers) {
        summary += `- Basic numbers (${patterns.numbers.unique_numbers.range}): Foundation level\n`;
      }
      if (patterns.numbers.pattern_based) {
        Object.entries(patterns.numbers.pattern_based).forEach(([type, data]) => {
          summary += `- ${type}: ${data.pattern} (${data.examples?.length || 0} examples)\n`;
        });
      }
      summary += "\n";
    }

    if (patterns.verbs.patterns_found !== false) {
      summary += "VERBS:\n";
      if (patterns.verbs.conjugation_patterns?.regular) {
        Object.entries(patterns.verbs.conjugation_patterns.regular).forEach(([group, data]) => {
          summary += `- ${group}: ${data.ending} ending (${data.examples?.length || 0} examples)\n`;
        });
      }
      if (patterns.verbs.conjugation_patterns?.irregular) {
        summary += `- Irregular verbs: ${patterns.verbs.conjugation_patterns.irregular.length} identified\n`;
      }
      summary += "\n";
    }

    if (patterns.grammar.word_order) {
      summary += "GRAMMAR:\n";
      summary += `- Word order: ${patterns.grammar.word_order.pattern}\n`;
      if (patterns.grammar.case_patterns) {
        summary += `- Cases identified: ${Object.keys(patterns.grammar.case_patterns).join(', ')}\n`;
      }
      summary += "\n";
    }

    return summary;
  }

  // Helper methods for pattern matching and grouping

  matchesNumberRange(phrase, range) {
    // Albanian numbers 1-10: një, dy, tre, katër, pesë, gjashtë, shtatë, tetë, nëntë, dhjetë
    const basicNumbers = ['një', 'dy', 'tre', 'katër', 'pesë', 'gjashtë', 'shtatë', 'tetë', 'nëntë', 'dhjetë'];

    // English numbers 1-10
    const basicEnglish = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];

    // Albanian numbers 11-20: njëmbëdhjetë, dymbëdhjetë, etc.
    const teenNumbers = [
      'njëmbëdhjetë', 'dymbëdhjetë', 'trembëdhjetë', 'katërmbëdhjetë',
      'pesëmbëdhjetë', 'gjashtëmbëdhjetë', 'shtatëmbëdhjetë', 'tetëmbëdhjetë',
      'nëntëmbëdhjetë', 'njëzet'
    ];

    // English numbers 11-20
    const teenEnglish = [
      'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen',
      'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'
    ];

    // Normalize phrase for comparison
    const normalizedPhrase = phrase.toLowerCase().trim();

    if (range === '1-10') {
      // Check for exact numbers 1-10 in both Albanian and English
      const matchesBasicAlbanian = basicNumbers.some(num => {
        const regex = new RegExp(`\\b${num.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
        return regex.test(normalizedPhrase);
      });

      const matchesBasicEnglish = basicEnglish.some(num => {
        const regex = new RegExp(`\\b${num}\\b`, 'i');
        return regex.test(normalizedPhrase);
      });

      // Also check for digits 1-10
      const matchesDigits = /\b[1-9]|10\b/.test(normalizedPhrase);

      // Exclude teens that might contain these patterns
      const isNotTeen = !teenNumbers.some(teen => normalizedPhrase.includes(teen)) &&
                        !teenEnglish.some(teen => normalizedPhrase.includes(teen));

      return (matchesBasicAlbanian || matchesBasicEnglish || matchesDigits) && isNotTeen;
    }

    if (range === '11-20') {
      // Match teen numbers in Albanian or English
      const matchesTeenAlbanian = teenNumbers.some(num => normalizedPhrase.includes(num));
      const matchesTeenEnglish = teenEnglish.some(num => {
        const regex = new RegExp(`\\b${num}\\b`, 'i');
        return regex.test(normalizedPhrase);
      });

      // Also check for digits 11-20
      const matchesTeenDigits = /\b(1[1-9]|20)\b/.test(normalizedPhrase);

      return matchesTeenAlbanian || matchesTeenEnglish || matchesTeenDigits;
    }

    if (range === '21-100') {
      // Match higher numbers
      return /\b(2[1-9]|[3-9][0-9]|100)\b/.test(normalizedPhrase) ||
             normalizedPhrase.includes('zet') || // for 20, 30, etc.
             normalizedPhrase.includes('qind'); // for hundreds
    }

    return false;
  }

  sortNumberContent(content, range) {
    // Define proper number ordering
    const numberOrder = {
      'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
      'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
      'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14,
      'fifteen': 15, 'sixteen': 16, 'seventeen': 17, 'eighteen': 18,
      'nineteen': 19, 'twenty': 20
    };

    const albanianToNumber = {
      'një': 1, 'dy': 2, 'tre': 3, 'katër': 4, 'pesë': 5,
      'gjashtë': 6, 'shtatë': 7, 'tetë': 8, 'nëntë': 9, 'dhjetë': 10,
      'njëmbëdhjetë': 11, 'dymbëdhjetë': 12, 'trembëdhjetë': 13,
      'katërmbëdhjetë': 14, 'pesëmbëdhjetë': 15, 'gjashtëmbëdhjetë': 16,
      'shtatëmbëdhjetë': 17, 'tetëmbëdhjetë': 18, 'nëntëmbëdhjetë': 19,
      'njëzet': 20
    };

    return content.sort((a, b) => {
      // Try to extract number from english phrase
      const englishA = a.english_phrase.toLowerCase();
      const englishB = b.english_phrase.toLowerCase();

      // Extract number words
      const numA = Object.keys(numberOrder).find(num => englishA.includes(num));
      const numB = Object.keys(numberOrder).find(num => englishB.includes(num));

      if (numA && numB) {
        return numberOrder[numA] - numberOrder[numB];
      }

      // Try Albanian numbers
      const albanianA = a.target_phrase.toLowerCase();
      const albanianB = b.target_phrase.toLowerCase();

      const albNumA = Object.keys(albanianToNumber).find(num => albanianA.includes(num));
      const albNumB = Object.keys(albanianToNumber).find(num => albanianB.includes(num));

      if (albNumA && albNumB) {
        return albanianToNumber[albNumA] - albanianToNumber[albNumB];
      }

      // Fall back to alphabetical
      return a.english_phrase.localeCompare(b.english_phrase);
    });
  }

  matchesVerbGroup(phrase, verbGroup) {
    if (verbGroup.group === 'essential_irregular') {
      const irregularVerbs = ['jam', 'kam', 'them', 'vij'];
      return irregularVerbs.some(verb => phrase.includes(verb));
    }
    if (verbGroup.group === 'regular_first_conjugation') {
      return phrase.endsWith('oj') || phrase.endsWith('on');
    }
    return false;
  }

  groupByGrammarCategory(content) {
    const categoryMap = new Map();

    content.forEach(item => {
      const category = item.grammar_category || 'general';
      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }
      categoryMap.get(category).push(item);
    });

    return Array.from(categoryMap.entries()).map(([category, items], index) => ({
      group_id: `category_${index + 1}`,
      theme: `Albanian ${category.charAt(0).toUpperCase() + category.slice(1)}`,
      description: `Essential ${category} for Albanian communication`,
      difficulty: this.estimateDifficulty(items),
      pattern_focus: 'vocabulary_building',
      content: items,
      content_ids: items.map(c => c.id),
      prerequisites: [],
      estimated_items: items.length,
      learning_objectives: [
        `Master essential ${category} vocabulary`,
        `Use ${category} in practical contexts`,
        `Recognize patterns in ${category}`
      ]
    }));
  }

  estimateDifficulty(items) {
    const avgLength = items.reduce((sum, item) => sum + item.target_phrase.length, 0) / items.length;
    if (avgLength <= 10) return 1;
    if (avgLength <= 20) return 2;
    if (avgLength <= 30) return 3;
    return 4;
  }

  calculateDifficultyProgression(contentGroups) {
    return contentGroups.map(group => ({
      group_id: group.group_id,
      difficulty: group.difficulty,
      prerequisites: group.prerequisites,
      suggested_order: contentGroups.indexOf(group) + 1
    }));
  }

  analyzeContentTypes(content) {
    const types = {};
    content.forEach(item => {
      const type = item.word_type || 'unknown';
      types[type] = (types[type] || 0) + 1;
    });
    return types;
  }

  // Fallback methods for when LLM calls fail

  fallbackNumberPatterns(numberContent) {
    return {
      fallback: true,
      unique_numbers: { range: "1-10", items: numberContent.slice(0, 10) },
      suggested_grouping: [
        { range: "1-10", lesson_num: 1, difficulty: 1, pedagogical_focus: "foundation" }
      ]
    };
  }

  fallbackVerbPatterns(verbContent) {
    return {
      fallback: true,
      suggested_grouping: [
        { group: "basic_verbs", verbs: verbContent, difficulty: 2 }
      ]
    };
  }

  fallbackGrammarPatterns(content) {
    return {
      fallback: true,
      word_order: { pattern: "SVO", examples: [] },
      pedagogical_sequence: [
        { concept: "basic_grammar", difficulty: 1, prerequisite: null }
      ]
    };
  }

  // Utility methods

  /**
   * Clean LLM response to extract valid JSON
   * @param {string} response - Raw LLM response
   * @returns {string} Cleaned JSON string
   */
  cleanJsonResponse(response) {
    let cleaned = response.trim();

    // Remove markdown code blocks
    cleaned = cleaned.replace(/```json\s*\n?/gi, '');
    cleaned = cleaned.replace(/```\s*$/gi, '');
    cleaned = cleaned.replace(/^```\s*/gi, '');

    // Remove any leading/trailing text that's not part of JSON
    const jsonStart = cleaned.indexOf('{');
    const jsonEnd = cleaned.lastIndexOf('}');

    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
    }

    // Handle common LLM formatting issues
    cleaned = cleaned.replace(/\n\s*/g, ' '); // Remove extra whitespace
    cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1'); // Remove trailing commas

    return cleaned;
  }

  getProcessingStats() {
    return {
      ...this.processingStats,
      cacheSize: this.analysisCache.size
    };
  }

  clearCache() {
    this.analysisCache.clear();
    console.log('🧹 Pattern analysis cache cleared');
  }
}

module.exports = { PatternAnalyzer };