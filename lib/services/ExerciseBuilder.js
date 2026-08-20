/**
 * Exercise Builder Service
 * Creates varied, progressive exercises that reinforce lesson content
 * Chunk 3.1 of the masterplan
 */

const { OpenAIClient } = require('../openai');

class ExerciseBuilder {
  constructor() {
    this.openaiClient = new OpenAIClient();
    this.exerciseCache = new Map();

    // Exercise progression framework
    this.EXERCISE_PROGRESSION = {
      beginner: {
        recognition: 0.50,      // Mostly recognition
        guided_practice: 0.35,  // Some guided practice
        production: 0.10,       // Minimal production
        real_world: 0.05       // Basic scenarios only
      },
      intermediate: {
        recognition: 0.20,
        guided_practice: 0.35,
        production: 0.30,
        real_world: 0.15
      },
      advanced: {
        recognition: 0.10,
        guided_practice: 0.20,
        production: 0.40,
        real_world: 0.30
      }
    };
  }

  /**
   * Main function: Generate complete exercise set for a lesson
   */
  async addExercises(lessonContent, difficulty = 'beginner') {
    console.log(`🏋️ Generating exercises for lesson: "${lessonContent.title}"`);

    const exercises = {
      recognition: [],
      guided_practice: [],
      production: [],
      real_world: [],
      assessment: []
    };

    try {
      // Generate exercises based on vocabulary
      if (lessonContent.vocabulary?.words) {
        console.log('📚 Generating vocabulary exercises...');
        const vocabExercises = await this.generateVocabularyExercises(
          lessonContent.vocabulary.words,
          difficulty
        );
        exercises.recognition.push(...vocabExercises.recognition);
        exercises.guided_practice.push(...vocabExercises.guided);
      }

      // Generate exercises based on grammar
      if (lessonContent.grammar?.conjugations) {
        console.log('🔤 Generating grammar exercises...');
        const grammarExercises = await this.generateGrammarExercises(
          lessonContent.grammar,
          difficulty
        );
        exercises.guided_practice.push(...grammarExercises.guided);
        exercises.production.push(...grammarExercises.production);
      }

      // Generate pattern recognition exercises
      if (lessonContent.pattern_recognition?.patterns) {
        console.log('🧠 Generating pattern exercises...');
        const patternExercises = await this.generatePatternExercises(
          lessonContent.pattern_recognition,
          difficulty
        );
        exercises.recognition.push(...patternExercises);
      }

      // Generate real-world scenarios
      console.log('🌍 Generating real-world scenarios...');
      const scenarios = await this.generateRealWorldExercises(
        lessonContent,
        lessonContent.cultural_notes || [],
        difficulty
      );
      exercises.real_world.push(...scenarios);

      // Create comprehensive assessment
      console.log('📝 Generating lesson assessment...');
      const assessment = await this.generateAssessmentExercises(lessonContent);
      exercises.assessment.push(assessment);

      // Apply progression framework
      const balancedExercises = this.balanceExerciseTypes(exercises, difficulty);

      console.log(`✅ Generated ${this.getTotalExerciseCount(balancedExercises)} exercises`);

      return {
        ...lessonContent,
        exercises: balancedExercises
      };

    } catch (error) {
      console.error('❌ Exercise generation failed:', error);
      return {
        ...lessonContent,
        exercises: this.generateFallbackExercises(lessonContent)
      };
    }
  }

  /**
   * Generate recognition exercises for initial exposure
   */
  async generateRecognitionExercises(vocabulary, patterns) {
    const exercises = [];

    // Multiple Choice Recognition
    for (const word of vocabulary.slice(0, 5)) {
      exercises.push({
        type: "multiple_choice",
        instruction: `Select the Albanian word for '${word.english}'`,
        question: word.english,
        options: this.generateOptions(word.target, vocabulary),
        correct: word.target,
        feedback: {
          correct: `Excellent! '${word.target}' means ${word.english}.`,
          incorrect: `Not quite. '${word.target}' means ${word.english}. Try to remember the sound pattern.`
        }
      });
    }

    // Audio Recognition
    for (const word of vocabulary.slice(0, 3)) {
      if (word.pronunciation) {
        exercises.push({
          type: "audio_recognition",
          instruction: "Which word do you hear?",
          audio_text: word.target,
          audio_pronunciation: word.pronunciation.sounds_like,
          options: this.generateTextOptions([word.english], vocabulary),
          correct: word.english,
          feedback: {
            correct: `Perfect! '${word.target}' sounds like '${word.pronunciation.sounds_like}' and means ${word.english}.`,
            incorrect: `Listen again. '${word.target}' means ${word.english}.`
          }
        });
      }
    }

    // Matching Exercise
    if (vocabulary.length >= 4) {
      exercises.push({
        type: "matching",
        instruction: "Match Albanian words with their English meanings",
        pairs: vocabulary.slice(0, 4).map(word => ({
          left: word.target,
          right: word.english
        })),
        randomize: true
      });
    }

    return exercises;
  }

  /**
   * Generate guided practice exercises with scaffolding
   */
  async generateGuidedPracticeExercises(content) {
    const exercises = [];
    const vocabulary = content.vocabulary?.words || [];

    // Fill in the Blank with Word Bank
    for (const word of vocabulary.slice(0, 3)) {
      if (word.example_sentence) {
        exercises.push({
          type: "fill_blank_wordbank",
          instruction: "Complete the sentence using words from the bank",
          sentence: word.example_sentence.target.replace(word.target, '___'),
          translation: word.example_sentence.english,
          wordbank: this.generateWordBank(word.target, vocabulary),
          correct: word.target,
          hints: [
            "Think about the meaning first",
            `This word means '${word.english}'`
          ]
        });
      }
    }

    // Sentence Building
    if (vocabulary.length >= 3) {
      const sentence = this.createSentenceBuildingExercise(vocabulary);
      if (sentence) {
        exercises.push(sentence);
      }
    }

    // Conjugation Practice (if grammar available)
    if (content.grammar?.conjugations) {
      for (const conjugation of content.grammar.conjugations.slice(0, 2)) {
        exercises.push({
          type: "conjugation_practice",
          instruction: "Complete the conjugation",
          verb: conjugation.verb,
          prompt: `Ti _____ (you ${conjugation.verb.split(' ')[1] || 'verb'})`,
          correct: conjugation.conjugations?.[1]?.albanian?.split(' ')[1] || 'unknown',
          pattern_hint: "Second person singular form"
        });
      }
    }

    return exercises;
  }

  /**
   * Generate production exercises requiring active creation
   */
  async generateProductionExercises(content, level) {
    const exercises = [];
    const vocabulary = content.vocabulary?.words || [];

    // Translation Production
    for (const word of vocabulary.slice(0, 3)) {
      exercises.push({
        type: "translation_production",
        instruction: "Translate to Albanian",
        english: `I have ${word.english}`,
        acceptable_answers: [
          `Unë kam ${word.target}`,
          `Kam ${word.target}` // Pronoun optional
        ],
        hints_available: 2,
        hints: [
          "Start with the subject (I)",
          `${word.english} = ${word.target}`
        ],
        feedback_points: [
          "Check word order",
          "Remember the verb 'kam' (have)"
        ]
      });
    }

    // Free Response
    if (vocabulary.length > 0) {
      const randomWord = vocabulary[0];
      exercises.push({
        type: "free_response",
        instruction: `Write a sentence using '${randomWord.target}' (${randomWord.english})`,
        requirements: [
          `Must include '${randomWord.target}'`,
          "Must be grammatically correct",
          "Minimum 3 words"
        ],
        example_answers: [
          randomWord.example_sentence?.target || `Unë kam ${randomWord.target}.`
        ],
        ai_evaluation_criteria: [
          `Contains '${randomWord.target}'`,
          "Grammatically correct",
          "Makes sense contextually"
        ]
      });
    }

    return exercises;
  }

  /**
   * Generate real-world application exercises
   */
  async generateRealWorldExercises(lessonContent, culturalNotes, difficulty) {
    const exercises = [];

    // Scenario Response
    exercises.push({
      type: "scenario_response",
      instruction: "How would you respond in this situation?",
      scenario: "You're at a shop in Kosovo. The shopkeeper asks 'Sa doni?' (How many do you want?)",
      context_image_description: "Albanian shop interior",
      correct_responses: [
        "Dy, ju lutem",
        "Tre dua",
        "Një mjafton"
      ],
      cultural_note: "Keep responses brief and polite. 'Ju lutem' means 'please'"
    });

    // Role Play
    exercises.push({
      type: "role_play",
      instruction: "Practice at a café",
      roles: {
        user: "Customer",
        ai: "Server"
      },
      script_outline: [
        "Greeting",
        "Order (use numbers)",
        "Clarification",
        "Thank you"
      ],
      required_elements: ["number", "please", "thank you"],
      vocabulary_support: {
        "coffee": "kafe",
        "please": "ju lutem",
        "thank you": "faleminderit",
        "how many": "sa"
      }
    });

    return exercises;
  }

  /**
   * Generate comprehensive lesson assessment
   */
  async generateAssessmentExercises(lessonContent) {
    const vocabulary = lessonContent.vocabulary?.words || [];

    return {
      type: "lesson_assessment",
      sections: [
        {
          name: "Vocabulary Check",
          exercises: await this.generateQuickVocabCheck(vocabulary.slice(0, 5)),
          weight: 0.3
        },
        {
          name: "Grammar Application",
          exercises: await this.generateGrammarCheck(lessonContent.grammar),
          weight: 0.3
        },
        {
          name: "Practical Use",
          exercises: await this.generatePracticalCheck(lessonContent),
          weight: 0.4
        }
      ],
      passing_score: 0.7,
      feedback_levels: {
        excellent: "Outstanding! Ready for the next lesson!",
        good: "Well done! Review the pattern section once more.",
        needs_work: "Review the vocabulary and grammar sections, then try again."
      }
    };
  }

  /**
   * Generate vocabulary exercises from words
   */
  async generateVocabularyExercises(words, difficulty) {
    const recognition = await this.generateRecognitionExercises(words, []);
    const guided = words.slice(0, 3).map(word => ({
      type: "flashcard_review",
      front: word.english,
      back: word.target,
      pronunciation: word.pronunciation?.sounds_like,
      memory_aid: word.memory_aid
    }));

    return { recognition, guided };
  }

  /**
   * Generate grammar exercises
   */
  async generateGrammarExercises(grammar, difficulty) {
    const guided = [{
      type: "grammar_explanation_practice",
      rule: grammar.focus,
      examples: grammar.explanation?.practice_sentences || [],
      practice_type: "pattern_identification"
    }];

    const production = [{
      type: "grammar_application",
      rule: grammar.focus,
      prompt: "Create a sentence demonstrating this grammar rule",
      evaluation_criteria: ["Follows the rule", "Makes sense", "Uses lesson vocabulary"]
    }];

    return { guided, production };
  }

  /**
   * Generate pattern recognition exercises
   */
  async generatePatternExercises(patternRecognition, difficulty) {
    return patternRecognition.patterns.map(pattern => ({
      type: "pattern_identification",
      instruction: `Identify the pattern: ${pattern.pattern_name}`,
      examples: pattern.examples,
      question: "Which examples follow this pattern?",
      teaching_point: pattern.explanation
    }));
  }

  // Helper methods

  generateOptions(correct, vocabulary) {
    const others = vocabulary.filter(w => w.target !== correct)
                           .slice(0, 3)
                           .map(w => w.target);
    return this.shuffleArray([correct, ...others]);
  }

  generateTextOptions(correct, vocabulary) {
    const others = vocabulary.filter(w => !correct.includes(w.english))
                           .slice(0, 3)
                           .map(w => w.english);
    return this.shuffleArray([...correct, ...others]);
  }

  generateWordBank(target, vocabulary) {
    const others = vocabulary.filter(w => w.target !== target)
                           .slice(0, 3)
                           .map(w => w.target);
    return this.shuffleArray([target, ...others]);
  }

  createSentenceBuildingExercise(vocabulary) {
    if (vocabulary.length < 2) return null;

    const word1 = vocabulary[0];
    const word2 = vocabulary[1] || vocabulary[0];

    return {
      type: "sentence_builder",
      instruction: `Arrange words to form: 'I have ${word1.english}'`,
      words: [word1.target, "kam", "Unë"],
      correct_order: ["Unë", "kam", word1.target],
      translation: `I have ${word1.english}`,
      grammar_note: "Remember: Subject-Verb-Object order"
    };
  }

  async generateQuickVocabCheck(words) {
    return words.map(word => ({
      type: "quick_translation",
      question: word.english,
      answer: word.target,
      points: 1
    }));
  }

  async generateGrammarCheck(grammar) {
    if (!grammar) return [];

    return [{
      type: "grammar_rule_application",
      rule: grammar.focus,
      points: 2,
      example_required: true
    }];
  }

  async generatePracticalCheck(lessonContent) {
    return [{
      type: "practical_scenario",
      scenario: "Use what you learned in a real situation",
      requirements: ["Use lesson vocabulary", "Apply grammar rules", "Make cultural sense"],
      points: 3
    }];
  }

  balanceExerciseTypes(exercises, difficulty) {
    const progression = this.EXERCISE_PROGRESSION[difficulty] || this.EXERCISE_PROGRESSION.beginner;

    // Apply progression ratios (simplified - can be enhanced)
    return {
      recognition: exercises.recognition.slice(0, Math.max(2, Math.floor(exercises.recognition.length * progression.recognition))),
      guided_practice: exercises.guided_practice.slice(0, Math.max(2, Math.floor(exercises.guided_practice.length * progression.guided_practice))),
      production: exercises.production.slice(0, Math.max(1, Math.floor(exercises.production.length * progression.production))),
      real_world: exercises.real_world.slice(0, Math.max(1, Math.floor(exercises.real_world.length * progression.real_world))),
      assessment: exercises.assessment
    };
  }

  getTotalExerciseCount(exercises) {
    return Object.values(exercises).reduce((total, arr) => {
      return total + (Array.isArray(arr) ? arr.length : 1);
    }, 0);
  }

  generateFallbackExercises(lessonContent) {
    return {
      recognition: [
        {
          type: "basic_review",
          instruction: "Review the lesson content",
          content: lessonContent.vocabulary?.words?.slice(0, 3) || []
        }
      ],
      guided_practice: [],
      production: [],
      real_world: [],
      assessment: []
    };
  }

  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Adjust exercise difficulty based on user performance
   */
  adjustDifficulty(exercises, userPerformance) {
    if (userPerformance.accuracy < 0.6) {
      // Add more recognition, reduce production
      return this.simplifyExercises(exercises);
    }
    if (userPerformance.accuracy > 0.9) {
      // Add more production, add challenges
      return this.addChallenges(exercises);
    }
    return exercises;
  }

  simplifyExercises(exercises) {
    // Add more recognition exercises, reduce production difficulty
    return {
      ...exercises,
      recognition: [...exercises.recognition, ...exercises.production.slice(0, 2)],
      production: exercises.production.slice(0, 1)
    };
  }

  addChallenges(exercises) {
    // Add more complex production exercises
    return {
      ...exercises,
      production: [...exercises.production, {
        type: "advanced_production",
        instruction: "Create multiple sentences using lesson concepts",
        requirements: ["Use at least 3 vocabulary words", "Apply grammar rules", "Show creativity"]
      }]
    };
  }

  getStats() {
    return {
      exercisesGenerated: this.exerciseCache.size,
      cacheSize: this.exerciseCache.size
    };
  }
}

module.exports = { ExerciseBuilder };