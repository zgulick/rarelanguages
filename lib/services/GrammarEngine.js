/**
 * Grammar Engine Integration
 * Creates conjugation tables, analyzes grammar patterns, and explains rules clearly
 * Chunk 2.2 of the masterplan
 */

const { OpenAIClient } = require('../openai');
const { grammarExplanationSchema, conjugationTableSchema } = require('../schemas/lessonSchemas');

class GrammarEngine {
  constructor() {
    this.irregularVerbs = ['jam', 'kam', 'them', 'vij', 'dal', 'marr', 'jap'];
    this.grammarCache = new Map();
    this.conjugationCache = new Map();
    this.openaiClient = new OpenAIClient();
  }

  /**
   * Extract grammar patterns from content
   */
  async analyzeGrammarPatterns(content, languageCode = 'sq-AL') {
    const cacheKey = `patterns_${languageCode}_${content.length}`;
    if (this.grammarCache.has(cacheKey)) {
      return this.grammarCache.get(cacheKey);
    }

    console.log(`📖 Analyzing grammar patterns for ${content.length} items`);

    try {
      const verbs = this.extractVerbs(content);
      const nouns = this.extractNouns(content);

      const analysis = {
        verb_patterns: await this.analyzeVerbPatterns(verbs),
        noun_patterns: await this.analyzeNounPatterns(nouns),
        sentence_patterns: await this.analyzeSentencePatterns(content),
        main_grammar_focus: await this.identifyMainGrammarFocus(content)
      };

      this.grammarCache.set(cacheKey, analysis);
      return analysis;

    } catch (error) {
      console.error('❌ Grammar pattern analysis failed:', error);
      return this.fallbackGrammarAnalysis(content);
    }
  }

  /**
   * Generate complete conjugation table for a verb
   */
  async generateConjugationTable(verb, tense = 'present') {
    const cacheKey = `conjugation_${verb}_${tense}`;
    if (this.conjugationCache.has(cacheKey)) {
      return this.conjugationCache.get(cacheKey);
    }

    console.log(`🔤 Generating conjugation table for "${verb}" (${tense}) with structured output`);

    const prompt = `Generate a complete conjugation table for the Albanian verb: ${verb}
Tense: ${tense}

Provide for all persons (I, you, he/she, we, you(pl), they).
Include:
1. Albanian conjugation with pronoun
2. English translation
3. Pronunciation guide (simple phonetic)
4. Literal translation if different`;

    try {
      const messages = [{ role: 'user', content: prompt }];
      const response = await this.openaiClient.makeStructuredRequest(messages, conjugationTableSchema, 'conjugation_generation');

      const conjugation = response.content;
      this.conjugationCache.set(cacheKey, conjugation);
      return conjugation;

    } catch (error) {
      console.error('❌ Structured conjugation generation failed:', error);
      return this.fallbackConjugation(verb, tense);
    }
  }

  /**
   * Generate clear grammar explanations
   */
  async generateGrammarExplanation(rule, examples) {
    console.log(`📝 Generating grammar explanation for: ${rule} with structured output`);

    const prompt = `Create a clear grammar explanation for Albanian language learners.
Rule/Topic: ${rule}
Example content: ${JSON.stringify(examples.slice(0, 3), null, 2)}

Provide a comprehensive explanation with visual aids, English comparisons, common mistakes, and practice sentences.`;

    try {
      const messages = [{ role: 'user', content: prompt }];
      const response = await this.openaiClient.makeStructuredRequest(messages, grammarExplanationSchema, 'grammar_explanation');

      return response.content;

    } catch (error) {
      console.error('❌ Structured grammar explanation generation failed:', error);
      return this.fallbackGrammarExplanation(rule);
    }
  }

  /**
   * Identify verb type (regular/irregular)
   */
  async identifyVerbType(verb) {
    // Check against known irregular verbs
    if (this.irregularVerbs.includes(verb)) {
      return { type: 'irregular', pattern: 'known irregular verb' };
    }

    // Identify regular patterns by ending
    if (verb.endsWith('oj')) {
      return { type: 'regular', pattern: '-oj verbs (first conjugation)' };
    }
    if (verb.endsWith('aj')) {
      return { type: 'regular', pattern: '-aj verbs (second conjugation)' };
    }
    if (verb.endsWith('ej')) {
      return { type: 'regular', pattern: '-ej verbs (third conjugation)' };
    }

    // Use LLM for complex cases
    return await this.classifyVerbWithLLM(verb);
  }

  /**
   * Generate noun declension tables
   */
  async generateDeclensionTable(noun, gender = 'unknown') {
    console.log(`📋 Generating declension for "${noun}" (${gender})`);

    const prompt = `Generate a declension table for the Albanian noun: ${noun}
Gender: ${gender}

Provide all cases in singular and plural:
{
  "noun": "${noun}",
  "gender": "${gender}",
  "cases": [
    {
      "case": "nominative",
      "singular": "definite form",
      "plural": "definite plural",
      "usage": "when used as subject"
    },
    {
      "case": "accusative",
      "singular": "accusative form",
      "plural": "accusative plural",
      "usage": "when used as direct object"
    }
  ],
  "pattern_notes": "explanation of declension pattern"
}`;

    try {
      const messages = [{ role: 'user', content: prompt }];
      const response = await this.openaiClient.makeRequest(messages, 'noun_declension', {
        max_tokens: 800,
        temperature: 0.3
      });

      return this.cleanJsonResponse(response);

    } catch (error) {
      console.error('❌ Declension generation failed:', error);
      return this.fallbackDeclension(noun, gender);
    }
  }

  /**
   * Compare grammar structures between Albanian and English
   */
  async compareGrammarStructures(topic, albanianExample, englishExample) {
    const prompt = `Compare Albanian and English grammar for: ${topic}

Albanian example: ${albanianExample}
English example: ${englishExample}

Analyze the differences:
{
  "comparison_topic": "${topic}",
  "albanian_structure": {
    "pattern": "structural pattern",
    "example": "${albanianExample}",
    "literal": "word-by-word literal translation"
  },
  "english_structure": {
    "pattern": "English pattern",
    "example": "${englishExample}",
    "literal": "literal structure"
  },
  "key_differences": [
    "main difference 1",
    "main difference 2"
  ],
  "learning_tip": "helpful tip for learners"
}`;

    try {
      const messages = [{ role: 'user', content: prompt }];
      const response = await this.openaiClient.makeRequest(messages, 'grammar_comparison', {
        max_tokens: 600,
        temperature: 0.4
      });

      return this.cleanJsonResponse(response);

    } catch (error) {
      console.error('❌ Grammar comparison failed:', error);
      return this.fallbackGrammarComparison(topic);
    }
  }

  /**
   * Generate grammar progression by difficulty
   */
  generateGrammarProgression(skillLevel) {
    const progressions = {
      1: {
        level: 1,
        topics: ["present tense", "basic pronouns", "to be (jam)", "simple sentences"],
        reasoning: "Foundation for all communication"
      },
      2: {
        level: 2,
        topics: ["past tense", "object pronouns", "basic cases", "questions"],
        reasoning: "Enables talking about experiences"
      },
      3: {
        level: 3,
        topics: ["future tense", "subjunctive", "all cases", "complex sentences"],
        reasoning: "Complex expression and planning"
      }
    };

    return progressions[skillLevel] || progressions[1];
  }

  // Helper methods

  extractVerbs(content) {
    return content
      .filter(item =>
        item.word_type === 'verb' ||
        item.grammar_category === 'verbs' ||
        this.containsAlbanianVerb(item.target_phrase)
      )
      .map(item => this.extractVerbFromPhrase(item.target_phrase))
      .filter(verb => verb);
  }

  extractNouns(content) {
    return content
      .filter(item =>
        item.word_type === 'noun' ||
        item.grammar_category === 'nouns'
      )
      .map(item => this.extractNounFromPhrase(item.target_phrase))
      .filter(noun => noun);
  }

  containsAlbanianVerb(phrase) {
    const commonVerbs = ['jam', 'kam', 'shkoj', 'ha', 'pi', 'flas', 'punoj', 'lexoj'];
    return commonVerbs.some(verb => phrase.toLowerCase().includes(verb));
  }

  extractVerbFromPhrase(phrase) {
    // Simple extraction - can be enhanced
    const words = phrase.toLowerCase().split(' ');
    const commonVerbs = ['jam', 'kam', 'shkoj', 'ha', 'pi', 'flas', 'punoj', 'lexoj'];
    return words.find(word => commonVerbs.includes(word)) || words[0];
  }

  extractNounFromPhrase(phrase) {
    // Simple extraction - get main noun
    return phrase.split(' ')[0];
  }

  async analyzeVerbPatterns(verbs) {
    if (verbs.length === 0) return { patterns_found: false };

    return {
      infinitives: verbs.map(v => `të ${v}`),
      stems: verbs.map(v => v.replace(/oj$|aj$|ej$/, '')),
      conjugation_patterns: {
        regular: {
          present: "-j, -n, -n, -jmë, -ni, -jnë",
          past: "-va, -ve, -i, -më, -të, -në"
        },
        irregular: this.irregularVerbs.filter(v => verbs.includes(v))
      }
    };
  }

  async analyzeNounPatterns(nouns) {
    if (nouns.length === 0) return { patterns_found: false };

    return {
      gender_markers: { masculine: "-i", feminine: "-a", neuter: "-e" },
      pluralization: { regular: "+t", irregular: "varies" },
      cases: ["nominative", "accusative", "genitive", "dative", "ablative"]
    };
  }

  async analyzeSentencePatterns(content) {
    return {
      word_order: "SVO (Subject-Verb-Object)",
      question_formation: "question words at beginning",
      negation: "nuk + verb"
    };
  }

  async identifyMainGrammarFocus(content) {
    // Simple heuristic - can be enhanced with LLM
    const verbs = this.extractVerbs(content);
    const hasNumbers = content.some(group =>
      group.content && group.content.some(item =>
        item.english_phrase && item.english_phrase.match(/\b(one|two|three|four|five|six|seven|eight|nine|ten)\b/i)
      )
    );

    if (hasNumbers) return "Using numbers with nouns";
    if (verbs.length > 0) return "Present tense conjugation";
    return "Basic sentence structure";
  }

  async classifyVerbWithLLM(verb) {
    const prompt = `Classify this Albanian verb: ${verb}
Is it regular or irregular? What pattern does it follow?
Return JSON: {"type": "regular/irregular", "pattern": "description"}`;

    try {
      const messages = [{ role: 'user', content: prompt }];
      const response = await this.openaiClient.makeRequest(messages, 'verb_classification', {
        max_tokens: 200,
        temperature: 0.2
      });
      return this.cleanJsonResponse(response);
    } catch (error) {
      return { type: 'unknown', pattern: 'needs classification' };
    }
  }

  // Fallback methods

  fallbackGrammarAnalysis(content) {
    return {
      verb_patterns: { patterns_found: false },
      noun_patterns: { patterns_found: false },
      sentence_patterns: { word_order: "SVO" },
      main_grammar_focus: "Basic communication"
    };
  }

  fallbackConjugation(verb, tense) {
    return {
      verb: `të ${verb}`,
      tense,
      type: 'unknown',
      conjugations: [
        { person: 'I', albanian: `unë ${verb}`, english: `I ${verb}` }
      ],
      pattern_notes: 'Pattern needs analysis',
      usage_notes: `Used for ${tense} actions`
    };
  }

  fallbackGrammarExplanation(rule) {
    return {
      rule_name: rule,
      simple_explanation: `This rule covers ${rule} in Albanian.`,
      detailed_explanation: `${rule} is an important aspect of Albanian grammar.`,
      common_mistakes: [],
      practice_sentences: []
    };
  }

  fallbackDeclension(noun, gender) {
    return {
      noun,
      gender,
      cases: [
        { case: 'nominative', singular: noun, usage: 'subject' }
      ],
      pattern_notes: 'Declension pattern needs analysis'
    };
  }

  fallbackGrammarComparison(topic) {
    return {
      comparison_topic: topic,
      key_differences: [`${topic} works differently in Albanian than English`],
      learning_tip: `Pay attention to ${topic} patterns`
    };
  }

  cleanJsonResponse(response) {
    try {
      // Handle OpenAI API response object vs string
      let content = typeof response === 'object' && response.content ? response.content : response;

      if (typeof content !== 'string') {
        console.error('❌ Unexpected response type:', typeof content);
        return { error: 'Invalid response format', raw_response: response };
      }

      // Detect truncated responses (common signs of incomplete JSON)
      const truncationSigns = [
        content.includes('...'), // Truncation indicator
        content.endsWith('"'), // Ends mid-string
        !content.includes('}') && content.includes('{'), // Incomplete object
        content.includes('unterminated'), // Error message
      ];

      if (truncationSigns.some(Boolean)) {
        console.warn('🚧 Grammar Engine detected truncated response, attempting repair');
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

      let cleaned = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .replace(/^\s*[\r\n]/gm, '')
        .trim();

      // Fix common issues
      cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');

      return JSON.parse(cleaned);
    } catch (error) {
      console.error('❌ Grammar Engine JSON parsing error:', error);
      console.error('Raw response preview:', typeof response === 'object' ? response.content?.substring(0, 200) : response?.substring(0, 200));
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
        console.log('🔧 Grammar Engine closing unterminated string');
        repaired = repaired.replace(/"[^"]*$/, '""');
      }

      // If missing closing braces, try to add them
      const openBraces = (repaired.match(/{/g) || []).length;
      const closeBraces = (repaired.match(/}/g) || []).length;
      const openArrays = (repaired.match(/\[/g) || []).length;
      const closeArrays = (repaired.match(/]/g) || []).length;

      if (openBraces > closeBraces) {
        const missingClosing = openBraces - closeBraces;
        console.log(`🔧 Grammar Engine adding ${missingClosing} missing closing braces`);
        repaired += '}'.repeat(missingClosing);
      }

      if (openArrays > closeArrays) {
        const missingClosing = openArrays - closeArrays;
        console.log(`🔧 Grammar Engine adding ${missingClosing} missing closing brackets`);
        repaired += ']'.repeat(missingClosing);
      }

      // Remove trailing comma before closing
      repaired = repaired.replace(/,(\s*[}\]])/, '$1');

      return repaired;
    } catch (error) {
      console.warn('🔧 Grammar Engine JSON repair failed, returning original content');
      return content;
    }
  }
  /**
   * Integration method for LessonGeneratorV2
   */
  async generateGrammarSectionForLesson(content, patterns) {
    console.log('🔤 Generating grammar section with Grammar Engine');

    const analysis = await this.analyzeGrammarPatterns(content);
    const mainFocus = analysis.main_grammar_focus || 'Basic Grammar';

    // Generate main grammar explanation
    const explanation = await this.generateGrammarExplanation(mainFocus, content);

    // Generate conjugation tables for main verbs (if any)
    const verbs = this.extractVerbs(content);
    const conjugations = [];

    for (const verb of verbs.slice(0, 2)) { // Limit to 2 main verbs
      const table = await this.generateConjugationTable(verb, 'present');
      conjugations.push(table);
    }

    return {
      focus: mainFocus,
      explanation,
      conjugations,
      patterns: analysis,
      exercises: [] // Will be added by ExerciseBuilder in Phase 3
    };
  }

  /**
   * Extract verbs from content for conjugation
   */
  extractVerbs(content) {
    const verbs = [];

    for (const group of content) {
      for (const item of group.content || []) {
        // Method 1: Direct verb items
        if (item.word_type === 'verb' || item.grammar_category === 'verb') {
          const verb = item.target_phrase?.replace(/^të\s+/, '').trim();
          if (verb) verbs.push(verb);
        }

        // Method 2: Extract verbs from phrases (common Albanian verbs)
        if (item.target_phrase) {
          const commonVerbs = ['është', 'jam', 'jeni', 'janë', 'kam', 'ke', 'ka', 'kemi', 'keni', 'kanë', 'shkoj', 'vij', 'bëj', 'them'];
          const words = item.target_phrase.toLowerCase().split(/\s+/);

          for (const word of words) {
            // Remove punctuation and check if it's a known verb
            const cleanWord = word.replace(/[.,!?]/g, '');
            if (commonVerbs.includes(cleanWord)) {
              verbs.push(cleanWord);
            }
          }
        }
      }
    }

    return [...new Set(verbs)]; // Remove duplicates
  }
}

module.exports = { GrammarEngine };