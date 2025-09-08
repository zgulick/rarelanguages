/**
 * Mock Data for Phase 2.2 Development
 * Realistic Gheg Albanian content for family integration scenarios
 */

export const mockContent = [
  {
    id: "1",
    english_phrase: "This is my father",
    target_phrase: "Ky është babai im",
    pronunciation_guide: "Kuh eh-sht bah-bye eem",
    cultural_context: "Albanian families are very close-knit. Always show respect when introducing family members.",
    difficulty_score: 3,
    exercise_types: ["flashcard", "audio_repeat", "conversation", "visual"]
  },
  {
    id: "2",
    english_phrase: "Good morning",
    target_phrase: "Mirëmëngjes",
    pronunciation_guide: "Mee-ruh-men-guess",
    cultural_context: "Standard morning greeting used throughout Albania and Kosovo.",
    difficulty_score: 2,
    exercise_types: ["flashcard", "audio_repeat", "conversation"]
  },
  {
    id: "3",
    english_phrase: "How are you?",
    target_phrase: "Si jeni?",
    pronunciation_guide: "See yeh-nee",
    cultural_context: "Formal greeting. Use 'Si je?' for informal situations with family.",
    difficulty_score: 2,
    exercise_types: ["flashcard", "audio_repeat", "conversation"]
  },
  {
    id: "4",
    english_phrase: "Thank you very much",
    target_phrase: "Shumë faleminderit",
    pronunciation_guide: "Shoo-muh fah-leh-meen-deh-reet",
    cultural_context: "Shows proper appreciation. Important in Albanian hospitality culture.",
    difficulty_score: 4,
    exercise_types: ["flashcard", "audio_repeat", "conversation"]
  },
  {
    id: "5",
    english_phrase: "This is my mother",
    target_phrase: "Kjo është nëna ime",
    pronunciation_guide: "Kyoh eh-sht nuh-nah ee-meh",
    cultural_context: "Mothers are deeply respected in Albanian culture. Always speak with reverence.",
    difficulty_score: 3,
    exercise_types: ["flashcard", "audio_repeat", "conversation", "visual"]
  },
  {
    id: "6",
    english_phrase: "Your turn",
    target_phrase: "Radha jote",
    pronunciation_guide: "Rah-dah yoh-teh",
    cultural_context: "Used during card games and social activities. Keep the tone friendly and encouraging.",
    difficulty_score: 3,
    exercise_types: ["flashcard", "conversation", "visual"]
  },
  {
    id: "7",
    english_phrase: "Good game",
    target_phrase: "Lojë e mirë",
    pronunciation_guide: "Loh-yuh eh mee-ruh",
    cultural_context: "Shows good sportsmanship. Card games are social bonding time in Albanian families.",
    difficulty_score: 3,
    exercise_types: ["flashcard", "conversation"]
  },
  {
    id: "8",
    english_phrase: "Would you like coffee?",
    target_phrase: "A doni kafe?",
    pronunciation_guide: "Ah doh-nee kah-feh",
    cultural_context: "Coffee is central to Albanian hospitality. Offering coffee shows care and welcome.",
    difficulty_score: 4,
    exercise_types: ["flashcard", "audio_repeat", "conversation"]
  },
  {
    id: "9",
    english_phrase: "Yes, please",
    target_phrase: "Po, ju lutem",
    pronunciation_guide: "Poh, you loo-tem",
    cultural_context: "Polite acceptance. 'Ju lutem' adds respectful courtesy.",
    difficulty_score: 2,
    exercise_types: ["flashcard", "audio_repeat", "conversation"]
  },
  {
    id: "10",
    english_phrase: "See you later",
    target_phrase: "Shihemi më vonë",
    pronunciation_guide: "Shee-heh-mee muh voh-nuh",
    cultural_context: "Casual goodbye among family. Shows intention to meet again soon.",
    difficulty_score: 3,
    exercise_types: ["flashcard", "audio_repeat", "conversation"]
  },
  {
    id: "11",
    english_phrase: "I'm fine, thank you",
    target_phrase: "Jam mirë, faleminderit",
    pronunciation_guide: "Yahm mee-ruh, fah-leh-meen-deh-reet",
    cultural_context: "Standard polite response to 'How are you?'. Shows gratitude for their concern.",
    difficulty_score: 3,
    exercise_types: ["flashcard", "audio_repeat", "conversation"]
  },
  {
    id: "12",
    english_phrase: "Excuse me",
    target_phrase: "Më falni",
    pronunciation_guide: "Muh fahl-nee",
    cultural_context: "Shows politeness and respect. Essential for navigating family gatherings.",
    difficulty_score: 2,
    exercise_types: ["flashcard", "audio_repeat", "conversation"]
  },
  {
    id: "13",
    english_phrase: "Where is the bathroom?",
    target_phrase: "Ku është banja?",
    pronunciation_guide: "Koo eh-sht bahn-yah",
    cultural_context: "Practical phrase for family visits. Direct but polite way to ask.",
    difficulty_score: 3,
    exercise_types: ["flashcard", "audio_repeat", "conversation"]
  },
  {
    id: "14",
    english_phrase: "Delicious!",
    target_phrase: "Shumë e shijshme!",
    pronunciation_guide: "Shoo-muh eh shee-sheh-meh",
    cultural_context: "High praise for Albanian cooking. Food appreciation is very important culturally.",
    difficulty_score: 4,
    exercise_types: ["flashcard", "audio_repeat", "conversation"]
  },
  {
    id: "15",
    english_phrase: "Let's eat",
    target_phrase: "Të hamë",
    pronunciation_guide: "Tuh hah-muh",
    cultural_context: "Invitation to share a meal. Meals are central to Albanian family bonding.",
    difficulty_score: 2,
    exercise_types: ["flashcard", "audio_repeat", "conversation"]
  }
];

export const conversationScenarios = [
  {
    id: "scenario_1",
    category: "family_introductions",
    title: "Meeting Your Partner's Family",
    context: "You're at a family gathering and being introduced to relatives you haven't met before.",
    difficulty: 2,
    cultural_notes: "Always show respect for elders. Use formal greetings initially until invited to be more casual.",
    exchanges: [
      {
        speaker: "Aunt",
        text: "Kush është ky/kjo?",
        translation: "Who is this?",
        responses: [
          { text: "Unë jam partneri i saj/tij", translation: "I am her/his partner", correct: true },
          { text: "Unë jam miku i mirë", translation: "I am a good friend", correct: false },
          { text: "Nuk e di", translation: "I don't know", correct: false }
        ]
      }
    ]
  },
  {
    id: "scenario_2", 
    category: "card_game_banter",
    title: "Playing Cards After Dinner",
    context: "The family is playing a card game and it's getting competitive but friendly.",
    difficulty: 3,
    cultural_notes: "Card games are social time. Keep banter light and inclusive. Good sportsmanship is valued.",
    exchanges: [
      {
        speaker: "Uncle",
        text: "Radha jote, lulo mirë!",
        translation: "Your turn, play well!",
        responses: [
          { text: "Do të provoj!", translation: "I will try!", correct: true },
          { text: "Nuk di të luaj", translation: "I don't know how to play", correct: false },
          { text: "Kjo është e vështirë", translation: "This is difficult", correct: false }
        ]
      }
    ]
  },
  {
    id: "scenario_3",
    category: "daily_checkins",
    title: "Family Group Chat Response",
    context: "Someone in the family group chat is asking how everyone is doing today.",
    difficulty: 1,
    cultural_notes: "Regular family contact shows care. Even brief responses maintain family connection.",
    exchanges: [
      {
        speaker: "Family Member",
        text: "Si jeni sot të gjithë?",
        translation: "How is everyone today?",
        responses: [
          { text: "Jam mirë, faleminderit!", translation: "I'm fine, thank you!", correct: true },
          { text: "Jo mirë", translation: "Not good", correct: false },
          { text: "Nuk dua të flas", translation: "I don't want to talk", correct: false }
        ]
      }
    ]
  },
  {
    id: "scenario_4",
    category: "coffee_culture",
    title: "Coffee Invitation",
    context: "Your partner's mother is offering you coffee, which is a sign of hospitality.",
    difficulty: 2,
    cultural_notes: "Coffee offering is hospitality. Accepting shows respect. It's okay to politely decline if needed.",
    exchanges: [
      {
        speaker: "Mother",
        text: "A doni kafe të forte apo të butë?",
        translation: "Would you like strong or mild coffee?",
        responses: [
          { text: "Të butë, ju lutem", translation: "Mild, please", correct: true },
          { text: "Nuk pi kafe", translation: "I don't drink coffee", correct: true },
          { text: "Çfarë kafe?", translation: "What coffee?", correct: false }
        ]
      }
    ]
  }
];

export const visualContent = [
  {
    id: "visual_1",
    phrase: "Ky është babai im",
    pronunciation: "Kuh eh-sht bah-bye eem",
    images: ["👨‍🦳", "👩‍🦳", "👦", "👧"],
    correct: 0,
    category: "family",
    context: "Pointing to father in family photo"
  },
  {
    id: "visual_2",
    phrase: "Mirëmëngjes",
    pronunciation: "Mee-ruh-men-guess",
    images: ["🌅", "🌄", "🌙", "🌆"],
    correct: 0,
    category: "greetings",
    context: "Morning greeting"
  },
  {
    id: "visual_3",
    phrase: "Kjo është nëna ime",
    pronunciation: "Kyoh eh-sht nuh-nah ee-meh",
    images: ["👩‍🦳", "👨‍🦳", "👧", "👦"],
    correct: 0,
    category: "family",
    context: "Pointing to mother in family photo"
  },
  {
    id: "visual_4",
    phrase: "A doni kafe?",
    pronunciation: "Ah doh-nee kah-feh",
    images: ["☕", "🫖", "🥤", "🍺"],
    correct: 0,
    category: "hospitality",
    context: "Offering coffee to guest"
  },
  {
    id: "visual_5",
    phrase: "Shumë e shijshme!",
    pronunciation: "Shoo-muh eh shee-sheh-meh",
    images: ["😋", "😝", "😐", "😞"],
    correct: 0,
    category: "food_appreciation",
    context: "Reacting to delicious food"
  },
  {
    id: "visual_6",
    phrase: "Radha jote",
    pronunciation: "Rah-dah yoh-teh",
    images: ["🃏", "🎯", "👋", "🤝"],
    correct: 0,
    category: "games",
    context: "During card game"
  }
];

export const audioExercises = [
  {
    id: "audio_1",
    english_phrase: "Good morning",
    target_phrase: "Mirëmëngjes",
    pronunciation_guide: "Mee-ruh-men-guess",
    difficulty_level: 2,
    pimsleur_intervals: {
      immediate: 5,      // seconds
      short: 25,
      medium: 120,
      long: 600
    }
  },
  {
    id: "audio_2", 
    english_phrase: "Thank you very much",
    target_phrase: "Shumë faleminderit",
    pronunciation_guide: "Shoo-muh fah-leh-meen-deh-reet",
    difficulty_level: 4,
    pimsleur_intervals: {
      immediate: 5,
      short: 30,
      medium: 150,
      long: 720
    }
  }
];

// Export lesson structure for LessonContainer
export const mockLesson = {
  id: "lesson_1",
  title: "Family Greetings & Basic Politeness",
  description: "Essential phrases for meeting family members and showing respect",
  content: mockContent.slice(0, 8), // First 8 phrases
  exercise_flow: [
    { component: 'FlashcardExercise', duration: 2, content_count: 5 },
    { component: 'AudioExercise', duration: 3, content_count: 3 },
    { component: 'VisualExercise', duration: 2, content_count: 4 },
    { component: 'ConversationExercise', duration: 4, content_count: 2 }
  ],
  estimated_duration: 11, // minutes
  difficulty_level: 2,
  cultural_focus: "Kosovo Albanian family dynamics and hospitality"
};

export const userPreferences = {
  audio_enabled: true,
  pronunciation_shown: true,
  cultural_context_shown: true,
  difficulty_auto_adjust: true,
  speech_recognition_enabled: true,
  preferred_exercise_types: ["flashcard", "conversation", "audio_repeat"],
  session_length: 10 // minutes
};