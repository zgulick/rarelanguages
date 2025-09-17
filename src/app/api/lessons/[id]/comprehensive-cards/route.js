// File: src/app/api/lessons/[lessonId]/comprehensive-cards/route.js
import { query } from '../../../../../../lib/database';

export async function GET(request, { params }) {
  try {
    const { id: lessonId } = await params;

    // Get lesson info
    const lessonResult = await query(`
      SELECT l.*, s.name as skill_name, s.cefr_level
      FROM lessons l
      JOIN skills s ON l.skill_id = s.id
      WHERE l.id = $1
    `, [lessonId]);

    if (lessonResult.rows.length === 0) {
      return Response.json({ error: 'Lesson not found' }, { status: 404 });
    }

    const lesson = lessonResult.rows[0];

    // Get all content for this lesson
    const contentResult = await query(`
      SELECT 
        lc.*,
        v.infinitive,
        v.conjugations,
        v.frequency_rank
      FROM lesson_content lc
      LEFT JOIN verbs v ON lc.target_phrase = v.infinitive OR lc.target_phrase ILIKE '%' || v.infinitive || '%'
      WHERE lc.lesson_id = $1
      ORDER BY lc.difficulty_score, lc.id
    `, [lessonId]);

    const content = contentResult.rows;

    // Check if we have comprehensive lesson data
    const comprehensiveResult = await query(`
      SELECT 
        lv.*,
        lv.albanian_term,
        lv.english_term,
        lv.pronunciation,
        lv.gender,
        lv.example_sentence,
        lv.english_translation,
        lv.difficulty_level
      FROM lesson_vocabulary lv
      WHERE lv.lesson_id = $1
      ORDER BY lv.difficulty_level, lv.id
    `, [lessonId]);

    let cards = [];

    if (comprehensiveResult.rows.length > 0) {
      // Generate cards from comprehensive data
      cards = generateComprehensiveCards(comprehensiveResult.rows, lesson);
    } else {
      // Generate cards from basic lesson content
      cards = generateBasicCards(content, lesson);
    }

    // Get verb conjugations from database
    let verbs = [];
    if (content.length > 0) {
      const placeholders = content.map((_, i) => `$${i + 2}`).join(',');
      const verbsResult = await query(`
        SELECT * FROM verbs 
        WHERE language_id = (
          SELECT language_id FROM skills s
          WHERE s.id = $1
        )
        AND infinitive IN (${placeholders})
      `, [lesson.skill_id, ...content.map(c => c.target_phrase)]);
      verbs = verbsResult.rows;
    }

    // Enhance cards with verb data
    cards = enhanceCardsWithVerbData(cards, verbs);

    return Response.json({
      success: true,
      lesson: lesson,
      cards: cards,
      total_cards: cards.length
    });

  } catch (error) {
    console.error('Failed to load comprehensive cards:', error);
    return Response.json({ error: 'Failed to load comprehensive cards' }, { status: 500 });
  }
}

function generateComprehensiveCards(comprehensiveData, lesson) {
  const cards = [];
  const vocabularyMap = new Map();

  // Group vocabulary by term
  comprehensiveData.forEach(row => {
    if (!vocabularyMap.has(row.albanian_term)) {
      vocabularyMap.set(row.albanian_term, row);
    }
  });

  vocabularyMap.forEach((vocab, term) => {
    // Main vocabulary card
    cards.push({
      id: `vocab_${vocab.id}`,
      type: 'vocabulary',
      difficulty_level: vocab.difficulty_level,
      content_id: vocab.id,
      front: vocab.english_term,
      back: {
        albanian: vocab.albanian_term,
        pronunciation: vocab.pronunciation,
        gender: vocab.gender,
        example_sentence: vocab.example_sentence,
        english_translation: vocab.english_translation,
        cultural_context: extractCulturalContext(vocab.albanian_term),
        variations: generateAlbanianVariations(vocab.albanian_term, vocab.gender),
        usage_notes: generateUsageNotes(vocab.albanian_term, vocab.gender)
      }
    });

    // If it's a verb, add conjugation card
    if (isVerb(vocab.albanian_term)) {
      cards.push({
        id: `conjugation_${vocab.id}`,
        type: 'verb_conjugation',
        difficulty_level: vocab.difficulty_level + 1,
        content_id: vocab.id,
        front: `How do you conjugate "${vocab.albanian_term}"?`,
        back: {
          infinitive: vocab.albanian_term,
          pronunciation: vocab.pronunciation,
          conjugations: generateAlbanianConjugations(vocab.albanian_term),
          examples: generateVerbExamples(vocab.albanian_term),
          usage_patterns: generateVerbUsagePatterns(vocab.albanian_term)
        }
      });
    }

    // For family terms, add relationship card
    if (isFamilyTerm(vocab.albanian_term)) {
      cards.push({
        id: `family_${vocab.id}`,
        type: 'family_relationships',
        difficulty_level: vocab.difficulty_level,
        content_id: vocab.id,
        front: `Family relationships with "${vocab.english_term}"`,
        back: {
          main_term: vocab.albanian_term,
          relationships: generateFamilyRelationships(vocab.albanian_term),
          cultural_context: generateFamilyCulturalContext(vocab.albanian_term),
          formal_informal: generateFormalInformalVariations(vocab.albanian_term)
        }
      });
    }
  });

  return cards;
}

function generateBasicCards(content, lesson) {
  const cards = [];

  content.forEach(item => {
    // Main vocabulary card
    cards.push({
      id: `vocab_${item.id}`,
      type: 'vocabulary',
      difficulty_level: item.difficulty_score,
      content_id: item.id,
      front: item.english_phrase,
      back: {
        albanian: item.target_phrase,
        pronunciation: item.pronunciation_guide,
        gender: extractGender(item.target_phrase),
        example_sentence: `"${item.target_phrase}" - ${item.english_phrase}`,
        cultural_context: item.cultural_context,
        variations: generateAlbanianVariations(item.target_phrase),
        usage_notes: generateUsageNotes(item.target_phrase)
      }
    });

    // Add verb conjugation card if applicable
    if (isVerb(item.target_phrase)) {
      cards.push({
        id: `conjugation_${item.id}`,
        type: 'verb_conjugation',
        difficulty_level: item.difficulty_score + 1,
        content_id: item.id,
        front: `Conjugate: ${item.target_phrase}`,
        back: {
          infinitive: item.target_phrase,
          pronunciation: item.pronunciation_guide,
          conjugations: generateAlbanianConjugations(item.target_phrase),
          examples: generateVerbExamples(item.target_phrase)
        }
      });
    }
  });

  return cards;
}

function enhanceCardsWithVerbData(cards, verbs) {
  const verbMap = new Map();
  verbs.forEach(verb => verbMap.set(verb.infinitive, verb));

  return cards.map(card => {
    if (card.type === 'verb_conjugation') {
      const verbData = verbMap.get(card.back.infinitive);
      if (verbData && verbData.conjugations) {
        card.back.conjugations = verbData.conjugations;
        card.back.usage_examples = verbData.usage_examples;
        card.back.cultural_notes = verbData.cultural_notes;
      }
    }
    return card;
  });
}

// Albanian-specific linguistic functions
function generateAlbanianVariations(term, gender = null) {
  const variations = [];
  
  // Definite/Indefinite articles
  if (term.includes('babai')) {
    variations.push({ form: 'definite', text: 'babai', translation: 'the father', note: 'masculine definite' });
    variations.push({ form: 'indefinite', text: 'baba', translation: 'father', note: 'masculine indefinite' });
    variations.push({ form: 'vocative', text: 'baba!', translation: 'father! (calling)', note: 'used when addressing' });
  }
  
  if (term.includes('nëna')) {
    variations.push({ form: 'definite', text: 'nëna', translation: 'the mother', note: 'feminine definite' });
    variations.push({ form: 'indefinite', text: 'nënë', translation: 'mother', note: 'feminine indefinite' });
    variations.push({ form: 'vocative', text: 'nënë!', translation: 'mother! (calling)', note: 'used when addressing' });
  }

  if (term.includes('shtëpia')) {
    variations.push({ form: 'definite', text: 'shtëpia', translation: 'the house', note: 'feminine definite' });
    variations.push({ form: 'indefinite', text: 'shtëpi', translation: 'house', note: 'feminine indefinite' });
    variations.push({ form: 'ablative', text: 'nga shtëpia', translation: 'from the house', note: 'showing direction from' });
  }

  // Gender-based variations
  if (gender === 'masculine') {
    variations.push({ form: 'possessive', text: term + ' im', translation: 'my ' + term, note: 'masculine possessive' });
  } else if (gender === 'feminine') {
    variations.push({ form: 'possessive', text: term + ' ime', translation: 'my ' + term, note: 'feminine possessive' });
  }

  return variations;
}

function generateAlbanianConjugations(verb) {
  // This should ideally come from your verbs table
  // But we can generate basic patterns for common verbs
  
  const conjugations = {
    present: {},
    past: {},
    future: {}
  };

  // Pattern for -oj verbs (like punoj = work)
  if (verb.endsWith('oj')) {
    const root = verb.slice(0, -2);
    conjugations.present = {
      'unë': `${root}oj`,
      'ti': `${root}on`,
      'ai/ajo': `${root}on`,
      'ne': `${root}ojmë`,
      'ju': `${root}oni`,
      'ata/ato': `${root}ojnë`
    };
  }
  
  // Pattern for -em verbs (like flem = sleep)
  else if (verb.endsWith('em')) {
    const root = verb.slice(0, -2);
    conjugations.present = {
      'unë': `${root}em`,
      'ti': `${root}e`,
      'ai/ajo': `${root}e`,
      'ne': `${root}emi`,
      'ju': `${root}eni`,
      'ata/ato': `${root}emi`
    };
  }

  // Irregular verbs - hardcoded patterns for most common ones
  else if (verb === 'jam') { // to be
    conjugations.present = {
      'unë': 'jam',
      'ti': 'je',
      'ai/ajo': 'është',
      'ne': 'jemi',
      'ju': 'jeni',
      'ata/ato': 'janë'
    };
  }
  
  else if (verb === 'kam') { // to have
    conjugations.present = {
      'unë': 'kam',
      'ti': 'ke',
      'ai/ajo': 'ka',
      'ne': 'kemi',
      'ju': 'keni',
      'ata/ato': 'kanë'
    };
  }

  else if (verb === 'shkoj') { // to go
    conjugations.present = {
      'unë': 'shkoj',
      'ti': 'shkon',
      'ai/ajo': 'shkon',
      'ne': 'shkojmë',
      'ju': 'shkoni',
      'ata/ato': 'shkojnë'
    };
  }

  return conjugations;
}

function generateVerbExamples(verb) {
  const examples = [];
  
  // Generate contextual examples based on the verb
  if (verb.includes('punoj') || verb === 'punoj') {
    examples.push({
      albanian: 'Unë punoj në zyrë',
      english: 'I work in an office',
      context: 'daily routine'
    });
    examples.push({
      albanian: 'A punon ti sot?',
      english: 'Are you working today?',
      context: 'asking about work'
    });
  }
  
  if (verb.includes('flas') || verb === 'flas') {
    examples.push({
      albanian: 'Unë flas shqip',
      english: 'I speak Albanian',
      context: 'language ability'
    });
    examples.push({
      albanian: 'Ne flasim për familjen',
      english: 'We are talking about family',
      context: 'conversation topic'
    });
  }

  if (verb.includes('ha') || verb === 'ha') {
    examples.push({
      albanian: 'Unë ha bukë',
      english: 'I eat bread',
      context: 'basic eating'
    });
    examples.push({
      albanian: 'Ata hanë drekë',
      english: 'They are eating lunch',
      context: 'meal time'
    });
  }

  return examples;
}

function generateFamilyRelationships(term) {
  const relationships = [];
  
  if (term.includes('babai') || term.includes('baba')) {
    relationships.push({
      relationship: 'to children',
      albanian: 'babai i fëmijëve',
      english: 'father of the children'
    });
    relationships.push({
      relationship: 'to spouse',
      albanian: 'burri i gruas',
      english: 'husband of the wife'
    });
  }
  
  if (term.includes('nëna') || term.includes('nënë')) {
    relationships.push({
      relationship: 'to children',
      albanian: 'nëna e fëmijëve',
      english: 'mother of the children'
    });
    relationships.push({
      relationship: 'to spouse',
      albanian: 'gruaja e burrit',
      english: 'wife of the husband'
    });
  }

  return relationships;
}

function generateFamilyCulturalContext(term) {
  if (term.includes('babai') || term.includes('baba')) {
    return 'In Albanian culture, fathers are typically the head of the household and are treated with great respect. Children often use "baba" when speaking directly to their father, showing both familiarity and respect.';
  }
  
  if (term.includes('nëna') || term.includes('nënë')) {
    return 'Albanian mothers hold a central role in family life, often managing the household and maintaining family traditions. The term "nënë" is used both formally and affectionately.';
  }

  return 'Family relationships are very important in Albanian culture, with strong emphasis on respect for elders and family unity.';
}

function generateFormalInformalVariations(term) {
  const variations = [];
  
  if (term.includes('babai')) {
    variations.push({
      level: 'formal',
      term: 'babai',
      usage: 'when talking about father to others',
      example: 'Babai im punon në qytet'
    });
    variations.push({
      level: 'informal/direct',
      term: 'baba',
      usage: 'when speaking directly to father',
      example: 'Baba, ku je?'
    });
  }

  return variations;
}

function generateUsageNotes(term, gender = null) {
  const notes = [];
  
  // Gender agreement notes
  if (gender === 'masculine') {
    notes.push('Masculine noun - use "i" for definite article');
    notes.push('Adjectives must agree: i madh (big), i bukur (beautiful)');
  } else if (gender === 'feminine') {
    notes.push('Feminine noun - use "e" for definite article');
    notes.push('Adjectives must agree: e madhe (big), e bukur (beautiful)');
  }

  // Specific usage notes
  if (term.includes('mirëmëngjes')) {
    notes.push('Standard morning greeting until about 11 AM');
    notes.push('Can be used formally or informally');
  }

  if (term.includes('faleminderit')) {
    notes.push('More formal than "falë" (thanks)');
    notes.push('Shows proper appreciation in Albanian culture');
  }

  return notes;
}

// Utility functions
function extractGender(phrase) {
  // Simple gender detection for Albanian
  if (phrase.match(/\b(babai|baba|ati|djali|burri)\b/)) return 'masculine';
  if (phrase.match(/\b(nëna|nënë|ema|vajza|gruaja)\b/)) return 'feminine';
  if (phrase.includes(' i ') || phrase.endsWith(' i')) return 'masculine';
  if (phrase.includes(' e ') || phrase.endsWith(' e')) return 'feminine';
  return null;
}

function isVerb(phrase) {
  // Check if phrase contains or is a verb
  const verbEndings = ['oj', 'aj', 'ej', 'em', 'im'];
  const commonVerbs = ['jam', 'kam', 'shkoj', 'vij', 'flas', 'punoj', 'lexoj', 'shkruaj', 'ha', 'pi'];
  
  return verbEndings.some(ending => phrase.endsWith(ending)) || 
         commonVerbs.some(verb => phrase.includes(verb));
}

function isFamilyTerm(phrase) {
  const familyTerms = ['babai', 'baba', 'nëna', 'nënë', 'djali', 'vajza', 'motra', 'vëllai', 'gjyshi', 'gjyshja'];
  return familyTerms.some(term => phrase.includes(term));
}

function extractCulturalContext(term) {
  // Return cultural context based on the term
  const culturalContexts = {
    'mirëmëngjes': 'Standard morning greeting used throughout Albania and Kosovo',
    'faleminderit': 'Shows proper appreciation and politeness in Albanian hospitality culture',
    'babai': 'Father figure is highly respected in traditional Albanian families',
    'nëna': 'Mothers are central to Albanian family life and cultural transmission',
    'shtëpia': 'The home is sacred in Albanian culture, guests are treated with exceptional hospitality'
  };

  for (const [key, context] of Object.entries(culturalContexts)) {
    if (term.includes(key)) {
      return context;
    }
  }

  return null;
}

function generateVerbUsagePatterns(verb) {
  const patterns = [];
  
  if (verb === 'punoj') {
    patterns.push({
      pattern: 'punoj + në + location',
      example: 'punoj në zyrë',
      meaning: 'work at/in a place'
    });
    patterns.push({
      pattern: 'punoj + me + person',
      example: 'punoj me mikun',
      meaning: 'work with someone'
    });
  }

  return patterns;
}