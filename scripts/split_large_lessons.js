#!/usr/bin/env node

/**
 * Lesson Splitting Script
 * Breaks large lessons into manageable sub-lessons
 * Maintains content order and creates parent-child relationships
 */

const { query, transaction } = require('../lib/database');

// Configuration
const CONFIG = {
  CARDS_PER_LESSON: 15,
  MIN_LESSON_SIZE_TO_SPLIT: 20,
  MAX_LESSON_SIZE: 25, // Warning threshold
  DRY_RUN: false // Set to true to see what would happen without making changes
};

class LessonSplitter {
  constructor(config = CONFIG) {
    this.config = config;
    this.stats = {
      lessonsAnalyzed: 0,
      lessonsSplit: 0,
      subLessonsCreated: 0,
      contentMoved: 0,
      errors: []
    };
  }

  /**
   * Main entry point - analyze and split all large lessons
   */
  async splitAllLessons() {
    console.log('🚀 Starting lesson splitting process...');
    console.log(`Configuration: ${this.config.CARDS_PER_LESSON} cards per lesson, dry run: ${this.config.DRY_RUN}\n`);

    try {
      // Step 1: Identify lessons that need splitting
      const lessonsToSplit = await this.identifyLessonsToSplit();
      console.log(`📊 Found ${lessonsToSplit.length} lessons that need splitting\n`);

      if (lessonsToSplit.length === 0) {
        console.log('✅ No lessons need splitting!');
        return this.stats;
      }

      // Step 2: Process each lesson
      for (const lesson of lessonsToSplit) {
        await this.splitLesson(lesson);
      }

      // Step 3: Verify results
      await this.verifyResults();

      console.log('\n🎉 Lesson splitting complete!');
      console.log('Final stats:', this.stats);

      return this.stats;

    } catch (error) {
      console.error('❌ Lesson splitting failed:', error);
      this.stats.errors.push(error.message);
      throw error;
    }
  }

  /**
   * Identify lessons that need to be split
   */
  async identifyLessonsToSplit() {
    const result = await query(`
      SELECT
        l.id,
        l.name,
        l.skill_id,
        l.position,
        l.difficulty_level,
        l.estimated_minutes,
        COUNT(lc.id) as content_count,
        CEIL(COUNT(lc.id)::decimal / $1) as suggested_sub_lessons,
        s.name as skill_name
      FROM lessons l
      LEFT JOIN lesson_content lc ON l.id = lc.lesson_id
      LEFT JOIN skills s ON l.skill_id = s.id
      WHERE l.is_sub_lesson = FALSE
        AND l.is_active = TRUE
      GROUP BY l.id, l.name, l.skill_id, l.position, l.difficulty_level, l.estimated_minutes, s.name
      HAVING COUNT(lc.id) >= $2
      ORDER BY COUNT(lc.id) DESC
    `, [this.config.CARDS_PER_LESSON, this.config.MIN_LESSON_SIZE_TO_SPLIT]);

    result.rows.forEach(lesson => {
      console.log(`📋 "${lesson.name}" (${lesson.skill_name}): ${lesson.content_count} cards → ${lesson.suggested_sub_lessons} sub-lessons`);
    });

    this.stats.lessonsAnalyzed = result.rows.length;
    return result.rows;
  }

  /**
   * Split a single lesson into sub-lessons
   */
  async splitLesson(lesson) {
    console.log(`\n🔄 Splitting lesson: "${lesson.name}"`);

    try {
      // Step 1: Get all content for this lesson
      const content = await this.getLessonContent(lesson.id);
      console.log(`   📝 Found ${content.length} content items`);

      // Step 2: Group content into chunks
      const contentGroups = this.groupContent(content, this.config.CARDS_PER_LESSON);
      console.log(`   📦 Grouped into ${contentGroups.length} sub-lessons`);

      if (this.config.DRY_RUN) {
        console.log('   🔍 DRY RUN - would create:');
        contentGroups.forEach((group, index) => {
          console.log(`      Sub-lesson ${index + 1}: ${group.length} cards`);
        });
        return;
      }

      // Step 3: Create the lesson splitting transaction
      await this.createSubLessons(lesson, contentGroups);

      this.stats.lessonsSplit++;
      this.stats.subLessonsCreated += contentGroups.length;
      this.stats.contentMoved += content.length;

      console.log(`   ✅ Successfully split into ${contentGroups.length} sub-lessons`);

    } catch (error) {
      console.error(`   ❌ Failed to split lesson "${lesson.name}":`, error.message);
      this.stats.errors.push(`${lesson.name}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all content for a lesson in order
   */
  async getLessonContent(lessonId) {
    const result = await query(`
      SELECT *
      FROM lesson_content
      WHERE lesson_id = $1
      ORDER BY id ASC
    `, [lessonId]);

    return result.rows;
  }

  /**
   * Group content into manageable chunks
   */
  groupContent(content, chunkSize) {
    const groups = [];

    for (let i = 0; i < content.length; i += chunkSize) {
      const group = content.slice(i, i + chunkSize);
      groups.push(group);
    }

    return groups;
  }

  /**
   * Create sub-lessons and move content in a transaction
   */
  async createSubLessons(parentLesson, contentGroups) {
    const queries = [];

    // Step 1: Update parent lesson to be a container
    queries.push({
      text: `
        UPDATE lessons
        SET total_sub_lessons = $1,
            lesson_group_name = $2,
            cards_per_lesson = 5
        WHERE id = $3
      `,
      params: [contentGroups.length, parentLesson.name, parentLesson.id]
    });

    // Step 2: Create sub-lessons
    const subLessonIds = [];
    for (let i = 0; i < contentGroups.length; i++) {
      const subLessonId = `gen_random_uuid()`;

      queries.push({
        text: `
          INSERT INTO lessons (
            id,
            skill_id,
            name,
            position,
            difficulty_level,
            estimated_minutes,
            parent_lesson_id,
            sequence_number,
            is_sub_lesson,
            cards_per_lesson,
            is_active
          ) VALUES (
            gen_random_uuid(),
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
          ) RETURNING id
        `,
        params: [
          parentLesson.skill_id,
          `${parentLesson.name} - Part ${i + 1}`,
          parentLesson.position + i + 1000, // Use large offset to avoid conflicts
          parentLesson.difficulty_level,
          Math.ceil(parentLesson.estimated_minutes / contentGroups.length),
          parentLesson.id,
          i + 1,
          true,
          contentGroups[i].length,
          true
        ]
      });
    }

    // Execute transaction to create sub-lessons
    console.log('   💾 Creating sub-lessons...');
    const results = await transaction(queries);

    // Get the created sub-lesson IDs
    const createdSubLessons = results.slice(1); // Skip the parent update result

    // Step 3: Move content to sub-lessons
    console.log('   📋 Moving content to sub-lessons...');
    for (let i = 0; i < contentGroups.length; i++) {
      const subLessonId = createdSubLessons[i].rows[0].id;
      const contentGroup = contentGroups[i];

      // Move each content item to the appropriate sub-lesson
      for (const contentItem of contentGroup) {
        await query(`
          UPDATE lesson_content
          SET lesson_id = $1
          WHERE id = $2
        `, [subLessonId, contentItem.id]);
      }
    }

    console.log('   🔗 Sub-lesson creation and content migration complete');
  }

  /**
   * Verify the splitting results
   */
  async verifyResults() {
    console.log('\n🔍 Verifying splitting results...');

    // Check for any validation issues
    const validationResult = await query('SELECT * FROM validate_lesson_hierarchy()');

    if (validationResult.rows.length === 0) {
      console.log('✅ No hierarchy validation issues found');
    } else {
      console.log('⚠️  Validation issues found:');
      validationResult.rows.forEach(issue => {
        console.log(`   - ${issue.issue_type}: ${issue.lesson_name} - ${issue.issue_description}`);
        this.stats.errors.push(`Validation: ${issue.issue_type} in ${issue.lesson_name}`);
      });
    }

    // Check content counts
    const contentCheck = await query(`
      SELECT
        l.name,
        l.is_sub_lesson,
        l.cards_per_lesson,
        COUNT(lc.id) as actual_content_count
      FROM lessons l
      LEFT JOIN lesson_content lc ON l.id = lc.lesson_id
      WHERE l.is_sub_lesson = TRUE
      GROUP BY l.id, l.name, l.is_sub_lesson, l.cards_per_lesson
      HAVING COUNT(lc.id) > 25
    `);

    if (contentCheck.rows.length === 0) {
      console.log('✅ No sub-lessons exceed 25 cards');
    } else {
      console.log('⚠️  Sub-lessons still too large:');
      contentCheck.rows.forEach(lesson => {
        console.log(`   - ${lesson.name}: ${lesson.actual_content_count} cards`);
      });
    }

    // Summary statistics
    const summaryResult = await query(`
      SELECT
        COUNT(*) FILTER (WHERE is_sub_lesson = FALSE) as parent_lessons,
        COUNT(*) FILTER (WHERE is_sub_lesson = TRUE) as sub_lessons,
        AVG(cards_per_lesson) FILTER (WHERE is_sub_lesson = TRUE) as avg_cards_per_sub_lesson
      FROM lessons
      WHERE is_active = TRUE
    `);

    const summary = summaryResult.rows[0];
    console.log('📊 Final lesson statistics:');
    console.log(`   - Parent lessons: ${summary.parent_lessons}`);
    console.log(`   - Sub-lessons: ${summary.sub_lessons}`);
    console.log(`   - Average cards per sub-lesson: ${parseFloat(summary.avg_cards_per_sub_lesson || 0).toFixed(1)}`);
  }
}

/**
 * CLI interface
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const cardsPerLesson = parseInt(args.find(arg => arg.startsWith('--cards='))?.split('=')[1]) || CONFIG.CARDS_PER_LESSON;

  const config = {
    ...CONFIG,
    DRY_RUN: dryRun,
    CARDS_PER_LESSON: cardsPerLesson
  };

  try {
    const splitter = new LessonSplitter(config);
    const stats = await splitter.splitAllLessons();

    if (stats.errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      stats.errors.forEach(error => console.log(`   - ${error}`));
      process.exit(1);
    }

    console.log('\n🎉 Lesson splitting completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('\n💥 Fatal error:', error.message);
    process.exit(1);
  }
}

// Export for testing and direct usage
module.exports = { LessonSplitter, CONFIG };

// Run if called directly
if (require.main === module) {
  main();
}