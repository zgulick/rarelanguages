/**
 * Comprehensive English Vocabulary Lists for Gheg Albanian Curriculum
 * Organized by category and learning priority
 * 400+ terms ready for AI translation
 */

const vocabularyLists = {
  
  // Family & People (60 terms) - HIGHEST PRIORITY
  familyAndPeople: {
    category: "Family & People", 
    priority: "highest",
    cefr_level: "A1",
    description: "Essential family terms for Albanian family integration",
    terms: [
      // Immediate family
      "father", "dad", "daddy", "mother", "mom", "mommy", "brother", "sister", 
      "wife", "husband", "son", "daughter", "baby", "child", "children", 
      "parent", "parents", "family",
      
      // Extended family (key for Albanian culture)
      "grandmother", "grandma", "grandfather", "grandpa", "uncle", "aunt", 
      "cousin", "nephew", "niece", "relative", "relatives",
      
      // In-laws (important in Albanian families)
      "mother-in-law", "father-in-law", "brother-in-law", "sister-in-law",
      "son-in-law", "daughter-in-law",
      
      // Descriptors
      "young", "old", "older", "younger", "eldest", "youngest", "tall", "short",
      "married", "single", "divorced", "widowed",
      
      // Family activities and relationships
      "visit", "call", "text", "phone", "celebrate", "gather", "help", "love", 
      "care", "respect", "miss", "hug", "kiss"
    ],
    cultural_context: "Extended family central to Albanian life. Many specific terms for in-law relationships. Family activities are communal."
  },

  // Greetings & Basic Communication (50 terms) - HIGHEST PRIORITY
  greetingsAndBasics: {
    category: "Greetings & Basic Communication",
    priority: "highest", 
    cefr_level: "A1",
    description: "Foundation phrases for daily family interactions",
    terms: [
      // Greetings
      "hello", "hi", "hey", "good morning", "good afternoon", "good evening", 
      "good night", "goodbye", "bye", "see you later", "see you tomorrow", 
      "see you soon", "welcome",
      
      // Politeness essentials
      "please", "thank you", "thanks", "you're welcome", "excuse me", "sorry",
      "pardon me", "I'm sorry", "forgive me",
      
      // Basic questions and responses
      "how are you", "I'm fine", "I'm good", "I'm okay", "not bad", "great",
      "what's your name", "my name is", "nice to meet you", "pleased to meet you",
      "where are you from", "I'm from",
      
      // Essential communication
      "yes", "no", "maybe", "I don't know", "I understand", "I don't understand",
      "can you repeat", "speak slowly", "what", "when", "where", "why", "how",
      "who"
    ],
    conversation_starters: ["How are you?", "What's new?", "How is everyone?", "Good to see you"],
    cultural_context: "Albanian greetings emphasize warmth and respect. Always ask about family health first."
  },

  // Numbers & Time (55 terms) - HIGH PRIORITY
  numbersAndTime: {
    category: "Numbers & Time",
    priority: "high",
    cefr_level: "A1", 
    description: "Numbers for card games, time coordination, and family scheduling",
    terms: [
      // Numbers 1-20 (essential for card games)
      "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", 
      "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", 
      "sixteen", "seventeen", "eighteen", "nineteen", "twenty",
      
      // Time basics
      "time", "hour", "minute", "second", "morning", "afternoon", "evening", 
      "night", "day", "today", "tomorrow", "yesterday", "now", "later", 
      "soon", "early", "late", "on time",
      
      // Days of week (for family coordination)
      "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", 
      "Sunday", "weekend", "weekday", "week",
      
      // Time expressions
      "what time", "when", "at what time", "in the morning", "in the afternoon",
      "in the evening", "at night", "all day", "half past", "quarter past", "o'clock"
    ],
    practical_applications: ["Card game scoring", "Family visit scheduling", "Meal time coordination"],
    cultural_context: "Punctuality varies in Albanian culture. Coffee invitations and family meals have traditional timing."
  },

  // Household & Daily Life (85 terms) - HIGH PRIORITY  
  householdAndDaily: {
    category: "Household & Daily Life",
    priority: "high",
    cefr_level: "A1",
    description: "Home environment and daily activities for family gatherings",
    terms: [
      // Home and rooms
      "house", "home", "apartment", "room", "kitchen", "living room", "bedroom", 
      "bathroom", "dining room", "door", "window", "stairs", "upstairs", "downstairs",
      
      // Furniture and household items
      "table", "chair", "sofa", "couch", "bed", "TV", "television", "phone", 
      "computer", "refrigerator", "stove", "oven", "sink", "shower", "toilet",
      
      // Daily activities
      "eat", "drink", "sleep", "wake up", "get up", "shower", "wash", "brush teeth",
      "get dressed", "work", "cook", "clean", "watch TV", "read", "listen", 
      "talk", "speak", "sit", "stand", "walk", "run", "drive",
      
      // Food and drink basics
      "food", "water", "coffee", "tea", "milk", "bread", "meat", "vegetables",
      "fruit", "breakfast", "lunch", "dinner", "snack", "hungry", "thirsty", 
      "delicious", "tasty", "good", "bad", "hot", "cold", "warm",
      
      // Common objects and possessions
      "car", "money", "book", "clothes", "shirt", "pants", "shoes", "bag", 
      "keys", "wallet", "glasses", "watch", "phone", "camera"
    ],
    daily_scenarios: ["Morning routines", "Meal preparation", "Household help during visits"],
    cultural_context: "Albanian homes center around hospitality. Guests help with household tasks to show respect."
  },

  // Card Games & Social Activities (40 terms) - MEDIUM PRIORITY
  socialAndGames: {
    category: "Card Games & Social Activities", 
    priority: "medium",
    cefr_level: "A1-A2",
    description: "Gaming terminology and social expressions for family entertainment",
    terms: [
      // Card games
      "cards", "card", "game", "play", "player", "turn", "my turn", "your turn",
      "win", "lose", "winner", "loser", "point", "points", "score", "deal", 
      "shuffle", "hand", "deck", "ace", "king", "queen", "jack",
      
      // Game expressions
      "let's play", "who's next", "good move", "nice hand", "well played",
      "good game", "want to play again", "one more game", "I fold", "I pass",
      
      // Social expressions and emotions
      "fun", "funny", "boring", "interesting", "exciting", "good luck", 
      "well done", "nice", "great", "awesome", "cool", "amazing",
      "happy", "sad", "excited", "surprised", "lucky", "unlucky"
    ],
    game_scenarios: ["Starting games", "During play", "Winning and losing gracefully"],
    cultural_context: "Albanian card games are social bonding time. Good sportsmanship and encouragement valued over competition."
  },

  // Opinions & Feelings (45 terms) - MEDIUM PRIORITY
  opinionsAndFeelings: {
    category: "Opinions & Feelings",
    priority: "medium", 
    cefr_level: "A2",
    description: "Express emotions and opinions in family discussions",
    terms: [
      // Basic emotions
      "happy", "sad", "angry", "excited", "worried", "nervous", "calm", "tired",
      "hungry", "thirsty", "sick", "healthy", "fine", "okay", "great", "terrible",
      
      // Opinion expressions  
      "I think", "I believe", "I feel", "in my opinion", "I agree", "I disagree",
      "maybe", "probably", "definitely", "certainly", "I'm sure", "I'm not sure",
      
      // Preferences
      "I like", "I love", "I don't like", "I hate", "I prefer", "favorite",
      "best", "worst", "better", "worse", "same", "different",
      
      // Reactions and responses
      "really", "seriously", "of course", "exactly", "absolutely", "never", 
      "always", "sometimes", "often", "rarely"
    ],
    family_applications: ["Expressing preferences in group decisions", "Sharing feelings respectfully", "Family discussions"],
    cultural_context: "Albanian families value harmony. Express disagreement respectfully, especially with elders."
  },

  // Future & Plans (35 terms) - MEDIUM PRIORITY
  futureAndPlans: {
    category: "Future & Plans",
    priority: "medium",
    cefr_level: "A2", 
    description: "Discuss future plans and family aspirations",
    terms: [
      // Future expressions
      "will", "going to", "planning to", "want to", "hope to", "expect to",
      "future", "tomorrow", "next week", "next month", "next year", "later",
      
      // Plans and goals
      "plan", "plans", "goal", "dream", "hope", "wish", "want", "need",
      "visit", "travel", "move", "buy", "sell", "build", "start", "finish",
      
      // Family future (important for parent preparation)
      "baby", "pregnant", "children", "grow up", "education", "school",
      "marriage", "wedding", "celebration", "tradition", "family values"
    ],
    parent_preparation: ["Discussing baby plans", "Family traditions", "Future family goals"],
    cultural_context: "Albanian families plan together. Children's future is family priority. Traditional values important."
  },

  // Food Culture & Gatherings (50 terms) - MEDIUM PRIORITY  
  foodCulture: {
    category: "Food Culture & Gatherings",
    priority: "medium",
    cefr_level: "A2",
    description: "Traditional food and family gathering vocabulary",
    terms: [
      // Traditional Albanian foods (common terms)
      "burek", "qebapa", "tavë", "byrek", "flija", "pite", "baklava", "raki",
      "çaj", "kafe", "gjellë", "sallatë", 
      
      // Meal and cooking terms
      "cook", "cooking", "recipe", "ingredient", "spice", "salt", "pepper",
      "oil", "butter", "sugar", "flour", "egg", "cheese", "yogurt",
      
      // Meal situations
      "invite", "invitation", "guest", "host", "serve", "offer", "accept", 
      "refuse", "full", "enough", "more", "less", "delicious", "tasty",
      
      // Gathering expressions
      "celebration", "party", "birthday", "holiday", "feast", "gathering",
      "family dinner", "welcome", "cheers", "enjoy your meal", "bon appetit"
    ],
    gathering_scenarios: ["Family meals", "Holiday celebrations", "Hosting guests"],
    cultural_context: "Food central to Albanian family life. Refusing food can be insulting. Always compliment the cook."
  },

  // Colors & Descriptions (30 terms) - LOW PRIORITY
  colorsAndDescriptions: {
    category: "Colors & Descriptions", 
    priority: "low",
    cefr_level: "A1",
    description: "Basic descriptive vocabulary for everyday use",
    terms: [
      // Colors
      "red", "blue", "green", "yellow", "black", "white", "brown", "gray", 
      "orange", "purple", "pink",
      
      // Sizes and qualities
      "big", "small", "large", "little", "long", "short", "wide", "narrow",
      "thick", "thin", "heavy", "light", "new", "old", "clean", "dirty",
      "beautiful", "ugly", "nice"
    ],
    usage_context: "Basic descriptions for household items, clothing, and general conversation",
    cultural_context: "Descriptive language used when helping with household tasks and discussing possessions."
  }
};

// Generate comprehensive word count
const totalWordCount = Object.values(vocabularyLists).reduce((total, category) => {
  return total + category.terms.length;
}, 0);

console.log(`Total vocabulary terms: ${totalWordCount}`);

// Export for use in curriculum generation
module.exports = {
  vocabularyLists,
  totalWordCount,
  
  // Helper functions
  getTermsByPriority: (priority) => {
    return Object.values(vocabularyLists).filter(category => category.priority === priority);
  },
  
  getTermsByCEFR: (level) => {
    return Object.values(vocabularyLists).filter(category => category.cefr_level.includes(level));
  },
  
  getAllTerms: () => {
    return Object.values(vocabularyLists).flatMap(category => category.terms);
  },
  
  getCategoryTerms: (categoryName) => {
    const category = Object.values(vocabularyLists).find(cat => cat.category === categoryName);
    return category ? category.terms : [];
  }
};