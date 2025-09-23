/**
 * LLM-Powered Lesson Generator Service
 * Takes cleaned raw content and generates pedagogically structured lessons
 *
 * Pipeline: Raw Content DB → Lesson Generator → Processed Lessons DB → API → UI
 */

const { OpenAIClient } = require('../openai');
const { query, transaction } = require('../database');

class LessonGenerator {
  constructor() {
    this.openaiClient = new OpenAIClient();
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
      // 1. Fetch raw content for this skill
      const rawContent = await this.fetchRawContentForSkill(skillId);
      console.log(`📊 Found ${rawContent.length} content items for skill`);

      // 2. Group content by pedagogical themes
      const contentGroups = await this.groupContentPedagogically(rawContent);
      console.log(`📚 Organized into ${contentGroups.length} lesson themes`);

      // 3. Generate lessons for each group
      const generatedLessons = [];
      for (const group of contentGroups) {
        try {
          const lesson = await this.generateSingleLesson(group, skillId);
          generatedLessons.push(lesson);
          this.processingStatus.processedLessons++;
        } catch (error) {
          console.error(`❌ Failed to generate lesson for group ${group.theme}:`, error.message);
          this.processingStatus.errors.push({
            group: group.theme,
            error: error.message
          });
        }
      }

      // 4. Store processed lessons in database
      await this.storeProcessedLessons(generatedLessons, skillId);

      console.log(`✅ Generated ${generatedLessons.length} lessons for skill ${skillId}`);
      return {
        success: true,
        lessonsGenerated: generatedLessons.length,
        processingTime: Date.now() - this.processingStatus.startTime,
        costSummary: this.openaiClient.getCostSummary()
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
   * Generate a single structured lesson from grouped content
   */
  async generateSingleLesson(contentGroup, skillId) {
    console.log(`📝 Generating lesson: ${contentGroup.theme}`);

    const prompt = `Create a complete, structured language lesson from this content group.

Theme: ${contentGroup.theme}
Description: ${contentGroup.description}
Focus: ${contentGroup.pedagogical_focus}

Content Items:
${contentGroup.content.map(item => `- "${item.english_phrase}" → "${item.target_phrase}" (${item.word_type})`).join('\n')}

Generate a complete lesson with these sections:

1. LESSON OVERVIEW:
   - Clear title and learning objectives
   - Prerequisites and difficulty level
   - Estimated completion time

2. VOCABULARY INTRODUCTION:
   - Present new vocabulary systematically
   - Include pronunciation guides
   - Group by semantic/grammatical relationships

3. GRAMMAR FOCUS:
   - Main grammar concept being taught
   - Clear explanations with examples
   - Progressive exercises (recognition → production)

4. PRACTICE ACTIVITIES:
   - Multiple exercise types for different learning styles
   - Scaffolded difficulty (guided → independent)
   - Real-world application scenarios

5. LESSON PROGRESSION:
   - Logical order of presentation
   - Build-up from simple to complex
   - Clear transitions between sections

Return structured JSON:
{
  "lesson": {
    "title": "Lesson title",
    "overview": {
      "learning_objectives": ["obj1", "obj2"],
      "difficulty_level": 1-5,
      "estimated_minutes": number,
      "prerequisites": ["prereq1", "prereq2"]
    },
    "sections": [
      {
        "type": "vocabulary_intro",
        "title": "Section title",
        "content": "Detailed content",
        "exercises": [
          {
            "type": "flashcard/multiple_choice/fill_blank",
            "instruction": "Clear instruction",
            "items": [exercise items]
          }
        ]
      }
    ],
    "assessment": {
      "formative": [quick check exercises],
      "summative": [lesson completion exercise]
    }
  }
}`;

    const messages = [
      {
        role: 'system',
        content: 'You are an expert language lesson designer. Create engaging, pedagogically sound lessons that optimize learning progression and retention.'
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

    // Clean up the response content - remove code fences if present
    let cleanContent = response.content.trim();
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }

    const lessonData = JSON.parse(cleanContent);

    return {
      ...lessonData.lesson,
      skill_id: skillId,
      source_content_ids: contentGroup.content.map(c => c.id),
      generated_at: new Date().toISOString(),
      generation_cost: response.cost
    };
  }

  /**
   * Store processed lessons in new database table
   */
  async storeProcessedLessons(lessons, skillId) {
    console.log(`💾 Storing ${lessons.length} processed lessons`);

    // First, create the processed lessons table if it doesn't exist
    await this.ensureProcessedLessonsTable();

    const insertQueries = lessons.map(lesson => ({
      text: `
        INSERT INTO processed_lessons (
          skill_id, title, overview, sections, assessment,
          source_content_ids, generated_at, generation_cost
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
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
        lesson.generation_cost
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

module.exports = { LessonGenerator };