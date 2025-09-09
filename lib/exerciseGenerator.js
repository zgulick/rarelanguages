/**
 * Dynamic Exercise Generator
 * Generates grammar-based exercises from the verb database instead of hardcoded content
 */

class DynamicExerciseGenerator {
  constructor() {
    this.apiBase = '/api/grammar';
    this.verbCache = new Map();
    this.patternsCache = null;
  }

  /**
   * Generate a conjugation exercise
   */
  async generateConjugationExercise(options = {}) {
    const { 
      language = 'gheg-al',
      tense = 'present',
      difficulty = 'beginner',
      topicContext = null
    } = options;

    try {
      // Get available verbs
      const verbs = await this.getVerbs(language, 50);
      
      if (!verbs || verbs.length === 0) {
        throw new Error('No verbs available for exercise generation');
      }

      // Select verb based on difficulty and context
      const verb = this.selectVerbByDifficulty(verbs, difficulty, topicContext);
      
      // Select random person for conjugation
      const persons = ['unë', 'ti', 'ai/ajo', 'ne', 'ju', 'ata/ato'];
      const randomPerson = persons[Math.floor(Math.random() * persons.length)];
      
      // Get correct conjugation
      const conjugation = verb.conjugations[tense]?.[randomPerson];
      
      if (!conjugation) {
        throw new Error(`Conjugation not available for ${verb.infinitive} in ${tense} tense`);
      }
      
      // Generate wrong options from other conjugations
      const wrongOptions = this.generateWrongOptions(verb, randomPerson, tense);
      
      // Create exercise
      return {
        type: 'conjugation',
        verb: verb.infinitive,
        english: verb.english_translation,
        person: randomPerson,
        tense,
        correct: conjugation,
        options: this.shuffleArray([conjugation, ...wrongOptions]),
        prompt: this.generatePrompt(verb, randomPerson, tense),
        explanation: this.generateExplanation(verb, randomPerson, tense),
        cultural_context: this.getCulturalContext(verb),
        difficulty: difficulty
      };

    } catch (error) {
      console.error('Error generating conjugation exercise:', error);
      // Fallback to basic exercise with error info
      return this.generateFallbackExercise(error.message);
    }
  }

  /**
   * Generate a fill-in-the-blank exercise with verbs
   */
  async generateFillBlankExercise(options = {}) {
    const { 
      language = 'gheg-al',
      tense = 'present',
      difficulty = 'beginner' 
    } = options;

    try {
      const verbs = await this.getVerbs(language, 30);
      const verb = this.selectVerbByDifficulty(verbs, difficulty);
      
      const persons = ['unë', 'ti', 'ai/ajo', 'ne', 'ju', 'ata/ato'];
      const randomPerson = persons[Math.floor(Math.random() * persons.length)];
      
      const conjugation = verb.conjugations[tense][randomPerson];
      const exampleSentence = this.generateSentenceWithBlank(verb, randomPerson, tense);
      
      // Generate multiple choice options
      const wrongOptions = this.generateWrongOptions(verb, randomPerson, tense);
      
      return {
        type: 'fill_blank',
        verb: verb.infinitive,
        english: verb.english_translation,
        sentence: exampleSentence,
        correct: conjugation,
        options: this.shuffleArray([conjugation, ...wrongOptions]),
        explanation: `The sentence requires ${verb.infinitive} conjugated for ${randomPerson} in ${tense} tense.`,
        difficulty: difficulty
      };

    } catch (error) {
      console.error('Error generating fill-blank exercise:', error);
      return this.generateFallbackExercise(error.message);
    }
  }

  /**
   * Generate pattern recognition exercise
   */
  async generatePatternExercise(options = {}) {
    const { language = 'gheg-al' } = options;

    try {
      const patterns = await this.getVerbPatterns(language);
      const pattern = patterns[Math.floor(Math.random() * patterns.length)];
      
      const exampleVerbs = pattern.example_verbs || [];
      const verb = exampleVerbs[Math.floor(Math.random() * exampleVerbs.length)];
      
      if (!verb) {
        throw new Error('No example verbs available for pattern exercise');
      }

      // Get full verb data
      const verbs = await this.getVerbs(language, 100);
      const verbData = verbs.find(v => v.infinitive === verb);
      
      if (!verbData) {
        throw new Error(`Verb data not found for ${verb}`);
      }

      return {
        type: 'pattern_recognition',
        pattern: pattern.pattern_name,
        verb: verbData.infinitive,
        english: verbData.english_translation,
        description: pattern.description,
        example_conjugation: verbData.conjugations.present,
        question: `What pattern does the verb "${verb}" follow?`,
        correct: pattern.pattern_name,
        explanation: pattern.description
      };

    } catch (error) {
      console.error('Error generating pattern exercise:', error);
      return this.generateFallbackExercise(error.message);
    }
  }

  /**
   * Get verbs from API with caching
   */
  async getVerbs(language, limit = 50) {
    const cacheKey = `${language}_${limit}`;
    
    if (this.verbCache.has(cacheKey)) {
      return this.verbCache.get(cacheKey);
    }

    try {
      const response = await fetch(`${this.apiBase}/verbs?language=${language}&limit=${limit}`);
      const data = await response.json();
      
      if (data.success && data.verbs) {
        this.verbCache.set(cacheKey, data.verbs);
        return data.verbs;
      } else {
        throw new Error('Failed to fetch verbs from API');
      }
    } catch (error) {
      console.error('Error fetching verbs:', error);
      return [];
    }
  }

  /**
   * Get verb patterns from API with caching
   */
  async getVerbPatterns(language) {
    if (this.patternsCache) {
      return this.patternsCache;
    }

    try {
      const response = await fetch(`${this.apiBase}/patterns?language=${language}`);
      const data = await response.json();
      
      if (data.success && data.patterns) {
        this.patternsCache = data.patterns;
        return data.patterns;
      } else {
        throw new Error('Failed to fetch patterns from API');
      }
    } catch (error) {
      console.error('Error fetching patterns:', error);
      return [];
    }
  }

  /**
   * Select verb based on difficulty level and topic context
   */
  selectVerbByDifficulty(verbs, difficulty, topicContext = null) {
    let filteredVerbs = verbs;

    // Filter by topic context if provided
    if (topicContext) {
      filteredVerbs = verbs.filter(verb => 
        verb.usage_examples?.some(example => 
          example.albanian?.toLowerCase().includes(topicContext.toLowerCase()) ||
          example.english?.toLowerCase().includes(topicContext.toLowerCase())
        ) || verb.cultural_notes?.toLowerCase().includes(topicContext.toLowerCase())
      );
      
      // If no topic-specific verbs, fall back to all verbs
      if (filteredVerbs.length === 0) {
        filteredVerbs = verbs;
      }
    }

    // Select by frequency rank based on difficulty
    if (difficulty === 'beginner') {
      // Use top 20 most frequent verbs
      filteredVerbs = filteredVerbs.filter(v => v.frequency_rank <= 20);
    } else if (difficulty === 'intermediate') {
      // Use verbs ranked 21-60
      filteredVerbs = filteredVerbs.filter(v => v.frequency_rank > 20 && v.frequency_rank <= 60);
    } else if (difficulty === 'advanced') {
      // Use any verb (including less frequent ones)
      filteredVerbs = filteredVerbs.filter(v => v.frequency_rank > 60 || v.frequency_rank <= 100);
    }

    // Fallback if no verbs match criteria
    if (filteredVerbs.length === 0) {
      filteredVerbs = verbs.slice(0, 30); // Use top 30 as fallback
    }

    return filteredVerbs[Math.floor(Math.random() * filteredVerbs.length)];
  }

  /**
   * Generate wrong answer options for multiple choice
   */
  generateWrongOptions(verb, person, tense, count = 3) {
    const conjugations = verb.conjugations[tense];
    const correct = conjugations[person];
    
    // Get other conjugations from same verb as wrong answers
    const otherConjugations = Object.values(conjugations)
      .filter(c => c !== correct && c)
      .slice(0, count);
    
    // If not enough conjugations from same verb, generate common wrong patterns
    while (otherConjugations.length < count) {
      const wrongOption = this.generateCommonMistake(verb.infinitive, person, tense);
      if (wrongOption && !otherConjugations.includes(wrongOption) && wrongOption !== correct) {
        otherConjugations.push(wrongOption);
      } else {
        // Fallback: modify the correct answer slightly
        otherConjugations.push(correct + 'x');
        break;
      }
    }
    
    return otherConjugations.slice(0, count);
  }

  /**
   * Generate common grammatical mistakes for wrong options
   */
  generateCommonMistake(infinitive, person, tense) {
    // Common Albanian conjugation mistakes
    const stem = infinitive.replace(/j$/, ''); // Remove -j ending
    
    const commonMistakes = {
      'present': {
        'unë': stem + 'am',  // Wrong ending
        'ti': stem + 'as',   // Wrong ending
        'ne': stem + 'emi',  // Wrong ending
        'ju': stem + 'eni'   // Wrong ending
      }
    };
    
    return commonMistakes[tense]?.[person] || infinitive;
  }

  /**
   * Generate exercise prompt text
   */
  generatePrompt(verb, person, tense) {
    const personTranslations = {
      'unë': 'I',
      'ti': 'you',
      'ai/ajo': 'he/she',
      'ne': 'we', 
      'ju': 'you all',
      'ata/ato': 'they'
    };

    const englishVerb = verb.english_translation.replace('to ', '');
    const pronoun = personTranslations[person];
    
    return `${person} _____ (${pronoun} ${englishVerb})`;
  }

  /**
   * Generate explanation for the correct answer
   */
  generateExplanation(verb, person, tense) {
    const pattern = verb.pattern_name || 'unknown pattern';
    return `"${verb.infinitive}" (${verb.english_translation}) follows the ${pattern} and conjugates to "${verb.conjugations[tense][person]}" for ${person} in ${tense} tense.`;
  }

  /**
   * Generate sentence with blank for fill-in exercises
   */
  generateSentenceWithBlank(verb, person, tense) {
    // Use existing usage examples or generate simple sentences
    if (verb.usage_examples && verb.usage_examples.length > 0) {
      const example = verb.usage_examples[0];
      return example.albanian.replace(verb.conjugations[tense][person], '____');
    }
    
    // Fallback: generate simple sentence
    const sentences = {
      'unë': `Unë ____ ${this.getSimpleObject(verb)}`,
      'ti': `Ti ____ ${this.getSimpleObject(verb)}`, 
      'ai/ajo': `Ai/Ajo ____ ${this.getSimpleObject(verb)}`,
      'ne': `Ne ____ ${this.getSimpleObject(verb)}`,
      'ju': `Ju ____ ${this.getSimpleObject(verb)}`,
      'ata/ato': `Ata/Ato ____ ${this.getSimpleObject(verb)}`
    };
    
    return sentences[person] || `${person} ____ sot`;
  }

  /**
   * Get simple object for sentence generation
   */
  getSimpleObject(verb) {
    const objects = {
      'luaj': 'futboll',
      'ha': 'bukë', 
      'pi': 'ujë',
      'flas': 'shqip',
      'punoj': 'shumë',
      'studoj': 'gjermanishte'
    };
    
    return objects[verb.infinitive] || 'mirë';
  }

  /**
   * Get cultural context for verb if available
   */
  getCulturalContext(verb) {
    return verb.cultural_notes || null;
  }

  /**
   * Shuffle array elements
   */
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Generate fallback exercise when grammar engine fails
   */
  generateFallbackExercise(errorMessage) {
    return {
      type: 'fallback',
      error: true,
      message: 'Grammar engine not ready yet',
      prompt: 'Complete the sentence: Unë ____ shqip (I speak Albanian)',
      correct: 'flas',
      options: ['flas', 'flasim', 'flasin', 'flet'],
      explanation: 'This is a fallback exercise. The grammar engine is still being generated.',
      debug_error: errorMessage
    };
  }

  /**
   * Clear caches (useful for testing)
   */
  clearCache() {
    this.verbCache.clear();
    this.patternsCache = null;
  }
}

// Browser/Node.js compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DynamicExerciseGenerator;
} else if (typeof window !== 'undefined') {
  window.DynamicExerciseGenerator = DynamicExerciseGenerator;
}