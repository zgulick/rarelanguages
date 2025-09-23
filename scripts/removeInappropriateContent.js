/**
 * Remove Inappropriate Content Script
 * Removes academic and overly complex content that doesn't belong in language learning
 */

const { query, transaction } = require('../lib/database');
const fs = require('fs');

// Patterns for content that should be removed from language learning
const inappropriatePatterns = [
  // Academic writing patterns
  /as a result/i,
  /in conclusion/i,
  /in contrast/i,
  /therefore/i,
  /however/i,
  /furthermore/i,
  /moreover/i,
  /critique the/i,
  /analyze the/i,
  /identify the main claim/i,
  /reflect on the implications/i,
  /summarize the key points/i,
  /logical consistency/i,
  /main idea of the text/i,
  /in your own words/i,

  // Business/formal language inappropriate for beginners
  /apologize for the inconvenience/i,
  /thank you for your cooperation/i,
  /thank you for your assistance/i,
  /could you please provide more details/i,
  /clarify your point/i,
  /i apologize for the misunderstanding/i,
  /let's review the main points/i,

  // Meta language learning content (content about learning)
  /feedback to improve/i,
  /reflect on cultural differences/i,
  /seek feedback from peers/i,
  /identify your strengths and weaknesses/i,
  /reflect on.*learning/i,
  /use feedback/i,

  // Overly complex personal questions for Level 1
  /how many children do you have/i,
  /what brings you here/i,
  /how is work going/i,
  /what are your thoughts on this issue/i,
  /how was your trip/i,

  // Academic instruction language
  /discover vocabulary for/i,
  /in this lesson.*you'll learn/i,
];

const checkIfInappropriate = (text) => {
  const lower = text.toLowerCase();

  // Check against patterns
  for (const pattern of inappropriatePatterns) {
    if (pattern.test(lower)) {
      return {
        inappropriate: true,
        reason: `Matches academic/inappropriate pattern: ${pattern.source}`,
        category: 'academic_language'
      };
    }
  }

  // Check for overly long sentences in Level 1
  const wordCount = text.trim().split(/\s+/).length;
  if (wordCount > 8) {
    return {
      inappropriate: true,
      reason: `Too long for language learning (${wordCount} words)`,
      category: 'too_complex'
    };
  }

  return { inappropriate: false };
};

const removeInappropriateContent = async () => {
  console.log('🧹 Analyzing content for removal...\n');

  try {
    // Get all content from Level 1 lessons (most problematic)
    const contentQuery = `
      SELECT
        c.*,
        l.name as lesson_name,
        l.difficulty_level,
        s.name as skill_name,
        co.level as course_level
      FROM lesson_content c
      LEFT JOIN lessons l ON c.lesson_id = l.id
      LEFT JOIN skills s ON l.skill_id = s.id
      LEFT JOIN course_skills cs ON s.id = cs.skill_id
      LEFT JOIN courses co ON cs.course_id = co.id
      WHERE co.level = 1
      ORDER BY c.lesson_id, c.content_order
    `;

    const result = await query(contentQuery);
    const allContent = result.rows;

    console.log(`📊 Found ${allContent.length} Level 1 content items to analyze\n`);

    const toRemove = [];
    const toKeep = [];

    for (const content of allContent) {
      const analysis = checkIfInappropriate(content.english_phrase);

      if (analysis.inappropriate) {
        toRemove.push({
          ...content,
          removal_reason: analysis.reason,
          removal_category: analysis.category
        });
      } else {
        toKeep.push(content);
      }
    }

    console.log(`🗑️  Items to remove: ${toRemove.length}`);
    console.log(`✅ Items to keep: ${toKeep.length}`);
    console.log(`📊 Removal rate: ${(toRemove.length / allContent.length * 100).toFixed(1)}%\n`);

    // Show samples of what will be removed
    console.log('🚨 CONTENT TO BE REMOVED (samples):');
    console.log('====================================');
    toRemove.slice(0, 15).forEach(item => {
      console.log(`❌ "${item.english_phrase}"`);
      console.log(`   Lesson: ${item.lesson_name}`);
      console.log(`   Reason: ${item.removal_reason}`);
      console.log('');
    });

    // Group by categories
    const byCategory = toRemove.reduce((acc, item) => {
      acc[item.removal_category] = (acc[item.removal_category] || 0) + 1;
      return acc;
    }, {});

    console.log('📊 REMOVAL CATEGORIES:');
    console.log('======================');
    Object.entries(byCategory).forEach(([category, count]) => {
      console.log(`${category}: ${count} items`);
    });

    // Save removal report
    const removalReport = {
      timestamp: new Date().toISOString(),
      total_analyzed: allContent.length,
      to_remove: toRemove.length,
      to_keep: toKeep.length,
      removal_rate: (toRemove.length / allContent.length * 100).toFixed(1) + '%',
      categories: byCategory,
      items_to_remove: toRemove.map(item => ({
        content_id: item.id,
        english_phrase: item.english_phrase,
        lesson_name: item.lesson_name,
        reason: item.removal_reason,
        category: item.removal_category
      }))
    };

    fs.writeFileSync('./content_removal_report.json', JSON.stringify(removalReport, null, 2));

    console.log('\n📄 Removal report saved to ./content_removal_report.json');
    console.log('Run with --execute flag to perform deletions');

    // If --execute flag is passed, perform the deletions
    if (process.argv.includes('--execute')) {
      console.log('\n🚀 EXECUTING DELETIONS...');
      await executeRemovals(toRemove);
    }

  } catch (error) {
    console.error('Error analyzing content for removal:', error);
    throw error;
  }
};

const executeRemovals = async (toRemove) => {
  console.log(`Removing ${toRemove.length} inappropriate content items...`);

  try {
    // Build transaction queries
    const queries = toRemove.map(item => ({
      text: `DELETE FROM lesson_content WHERE id = $1`,
      params: [item.id]
    }));

    // Execute all deletions in a transaction
    await transaction(queries);

    console.log(`✅ Successfully removed ${toRemove.length} inappropriate content items!`);

    // Generate summary report
    const summary = {
      removed_count: toRemove.length,
      timestamp: new Date().toISOString(),
      removed_items: toRemove.map(item => ({
        content_id: item.id,
        phrase: item.english_phrase,
        lesson: item.lesson_name,
        reason: item.removal_reason
      }))
    };

    fs.writeFileSync('./executed_removals.json', JSON.stringify(summary, null, 2));
    console.log('📄 Removal summary saved to ./executed_removals.json');

  } catch (error) {
    console.error('❌ Error executing removals:', error);
    throw error;
  }
};

// Run the removal analysis
removeInappropriateContent().catch(console.error);