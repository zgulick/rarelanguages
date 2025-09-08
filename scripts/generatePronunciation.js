/**
 * Pronunciation Guide Generation Script  
 * Phase 1.3: Generate pronunciation guides for Gheg Albanian phrases
 */

require('dotenv').config();
const { query } = require('../lib/database');
const { OpenAIClient } = require('../lib/openai');
const config = require('../config/contentGeneration');
const fs = require('fs').promises;
const path = require('path');

class PronunciationGenerator {
  constructor() {
    this.openaiClient = new OpenAIClient();
    this.progressFile = path.join(config.progress.progressDirectory, 'pronunciations.json');
    this.completedPronunciations = new Set();
  }

  async getContentNeedingPronunciation() {
    console.log('📝 Fetching content needing pronunciation guides...');
    
    const result = await query(`
      SELECT lc.id, lc.english_phrase, lc.target_phrase, lc.cultural_context,
             l.name as lesson_name, s.name as skill_name, s.cefr_level
      FROM lesson_content lc
      JOIN lessons l ON lc.lesson_id = l.id
      JOIN skills s ON l.skill_id = s.id
      JOIN languages lang ON s.language_id = lang.id
      WHERE lang.code = 'gheg-al' 
        AND lc.target_phrase IS NOT NULL
        AND (lc.pronunciation_guide IS NULL OR lc.pronunciation_guide = '')
      ORDER BY s.position, l.position, lc.id
    `);
    
    console.log(`✅ Found ${result.rows.length} phrases needing pronunciation guides`);
    return result.rows;
  }

  async saveProgress(pronunciations, step = 'pronunciations') {
    try {
      await fs.mkdir(config.progress.progressDirectory, { recursive: true });
      await fs.writeFile(
        this.progressFile,
        JSON.stringify({
          step,
          completed: pronunciations.length,
          pronunciations,
          timestamp: new Date().toISOString(),
          costSummary: this.openaiClient.getCostSummary()
        }, null, 2)
      );
    } catch (error) {
      console.error('⚠️  Failed to save progress:', error.message);
    }
  }

  async loadProgress() {
    try {
      const data = await fs.readFile(this.progressFile, 'utf8');
      const progress = JSON.parse(data);
      console.log(`📂 Loaded previous progress: ${progress.completed} pronunciations completed`);
      
      progress.pronunciations.forEach(p => {
        this.completedPronunciations.add(p.target_phrase);
      });
      
      return progress;
    } catch (error) {
      console.log('📋 No previous progress found, starting fresh');
      return null;
    }
  }

  async generatePronunciationForPhrase(content) {
    console.log(`🔊 Generating pronunciation for: "${content.target_phrase}"`);
    
    try {
      const response = await this.openaiClient.generatePronunciation(
        content.target_phrase,
        'pronunciation_generation'
      );
      
      const pronunciationData = JSON.parse(response.content);
      
      if (!pronunciationData.phonetic || !pronunciationData.syllables) {
        throw new Error('Invalid pronunciation format returned from API');
      }
      
      // Validate and clean up the pronunciation guide
      const guide = {
        phrase: pronunciationData.phrase || content.target_phrase,
        phonetic: pronunciationData.phonetic,
        syllables: pronunciationData.syllables,
        stress: pronunciationData.stress || '',
        notes: pronunciationData.notes || ''
      };
      
      console.log(`✅ Generated pronunciation guide`);
      return guide;
      
    } catch (error) {
      console.error(`❌ Failed to generate pronunciation for "${content.target_phrase}":`, error.message);
      throw error;
    }
  }

  async updatePronunciationInDatabase(contentId, pronunciationGuide) {
    try {
      await query(`
        UPDATE lesson_content 
        SET pronunciation_guide = $1,
            updated_at = NOW()
        WHERE id = $2
      `, [JSON.stringify(pronunciationGuide), contentId]);
      
      return true;
    } catch (error) {
      console.error(`⚠️  Failed to update pronunciation in database:`, error.message);
      return false;
    }
  }

  groupContentByPhrase(content) {
    // Group by unique phrases to avoid duplicate API calls for same phrase
    const uniquePhrases = new Map();
    
    content.forEach(item => {
      const phrase = item.target_phrase.trim();
      if (!uniquePhrases.has(phrase)) {
        uniquePhrases.set(phrase, []);
      }
      uniquePhrases.get(phrase).push(item);
    });
    
    console.log(`📊 Found ${uniquePhrases.size} unique phrases from ${content.length} content items`);
    return uniquePhrases;
  }

  async processAllPronunciations() {
    console.log('🚀 Starting pronunciation generation process...');
    
    // Load previous progress
    const previousProgress = await this.loadProgress();
    let allPronunciations = previousProgress ? previousProgress.pronunciations : [];
    
    // Get content needing pronunciation
    const allContent = await this.getContentNeedingPronunciation();
    
    // Filter out already completed pronunciations
    const remainingContent = allContent.filter(content => 
      !this.completedPronunciations.has(content.target_phrase)
    );
    
    if (remainingContent.length === 0) {
      console.log('🎉 All content already has pronunciation guides!');
      return allPronunciations;
    }
    
    console.log(`📝 Processing ${remainingContent.length} content items for pronunciation guides`);
    
    // Group by unique phrases to minimize API calls
    const uniquePhrases = this.groupContentByPhrase(remainingContent);
    
    // Process each unique phrase
    let processedCount = 0;
    const batchSize = Math.min(5, config.batchConfig.translationBatchSize / 5); // Small batches for pronunciation
    
    const phraseEntries = Array.from(uniquePhrases.entries());
    
    for (let i = 0; i < phraseEntries.length; i += batchSize) {
      const batch = phraseEntries.slice(i, i + batchSize);
      console.log(`\n📦 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(phraseEntries.length/batchSize)} (${batch.length} unique phrases)`);
      
      for (const [phrase, contentItems] of batch) {
        try {
          // Use the first content item as representative
          const representativeContent = contentItems[0];
          
          const pronunciationGuide = await this.generatePronunciationForPhrase(representativeContent);
          
          // Update all content items with this phrase
          let updatedCount = 0;
          for (const content of contentItems) {
            const success = await this.updatePronunciationInDatabase(content.id, pronunciationGuide);
            if (success) updatedCount++;
          }
          
          allPronunciations.push({
            target_phrase: phrase,
            english_phrase: representativeContent.english_phrase,
            pronunciation_guide: pronunciationGuide,
            content_items_updated: updatedCount,
            skill_name: representativeContent.skill_name
          });
          
          processedCount++;
          console.log(`✅ Updated ${updatedCount} content items with pronunciation for "${phrase}"`);
          
          // Small delay between items
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (error) {
          console.error(`❌ Failed to process pronunciation for "${phrase}":`, error.message);
          // Continue with other phrases
        }
      }
      
      // Save progress periodically
      await this.saveProgress(allPronunciations);
      
      // Check budget
      const costSummary = this.openaiClient.getCostSummary();
      console.log(`💰 Current cost: $${costSummary.totalCost.toFixed(2)}`);
      
      if (costSummary.totalCost > config.generation.maxDailyCost * 0.95) {
        console.log(`⚠️  Approaching budget limit, stopping pronunciation generation`);
        break;
      }
    }
    
    // Final save
    await this.saveProgress(allPronunciations, 'completed');
    
    console.log('\n🎉 Pronunciation generation completed!');
    console.log(`✅ Processed ${processedCount} unique phrases`);
    console.log(`✅ Total pronunciations: ${allPronunciations.length}`);
    
    const costSummary = this.openaiClient.getCostSummary();
    console.log(`💰 Total cost: $${costSummary.totalCost.toFixed(2)}`);
    
    return allPronunciations;
  }
}

async function generatePronunciations() {
  const generator = new PronunciationGenerator();
  
  try {
    const pronunciations = await generator.processAllPronunciations();
    
    // Validate results
    const validation = await validatePronunciations();
    console.log(`✨ Validation: ${validation.coverage}% coverage`);
    
    return pronunciations;
    
  } catch (error) {
    console.error('❌ Pronunciation generation failed:', error);
    throw error;
  }
}

async function validatePronunciations() {
  console.log('🔍 Validating pronunciation generation results...');
  
  const result = await query(`
    SELECT 
      COUNT(*) as total_content,
      COUNT(CASE WHEN pronunciation_guide IS NOT NULL AND pronunciation_guide != '' THEN 1 END) as with_pronunciation,
      COUNT(DISTINCT target_phrase) as unique_phrases
    FROM lesson_content lc
    JOIN lessons l ON lc.lesson_id = l.id
    JOIN skills s ON l.skill_id = s.id
    JOIN languages lang ON s.language_id = lang.id
    WHERE lang.code = 'gheg-al' AND lc.target_phrase IS NOT NULL
  `);
  
  const stats = result.rows[0];
  const coverage = (parseInt(stats.with_pronunciation) / parseInt(stats.total_content)) * 100;
  
  console.log(`📊 Pronunciation Statistics:`);
  console.log(`  Total translated content: ${stats.total_content}`);
  console.log(`  With pronunciation guides: ${stats.with_pronunciation}`);
  console.log(`  Unique phrases: ${stats.unique_phrases}`);
  console.log(`  Coverage: ${coverage.toFixed(1)}%`);
  
  // Sample check - validate JSON structure
  const sampleResult = await query(`
    SELECT pronunciation_guide 
    FROM lesson_content 
    WHERE pronunciation_guide IS NOT NULL AND pronunciation_guide != ''
    LIMIT 5
  `);
  
  let validJsonCount = 0;
  for (const row of sampleResult.rows) {
    try {
      const guide = JSON.parse(row.pronunciation_guide);
      if (guide.phonetic && guide.syllables) {
        validJsonCount++;
      }
    } catch (error) {
      console.log('⚠️  Found invalid JSON in pronunciation guide');
    }
  }
  
  console.log(`📝 Sample validation: ${validJsonCount}/${sampleResult.rows.length} guides have valid structure`);
  
  return {
    totalContent: parseInt(stats.total_content),
    withPronunciation: parseInt(stats.with_pronunciation),
    uniquePhrases: parseInt(stats.unique_phrases),
    coverage: coverage.toFixed(1),
    validStructure: validJsonCount === sampleResult.rows.length
  };
}

if (require.main === module) {
  generatePronunciations()
    .then((pronunciations) => {
      console.log('🎯 Pronunciation generation completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Pronunciation generation failed:', error);
      process.exit(1);
    });
}

module.exports = {
  generatePronunciations,
  validatePronunciations,
  PronunciationGenerator
};