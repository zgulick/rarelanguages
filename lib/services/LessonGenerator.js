/**
 * LLM-Powered Lesson Generator Service
 * Takes cleaned raw content and generates pedagogically structured lessons
 *
 * Pipeline: Raw Content DB → Lesson Generator → Processed Lessons DB → API → UI
 */

import { OpenAIClient } from '../openai.js';
import { query, transaction } from '../database.js';
import { PatternAnalyzer } from './PatternAnalyzer.js';
import { LessonGeneratorV2 } from './LessonGeneratorV2.js';

class LessonGenerator {
  constructor() {
    this.openaiClient = new OpenAIClient();
    this.patternAnalyzer = new PatternAnalyzer(); // 🧠 Add pattern intelligence!
    this.lessonGeneratorV2 = new LessonGeneratorV2(); // 🔤 Add Grammar Engine integration!
    this.processingStatus = {
      totalLessons: 0,
      processedLessons: 0,
      errors: [],
      startTime: null
    };
  }

  /**
   * Main entry point: Generate lessons for a specific skill
   */
  async generateLessonsForSkill(skillId, options = {}) {
    console.log(`🎓 Starting lesson generation for skill: ${skillId}`);
    this.processingStatus.startTime = new Date();

    try {
      // 1. Analyze content patterns using AI linguistics intelligence 🧠
      console.log(`🔍 Running pattern analysis for skill: ${skillId}`);
      const patternAnalysis = await this.patternAnalyzer.analyzeContentForSkill(skillId);
      console.log(`📊 Analyzed ${patternAnalysis.total_items} content items`);
      console.log(`🎯 Found patterns: ${Object.keys(patternAnalysis.patterns).join(', ')}`);

      // 2. Use intelligent pattern-based grouping instead of basic grouping
      const contentGroups = patternAnalysis.content_groups;
      console.log(`📚 Created ${contentGroups.length} intelligent lesson groups using pattern analysis`);

      // 3. Generate lessons using HYBRID approach (LLM with reliable fallback)
      const generatedLessons = [];
      for (const [index, group] of contentGroups.entries()) {
        console.log(`📝 Generating hybrid lesson: ${group.theme}`);
        const lesson = await this.generateHybridLesson(group, skillId, index + 1);
        generatedLessons.push(lesson);
        this.processingStatus.processedLessons++;
      }

      // 4. Store processed lessons in database
      await this.storeProcessedLessons(generatedLessons, skillId);

      console.log(`✅ Generated ${generatedLessons.length} pattern-enhanced lessons for skill ${skillId}`);
      return {
        success: true,
        lessonsGenerated: generatedLessons.length,
        processingTime: Date.now() - this.processingStatus.startTime,
        costSummary: this.openaiClient.getCostSummary(),
        patternAnalysisSummary: patternAnalysis.pattern_summary,
        patternsFound: Object.keys(patternAnalysis.patterns),
        contentGroupsCreated: contentGroups.length,
        patternAnalysisMetadata: patternAnalysis.analysis_metadata
      };

    } catch (error) {
      console.error('❌ Lesson generation failed:', error);
      throw error;
    }
  }

  /**
   * Fetch cleaned raw content for a skill
   */
  async fetchRawContentForSkill(skillId) {
    const contentQuery = `
      SELECT
        lc.*,
        l.name as lesson_name,
        l.difficulty_level,
        s.name as skill_name,
        co.level as course_level
      FROM lesson_content lc
      JOIN lessons l ON lc.lesson_id = l.id
      JOIN skills s ON l.skill_id = s.id
      JOIN course_skills cs ON s.id = cs.skill_id
      JOIN courses co ON cs.course_id = co.id
      WHERE s.id = $1
      AND lc.word_type IS NOT NULL
      AND lc.grammar_category IS NOT NULL
      ORDER BY l.difficulty_level, lc.content_order
    `;

    const result = await query(contentQuery, [skillId]);
    return result.rows;
  }

  /**
   * Group content into pedagogically coherent themes
   */
  async groupContentPedagogically(rawContent) {
    const prompt = `Analyze this language learning content and group it into 3-5 pedagogically coherent lesson themes.

Content items:
${rawContent.map((item, i) => `${i+1}. "${item.english_phrase}" → "${item.target_phrase}" (${item.word_type}, ${item.grammar_category})`).join('\n')}

Instructions:
- Group items that teach related concepts together
- Each group should have 5-15 content items
- Focus on pedagogical progression (simple → complex)
- Consider grammar patterns, vocabulary themes, and difficulty
- Create logical learning units that build on each other

Return JSON format:
{
  "lesson_groups": [
    {
      "theme": "Clear theme name",
      "description": "What students will learn",
      "difficulty_level": 1-5,
      "content_ids": [array of content IDs from the list],
      "learning_objectives": ["objective 1", "objective 2"],
      "pedagogical_focus": "grammar/vocabulary/conversation/etc"
    }
  ]
}`;

    const messages = [
      {
        role: 'system',
        content: 'You are an expert language pedagogy specialist. Create logical, progressive lesson groupings that optimize learning.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    const response = await this.openaiClient.makeRequest(messages, 'content_grouping');

    // Clean up the response content - remove code fences if present
    let cleanContent = response.content.trim();
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }

    const groupingData = JSON.parse(cleanContent);

    // Map content IDs back to actual content objects
    return groupingData.lesson_groups.map(group => ({
      ...group,
      content: group.content_ids.map(id => rawContent[id - 1]).filter(Boolean)
    }));
  }

  /**
   * Generate a pattern-enhanced lesson with linguistic intelligence
   */
  async generatePatternEnhancedLesson(contentGroup, skillId, patternAnalysis) {
    console.log(`📝 Generating pattern-enhanced lesson: ${contentGroup.theme}`);

    const prompt = `Create a TEXTBOOK-QUALITY Albanian language lesson using advanced pattern analysis.

LESSON GROUP DETAILS:
Theme: ${contentGroup.theme}
Description: ${contentGroup.description}
Focus: ${contentGroup.pattern_focus}
Difficulty: ${contentGroup.difficulty}/5

LINGUISTIC PATTERNS DETECTED:
${patternAnalysis.pattern_summary}

CONTENT ITEMS TO TEACH:
${contentGroup.content.map(item => `- "${item.english_phrase}" → "${item.target_phrase}" (${item.word_type})`).join('\n')}

Create a COMPREHENSIVE TEXTBOOK LESSON with these enhanced sections:

1. LESSON OVERVIEW:
   - Clear title reflecting pattern focus
   - Specific learning objectives based on detected patterns
   - Prerequisites from pattern analysis
   - Estimated completion time (15-20 minutes)

2. PATTERN INTRODUCTION:
   - Explicitly explain the Albanian patterns detected
   - "Notice how..." pattern recognition exercises
   - Connect to patterns students may know from English

3. VOCABULARY SECTION:
   - Present vocabulary using pattern groupings
   - Full pronunciation guides for every word
   - Etymology and memory aids where relevant
   - Visual/contextual descriptions

4. GRAMMAR DEEP DIVE:
   - Focus on the specific patterns identified
   - Conjugation tables for verbs (if relevant)
   - Clear rule formulations with examples
   - Common mistakes and how to avoid them

5. PROGRESSIVE PRACTICE:
   - Recognition exercises (identify patterns)
   - Guided production (fill-in-the-blank with patterns)
   - Free production (create your own examples)
   - Real-world application scenarios

6. CULTURAL CONTEXT:
   - When and how to use these patterns
   - Cultural notes about Albanian usage
   - Formal vs informal contexts

7. LESSON SUMMARY:
   - Key pattern takeaways
   - Quick reference guide
   - Self-assessment questions

Return enhanced structured JSON:
{
  "lesson": {
    "title": "Pattern-focused lesson title",
    "overview": {
      "learning_objectives": ["specific pattern-based objectives"],
      "difficulty_level": 1-5,
      "estimated_minutes": 15-20,
      "prerequisites": ["from pattern analysis"],
      "pattern_focus": ["key patterns being taught"]
    },
    "sections": [
      {
        "type": "pattern_introduction/vocabulary/grammar/practice/cultural/summary",
        "title": "Section title",
        "content": "Rich, detailed content with pattern explanations",
        "pattern_highlights": ["specific patterns covered"],
        "exercises": [
          {
            "type": "pattern_recognition/flashcard/multiple_choice/fill_blank/production",
            "instruction": "Clear, pattern-focused instruction",
            "items": [exercise items with pattern context],
            "pattern_teaching_point": "What pattern this teaches"
          }
        ]
      }
    ],
    "pattern_summary": {
      "main_patterns": ["patterns taught"],
      "pattern_rules": ["formulated rules"],
      "memorable_examples": ["key examples to remember"]
    },
    "assessment": {
      "formative": [pattern recognition quick checks],
      "summative": [comprehensive pattern usage exercise]
    },
    "cultural_notes": {
      "usage_contexts": ["when to use these patterns"],
      "formality_levels": ["formal vs informal usage"]
    }
  }
}`;

    const messages = [
      {
        role: 'system',
        content: 'You are an expert Albanian language pedagogue and textbook author. Create comprehensive, pattern-based lessons that feel like premium language textbooks. Use the linguistic pattern analysis provided to create lessons that teach patterns explicitly, helping students understand the "why" behind Albanian grammar. Make every lesson rich, engaging, and pedagogically progressive.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    const response = await this.openaiClient.makeRequest(messages, 'lesson_generation', {
      max_tokens: 6000,
      temperature: 0.4
    });

    // Use enhanced JSON cleaning with fallback
    let lessonData;
    try {
      const cleanContent = this.cleanJsonResponse(response.content);
      lessonData = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('❌ JSON parsing failed, attempting fallback generation:', parseError.message);
      console.log('Raw response (first 500 chars):', response.content.substring(0, 500));

      // Generate a fallback lesson structure
      lessonData = this.generateFallbackLesson(contentGroup, response.content);
    }

    return {
      ...lessonData.lesson,
      skill_id: skillId,
      source_content_ids: contentGroup.content_ids,
      pattern_analysis_used: {
        content_group_theme: contentGroup.theme,
        pattern_focus: contentGroup.pattern_focus,
        difficulty_level: contentGroup.difficulty,
        learning_objectives: contentGroup.learning_objectives,
        prerequisites: contentGroup.prerequisites
      },
      generated_at: new Date().toISOString(),
      generation_cost: response.cost
    };
  }

  /**
   * Generate hybrid lesson: Try LLM with strict validation, fallback to structured
   */
  async generateHybridLesson(contentGroup, skillId, lessonNumber) {
    console.log(`🤖 Attempting LLM lesson generation for: ${contentGroup.theme}`);

    try {
      // Try LLM generation with STRICT validation and low temperature
      const llmLesson = await this.generateLLMLessonWithStrictValidation(contentGroup, skillId, lessonNumber);

      if (llmLesson && this.validateLessonStructure(llmLesson)) {
        console.log(`✅ LLM generation successful for: ${contentGroup.theme}`);
        return llmLesson;
      } else {
        throw new Error('LLM lesson failed validation');
      }

    } catch (error) {
      console.log(`⚠️  LLM generation failed (${error.message}), using enhanced Grammar Engine fallback`);
      return this.generateEnhancedStructuredLesson(contentGroup, skillId, lessonNumber);
    }
  }

  /**
   * Generate lesson using LLM with strict JSON validation
   */
  async generateLLMLessonWithStrictValidation(contentGroup, skillId, lessonNumber) {
    // Use the language from the content to make it fully dynamic
    const language = this.detectLanguageFromContent(contentGroup.content);
    const culturalContext = this.detectCulturalContext(contentGroup.content);

    const prompt = `Create a pedagogical lesson for ${language} language learning.

CRITICAL REQUIREMENTS:
1. Return ONLY valid JSON - no markdown, no comments, no extra text
2. Use ONLY single integers for numeric values (example: "estimated_minutes": 15)
3. Temperature is low - be consistent and precise
4. Follow the exact JSON structure below

Content to teach: ${JSON.stringify(contentGroup.content.slice(0, 8), null, 2)}
Theme: ${contentGroup.theme}
Pattern Focus: ${contentGroup.pattern_focus || 'General vocabulary'}
Cultural Context: ${culturalContext}

Required JSON structure (return EXACTLY this format):
{
  "lesson_number": ${lessonNumber},
  "title": "Engaging lesson title",
  "overview": {
    "learning_objectives": ["specific objective 1", "specific objective 2", "specific objective 3"],
    "estimated_minutes": 15,
    "difficulty_level": 2,
    "prerequisites": ["prerequisite if needed"]
  },
  "sections": [
    {
      "type": "vocabulary",
      "title": "Vocabulary Section",
      "content": "Rich explanation with examples",
      "exercises": [
        {
          "type": "flashcard",
          "items": [{"front": "English", "back": "${language} translation"}]
        }
      ]
    },
    {
      "type": "grammar",
      "title": "Grammar Section",
      "content": "Clear grammar explanation",
      "exercises": []
    },
    {
      "type": "practice",
      "title": "Practice Section",
      "content": "Practice activities",
      "exercises": []
    }
  ],
  "assessment": {
    "type": "quick_check",
    "questions": ["assessment question"]
  }
}`;

    const messages = [{ role: 'user', content: prompt }];
    const response = await this.openaiClient.makeRequest(messages, 'hybrid_lesson_generation', {
      max_tokens: 2000,
      temperature: 0.1, // Very low for consistency
      response_format: { type: "json_object" } // Force JSON mode
    });

    // Strict JSON parsing with comprehensive validation
    return this.parseAndValidateJSON(response, contentGroup, skillId, lessonNumber);
  }

  /**
   * Parse JSON with comprehensive validation and cleaning
   */
  parseAndValidateJSON(response, contentGroup, skillId, lessonNumber) {
    try {
      let content = typeof response === 'object' && response.content ? response.content : response;

      if (typeof content !== 'string') {
        throw new Error('Response is not a string');
      }

      // Clean the response more aggressively
      let cleaned = content.trim();

      // Remove any markdown artifacts
      cleaned = cleaned.replace(/```json\s*|\s*```/g, '');

      // Fix common JSON issues BEFORE parsing
      cleaned = cleaned
        .replace(/,(\s*[}\]])/g, '$1') // trailing commas
        .replace(/:\s*"([^"]*\d+)\s*-\s*(\d+)([^"]*)"/g, ': "$1$3"') // ranges in quotes
        .replace(/:\s*(\d+)\s*-\s*(\d+)/g, ': $1') // numeric ranges
        .replace(/([{,]\s*\w+):/g, '"$1":') // unquoted keys
        .replace(/:\s*([^",{\[\s][^,}\]]*[^",}\]\s])/g, ': "$1"'); // unquoted values

      const parsed = JSON.parse(cleaned);

      // Add required fields that LLM might have missed
      const validatedLesson = {
        skill_id: skillId,
        lesson_number: lessonNumber,
        ...parsed,
        source_content_ids: contentGroup.content_ids,
        pattern_analysis_used: {
          content_group_theme: contentGroup.theme,
          pattern_focus: contentGroup.pattern_focus,
          difficulty_level: contentGroup.difficulty
        },
        generated_at: new Date().toISOString(),
        generation_cost: response.cost || 0
      };

      return validatedLesson;

    } catch (error) {
      console.error(`❌ JSON parsing failed: ${error.message}`);
      throw new Error(`JSON parsing failed: ${error.message}`);
    }
  }

  /**
   * Validate lesson structure
   */
  validateLessonStructure(lesson) {
    const required = ['title', 'overview', 'sections'];
    const hasRequired = required.every(field => lesson[field]);

    const hasValidOverview = lesson.overview &&
      Array.isArray(lesson.overview.learning_objectives) &&
      typeof lesson.overview.estimated_minutes === 'number' &&
      typeof lesson.overview.difficulty_level === 'number';

    const hasValidSections = lesson.sections &&
      Array.isArray(lesson.sections) &&
      lesson.sections.length > 0;

    return hasRequired && hasValidOverview && hasValidSections;
  }

  /**
   * Detect language from content dynamically (zero hardcoding)
   */
  detectLanguageFromContent(content) {
    if (!content || content.length === 0) return 'target language';

    // Look for language patterns in the target phrases
    const targetPhrases = content.map(item => item.target_phrase).join(' ').toLowerCase();

    // Albanian patterns
    if (targetPhrases.includes('një') || targetPhrases.includes('dy') || targetPhrases.includes('tre')) {
      return 'Albanian';
    }

    // Add other language detection patterns as needed
    // Spanish: uno, dos, tres
    // French: un, deux, trois
    // etc.

    return 'target language'; // Generic fallback
  }

  /**
   * Detect cultural context dynamically
   */
  detectCulturalContext(content) {
    if (!content || content.length === 0) return 'general context';

    const allText = content.map(item => `${item.english_phrase} ${item.target_phrase}`).join(' ').toLowerCase();

    // Albanian/Kosovo patterns
    if (allText.includes('albanian') || this.detectLanguageFromContent(content) === 'Albanian') {
      return 'Kosovo/Albanian culture';
    }

    return 'local cultural context';
  }

  /**
   * Generate enhanced structured lesson using LessonGeneratorV2 with Grammar Engine
   */
  async generateEnhancedStructuredLesson(contentGroup, skillId, lessonNumber) {
    console.log(`🔤 Creating enhanced lesson with Grammar Engine: ${contentGroup.theme}`);

    try {
      // Create lesson plan for LessonGeneratorV2
      const lessonPlan = {
        title: contentGroup.theme,
        lesson_number: lessonNumber,
        content_groups: [contentGroup],
        focus_patterns: [contentGroup.pattern_focus || 'vocabulary_building']
      };

      // Use LessonGeneratorV2 to generate lesson with Grammar Engine
      const enhancedLesson = await this.lessonGeneratorV2.generateCore(lessonPlan);

      // Convert to the format expected by the database
      const lesson = {
        lesson_number: lessonNumber,
        title: contentGroup.theme,
        overview: enhancedLesson.content.overview || {
          learning_objectives: contentGroup.learning_objectives || [
            `Master ${contentGroup.theme.toLowerCase()}`,
            `Build confidence with practical usage`
          ],
          difficulty_level: contentGroup.difficulty || 1,
          estimated_minutes: 15
        },
        sections: this.convertEnhancedSections(enhancedLesson.content),
        assessment: {
          exercises: enhancedLesson.content.exercises || [],
          passing_score: 0.7
        },
        source_content_ids: contentGroup.content_ids || [],
        generated_at: new Date(),
        generation_cost: 0.01,
        pattern_analysis_used: {
          pattern_focus: contentGroup.pattern_focus,
          grammar_engine_used: true,
          verb_conjugations: enhancedLesson.content.grammar?.conjugations?.length || 0
        }
      };

      console.log(`✅ Enhanced lesson generated with ${lesson.pattern_analysis_used.verb_conjugations} verb conjugations`);
      return lesson;

    } catch (error) {
      console.error(`❌ Enhanced lesson generation failed: ${error.message}`);
      // Fall back to simple lesson if enhanced fails
      return this.generateSimpleStructuredLesson(contentGroup, skillId, lessonNumber);
    }
  }

  /**
   * Convert enhanced lesson sections to database format
   */
  convertEnhancedSections(content) {
    const sections = [];

    // Add vocabulary section
    if (content.vocabulary) {
      // Convert structured vocabulary format to UI format
      const convertedWords = (content.vocabulary.words || []).map(word => ({
        id: word.id || `vocab_${Math.random().toString(36).substr(2, 9)}`,
        english_phrase: word.english,
        target_phrase: word.target,
        pronunciation: word.pronunciation, // Keep structured pronunciation object
        pronunciation_guide: word.pronunciation?.sounds_like || word.pronunciation?.ipa || '',
        memory_aid: word.memory_aid,
        usage_notes: word.usage_notes,
        example_sentence: word.example_sentence,
        related_words: word.related_words,
        word_type: 'vocabulary',
        difficulty_level: 1,
        content_type: 'vocabulary',
        cultural_context: null,
        grammar_notes: null,
        position: 0,
        verb_type: null,
        gender: null,
        stress_pattern: word.pronunciation?.stress || null,
        conjugation_data: null,
        grammar_category: null,
        difficulty_notes: null,
        usage_examples: word.example_sentence ? [
          {
            albanian: word.example_sentence.target,
            english: word.example_sentence.english
          }
        ] : null
      }));

      sections.push({
        type: 'vocabulary',
        title: 'Vocabulary',
        content: convertedWords,
        exercises: []
      });
    }

    // Add grammar section with conjugations
    if (content.grammar) {
      sections.push({
        type: 'grammar',
        title: 'Grammar & Conjugations',
        content: {
          focus: content.grammar.focus,
          explanation: content.grammar.explanation,
          conjugations: content.grammar.conjugations,
          rules: content.grammar.rules || []
        },
        exercises: content.grammar.exercises || []
      });
    }

    // Add pattern recognition section
    if (content.pattern_recognition) {
      sections.push({
        type: 'pattern_summary',
        title: 'Pattern Focus',
        content: content.pattern_recognition.patterns || [],
        exercises: content.pattern_recognition.pattern_exercises || []
      });
    }

    // Add exercises section
    if (content.exercises) {
      sections.push({
        type: 'practice',
        title: 'Practice',
        content: [],
        exercises: content.exercises
      });
    }

    return sections;
  }

  /**
   * Generate simple, structured lesson without complex JSON parsing
   */
  generateSimpleStructuredLesson(contentGroup, skillId, lessonNumber) {
    console.log(`📝 Creating simple structured lesson: ${contentGroup.theme}`);

    // Create lesson structure directly without LLM JSON parsing
    const lesson = {
      skill_id: skillId,
      lesson_number: lessonNumber,
      title: contentGroup.theme,
      overview: {
        learning_objectives: contentGroup.learning_objectives || [
          `Learn ${contentGroup.theme.toLowerCase()}`,
          `Practice Albanian vocabulary`,
          `Apply in practical contexts`
        ],
        difficulty_level: contentGroup.difficulty || 1,
        estimated_minutes: 15,
        prerequisites: contentGroup.prerequisites || [],
        key_takeaways: [
          `Master ${contentGroup.theme.toLowerCase()}`,
          `Build confidence with Albanian`
        ]
      },
      sections: this.createSimpleSections(contentGroup),
      assessment: {
        exercises: [],
        passing_score: 0.7
      },
      source_content_ids: contentGroup.content_ids || [],
      generated_at: new Date(),
      generation_cost: 0.01 // Minimal cost for simple generation
    };

    return lesson;
  }

  /**
   * Create simple lesson sections from content group
   */
  createSimpleSections(contentGroup) {
    const sections = [];

    // Vocabulary section
    if (contentGroup.content && contentGroup.content.length > 0) {
      sections.push({
        type: 'vocabulary',
        title: 'Vocabulary',
        content: contentGroup.content.map(item => ({
          english: item.english_phrase,
          albanian: item.target_phrase,
          pronunciation: item.pronunciation_guide || 'N/A'
        })),
        exercises: []
      });
    }

    // Pattern section - show middle items to avoid repetition
    if (contentGroup.content && contentGroup.content.length > 3) {
      const startIdx = Math.floor(contentGroup.content.length / 3);
      sections.push({
        type: 'pattern_summary',
        title: `Pattern Focus: ${contentGroup.pattern_focus}`,
        content: contentGroup.content.slice(startIdx, startIdx + 3).map(item => ({
          english: item.english_phrase,
          albanian: item.target_phrase,
          pronunciation: item.pronunciation_guide || 'N/A'
        }))
      });
    }

    // Practice section - show last items for practice
    if (contentGroup.content && contentGroup.content.length > 2) {
      const practiceItems = contentGroup.content.slice(-3); // Last 3 items
      sections.push({
        type: 'practice',
        title: 'Practice',
        content: practiceItems.map(item => ({
          english: item.english_phrase,
          albanian: item.target_phrase,
          pronunciation: item.pronunciation_guide || 'N/A'
        })),
        exercises: [{
          type: 'recognition',
          instruction: 'Match the Albanian words with their English meanings',
          items: contentGroup.content ? contentGroup.content.slice(0, 5) : []
        }]
      });
    }

    return sections;
  }

  /**
   * Clear existing lessons for a skill to prevent duplicates
   */
  async clearExistingLessons(skillId) {
    console.log('🧹 Clearing existing lessons to prevent duplicates...');

    // Use CASCADE delete and also clear any orphaned records
    const deleteQueries = [
      'DELETE FROM processed_lessons WHERE skill_id = $1',
      'DELETE FROM processed_lessons WHERE skill_id = $1', // Second attempt in case of timing issues
    ];

    let totalCleared = 0;
    for (const deleteQuery of deleteQueries) {
      try {
        const result = await query(deleteQuery, [skillId]);
        totalCleared += result.rowCount;
        if (result.rowCount > 0) {
          console.log(`✅ Cleared ${result.rowCount} lessons`);
        }
      } catch (error) {
        console.log(`⚠️ Delete attempt: ${error.message}`);
      }
    }

    console.log(`✅ Total cleared: ${totalCleared} existing lessons`);
  }

  /**
   * Store processed lessons in new database table
   */
  async storeProcessedLessons(lessons, skillId) {
    console.log(`💾 Storing ${lessons.length} processed lessons`);

    // First, create the processed lessons table if it doesn't exist
    await this.ensureProcessedLessonsTable();

    // Clear existing lessons to prevent constraint violations
    await this.clearExistingLessons(skillId);

    const insertQueries = lessons.map(lesson => ({
      text: `
        INSERT INTO processed_lessons (
          skill_id, title, overview, sections, assessment,
          source_content_ids, generated_at, generation_cost, lesson_number
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `,
      params: [
        skillId,
        lesson.title,
        JSON.stringify(lesson.overview),
        JSON.stringify(lesson.sections),
        JSON.stringify(lesson.assessment),
        lesson.source_content_ids,
        lesson.generated_at,
        lesson.generation_cost,
        lesson.lesson_number // ← Add the lesson_number!
      ]
    }));

    const results = await transaction(insertQueries);
    console.log(`✅ Stored ${results.length} processed lessons`);
    return results;
  }

  /**
   * Ensure processed lessons table exists
   */
  async ensureProcessedLessonsTable() {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS processed_lessons (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        overview JSONB NOT NULL,
        sections JSONB NOT NULL,
        assessment JSONB NOT NULL,
        source_content_ids UUID[] NOT NULL,
        generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        generation_cost DECIMAL(10,6) DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_processed_lessons_skill_id ON processed_lessons(skill_id);
      CREATE INDEX IF NOT EXISTS idx_processed_lessons_active ON processed_lessons(is_active);
    `;

    await query(createTableQuery);
  }

  /**
   * Clean LLM response to extract valid JSON (enhanced version)
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

    // Enhanced JSON cleaning for common LLM issues
    cleaned = cleaned.replace(/\n\s*/g, ' '); // Remove extra whitespace
    cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1'); // Remove trailing commas

    // Fix common numeric range issues (like "15-20" should be 18)
    cleaned = cleaned.replace(/"estimated_minutes":\s*(\d+)-(\d+)/g, (match, min, max) => {
      const avg = Math.round((parseInt(min) + parseInt(max)) / 2);
      return `"estimated_minutes": ${avg}`;
    });

    // Fix other numeric range patterns
    cleaned = cleaned.replace(/"difficulty_level":\s*(\d+)-(\d+)/g, (match, min, max) => {
      const avg = Math.round((parseInt(min) + parseInt(max)) / 2);
      return `"difficulty_level": ${avg}`;
    });

    cleaned = cleaned.replace(/([{,]\s*)"([^"]+)"\s*:\s*"([^"]*)"([^",}\]]*)/g, (match, prefix, key, value, suffix) => {
      // Fix malformed string values
      const cleanSuffix = suffix.replace(/[^",}\]]/g, '');
      return `${prefix}"${key}": "${value}"${cleanSuffix}`;
    });

    // Fix specific JSON syntax issues
    cleaned = cleaned.replace(/([{,]\s*)"([^"]+)"\s*:\s*([^",}\]]+)([^,}\]]*)/g, (match, prefix, key, value, suffix) => {
      // Handle unquoted values that should be strings
      if (!value.match(/^(true|false|null|\d+|\[|\{)/)) {
        return `${prefix}"${key}": "${value.trim()}"${suffix}`;
      }
      return match;
    });

    return cleaned;
  }

  /**
   * Generate a fallback lesson when JSON parsing fails
   * @param {Object} contentGroup - The content group being processed
   * @param {string} rawResponse - The raw LLM response
   * @returns {Object} Fallback lesson structure
   */
  generateFallbackLesson(contentGroup, rawResponse) {
    console.log('🔄 Generating fallback lesson structure');

    return {
      lesson: {
        title: `${contentGroup.theme} - Pattern-Based Learning`,
        overview: {
          learning_objectives: contentGroup.learning_objectives || [
            `Master ${contentGroup.theme.toLowerCase()}`,
            "Understand Albanian patterns",
            "Practice in real contexts"
          ],
          difficulty_level: contentGroup.difficulty || 2,
          estimated_minutes: 15,
          prerequisites: contentGroup.prerequisites || [],
          pattern_focus: [contentGroup.pattern_focus || "vocabulary_building"]
        },
        sections: [
          {
            type: "pattern_introduction",
            title: "Pattern Introduction",
            content: `Welcome to ${contentGroup.theme}! In this lesson, we'll explore Albanian patterns and help you master this essential language skill.`,
            pattern_highlights: [contentGroup.pattern_focus || "basic_patterns"],
            exercises: []
          },
          {
            type: "vocabulary",
            title: "Core Vocabulary",
            content: `Let's learn the essential vocabulary for ${contentGroup.theme.toLowerCase()}.`,
            pattern_highlights: ["vocabulary_patterns"],
            exercises: contentGroup.content.slice(0, 5).map(item => ({
              type: "flashcard",
              instruction: `Learn: "${item.english_phrase}" in Albanian`,
              items: [{
                english: item.english_phrase,
                albanian: item.target_phrase,
                pronunciation: item.pronunciation_guide || ""
              }],
              pattern_teaching_point: "Basic vocabulary recognition"
            }))
          },
          {
            type: "practice",
            title: "Practice & Application",
            content: "Now let's practice using what you've learned in context.",
            pattern_highlights: ["application_patterns"],
            exercises: [{
              type: "multiple_choice",
              instruction: "Choose the correct Albanian translation",
              items: contentGroup.content.slice(0, 3).map(item => ({
                question: `How do you say "${item.english_phrase}" in Albanian?`,
                options: [item.target_phrase, "Option B", "Option C", "Option D"],
                correct: item.target_phrase
              })),
              pattern_teaching_point: "Pattern recognition in context"
            }]
          }
        ],
        pattern_summary: {
          main_patterns: [contentGroup.pattern_focus || "basic_patterns"],
          pattern_rules: [`Key patterns for ${contentGroup.theme}`],
          memorable_examples: contentGroup.content.slice(0, 3).map(item =>
            `"${item.english_phrase}" → "${item.target_phrase}"`
          )
        },
        assessment: {
          formative: ["Quick vocabulary checks", "Pattern recognition exercises"],
          summative: [`Complete ${contentGroup.theme} assessment`]
        },
        cultural_notes: {
          usage_contexts: [`When to use ${contentGroup.theme.toLowerCase()} in Albanian`],
          formality_levels: ["Appropriate for all contexts"]
        }
      }
    };
  }

  /**
   * Get processing status
   */
  getProcessingStatus() {
    return {
      ...this.processingStatus,
      elapsedTime: this.processingStatus.startTime ?
        Date.now() - this.processingStatus.startTime : 0,
      costSummary: this.openaiClient.getCostSummary()
    };
  }
}

export { LessonGenerator };