const { query } = require('../lib/database');
const { OpenAIClient } = require('../lib/openai');

class GrammarEngineGenerator {
  constructor() {
    this.openaiClient = new OpenAIClient();
  }

  async generateGrammarEngine(languageCode, progress) {
    console.log(`🔧 Generating grammar engine for ${languageCode}...`);
    
    try {
      // Update status - generation started
      await this.updateGenerationStatus(languageCode, 'started');
      
      // Step 1: Analyze verb patterns
      if (!await this.isStepCompleted(languageCode, 'grammar_patterns_generated')) {
        console.log('📝 Analyzing verb patterns...');
        const verbPatterns = await this.analyzeVerbPatterns(languageCode);
        await this.storeVerbPatterns(languageCode, verbPatterns);
        await this.markStepCompleted(languageCode, 'grammar_patterns_generated');
        console.log('✅ Verb patterns analyzed and stored');
      } else {
        console.log('✅ Verb patterns already generated - skipping');
      }
      
      // Step 2: Generate comprehensive verb list
      if (!await this.isStepCompleted(languageCode, 'verb_list_generated')) {
        console.log('📚 Generating comprehensive verb list...');
        const verbs = await this.generateVerbList(languageCode);
        await this.storeVerbs(languageCode, verbs);
        await this.markStepCompleted(languageCode, 'verb_list_generated');
        console.log('✅ Verb list generated and stored');
      } else {
        console.log('✅ Verb list already generated - skipping');
      }
      
      // Step 3: Generate additional grammar rules
      if (!await this.isStepCompleted(languageCode, 'grammar_rules_generated')) {
        console.log('📖 Generating additional grammar rules...');
        const grammarRules = await this.generateGrammarRules(languageCode);
        await this.storeGrammarRules(languageCode, grammarRules);
        await this.markStepCompleted(languageCode, 'grammar_rules_generated');
        console.log('✅ Grammar rules generated and stored');
      } else {
        console.log('✅ Grammar rules already generated - skipping');
      }
      
      // Mark generation as completed
      await this.updateGenerationStatus(languageCode, 'completed');
      console.log(`✅ Grammar engine complete for ${languageCode}`);
      
    } catch (error) {
      console.error(`❌ Grammar engine generation failed for ${languageCode}:`, error);
      await this.updateGenerationStatus(languageCode, 'error', error.message);
      throw error;
    }
  }

  async analyzeVerbPatterns(languageCode) {
    const prompt = `
Analyze ${this.getLanguageName(languageCode)} verb conjugation patterns for family conversation contexts.

Provide a comprehensive analysis of verb patterns including:
1. Regular verb patterns (with detailed conjugation rules)
2. Most common irregular verbs (with full conjugations)
3. Semi-regular patterns (verbs that mostly follow patterns with some exceptions)
4. Present, past, and future tenses
5. Cultural context for verb usage in family settings

Format as JSON with this exact structure:
{
  "patterns": {
    "regular_-oj": {
      "type": "regular",
      "description": "Regular verbs ending in -oj like luaj (to play), punoj (to work)",
      "conjugation_rules": {
        "present": {
          "unë": "{stem}",
          "ti": "{stem}n", 
          "ai/ajo": "{stem}n",
          "ne": "{stem}më",
          "ju": "{stem}ni",
          "ata/ato": "{stem}në"
        },
        "past": {
          "unë": "{stem}ova",
          "ti": "{stem}ove",
          "ai/ajo": "{stem}oi", 
          "ne": "{stem}uam",
          "ju": "{stem}uat",
          "ata/ato": "{stem}uan"
        },
        "future": {
          "unë": "do {stem}",
          "ti": "do {stem}sh",
          "ai/ajo": "do {stem}",
          "ne": "do {stem}më",
          "ju": "{stem}ni", 
          "ata/ato": "do {stem}në"
        }
      },
      "example_verbs": ["luaj", "punoj", "studoj", "gatoj", "flas"]
    },
    "irregular_jam": {
      "type": "irregular", 
      "description": "The verb 'to be' - most important irregular verb",
      "conjugation_rules": {
        "present": {
          "unë": "jam",
          "ti": "je",
          "ai/ajo": "është",
          "ne": "jemi", 
          "ju": "jeni",
          "ata/ato": "janë"
        },
        "past": {
          "unë": "isha",
          "ti": "ishe", 
          "ai/ajo": "ishte",
          "ne": "ishim",
          "ju": "ishit",
          "ata/ato": "ishin"
        }
      },
      "example_verbs": ["jam"]
    }
  }
}

Focus on the most common patterns used in Kosovo Albanian family conversations. Include at least 5 different patterns covering regular and irregular verbs.
`;

    const messages = [
      { role: 'user', content: prompt }
    ];
    const response = await this.openaiClient.makeRequest(messages, 'verb_pattern_analysis');
    // Clean the response to remove markdown code blocks
    let cleanContent = response.content.trim();
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/```json\s*/, '').replace(/```\s*$/, '');
    }
    if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/```\s*/, '').replace(/```\s*$/, '');
    }
    return JSON.parse(cleanContent);
  }

  async generateVerbList(languageCode) {
    const prompt = `
Generate the 10 most essential verbs in ${this.getLanguageName(languageCode)} for family conversations and daily life.

For each verb, provide complete information:
1. Infinitive form
2. English translation  
3. Pattern type (matching the patterns from verb pattern analysis)
4. Complete conjugations for present, past, and future tenses
5. 2-3 realistic usage examples in family contexts
6. Frequency rank (1-10, where 1 = most commonly used in family conversations)
7. Cultural notes when relevant

Format as JSON array with this exact structure:
[
  {
    "infinitive": "luaj", 
    "english": "to play",
    "pattern": "regular_-oj",
    "frequency_rank": 15,
    "conjugations": {
      "present": {
        "unë": "luaj",
        "ti": "luan", 
        "ai/ajo": "luan",
        "ne": "luajmë",
        "ju": "luani",
        "ata/ato": "luajnë"
      },
      "past": {
        "unë": "luajova",
        "ti": "luajove",
        "ai/ajo": "luajoi", 
        "ne": "luajuam",
        "ju": "luajuat", 
        "ata/ato": "luajuan"
      },
      "future": {
        "unë": "do luaj",
        "ti": "do luash",
        "ai/ajo": "do luaj",
        "ne": "do luajmë", 
        "ju": "do luani",
        "ata/ato": "do luajnë"
      }
    },
    "examples": [
      {"albanian": "Ti luan futboll çdo ditë", "english": "You play football every day"},
      {"albanian": "Ne luajmë bashkë me fëmijët", "english": "We play together with the children"},
      {"albanian": "Do luaj me ty nesër", "english": "I will play with you tomorrow"}
    ],
    "cultural_notes": "Playing (luaj) is important in Albanian family culture for bonding between generations"
  }
]

Prioritize verbs used in:
- Family interactions and conversations
- Daily household activities  
- Expressing emotions and opinions
- Basic needs and actions
- Social interactions with relatives

Focus on the 10 most essential verbs (frequency_rank 1-10) that every Albanian family member needs to know.
`;

    const messages = [
      { role: 'user', content: prompt }
    ];
    const response = await this.openaiClient.makeRequest(messages, 'verb_list_generation', { max_tokens: 4000 });
    // Clean the response to remove markdown code blocks
    let cleanContent = response.content.trim();
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/```json\s*/, '').replace(/```\s*$/, '');
    }
    if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/```\s*/, '').replace(/```\s*$/, '');
    }
    
    try {
      return JSON.parse(cleanContent);
    } catch (error) {
      console.error('JSON Parse Error for verb list:', error.message);
      console.error('Response content length:', cleanContent.length);
      console.error('First 500 chars:', cleanContent.substring(0, 500));
      console.error('Last 500 chars:', cleanContent.substring(cleanContent.length - 500));
      
      // Try to fix common JSON issues
      cleanContent = cleanContent.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
      
      try {
        return JSON.parse(cleanContent);
      } catch (secondError) {
        console.error('Still failed after cleanup:', secondError.message);
        throw new Error(`Failed to parse verb list JSON: ${error.message}`);
      }
    }
  }

  async generateGrammarRules(languageCode) {
    const prompt = `
Generate additional grammar rules for ${this.getLanguageName(languageCode)} beyond verb conjugations.

Include rules for:
1. Noun gender and definite articles  
2. Basic adjective agreement
3. Possessive pronouns (my, your, his/her, etc.)
4. Question formation patterns
5. Negation patterns
6. Common sentence structures

Format as JSON with this structure:
{
  "rules": {
    "definite_articles": {
      "rule_type": "noun_modification",
      "description": "How to add definite articles to nouns",
      "patterns": {
        "masculine_singular": "{noun}i",
        "feminine_singular": "{noun}a", 
        "plural": "{noun}t"
      },
      "examples": [
        {"albanian": "djalë → djali", "english": "boy → the boy"},
        {"albanian": "vajzë → vajza", "english": "girl → the girl"}
      ]
    },
    "negation": {
      "rule_type": "sentence_structure", 
      "description": "How to make negative sentences",
      "patterns": {
        "verb_negation": "nuk {verb}",
        "noun_negation": "s'ka {noun}"
      },
      "examples": [
        {"albanian": "Nuk flas shqip", "english": "I don't speak Albanian"},
        {"albanian": "S'ka kohë", "english": "There's no time"}
      ]
    }
  }
}

Focus on grammar patterns that are essential for family conversations and daily communication.
`;

    const messages = [
      { role: 'user', content: prompt }
    ];
    const response = await this.openaiClient.makeRequest(messages, 'grammar_rules_generation');
    // Clean the response to remove markdown code blocks
    let cleanContent = response.content.trim();
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/```json\s*/, '').replace(/```\s*$/, '');
    }
    if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/```\s*/, '').replace(/```\s*$/, '');
    }
    return JSON.parse(cleanContent);
  }

  async storeVerbPatterns(languageCode, patterns) {
    const language = await this.getLanguageId(languageCode);
    
    for (const [patternName, patternData] of Object.entries(patterns.patterns)) {
      await query(`
        INSERT INTO verb_patterns (language_id, pattern_name, pattern_type, description, conjugation_rules, example_verbs)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (language_id, pattern_name) 
        DO UPDATE SET 
          pattern_type = $3,
          description = $4,
          conjugation_rules = $5,
          example_verbs = $6
      `, [
        language.id,
        patternName,
        patternData.type || 'regular',
        patternData.description,
        JSON.stringify(patternData.conjugation_rules),
        patternData.example_verbs
      ]);
    }
  }

  async storeVerbs(languageCode, verbs) {
    const language = await this.getLanguageId(languageCode);
    
    for (const verb of verbs) {
      // Get pattern ID
      const patternResult = await query(`
        SELECT id FROM verb_patterns 
        WHERE language_id = $1 AND pattern_name = $2
      `, [language.id, verb.pattern]);
      
      const patternId = patternResult.rows[0]?.id;
      
      await query(`
        INSERT INTO verbs (language_id, infinitive, english_translation, verb_pattern_id, frequency_rank, conjugations, usage_examples, cultural_notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (language_id, infinitive)
        DO UPDATE SET
          english_translation = $3,
          verb_pattern_id = $4,
          frequency_rank = $5,
          conjugations = $6,
          usage_examples = $7,
          cultural_notes = $8
      `, [
        language.id,
        verb.infinitive,
        verb.english,
        patternId,
        verb.frequency_rank,
        JSON.stringify(verb.conjugations),
        JSON.stringify(verb.examples),
        verb.cultural_notes
      ]);
    }
  }

  async storeGrammarRules(languageCode, grammarData) {
    const language = await this.getLanguageId(languageCode);
    
    for (const [ruleName, ruleData] of Object.entries(grammarData.rules)) {
      await query(`
        INSERT INTO grammar_rules (language_id, rule_type, rule_name, rule_description, rule_patterns, examples)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (language_id, rule_type, rule_name)
        DO UPDATE SET
          rule_description = $4,
          rule_patterns = $5,
          examples = $6
      `, [
        language.id,
        ruleData.rule_type,
        ruleName,
        ruleData.description,
        JSON.stringify(ruleData.patterns),
        JSON.stringify(ruleData.examples)
      ]);
    }
  }

  // Status tracking methods
  async updateGenerationStatus(languageCode, status, errorDetails = null) {
    if (status === 'started') {
      await query(`
        INSERT INTO language_generation_status (language_code, generation_started_at)
        VALUES ($1, NOW())
        ON CONFLICT (language_code)
        DO UPDATE SET generation_started_at = NOW()
      `, [languageCode]);
    } else if (status === 'completed') {
      await query(`
        UPDATE language_generation_status 
        SET generation_completed_at = NOW()
        WHERE language_code = $1
      `, [languageCode]);
    } else if (status === 'error') {
      await query(`
        UPDATE language_generation_status
        SET error_details = $2
        WHERE language_code = $1  
      `, [languageCode, errorDetails]);
    }
  }

  async isStepCompleted(languageCode, stepColumn) {
    const result = await query(`
      SELECT ${stepColumn} as completed
      FROM language_generation_status
      WHERE language_code = $1
    `, [languageCode]);
    
    return result.rows[0]?.completed || false;
  }

  async markStepCompleted(languageCode, stepColumn) {
    await query(`
      UPDATE language_generation_status
      SET ${stepColumn} = TRUE
      WHERE language_code = $1
    `, [languageCode]);
  }

  async getLanguageId(languageCode) {
    const result = await query('SELECT id, name FROM languages WHERE code = $1', [languageCode]);
    if (result.rows.length === 0) {
      throw new Error(`Language ${languageCode} not found in database`);
    }
    return result.rows[0];
  }

  getLanguageName(languageCode) {
    const names = {
      'gheg-al': 'Gheg Albanian (Kosovo)',
      'fr': 'French',
      'es': 'Spanish',
      'de': 'German',
      'it': 'Italian'
    };
    return names[languageCode] || languageCode;
  }
}

module.exports = { GrammarEngineGenerator };