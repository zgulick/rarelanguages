/**
 * Translation Batch Processing for Gheg Albanian Content
 * Organizes content into logical batches with cultural context
 */

const { OpenAIClient } = require('../lib/openai');
const config = require('../config/contentGeneration');

/**
 * Translation batches organized by priority and cultural context
 */
const translationBatches = {
  // Batch 1: Family terms (highest priority - most requested feature)
  family_vocabulary: {
    priority: 1,
    context: "Kosovo Albanian family conversations, informal tone, family gatherings",
    phrases: [
      "This is my father",
      "This is my mother",
      "This is my brother", 
      "This is my sister",
      "How is your family?",
      "I love my family",
      "My father works hard",
      "My mother cooks well",
      "My brother is tall",
      "My sister is smart",
      "We are having dinner",
      "Come meet my parents",
      "This is my grandfather",
      "This is my grandmother",
      "My uncle is visiting",
      "My aunt brought food",
      "The children are playing",
      "Our family is close",
      "We gather every Sunday",
      "Family comes first",
      "I miss my family",
      "When will you visit?",
      "Bring your family over",
      "How many children do you have?",
      "My son is five years old",
      "My daughter goes to school",
      "We are proud parents",
      "The baby is sleeping",
      "Grandpa tells great stories",
      "Grandma makes the best food"
    ]
  },
  
  // Batch 2: Greetings and basic politeness
  greetings_basics: {
    priority: 2,
    context: "Daily greetings, respectful tone, common social expressions",
    phrases: [
      "Hello, how are you?",
      "Good morning",
      "Good afternoon", 
      "Good evening",
      "How are things?",
      "Everything is fine",
      "Thank you very much",
      "You're welcome",
      "Please sit down",
      "Make yourself at home",
      "Have a good day",
      "See you later",
      "Take care",
      "Safe travels",
      "Welcome to our home",
      "How was your trip?",
      "Did you eat yet?",
      "Are you tired?",
      "Rest a little",
      "What brings you here?",
      "It's good to see you",
      "How long can you stay?",
      "We missed you",
      "You look well",
      "How is your health?",
      "God bless you",
      "May you be healthy",
      "Congratulations",
      "I'm happy for you",
      "Best wishes"
    ]
  },
  
  // Batch 3: Coffee culture and hospitality
  coffee_hospitality: {
    priority: 3,
    context: "Albanian coffee culture, social gathering, hospitality traditions",
    phrases: [
      "Would you like some coffee?",
      "Yes, please",
      "No, thank you",
      "The coffee is ready",
      "This coffee is delicious",
      "One more cup?",
      "Let's sit and talk",
      "Bring some sugar",
      "Do you want it sweet?",
      "The coffee is hot",
      "Let it cool down",
      "What beautiful weather",
      "How is work going?",
      "Are you busy these days?",
      "Life is good",
      "We should meet more often",
      "Come by anytime",
      "Our door is always open",
      "You are always welcome",
      "Don't be a stranger",
      "Stay for dinner",
      "We have plenty of food",
      "No need to rush",
      "Sit, relax",
      "Tell me the news",
      "How is everyone?",
      "What's new with you?",
      "Time passes so quickly",
      "It feels like yesterday",
      "We need to catch up"
    ]
  },
  
  // Batch 4: Food and meals
  food_meals: {
    priority: 4,
    context: "Meal preparation, dining together, Albanian food traditions",
    phrases: [
      "Are you hungry?",
      "Let's eat",
      "The food is ready",
      "Come to the table",
      "Wash your hands",
      "This is delicious", 
      "More bread please",
      "Pass the salt",
      "I'm full",
      "Thank you for the meal",
      "Who cooked this?",
      "The recipe is old",
      "My grandmother taught me",
      "Traditional Albanian food",
      "Made with love",
      "Eat more",
      "Don't be shy",
      "There's plenty",
      "Try this dish",
      "It's very good",
      "What do you think?",
      "I like it spicy",
      "Not too much pepper",
      "Fresh vegetables",
      "From our garden",
      "Homemade bread",
      "Still warm",
      "Have some more",
      "Save room for dessert",
      "Let's clear the table"
    ]
  },
  
  // Batch 5: Time and daily activities
  time_daily: {
    priority: 5,
    context: "Time expressions, daily scheduling, routine activities",
    phrases: [
      "What time is it?",
      "It's three o'clock",
      "Half past four",
      "Quarter to five",
      "See you tomorrow",
      "Yesterday was nice",
      "Today is beautiful",
      "This morning",
      "This afternoon",
      "This evening",
      "Last night",
      "Next week",
      "I'm going to work",
      "Coming home late",
      "The meeting is at five",
      "Don't be late",
      "We're running behind",
      "There's plenty of time",
      "What's the hurry?",
      "Take your time",
      "When do you wake up?",
      "I sleep early",
      "Good night",
      "Sweet dreams",
      "See you in the morning",
      "Have a good rest",
      "Tomorrow is another day",
      "Time for bed",
      "Turn off the lights",
      "Lock the door"
    ]
  },
  
  // Batch 6: Numbers and ages
  numbers_ages: {
    priority: 6,
    context: "Numbers, ages, counting, basic mathematics",
    phrases: [
      "I am twenty years old",
      "How old are you?",
      "She is fifteen",
      "He is thirty-five",
      "The baby is six months old",
      "My birthday is next month",
      "Happy birthday",
      "How many are there?",
      "Count to ten",
      "One, two, three",
      "First, second, third",
      "Half of this",
      "Double that amount",
      "A few more",
      "Not many left",
      "All of them",
      "None remaining",
      "Most people",
      "Some children",
      "Every day",
      "Once a week",
      "Twice a month",
      "Three times a year",
      "Many years ago",
      "A long time",
      "Not long ago",
      "Recently",
      "Just now",
      "Right away",
      "In a moment"
    ]
  },
  
  // Batch 7: Feelings and emotions
  feelings_emotions: {
    priority: 7,
    context: "Emotional expressions, feelings, empathy, support",
    phrases: [
      "I am happy",
      "We are excited",
      "Don't be sad",
      "Everything will be fine",
      "I understand",
      "Don't worry",
      "Be patient",
      "Stay strong",
      "I'm proud of you",
      "Well done",
      "You did great",
      "I believe in you",
      "Don't give up",
      "Try again",
      "It's okay",
      "Mistakes happen",
      "Learn from this",
      "Tomorrow is better",
      "I love you",
      "We care about you",
      "You're important",
      "Family supports you",
      "We're here for you",
      "Never alone",
      "Share your worries",
      "Talk to me",
      "I'm listening",
      "What's wrong?",
      "How can I help?",
      "Everything passes"
    ]
  },
  
  // Batch 8: Weather and nature
  weather_nature: {
    priority: 8,
    context: "Weather descriptions, natural phenomena, seasonal talk",
    phrases: [
      "It's sunny today",
      "The weather is nice",
      "It's raining",
      "Very cold outside",
      "Quite warm",
      "Beautiful spring day",
      "Hot summer",
      "Cool autumn",
      "Snow is falling",
      "Strong wind",
      "Clear sky",
      "Many clouds",
      "Thunder and lightning",
      "The sun is shining",
      "Stars are bright",
      "Full moon tonight",
      "Fresh air",
      "Birds are singing",
      "Flowers blooming",
      "Trees are green",
      "Leaves falling",
      "First snow",
      "Ice on the road",
      "Be careful driving",
      "Roads are slippery",
      "Stay inside",
      "Bundle up warm",
      "Open the windows",
      "Close the shutters",
      "Beautiful view"
    ]
  }
};

/**
 * Get all translation batches
 */
function getTranslationBatches() {
  return translationBatches;
}

/**
 * Process a single translation batch using OpenAI
 */
async function processBatch(batchName, batchData, progress) {
  console.log(`🔄 Processing batch: ${batchName} (${batchData.phrases.length} phrases)`);
  
  const openaiClient = new OpenAIClient();
  
  const prompt = `
Translate these English phrases to Gheg Albanian (Kosovo dialect).

Context: ${batchData.context}

Important Guidelines:
- Use Gheg Albanian specifically, NOT Standard Albanian (Tosk)
- Focus on natural, family-friendly expressions used in Kosovo
- Include brief cultural context when relevant
- Use informal, conversational tone appropriate for family settings
- Avoid overly formal or literary language

English phrases:
${batchData.phrases.map((phrase, i) => `${i+1}. ${phrase}`).join('\n')}

Return as a JSON array with this exact format:
[
  {
    "english": "exact original phrase",
    "gheg": "Kosovo Gheg Albanian translation", 
    "cultural_note": "brief cultural context if relevant (optional)"
  }
]

Make sure the response is valid JSON and includes all ${batchData.phrases.length} phrases.`;

  try {
    const response = await openaiClient.batchTranslate(
      batchData.phrases, 
      batchData.context, 
      `batch_${batchName}`
    );
    
    const content = response.content.trim();
    
    // Try to extract JSON from the response
    let translations;
    try {
      // Sometimes the API wraps JSON in code blocks
      const jsonMatch = content.match(/```(?:json)?\s*(\[[\s\S]*\])\s*```/) || content.match(/(\[[\s\S]*\])/);
      const jsonString = jsonMatch ? jsonMatch[1] : content;
      translations = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse JSON response:', content);
      throw new Error(`Invalid JSON response for batch ${batchName}: ${parseError.message}`);
    }
    
    // Validate response
    if (!Array.isArray(translations)) {
      throw new Error(`Response is not an array for batch ${batchName}`);
    }
    
    if (translations.length !== batchData.phrases.length) {
      console.warn(`⚠️  Expected ${batchData.phrases.length} translations, got ${translations.length} for batch ${batchName}`);
    }
    
    // Log successful translations
    console.log(`✅ Batch ${batchName}: ${translations.length} translations completed`);
    
    // Show sample translations
    const samples = translations.slice(0, 2);
    samples.forEach(t => {
      console.log(`   "${t.english}" → "${t.gheg}"`);
    });
    
    return translations;
    
  } catch (error) {
    console.error(`❌ Failed to process batch ${batchName}:`, error.message);
    progress.logError(error, `batch_${batchName}`);
    throw error;
  }
}

/**
 * Get batch statistics
 */
function getBatchStatistics() {
  const batches = Object.entries(translationBatches);
  const totalPhrases = batches.reduce((sum, [, batchData]) => sum + batchData.phrases.length, 0);
  const priorityBatches = batches.filter(([, batchData]) => (batchData.priority || 10) <= 3).length;
  
  return {
    totalBatches: batches.length,
    totalPhrases,
    priorityBatches,
    estimatedCost: totalPhrases * 0.02, // ~$0.02 per phrase
    estimatedTime: Math.ceil(totalPhrases / 100) * 5 // ~5 minutes per 100 phrases
  };
}

module.exports = {
  getTranslationBatches,
  processBatch,
  getBatchStatistics,
  translationBatches
};