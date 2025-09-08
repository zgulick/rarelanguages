/**
 * Conversation Scenario Templates
 * Real-world family situations and card game interactions
 * English frameworks ready for AI translation
 */

const conversationScenarios = {

  // Family Group Text Response Templates  
  familyTextScenarios: {
    category: "Family Group Text Messages",
    description: "Common family group chat situations and appropriate responses",
    priority: "highest",
    cultural_context: "Albanian families maintain close contact through group messaging. Participation shows care and family commitment.",
    
    scenarios: [
      {
        context: "Someone shares good news",
        situation_description: "Family member announces promotion, pregnancy, achievement, etc.",
        english_responses: [
          "Congratulations!",
          "I'm so happy for you!",
          "That's wonderful news!",
          "Amazing! Well deserved!",
          "So proud of you!",
          "This is fantastic!",
          "We're all so excited!",
          "God bless you!"
        ],
        cultural_note: "Celebrating together is very important. Entire family should respond quickly and enthusiastically.",
        response_timing: "Respond within hours, not days - silence interpreted as lack of care",
        follow_up_suggestions: ["Ask for more details", "Offer to help celebrate", "Share excitement with other family members"]
      },
      {
        context: "Making plans to visit",
        situation_description: "Coordinating family visits, meals, or gatherings",
        english_phrases: [
          "When should I come?",
          "What time works for you?",
          "I'll bring something for dinner",
          "What can I bring?",
          "Looking forward to seeing everyone",
          "Can't wait to visit!",
          "Should I come early to help?",
          "I'll bring the kids too",
          "Will uncle/aunt be there?",
          "How long should I plan to stay?"
        ],
        cultural_note: "Never arrive empty-handed. Always coordinate respectfully with hosts about timing and contributions.",
        planning_elements: ["Timing coordination", "Food/gift contributions", "Duration planning", "Including other family members"]
      },
      {
        context: "Checking on family health",
        situation_description: "Regular wellness check-ins, especially with elders",
        english_phrases: [
          "How is everyone feeling?",
          "How are you doing?",
          "Is everything okay with the family?",
          "How's your health?",
          "Sending love to everyone",
          "Hope you're all well",
          "Thinking of you all",
          "Let me know if you need anything",
          "How's grandma/grandpa doing?",
          "Are you taking care of yourself?"
        ],
        cultural_note: "Family health is top priority. Regular check-ins show love and respect, especially for older family members.",
        frequency: "Weekly minimum, daily during illness or difficult times"
      },
      {
        context: "Responding to family photos",
        situation_description: "Someone shares family photos or milestone pictures",
        english_responses: [
          "Beautiful family!",
          "Such a nice picture!",
          "Everyone looks so happy!",
          "Love seeing you all together",
          "The kids are getting so big!",
          "What a wonderful memory",
          "You all look great!",
          "Thanks for sharing this",
          "Miss you all!",
          "Can't wait to see you in person"
        ],
        cultural_note: "Photos represent family unity and milestones. Always respond positively and comment on growth, happiness, togetherness."
      },
      {
        context: "Sharing daily life updates",
        situation_description: "Keeping family informed about work, daily activities, small news",
        english_examples: [
          "Just finished work, heading home",
          "Having coffee with a friend", 
          "Kids did well in school today",
          "Made your recipe for dinner - delicious!",
          "Weather is beautiful here",
          "Thinking of you all",
          "Busy day but good",
          "Weekend plans with family"
        ],
        cultural_note: "Sharing daily life makes family feel included and connected. Include family in routine experiences.",
        sharing_frequency: "Few times per week - show you think of family regularly"
      }
    ]
  },

  // Card Game Conversation Templates
  cardGameScenarios: {
    category: "Card Game Social Interactions",
    description: "Typical conversations during family card game sessions",
    priority: "high", 
    cultural_context: "Card games are social bonding time, not just competition. Focus on encouraging others and maintaining friendly atmosphere.",

    scenarios: [
      {
        context: "Starting a game",
        situation_description: "Beginning card game session, organizing players",
        english_phrases: [
          "Who wants to play cards?",
          "Let's start a game!",
          "What game should we play?",
          "I'll deal first",
          "Everyone ready?",
          "Whose turn is it to deal?",
          "Let me shuffle the cards",
          "Are we all playing?",
          "Same rules as last time?",
          "Should we play teams?"
        ],
        cultural_note: "Include everyone who wants to play. Games are social time, not exclusive competition.",
        organization_elements: ["Player inclusion", "Game selection", "Rule clarification", "Team formation if applicable"]
      },
      {
        context: "During active play",
        situation_description: "Ongoing game commentary and encouragement",
        english_phrases: [
          "Good move!",
          "Nice hand!",
          "Your turn",
          "Well played!",
          "That was smart",
          "Good thinking",
          "I didn't see that coming",
          "Clever play",
          "You're doing well",
          "Good strategy",
          "That's the way to do it",
          "I fold",
          "I pass",
          "Your deal"
        ],
        cultural_note: "Encourage good play from everyone. Competitive but supportive atmosphere valued.",
        interaction_types: ["Encouragement", "Move recognition", "Game mechanics", "Strategy appreciation"]
      },
      {
        context: "Winning and losing moments",
        situation_description: "Handling victory and defeat gracefully",
        english_phrases: [
          "Good game everyone!",
          "Well played all around",
          "That was fun!",
          "You played really well",
          "Lucky cards this time",
          "Better luck next hand",
          "Want to play again?",
          "One more game?",
          "That was a close one",
          "You almost had me there",
          "Great game!",
          "Thanks for playing"
        ],
        cultural_note: "Always end games positively. Focus on fun and social bonding rather than winning/losing.",
        sportsmanship_elements: ["Congratulating winners", "Encouraging losers", "Emphasizing fun over competition", "Inviting continued play"]
      },
      {
        context: "Game interruptions and breaks",
        situation_description: "Handling phone calls, food breaks, or other interruptions during games",
        english_phrases: [
          "Let's take a break",
          "I need some coffee",
          "Someone's calling me",
          "Let's eat something",
          "We can pause here",
          "Save my hand",
          "I'll be right back", 
          "Continue without me for now",
          "Where were we?",
          "Whose turn was it?",
          "Let's finish this hand first"
        ],
        cultural_note: "Games accommodate family life. Food, coffee, and family needs come before game completion.",
        accommodation_types: ["Food/drink breaks", "Family interruptions", "Phone calls", "Game resumption"]
      }
    ]
  },

  // Coffee Conversation Templates
  coffeeConversationScenarios: {
    category: "Coffee Culture Conversations", 
    description: "Small talk and bonding during coffee time",
    priority: "high",
    cultural_context: "Coffee time is sacred social bonding. Never rush. Use for relationship building and gentle information sharing.",

    scenarios: [
      {
        context: "Inviting for coffee",
        situation_description: "Extending coffee invitations to family or friends",
        english_phrases: [
          "Would you like to have coffee?",
          "Let's sit and have some coffee",
          "Come, let's have coffee together",
          "Do you want coffee?",
          "I just made fresh coffee",
          "Join me for coffee?",
          "Coffee is ready",
          "Let's take a coffee break",
          "Have time for coffee?",
          "Coffee and chat?"
        ],
        cultural_note: "Coffee invitations are serious friendship gestures. Rarely refused without good reason.",
        invitation_context: ["Morning routine", "Guest arrival", "after meals", "casual visits"]
      },
      {
        context: "Coffee conversation topics",
        situation_description: "Appropriate light conversation during coffee time",
        english_topics: [
          "How's the family?",
          "What's new with you?",
          "How's work going?",
          "Beautiful weather today",
          "How are the kids?",
          "Any plans for the weekend?",
          "Did you hear about...?",
          "How's your health?",
          "What have you been up to?",
          "Everything going well?"
        ],
        cultural_note: "Start with family/health, move to lighter topics. Avoid heavy problems during first coffee - build relationship first.",
        topic_progression: ["Family health inquiry", "Personal updates", "Light news/weather", "Future plans"]
      },
      {
        context: "Extending coffee time",
        situation_description: "Making coffee last for proper social bonding",
        english_phrases: [
          "This coffee is perfect",
          "No rush, we have time",
          "Let's have another cup",
          "Sit, relax for a while",
          "Tell me more about...",
          "This is nice, just talking",
          "I'm enjoying this conversation",
          "No need to hurry",
          "Want some more coffee?",
          "Let's finish our coffee first"
        ],
        cultural_note: "Coffee time is for bonding, not just caffeine. Extended conversation shows care and friendship.",
        bonding_elements: ["Unhurried pace", "Active listening", "Follow-up questions", "Comfortable silence"]
      }
    ]
  },

  // Family Meal Conversations
  familyMealScenarios: {
    category: "Family Meal Conversations",
    description: "Dinner table and family gathering meal interactions", 
    priority: "high",
    cultural_context: "Family meals are central to Albanian culture. Everyone participates in conversation. Food appreciation is important.",

    scenarios: [
      {
        context: "Beginning of meal",
        situation_description: "Starting family dinner, welcoming everyone to table",
        english_phrases: [
          "Everyone sit down, dinner is ready",
          "Come to the table",
          "Let's eat together",
          "Food is getting cold",
          "Bring your plates",
          "Did everyone wash hands?",
          "Bon appetit everyone",
          "Let's start",
          "Help yourself",
          "Pass the bread please"
        ],
        cultural_note: "Family gathers together for meals. Wait for elders to begin. Everyone should participate.",
        meal_etiquette: ["Wait for elders", "Pass food to others", "Include everyone", "Express gratitude"]
      },
      {
        context: "Food appreciation",
        situation_description: "Complimenting cooking and expressing enjoyment of meal",
        english_phrases: [
          "This is delicious!",
          "You're such a good cook",
          "This tastes amazing",
          "I love this dish",
          "Can I have the recipe?",
          "You outdid yourself",
          "Everything is perfect",
          "This is my favorite",
          "You cook better than restaurants",
          "I'm going to have seconds"
        ],
        cultural_note: "Always compliment the cooking. Food appreciation shows respect and gratitude to the cook.",
        appreciation_types: ["Taste compliments", "Cooking skill recognition", "Recipe requests", "Portion enthusiasm"]
      },
      {
        context: "Family updates during meals",
        situation_description: "Sharing news and updates while eating together",
        english_conversation_starters: [
          "How was everyone's day?",
          "What happened at work/school?",
          "Tell us about your week",
          "Any interesting news?",
          "What's everyone up to tomorrow?",
          "How are the cousins doing?",
          "Did you talk to aunt/uncle lately?",
          "What's new in the family?",
          "Anyone have plans this weekend?",
          "How's everyone feeling?"
        ],
        cultural_note: "Meal time is for family connection. Everyone shares and everyone listens. Include absent family members in conversation.",
        sharing_elements: ["Daily experiences", "Family member updates", "Future plans", "Extended family news"]
      },
      {
        context: "Offering and serving food",
        situation_description: "Hospitality during meals, ensuring everyone eats well",
        english_phrases: [
          "Have some more",
          "Try this dish",
          "You're not eating enough",
          "Take more bread",
          "Have you tried this?",
          "Eat, eat, there's plenty",
          "Don't be shy, help yourself",
          "You need to eat more",
          "This is good for you",
          "Just a little bit more"
        ],
        cultural_note: "Albanian hospitality requires ensuring guests eat well. Persistent offering shows care, not pushiness.",
        hospitality_aspects: ["Persistent offering", "Care expression", "Abundance sharing", "Guest priority"]
      }
    ]
  },

  // Phone Call Conversations  
  phoneCallScenarios: {
    category: "Family Phone Conversations",
    description: "Typical family phone call structure and topics",
    priority: "medium",
    cultural_context: "Phone calls follow predictable patterns: health inquiry, family updates, future plans. Always end with expressions of love.",

    scenarios: [
      {
        context: "Opening phone calls",
        situation_description: "Beginning family phone conversations appropriately",
        english_phrases: [
          "Hello, how are you?",
          "Hi, good to hear your voice",
          "How's everyone doing?",
          "How are you feeling?",
          "Is everything okay?",
          "Good morning/afternoon/evening",
          "Hope I'm not calling at a bad time",
          "Just wanted to check on you",
          "How's the family?",
          "What's going on with everyone?"
        ],
        cultural_note: "Always start with health and family inquiry. Personal news comes after ensuring everyone is well.",
        call_opening_structure: ["Health inquiry", "Family check", "Timing consideration", "Care expression"]
      },
      {
        context: "Ending phone calls",
        situation_description: "Closing family phone conversations with warmth",
        english_phrases: [
          "Take care of yourself",
          "Give my love to everyone",
          "Kiss the kids for me",
          "Say hello to the family",
          "Talk to you soon",
          "Call me if you need anything",
          "Love you all",
          "Stay healthy",
          "God bless you",
          "Until next time"
        ],
        cultural_note: "Phone calls end with expressions of love and care. Include messages for other family members.",
        closing_elements: ["Care expression", "Love declaration", "Messages for others", "Future contact promise"]
      }
    ]
  }
};

// Helper functions for accessing conversation scenarios
const conversationScenarioHelpers = {
  
  getScenariosByPriority: (priority) => {
    return Object.values(conversationScenarios).filter(category => category.priority === priority);
  },

  getScenariosByCategory: (categoryName) => {
    return Object.values(conversationScenarios).find(category => 
      category.category.toLowerCase().includes(categoryName.toLowerCase())
    );
  },

  getAllPhrasesForContext: (context) => {
    let phrases = [];
    Object.values(conversationScenarios).forEach(category => {
      category.scenarios.forEach(scenario => {
        if (scenario.context.toLowerCase().includes(context.toLowerCase())) {
          if (scenario.english_phrases) phrases.push(...scenario.english_phrases);
          if (scenario.english_responses) phrases.push(...scenario.english_responses);
          if (scenario.english_topics) phrases.push(...scenario.english_topics);
          if (scenario.english_examples) phrases.push(...scenario.english_examples);
          if (scenario.english_conversation_starters) phrases.push(...scenario.english_conversation_starters);
        }
      });
    });
    return phrases;
  },

  getConversationFrameworkForSkill: (skillName) => {
    const skillScenarioMap = {
      "Family Conversations": ["familyTextScenarios", "familyMealScenarios", "phoneCallScenarios"],
      "Card Games & Leisure": ["cardGameScenarios"],
      "Basic Conversations": ["coffeeConversationScenarios", "familyTextScenarios"],
      "Food & Gatherings": ["familyMealScenarios"],
      "Greetings & Politeness": ["phoneCallScenarios", "coffeeConversationScenarios"]
    };
    
    const relevantCategories = skillScenarioMap[skillName] || [];
    return relevantCategories.map(categoryKey => conversationScenarios[categoryKey]);
  }
};

module.exports = {
  conversationScenarios,
  conversationScenarioHelpers
};