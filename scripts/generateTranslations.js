/**
 * Batch Translation Script
 * Phase 1.3: Translate English content to Gheg Albanian
 */

require('dotenv').config();
const { query } = require('../lib/database');
const { OpenAIClient } = require('../lib/openai');
const config = require('../config/contentGeneration');
const fs = require('fs').promises;
const path = require('path');

class TranslationBatcher {
  constructor() {
    this.openaiClient = new OpenAIClient();
    this.progressFile = path.join(config.progress.progressDirectory, 'translations.json');
    this.completedTranslations = new Set();
  }

  async getUntranslatedContent() {
    console.log('📝 Fetching untranslated content...');
    
    const result = await query(`
      SELECT lc.id, lc.english_phrase, lc.lesson_id, l.name as lesson_name, 
             s.name as skill_name, s.cefr_level
      FROM lesson_content lc
      JOIN lessons l ON lc.lesson_id = l.id  
      JOIN skills s ON l.skill_id = s.id
      JOIN languages lang ON s.language_id = lang.id
      WHERE lang.code = 'gheg-al' 
        AND lc.target_phrase IS NULL
        AND lc.english_phrase IS NOT NULL
      ORDER BY s.position, l.position, lc.id
    `);
    
    console.log(`✅ Found ${result.rows.length} phrases needing translation`);
    return result.rows;
  }

  async saveProgress(translations, step = 'translations') {
    try {
      await fs.mkdir(config.progress.progressDirectory, { recursive: true });
      await fs.writeFile(
        this.progressFile,
        JSON.stringify({
          step,
          completed: translations.length,
          translations,
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
      console.log(`📂 Loaded previous progress: ${progress.completed} translations completed`);
      
      // Mark completed translations
      progress.translations.forEach(t => {
        this.completedTranslations.add(t.english);
      });
      
      return progress;
    } catch (error) {
      console.log('📋 No previous progress found, starting fresh');
      return null;
    }
  }

  groupContentByContext(content) {
    const groups = {};
    const contextMap = config.ghegSpecific.contexts;
    
    // Define keyword mappings for cultural contexts
    const keywordGroups = {
      familyTerms: ['father', 'mother', 'parent', 'son', 'daughter', 'family', 'brother', 'sister', 'uncle', 'aunt'],
      greetings: ['hello', 'good morning', 'good evening', 'how are you', 'nice to meet', 'goodbye'],
      cardGames: ['cards', 'game', 'turn', 'win', 'lose', 'play', 'deal', 'shuffle'],
      coffee: ['coffee', 'drink', 'cup', 'sugar', 'milk', 'cafe'],
      food: ['eat', 'food', 'meal', 'breakfast', 'lunch', 'dinner', 'hungry', 'delicious'],
      children: ['child', 'children', 'baby', 'kid', 'young'],
      compliments: ['beautiful', 'good', 'excellent', 'wonderful', 'amazing', 'great'],
      apologies: ['sorry', 'excuse me', 'apologize', 'forgive']
    };

    // Group content by matching keywords
    content.forEach(item => {
      const phrase = item.english_phrase.toLowerCase();
      let assigned = false;

      for (const [contextKey, keywords] of Object.entries(keywordGroups)) {
        if (keywords.some(keyword => phrase.includes(keyword))) {
          if (!groups[contextKey]) {
            groups[contextKey] = {
              context: contextMap[contextKey],
              items: []
            };
          }
          groups[contextKey].items.push(item);
          assigned = true;
          break;
        }
      }

      // Default group for unmatched content
      if (!assigned) {
        if (!groups.general) {
          groups.general = {
            context: "General conversational phrases for everyday communication",
            items: []
          };
        }
        groups.general.items.push(item);
      }
    });

    return groups;
  }

  async translateBatch(items, context) {
    const phrases = items.map(item => item.english_phrase);
    console.log(`🔤 Translating batch of ${phrases.length} phrases (${context.substring(0, 50)}...)`);
    
    try {
      const response = await this.openaiClient.batchTranslate(phrases, context);
      
      // Clean response content - handle various OpenAI response formats
      let content = response.content.trim();
      
      // Remove markdown code blocks
      if (content.includes('```')) {
        const jsonMatch = content.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
        if (jsonMatch) {
          content = jsonMatch[1];
        } else {
          // Fallback: remove all ``` markers
          content = content.replace(/```[^`]*?```/g, '').replace(/```/g, '').trim();
        }
      }
      
      // Extract just the JSON array if there's extra text
      const jsonMatch = content.match(/(\[[\s\S]*\])/);
      if (jsonMatch) {
        content = jsonMatch[1];
      }
      
      const translations = JSON.parse(content);
      
      // Validate response structure
      if (!Array.isArray(translations)) {
        throw new Error('Invalid response format - expected array');
      }

      // Match translations back to database IDs
      const results = [];
      translations.forEach(translation => {
        const matchingItem = items.find(item => 
          item.english_phrase.toLowerCase() === translation.english.toLowerCase()
        );
        
        if (matchingItem) {
          results.push({
            id: matchingItem.id,
            english: translation.english,
            gheg: translation.gheg,
            cultural_note: translation.cultural_note || null,
            lesson_name: matchingItem.lesson_name,
            skill_name: matchingItem.skill_name
          });
        }
      });

      console.log(`✅ Successfully translated ${results.length}/${phrases.length} phrases`);
      return results;
      
    } catch (error) {
      console.error(`❌ Translation failed for batch:`, error.message);
      throw error;
    }
  }

  async updateDatabase(translations) {
    console.log(`💾 Updating database with ${translations.length} translations...`);
    
    let updated = 0;
    for (const translation of translations) {
      try {
        await query(`
          UPDATE lesson_content 
          SET target_phrase = $1, 
              cultural_context = $2
          WHERE id = $3 AND target_phrase IS NULL
        `, [translation.gheg, translation.cultural_note, translation.id]);
        
        updated++;
      } catch (error) {
        console.error(`⚠️  Failed to update ${translation.english}:`, error.message);
      }
    }
    
    console.log(`✅ Updated ${updated} records in database`);
    return updated;
  }

  async processAllTranslations() {
    console.log('🚀 Starting batch translation process...');
    
    // Load previous progress
    const previousProgress = await this.loadProgress();
    let allTranslations = previousProgress ? previousProgress.translations : [];
    
    // Get untranslated content (skip already completed)
    const allContent = await this.getUntranslatedContent();
    const remainingContent = allContent.filter(item => 
      !this.completedTranslations.has(item.english_phrase)
    );
    
    if (remainingContent.length === 0) {
      console.log('🎉 All content already translated!');
      return allTranslations;
    }
    
    console.log(`📝 Processing ${remainingContent.length} remaining phrases`);
    
    // Group content by cultural context
    const contextGroups = this.groupContentByContext(remainingContent);
    console.log(`📊 Grouped into ${Object.keys(contextGroups).length} cultural contexts`);
    
    // Process each context group
    for (const [contextName, group] of Object.entries(contextGroups)) {
      console.log(`\n🎯 Processing ${contextName}: ${group.items.length} items`);
      
      // Split into batches
      const batchSize = config.batchConfig.translationBatchSize;
      const batches = [];
      for (let i = 0; i < group.items.length; i += batchSize) {
        batches.push(group.items.slice(i, i + batchSize));
      }
      
      // Process batches with concurrent limit
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        console.log(`  📦 Batch ${i + 1}/${batches.length} (${batch.length} items)`);
        
        try {
          const batchTranslations = await this.translateBatch(batch, group.context);
          await this.updateDatabase(batchTranslations);
          
          allTranslations = allTranslations.concat(batchTranslations);
          
          // Save progress periodically
          if (allTranslations.length % config.progress.saveInterval === 0) {
            await this.saveProgress(allTranslations);
          }
          
          // Check budget
          const costSummary = this.openaiClient.getCostSummary();
          if (costSummary.totalCost > config.generation.maxDailyCost * 0.8) {
            console.log(`⚠️  Approaching budget limit ($${costSummary.totalCost.toFixed(2)})`);
          }
          
        } catch (error) {
          console.error(`❌ Batch ${i + 1} failed:`, error.message);
          await this.saveProgress(allTranslations, 'partial');
          throw error;
        }
      }
    }
    
    // Final save
    await this.saveProgress(allTranslations, 'completed');
    
    console.log('\n🎉 Translation process completed!');
    console.log(`✅ Total translations: ${allTranslations.length}`);
    
    const costSummary = this.openaiClient.getCostSummary();
    console.log(`💰 Total cost: $${costSummary.totalCost.toFixed(2)}`);
    console.log(`📊 API calls: ${costSummary.totalCalls}`);
    
    return allTranslations;
  }
}

async function generateTranslations() {
  const batcher = new TranslationBatcher();
  
  try {
    const translations = await batcher.processAllTranslations();
    
    // Validate results
    const validation = await validateTranslations();
    console.log(`✨ Validation: ${validation.successRate}% success rate`);
    
    return translations;
    
  } catch (error) {
    console.error('❌ Translation generation failed:', error);
    throw error;
  }
}

async function validateTranslations() {
  console.log('🔍 Validating translation results...');
  
  const result = await query(`
    SELECT 
      COUNT(*) as total,
      COUNT(target_phrase) as translated,
      COUNT(cultural_context) as with_context
    FROM lesson_content lc
    JOIN lessons l ON lc.lesson_id = l.id
    JOIN skills s ON l.skill_id = s.id  
    JOIN languages lang ON s.language_id = lang.id
    WHERE lang.code = 'gheg-al'
  `);
  
  const stats = result.rows[0];
  const successRate = (parseInt(stats.translated) / parseInt(stats.total)) * 100;
  
  console.log(`📊 Translation Statistics:`);
  console.log(`  Total phrases: ${stats.total}`);
  console.log(`  Translated: ${stats.translated}`);
  console.log(`  With cultural context: ${stats.with_context}`);
  console.log(`  Success rate: ${successRate.toFixed(1)}%`);
  
  return {
    total: parseInt(stats.total),
    translated: parseInt(stats.translated),
    withContext: parseInt(stats.with_context),
    successRate: successRate.toFixed(1)
  };
}

if (require.main === module) {
  generateTranslations()
    .then((translations) => {
      console.log('🎯 Translation generation completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Translation generation failed:', error);
      process.exit(1);
    });
}

module.exports = {
  generateTranslations,
  validateTranslations,
  TranslationBatcher
};