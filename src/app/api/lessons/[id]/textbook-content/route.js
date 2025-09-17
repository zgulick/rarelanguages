// File: src/app/api/lessons/[id]/textbook-content/route.js
// API endpoint that provides structured content for textbook-style learning

import { query } from '../../../../../../lib/database';

export async function GET(request, { params }) {
  try {
    const { id: lessonId } = await params;

    // Get lesson details with skill and course context
    const lessonResult = await query(`
      SELECT 
        l.*,
        s.name as skill_name,
        s.description as skill_description,
        s.cefr_level,
        lang.name as language_name,
        lang.code as language_code
      FROM lessons l
      JOIN skills s ON l.skill_id = s.id
      JOIN languages lang ON s.language_id = lang.id
      WHERE l.id = $1
    `, [lessonId]);

    if (lessonResult.rows.length === 0) {
      return Response.json({ error: 'Lesson not found' }, { status: 404 });
    }

    const lesson = lessonResult.rows[0];

    // Get lesson content (vocabulary and phrases)
    const contentResult = await query(`
      SELECT 
        id,
        english_phrase,
        target_phrase,
        pronunciation_guide,
        cultural_context,
        difficulty_score,
        exercise_types
      FROM lesson_content
      WHERE lesson_id = $1
      ORDER BY difficulty_score ASC, created_at ASC
    `, [lessonId]);

    const rawContent = contentResult.rows;

    // Structure content for textbook-style teaching
    const structuredContent = createTextbookContent(lesson, rawContent);

    return Response.json({
      success: true,
      lesson: {
        id: lesson.id,
        name: lesson.name,
        description: lesson.description,
        skill_name: lesson.skill_name,
        cefr_level: lesson.cefr_level
      },
      content: structuredContent
    });

  } catch (error) {
    console.error('Failed to load textbook content:', error);
    return Response.json({ error: 'Failed to load lesson content' }, { status: 500 });
  }
}

function createTextbookContent(lesson, rawContent) {
  // Organize content by learning phases
  const vocabulary = organizeVocabulary(rawContent);
  const grammar = extractGrammarConcepts(rawContent, lesson);
  const examples = createUsageExamples(vocabulary);
  const conversationScenario = createConversationScenario(lesson, vocabulary);

  return {
    topic: lesson.name,
    description: lesson.description || `Learn essential ${lesson.skill_name.toLowerCase()} vocabulary`,
    estimatedMinutes: lesson.estimated_minutes || calculateEstimatedTime(vocabulary.length),
    
    // Teaching phase content
    vocabulary: vocabulary,
    grammar: grammar,
    examples: examples,
    
    // Practice phase content  
    practiceExercises: createPracticeExercises(vocabulary),
    
    // Testing phase content
    testExercises: createTestExercises(vocabulary),
    conversationScenario: conversationScenario,
    
    // Review content
    reviewSummary: createReviewSummary(vocabulary, lesson)
  };
}

function organizeVocabulary(rawContent) {
  // Convert raw lesson content into structured vocabulary
  return rawContent.map((item, index) => ({
    id: item.id,
    albanian: item.target_phrase,
    english: item.english_phrase,
    pronunciation: cleanPronunciation(item.pronunciation_guide),
    cultural_context: item.cultural_context,
    difficulty: item.difficulty_score || 5,
    wordNumber: index + 1,
    
    // Add linguistic information
    gender: detectGender(item.target_phrase),
    wordType: detectWordType(item.english_phrase),
    frequency: calculateFrequency(item.target_phrase)
  })).slice(0, 8); // Limit to 8 words for manageable lesson size
}

function extractGrammarConcepts(rawContent, lesson) {
  // Look for grammar patterns in the content
  const verbs = rawContent.filter(item => 
    isVerb(item.target_phrase) || isVerb(item.english_phrase)
  );
  
  if (verbs.length > 0) {
    const mainVerb = verbs[0];
    return {
      concept: extractVerbConcept(mainVerb.target_phrase),
      explanation: generateGrammarExplanation(mainVerb, lesson),
      pattern: generateGrammarPattern(mainVerb.target_phrase),
      examples: generateGrammarExamples(mainVerb.target_phrase),
      conjugations: generateAlbanianConjugations(mainVerb.target_phrase)
    };
  }
  
  // Look for noun patterns
  const nouns = rawContent.filter(item => 
    detectGender(item.target_phrase) !== null
  );
  
  if (nouns.length > 0) {
    return {
      concept: 'Albanian Articles',
      explanation: 'Albanian nouns use definite and indefinite forms',
      pattern: 'noun + definite ending',
      examples: generateArticleExamples(nouns.slice(0, 3))
    };
  }
  
  return null;
}

function createUsageExamples(vocabulary) {
  // Create realistic usage examples
  const examples = [];
  
  vocabulary.slice(0, 4).forEach(word => {
    if (word.cultural_context) {
      examples.push({
        albanian: createExampleSentence(word.albanian, word.wordType),
        english: createExampleSentence(word.english, word.wordType),
        context: word.cultural_context,
        vocabulary_focus: word.albanian
      });
    }
  });
  
  return examples;
}

function createPracticeExercises(vocabulary) {
  return {
    recognition: vocabulary.slice(0, 6).map(word => ({
      type: 'multiple_choice',
      question: `Which word means "${word.english}"?`,
      correct: word.albanian,
      options: generateMultipleChoiceOptions(word, vocabulary),
      hint: word.pronunciation
    })),
    
    audio: vocabulary.slice(0, 4).map(word => ({
      type: 'pronunciation',
      albanian: word.albanian,
      pronunciation: word.pronunciation,
      instruction: 'Listen and repeat'
    })),
    
    pattern: vocabulary.slice(0, 3).map(word => ({
      type: 'fill_blank',
      sentence: createFillBlankSentence(word.albanian),
      correct: word.albanian,
      hint: word.english
    }))
  };
}

function createTestExercises(vocabulary) {
  return {
    recall: vocabulary.slice(0, 5).map(word => ({
      type: 'open_ended',
      question: `How do you say "${word.english}" in Albanian?`,
      correct: word.albanian,
      pronunciation: word.pronunciation,
      cultural_context: word.cultural_context
    })),
    
    translation: vocabulary.slice(0, 3).map(word => ({
      type: 'translation',
      english_sentence: createExampleSentence(word.english, word.wordType),
      albanian_sentence: createExampleSentence(word.albanian, word.wordType),
      focus_word: word.albanian
    }))
  };
}

function createConversationScenario(lesson, vocabulary) {
  // Create realistic conversation based on lesson topic
  const topic = lesson.name.toLowerCase();
  
  if (topic.includes('family')) {
    return {
      title: 'Family Introduction',
      setting: 'Meeting your Albanian relatives for the first time',
      dialogue: [
        {
          speaker: 'You',
          english: 'Hello! Nice to meet you.',
          albanian: 'Mirëdita! Gëzohem që ju njoh.',
          vocabulary_used: ['hello']
        },
        {
          speaker: 'Relative',
          english: 'This is my father.',
          albanian: 'Ky është babai im.',
          vocabulary_used: vocabulary.filter(w => w.english.includes('father')).map(w => w.albanian)
        }
      ],
      cultural_notes: 'Albanian families are very close-knit. Always show respect to elders.'
    };
  }
  
  if (topic.includes('greeting')) {
    return {
      title: 'Daily Greetings',
      setting: 'Starting your day in an Albanian household',
      dialogue: [
        {
          speaker: 'You',
          english: 'Good morning!',
          albanian: 'Mirëmëngjes!',
          vocabulary_used: ['morning']
        },
        {
          speaker: 'Host',
          english: 'Good morning! How are you?',
          albanian: 'Mirëmëngjes! Si jeni?',
          vocabulary_used: ['morning', 'how are you']
        }
      ],
      cultural_notes: 'Albanians always ask about health and family when greeting.'
    };
  }
  
  return {
    title: 'Practice Conversation',
    setting: 'Using your new vocabulary in context',
    dialogue: vocabulary.slice(0, 2).map(word => ({
      speaker: 'Practice',
      english: `Use "${word.english}" in a sentence`,
      albanian: createExampleSentence(word.albanian, word.wordType),
      vocabulary_used: [word.albanian]
    })),
    cultural_notes: 'Practice using these words in everyday situations.'
  };
}

function createReviewSummary(vocabulary, lesson) {
  return {
    key_vocabulary: vocabulary.slice(0, 5).map(word => ({
      albanian: word.albanian,
      english: word.english,
      pronunciation: word.pronunciation
    })),
    
    key_grammar: lesson.skill_name.includes('verb') ? 
      [`${lesson.name} conjugation patterns`] : 
      [`${lesson.name} vocabulary usage`],
    
    essential_phrases: vocabulary.slice(0, 3).map(word => 
      createExampleSentence(word.albanian, word.wordType)
    ),
    
    next_lesson_prep: `Review these ${vocabulary.length} words throughout the day. Next lesson will build on this vocabulary.`,
    
    study_tips: [
      'Practice pronunciation daily',
      'Use new words in sentences',
      'Connect words to Albanian culture'
    ]
  };
}

// Helper functions for Albanian linguistic analysis
function cleanPronunciation(pronunciation) {
  if (!pronunciation) return '';
  
  // Convert complex phonetic notation to simple English
  return pronunciation
    .replace(/\[|\]/g, '') // Remove brackets
    .replace(/ɟ/g, 'j')    // Albanian j sound
    .replace(/ʃ/g, 'sh')   // sh sound
    .replace(/ə/g, 'uh')   // schwa
    .replace(/ˈ/g, '')     // stress marks
    .toUpperCase();
}

function detectGender(albanianWord) {
  if (!albanianWord) return null;
  
  // Albanian gender patterns
  if (albanianWord.match(/\b(babai|baba|djali|burri|ati)\b/)) return 'masculine';
  if (albanianWord.match(/\b(nëna|nënë|vajza|gruaja|ema)\b/)) return 'feminine';
  if (albanianWord.includes(' i ') || albanianWord.endsWith(' i')) return 'masculine';
  if (albanianWord.includes(' e ') || albanianWord.endsWith(' e')) return 'feminine';
  
  return null;
}

function detectWordType(englishPhrase) {
  if (englishPhrase.match(/\b(is|am|are|was|were)\b/)) return 'verb';
  if (englishPhrase.match(/\b(father|mother|son|daughter|family)\b/)) return 'family_noun';
  if (englishPhrase.match(/\b(hello|goodbye|please|thank)\b/)) return 'greeting';
  if (englishPhrase.match(/\b(one|two|three|number)\b/)) return 'number';
  
  return 'general';
}

function isVerb(phrase) {
  if (!phrase) return false;
  
  const verbPatterns = ['oj', 'aj', 'ej', 'em', 'im'];
  const commonVerbs = ['jam', 'kam', 'shkoj', 'vij', 'flas'];
  
  return verbPatterns.some(ending => phrase.endsWith(ending)) || 
         commonVerbs.some(verb => phrase.includes(verb));
}

function generateAlbanianConjugations(verb) {
  if (!verb) return null;
  
  // Basic Albanian verb conjugation patterns
  if (verb === 'jam') {
    return {
      present: {
        'unë': 'jam',
        'ti': 'je', 
        'ai/ajo': 'është',
        'ne': 'jemi',
        'ju': 'jeni',
        'ata/ato': 'janë'
      }
    };
  }
  
  if (verb.endsWith('oj')) {
    const root = verb.slice(0, -2);
    return {
      present: {
        'unë': `${root}oj`,
        'ti': `${root}on`,
        'ai/ajo': `${root}on`,
        'ne': `${root}ojmë`,
        'ju': `${root}oni`,
        'ata/ato': `${root}ojnë`
      }
    };
  }
  
  return null;
}

function generateGrammarExplanation(verb, lesson) {
  if (verb.target_phrase === 'jam') {
    return 'The verb "to be" (jam) is irregular and essential for introducing people and describing things.';
  }
  
  if (verb.target_phrase.endsWith('oj')) {
    return 'Regular Albanian verbs ending in -oj follow a predictable pattern for each person.';
  }
  
  return `This grammar helps you use ${lesson.name.toLowerCase()} vocabulary correctly.`;
}

function generateGrammarPattern(verb) {
  if (verb === 'jam') {
    return 'Subject + form of "jam" + description';
  }
  
  return 'Subject + verb form + object';
}

function generateGrammarExamples(verb) {
  if (verb === 'jam') {
    return [
      { albanian: 'Unë jam student', english: 'I am a student' },
      { albanian: 'Ti je shumë i mirë', english: 'You are very good' }
    ];
  }
  
  return [
    { albanian: `Unë ${verb}`, english: `I ${verb}` },
    { albanian: `Ti ${verb.replace(/oj$/, 'on')}`, english: `You ${verb}` }
  ];
}

function createExampleSentence(word, wordType) {
  // Create realistic example sentences
  const patterns = {
    family_noun: {
      albanian: `Ky është ${word} im`,
      english: `This is my ${word}`
    },
    greeting: {
      albanian: word,
      english: word
    },
    general: {
      albanian: `${word} është i mirë`,
      english: `${word} is good`
    }
  };
  
  return patterns[wordType] || patterns.general;
}

function createFillBlankSentence(albanianWord) {
  return `Ky është _____ im`; // This is my _____
}

function generateMultipleChoiceOptions(correct, allVocabulary) {
  const incorrect = allVocabulary
    .filter(word => word.albanian !== correct.albanian)
    .slice(0, 3)
    .map(word => word.albanian);
  
  const options = [correct.albanian, ...incorrect];
  return shuffleArray(options);
}

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function calculateEstimatedTime(vocabularyCount) {
  // Estimate based on textbook methodology
  const teachingTime = vocabularyCount * 1; // 1 minute per word
  const practiceTime = vocabularyCount * 0.5; // 30 seconds practice each
  const testingTime = vocabularyCount * 0.5; // 30 seconds test each
  
  return Math.round(teachingTime + practiceTime + testingTime);
}

function calculateFrequency(word) {
  // Simple frequency ranking for common Albanian words
  const highFreq = ['babai', 'nëna', 'jam', 'është', 'mirëmëngjes'];
  if (highFreq.includes(word)) return 'high';
  
  return 'medium';
}

function extractVerbConcept(verb) {
  if (verb === 'jam') return 'The verb "to be"';
  if (verb.endsWith('oj')) return 'Regular -oj verbs';
  
  return 'Verb usage';
}

function generateArticleExamples(nouns) {
  return nouns.map(noun => ({
    indefinite: noun.albanian.replace(/ai$|a$/, ''),
    definite: noun.albanian,
    english: noun.english
  }));
}