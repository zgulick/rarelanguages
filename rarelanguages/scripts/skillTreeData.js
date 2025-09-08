/**
 * Gheg Albanian Skill Tree Structure
 * Complete A1-A2 curriculum framework with English content only
 */

const skillTreeData = {
  // Level 1: Essential Basics
  level1Skills: [
    {
      name: "Greetings & Politeness",
      description: "Master basic greetings and polite expressions for family interactions",
      position: 1,
      prerequisites: [],
      cefr_level: "A1",
      estimated_lessons: 3,
      priority_focus: "Family greeting customs and respectful communication",
      lessons: [
        {
          name: "Basic Greetings",
          position: 1,
          difficulty_level: 1,
          estimated_minutes: 15,
          lesson_description: "Essential daily greetings for family conversations"
        },
        {
          name: "Please & Thank You",
          position: 2,
          difficulty_level: 2,
          estimated_minutes: 15,
          lesson_description: "Polite expressions and gratitude in family settings"
        },
        {
          name: "Excuse Me & Sorry",
          position: 3,
          difficulty_level: 2,
          estimated_minutes: 15,
          lesson_description: "Apologizing and getting attention politely"
        }
      ],
      cultural_focus: "Albanian greeting customs emphasize respect and warmth. Formal vs informal address varies with age and family relationship."
    },
    {
      name: "Personal Identity",
      description: "Introduce yourself and share basic personal information",
      position: 2,
      prerequisites: [1],
      cefr_level: "A1", 
      estimated_lessons: 3,
      priority_focus: "Self-introduction in family contexts",
      lessons: [
        {
          name: "My Name Is",
          position: 1,
          difficulty_level: 1,
          estimated_minutes: 15,
          lesson_description: "Introducing yourself and asking names"
        },
        {
          name: "Where I'm From", 
          position: 2,
          difficulty_level: 3,
          estimated_minutes: 20,
          lesson_description: "Talking about origins and background"
        },
        {
          name: "Age & Basic Info",
          position: 3,
          difficulty_level: 3,
          estimated_minutes: 20,
          lesson_description: "Sharing and asking about age and basic details"
        }
      ],
      cultural_focus: "Albanian naming conventions reflect family pride. Often include father's name and regional origins in introductions."
    }
  ],

  // Level 2: Family Foundation
  level2Skills: [
    {
      name: "Family Members",
      description: "Learn family relationships and describe your family structure",
      position: 3,
      prerequisites: [1, 2],
      cefr_level: "A1",
      estimated_lessons: 4,
      priority_focus: "Wife's family structure, Kosovo Albanian family dynamics",
      lessons: [
        {
          name: "Immediate Family",
          position: 1,
          difficulty_level: 2,
          estimated_minutes: 20,
          lesson_description: "Parents, siblings, spouse, children"
        },
        {
          name: "Extended Family",
          position: 2, 
          difficulty_level: 4,
          estimated_minutes: 25,
          lesson_description: "Grandparents, aunts, uncles, cousins, in-laws"
        },
        {
          name: "Family Relationships",
          position: 3,
          difficulty_level: 3,
          estimated_minutes: 20,
          lesson_description: "Describing relationships and family connections"
        },
        {
          name: "Family Descriptions",
          position: 4,
          difficulty_level: 4,
          estimated_minutes: 25,
          lesson_description: "Ages, occupations, and characteristics of family members"
        }
      ],
      cultural_focus: "Extended family is central to Albanian life. Respect for elders is paramount. Many specific terms for in-law relationships."
    },
    {
      name: "Family Conversations",
      description: "Participate in family discussions and social interactions",
      position: 4,
      prerequisites: [3],
      cefr_level: "A1",
      estimated_lessons: 4,
      priority_focus: "Group text responses and coffee conversation participation",
      lessons: [
        {
          name: "Introducing Family",
          position: 1,
          difficulty_level: 3,
          estimated_minutes: 20,
          lesson_description: "Presenting family members to others"
        },
        {
          name: "Talking About Family",
          position: 2,
          difficulty_level: 4,
          estimated_minutes: 25,
          lesson_description: "Sharing family news and updates"
        },
        {
          name: "Family Activities",
          position: 3,
          difficulty_level: 4,
          estimated_minutes: 25,
          lesson_description: "Discussing family plans and activities"
        },
        {
          name: "Family Plans",
          position: 4,
          difficulty_level: 5,
          estimated_minutes: 30,
          lesson_description: "Making and discussing family arrangements"
        }
      ],
      conversation_scenarios: ["Family dinner conversation", "Meeting relatives for first time", "Family celebration planning"],
      cultural_focus: "Family conversations prioritize health, well-being, and mutual support. Always inquire about family before personal matters."
    }
  ],

  // Level 3: Numbers & Time
  level3Skills: [
    {
      name: "Numbers 1-20",
      description: "Count and use numbers in daily conversations and card games",
      position: 5,
      prerequisites: [1],
      cefr_level: "A1",
      estimated_lessons: 3,
      priority_focus: "Card game scoring and basic counting needs",
      lessons: [
        {
          name: "Numbers 1-10",
          position: 1,
          difficulty_level: 2,
          estimated_minutes: 15,
          lesson_description: "Basic counting and simple numbers"
        },
        {
          name: "Numbers 11-20",
          position: 2,
          difficulty_level: 3,
          estimated_minutes: 20,
          lesson_description: "Teen numbers and twenty"
        },
        {
          name: "Counting & Quantities",
          position: 3,
          difficulty_level: 4,
          estimated_minutes: 25,
          lesson_description: "Using numbers with objects and quantities"
        }
      ],
      practical_applications: ["Card game scoring", "Ages and important dates", "Simple counting and math"],
      cultural_focus: "Numbers are essential for card games and family celebrations. Age is often discussed in family contexts."
    },
    {
      name: "Days & Time", 
      description: "Tell time and discuss schedules for family coordination",
      position: 6,
      prerequisites: [5],
      cefr_level: "A1",
      estimated_lessons: 4,
      priority_focus: "Coordinating family visits and meal times",
      lessons: [
        {
          name: "Days of Week",
          position: 1,
          difficulty_level: 2,
          estimated_minutes: 15,
          lesson_description: "Seven days and weekend concepts"
        },
        {
          name: "Telling Time",
          position: 2,
          difficulty_level: 5,
          estimated_minutes: 30,
          lesson_description: "Hours, minutes, and time expressions"
        },
        {
          name: "Time Expressions",
          position: 3,
          difficulty_level: 4,
          estimated_minutes: 25,
          lesson_description: "Morning, afternoon, evening, early, late"
        },
        {
          name: "Scheduling",
          position: 4,
          difficulty_level: 6,
          estimated_minutes: 35,
          lesson_description: "Making appointments and coordinating times"
        }
      ],
      conversation_scenarios: ["Scheduling family visits", "Coordinating meal times", "Making appointments"],
      cultural_focus: "Albanian families coordinate closely. Coffee invitations and family meals happen at specific traditional times."
    }
  ],

  // Level 4: Daily Communication
  level4Skills: [
    {
      name: "Basic Conversations",
      description: "Engage in everyday conversations and express basic opinions",
      position: 7,
      prerequisites: [2, 4],
      cefr_level: "A1", 
      estimated_lessons: 5,
      priority_focus: "Family group text responses and coffee conversation participation",
      lessons: [
        {
          name: "How Are You",
          position: 1,
          difficulty_level: 2,
          estimated_minutes: 15,
          lesson_description: "Health inquiries and basic responses"
        },
        {
          name: "What's New",
          position: 2,
          difficulty_level: 4,
          estimated_minutes: 25,
          lesson_description: "Sharing and asking for updates"
        },
        {
          name: "Making Plans",
          position: 3,
          difficulty_level: 5,
          estimated_minutes: 30,
          lesson_description: "Suggesting activities and coordinating"
        },
        {
          name: "Small Talk",
          position: 4,
          difficulty_level: 4,
          estimated_minutes: 25,
          lesson_description: "Weather, general topics, light conversation"
        },
        {
          name: "Basic Opinions",
          position: 5,
          difficulty_level: 5,
          estimated_minutes: 30,
          lesson_description: "Expressing likes, dislikes, and preferences"
        }
      ],
      family_conversation_focus: ["Group text responses", "Coffee conversation starters", "Casual check-ins with relatives"],
      cultural_focus: "Albanian conversations emphasize personal connection. Always start with family/health before business or plans."
    },
    {
      name: "Household Terms",
      description: "Navigate home environments and discuss daily activities",
      position: 8,
      prerequisites: [3, 6],
      cefr_level: "A1",
      estimated_lessons: 4,
      priority_focus: "Helping at family gatherings and describing daily life",
      lessons: [
        {
          name: "Home & Rooms",
          position: 1,
          difficulty_level: 3,
          estimated_minutes: 20,
          lesson_description: "House parts and room names"
        },
        {
          name: "Daily Activities",
          position: 2,
          difficulty_level: 4,
          estimated_minutes: 25,
          lesson_description: "Morning routines and daily actions"
        },
        {
          name: "Household Objects", 
          position: 3,
          difficulty_level: 4,
          estimated_minutes: 25,
          lesson_description: "Common furniture and household items"
        },
        {
          name: "Daily Routines",
          position: 4,
          difficulty_level: 5,
          estimated_minutes: 30,
          lesson_description: "Describing schedules and regular activities"
        }
      ],
      practical_scenarios: ["Helping at family gatherings", "Describing your home to relatives", "Discussing daily routines"],
      cultural_focus: "Albanian homes are centers of family life. Hospitality and helping with household tasks shows respect."
    }
  ],

  // Level 5: Social Interaction (A2 Development)
  level5Skills: [
    {
      name: "Card Games & Leisure",
      description: "Participate in card games and leisure activities with family",
      position: 9,
      prerequisites: [5, 7],
      cefr_level: "A2",
      estimated_lessons: 3,
      priority_focus: "Albanian card game participation and social gaming",
      lessons: [
        {
          name: "Card Game Terms",
          position: 1,
          difficulty_level: 4,
          estimated_minutes: 25,
          lesson_description: "Deck, cards, dealing, hands, turns"
        },
        {
          name: "Winning & Losing",
          position: 2,
          difficulty_level: 5,
          estimated_minutes: 30,
          lesson_description: "Score, points, victory, defeat expressions"
        },
        {
          name: "Game Conversation",
          position: 3,
          difficulty_level: 6,
          estimated_minutes: 35,
          lesson_description: "Friendly banter, encouragement, game etiquette"
        }
      ],
      specific_applications: ["Albanian card game terminology", "Competitive but friendly banter", "Celebration and consolation phrases"],
      cultural_focus: "Card games are social bonding time, not just competition. Good sportsmanship and encouraging others is valued."
    },
    {
      name: "Food & Gatherings",
      description: "Navigate food conversations and family meal situations",
      position: 10,
      prerequisites: [4, 8],
      cefr_level: "A2",
      estimated_lessons: 4,
      priority_focus: "Family meal participation and traditional food culture",
      lessons: [
        {
          name: "Food Names",
          position: 1,
          difficulty_level: 4,
          estimated_minutes: 25,
          lesson_description: "Common Albanian dishes and ingredients"
        },
        {
          name: "Meal Conversations",
          position: 2,
          difficulty_level: 5,
          estimated_minutes: 30,
          lesson_description: "Table talk and meal-time discussions"
        },
        {
          name: "Cooking Terms",
          position: 3,
          difficulty_level: 6,
          estimated_minutes: 35,
          lesson_description: "Preparation methods and cooking vocabulary"
        },
        {
          name: "Food Preferences",
          position: 4,
          difficulty_level: 5,
          estimated_minutes: 30,
          lesson_description: "Likes, dislikes, dietary needs, compliments"
        }
      ],
      cultural_integration: ["Traditional Kosovo Albanian dishes", "Family meal etiquette and customs", "Food sharing and hospitality culture"],
      cultural_focus: "Food is central to Albanian family life. Refusing offered food can be insulting. Always compliment the cook."
    }
  ],

  // Level 6: Complex Communication (A2 Advanced)
  level6Skills: [
    {
      name: "Opinions & Feelings",
      description: "Express emotions, opinions, and engage in deeper conversations",
      position: 11,
      prerequisites: [7, 9],
      cefr_level: "A2",
      estimated_lessons: 4,
      priority_focus: "Meaningful family discussions and emotional expression",
      lessons: [
        {
          name: "Expressing Opinions",
          position: 1,
          difficulty_level: 6,
          estimated_minutes: 35,
          lesson_description: "I think, I believe, in my opinion"
        },
        {
          name: "Emotions & Feelings",
          position: 2,
          difficulty_level: 5,
          estimated_minutes: 30,
          lesson_description: "Happy, sad, excited, worried, proud"
        },
        {
          name: "Agreeing & Disagreeing",
          position: 3,
          difficulty_level: 7,
          estimated_minutes: 40,
          lesson_description: "Polite agreement and respectful disagreement"
        },
        {
          name: "Personal Preferences", 
          position: 4,
          difficulty_level: 6,
          estimated_minutes: 35,
          lesson_description: "Favorites, preferences, explaining choices"
        }
      ],
      conversation_applications: ["Family discussions and decision-making", "Sharing personal thoughts respectfully", "Expressing preferences in group settings"],
      cultural_focus: "Albanian families value harmony. Express disagreement respectfully, especially with elders. Personal opinions shared within family trust."
    },
    {
      name: "Future & Plans",
      description: "Discuss future plans, hopes, and family expectations",
      position: 12,
      prerequisites: [6, 10],
      cefr_level: "A2",
      estimated_lessons: 4,
      priority_focus: "Future family planning and parenting preparation",
      lessons: [
        {
          name: "Future Tense Basics",
          position: 1,
          difficulty_level: 7,
          estimated_minutes: 40,
          lesson_description: "Will, going to, planning to"
        },
        {
          name: "Making Plans",
          position: 2,
          difficulty_level: 6,
          estimated_minutes: 35,
          lesson_description: "Family plans, vacation, visits, events"
        },
        {
          name: "Hopes & Dreams",
          position: 3,
          difficulty_level: 7,
          estimated_minutes: 40,
          lesson_description: "Aspirations, wishes, goals for family"
        },
        {
          name: "Life Predictions",
          position: 4,
          difficulty_level: 8,
          estimated_minutes: 45,
          lesson_description: "Discussing possibilities and future expectations"
        }
      ],
      parent_preparation: ["Talking about baby and family expansion", "Discussing family future and traditions", "Life goals and family values"],
      cultural_focus: "Albanian families plan together. Children's future is family priority. Traditional values balanced with modern aspirations."
    }
  ]
};

module.exports = skillTreeData;