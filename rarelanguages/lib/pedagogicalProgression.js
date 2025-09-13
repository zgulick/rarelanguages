/**
 * Pedagogical Progression Framework for Phase 3
 * Enhances existing academic lesson structure with systematic progression
 */

export const PedagogicalLevels = {
  RECOGNITION: {
    order: 1,
    name: 'Recognition',
    description: 'Recognize patterns and understand meaning',
    cognitiveLoad: 'low',
    successThreshold: 85,
    exercises: ['multiple_choice', 'matching', 'visual_recognition', 'audio_comprehension'],
    duration: '2-3 minutes per concept'
  },
  
  GUIDED_PRACTICE: {
    order: 2,
    name: 'Guided Practice', 
    description: 'Practice with scaffolding and immediate feedback',
    cognitiveLoad: 'medium',
    successThreshold: 80,
    exercises: ['fill_in_blank', 'guided_audio', 'pattern_completion', 'assisted_conversation'],
    duration: '3-5 minutes per concept'
  },
  
  INDEPENDENT_PRODUCTION: {
    order: 3,
    name: 'Independent Production',
    description: 'Use language independently in realistic contexts', 
    cognitiveLoad: 'high',
    successThreshold: 75,
    exercises: ['free_conversation', 'open_audio', 'translation', 'scenario_response'],
    duration: '5-8 minutes per concept'
  },
  
  CULTURAL_INTEGRATION: {
    order: 4,
    name: 'Cultural Integration',
    description: 'Apply in complex, culturally-aware scenarios',
    cognitiveLoad: 'very_high', 
    successThreshold: 70,
    exercises: ['family_scenario', 'cultural_navigation', 'complex_conversation', 'real_world_application'],
    duration: '8-12 minutes per concept'
  }
};

export const CulturalCompetencyFramework = {
  AWARENESS: {
    level: 1,
    name: 'Cultural Awareness',
    description: 'Basic understanding that cultural differences exist',
    indicators: ['recognizes_cultural_differences', 'shows_curiosity', 'asks_appropriate_questions'],
    assessmentTypes: ['observation', 'reflection_questions', 'cultural_recognition_exercises']
  },
  
  KNOWLEDGE: {
    level: 2, 
    name: 'Cultural Knowledge',
    description: 'Learns specific cultural practices and values',
    indicators: ['knows_family_roles', 'understands_communication_patterns', 'recognizes_social_expectations'],
    assessmentTypes: ['scenario_analysis', 'cultural_facts_quiz', 'practice_interactions']
  },
  
  UNDERSTANDING: {
    level: 3,
    name: 'Cultural Understanding',
    description: 'Understands why cultural practices exist and their meaning',
    indicators: ['explains_cultural_reasoning', 'shows_empathy', 'adapts_behavior_appropriately'],
    assessmentTypes: ['cultural_explanation_tasks', 'perspective_taking_exercises', 'guided_reflection']
  },
  
  INTEGRATION: {
    level: 4,
    name: 'Cultural Integration', 
    description: 'Naturally integrates cultural awareness into language use',
    indicators: ['seamless_cultural_adaptation', 'builds_cultural_bridges', 'mentors_others'],
    assessmentTypes: ['authentic_family_interactions', 'cultural_leadership_tasks', 'peer_teaching']
  }
};

/**
 * Determines the appropriate pedagogical level for a user based on performance
 */
export function determinePedagogicalLevel(userPerformance, grammarConcept) {
  const { recentScores, consistency, culturalCompetency } = userPerformance;
  
  if (!recentScores || recentScores.length === 0) {
    return PedagogicalLevels.RECOGNITION;
  }
  
  const averageScore = recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length;
  const isConsistent = consistency > 0.85; // 85% consistency threshold
  
  // Determine level based on performance and consistency
  if (averageScore >= 85 && isConsistent) {
    if (culturalCompetency >= CulturalCompetencyFramework.UNDERSTANDING.level) {
      return PedagogicalLevels.CULTURAL_INTEGRATION;
    } else if (averageScore >= 80) {
      return PedagogicalLevels.INDEPENDENT_PRODUCTION;
    } else {
      return PedagogicalLevels.GUIDED_PRACTICE;
    }
  } else if (averageScore >= 75 && isConsistent) {
    return PedagogicalLevels.GUIDED_PRACTICE;
  } else {
    return PedagogicalLevels.RECOGNITION;
  }
}

/**
 * Generates micro-progression steps within each exercise phase
 */
export function generateMicroProgression(level, exerciseType, grammarConcept, culturalContext) {
  const baseProgression = {
    warmup: {
      description: 'Activate prior knowledge and prepare for learning',
      duration: '30-60 seconds',
      activities: []
    },
    instruction: {
      description: 'Present new concept or reinforce existing knowledge',
      duration: '1-2 minutes', 
      activities: []
    },
    practice: {
      description: 'Guided practice with immediate feedback',
      duration: '2-4 minutes',
      activities: []
    },
    application: {
      description: 'Apply knowledge in realistic context',
      duration: '1-3 minutes',
      activities: []
    },
    reflection: {
      description: 'Reflect on learning and cultural insights',
      duration: '30-90 seconds',
      activities: []
    }
  };
  
  // Customize progression based on pedagogical level
  switch (level.name) {
    case 'Recognition':
      baseProgression.warmup.activities = ['visual_preview', 'concept_introduction'];
      baseProgression.instruction.activities = ['pattern_explanation', 'example_demonstration'];
      baseProgression.practice.activities = ['multiple_choice', 'matching_exercises'];
      baseProgression.application.activities = ['simple_recognition_tasks'];
      baseProgression.reflection.activities = ['pattern_summary', 'cultural_note_preview'];
      break;
      
    case 'Guided Practice':
      baseProgression.warmup.activities = ['pattern_review', 'previous_lesson_connection'];
      baseProgression.instruction.activities = ['scaffolded_examples', 'mistake_prevention'];
      baseProgression.practice.activities = ['fill_in_blanks', 'guided_audio_practice'];
      baseProgression.application.activities = ['supported_conversation', 'pattern_application'];
      baseProgression.reflection.activities = ['cultural_connection', 'progress_acknowledgment'];
      break;
      
    case 'Independent Production':
      baseProgression.warmup.activities = ['concept_activation', 'cultural_context_setting'];
      baseProgression.instruction.activities = ['advanced_patterns', 'cultural_nuances'];
      baseProgression.practice.activities = ['free_response', 'translation_practice'];
      baseProgression.application.activities = ['independent_conversation', 'real_scenario_practice'];
      baseProgression.reflection.activities = ['cultural_competency_check', 'learning_integration'];
      break;
      
    case 'Cultural Integration':
      baseProgression.warmup.activities = ['cultural_scenario_setup', 'family_context_activation'];
      baseProgression.instruction.activities = ['cultural_competency_instruction', 'advanced_cultural_patterns'];
      baseProgression.practice.activities = ['complex_cultural_scenarios', 'multi_skill_integration'];
      baseProgression.application.activities = ['authentic_family_interaction', 'cultural_bridge_building'];
      baseProgression.reflection.activities = ['cultural_mastery_assessment', 'real_world_application_planning'];
      break;
  }
  
  return baseProgression;
}

/**
 * Assesses cultural competency based on user responses and behaviors
 */
export function assessCulturalCompetency(userResponses, culturalScenarios, currentLevel) {
  const competencyIndicators = {
    awareness: 0,
    knowledge: 0, 
    understanding: 0,
    integration: 0
  };
  
  userResponses.forEach(response => {
    const scenario = culturalScenarios.find(s => s.id === response.scenarioId);
    if (!scenario) return;
    
    // Analyze response for cultural competency indicators
    if (response.recognizedCulturalElement) {
      competencyIndicators.awareness += 1;
    }
    
    if (response.appliedCulturalKnowledge) {
      competencyIndicators.knowledge += 1;
    }
    
    if (response.explainedCulturalReasoning) {
      competencyIndicators.understanding += 1;
    }
    
    if (response.adaptedBehaviorNaturally) {
      competencyIndicators.integration += 1;
    }
  });
  
  // Calculate overall competency level
  const totalResponses = userResponses.length;
  const competencyScore = (
    (competencyIndicators.awareness * 0.1) +
    (competencyIndicators.knowledge * 0.3) + 
    (competencyIndicators.understanding * 0.4) +
    (competencyIndicators.integration * 0.2)
  ) / totalResponses;
  
  if (competencyScore >= 0.8) return CulturalCompetencyFramework.INTEGRATION;
  if (competencyScore >= 0.6) return CulturalCompetencyFramework.UNDERSTANDING;
  if (competencyScore >= 0.4) return CulturalCompetencyFramework.KNOWLEDGE;
  return CulturalCompetencyFramework.AWARENESS;
}

/**
 * Albanian Family Cultural Themes for integration
 */
export const AlbanianCulturalThemes = {
  FAMILY_HIERARCHY: {
    name: 'Family Hierarchy',
    importance: 'critical',
    description: 'Understanding respect for elders and family roles',
    languageConnections: ['formal_vs_informal_address', 'respect_expressions', 'family_titles'],
    scenarios: ['meeting_family_elders', 'family_decision_making', 'showing_proper_respect'],
    competencyProgression: {
      awareness: 'Recognizes that Albanian families have hierarchical structure',
      knowledge: 'Knows specific roles of different family members',
      understanding: 'Understands why hierarchy exists and its cultural importance',
      integration: 'Naturally adapts behavior to show appropriate respect'
    }
  },
  
  HOSPITALITY: {
    name: 'Albanian Hospitality',
    importance: 'critical', 
    description: 'Albanian hospitality customs and guest treatment',
    languageConnections: ['invitation_language', 'gratitude_expressions', 'polite_refusal_methods'],
    scenarios: ['being_welcomed_as_guest', 'participating_in_meals', 'expressing_gratitude'],
    competencyProgression: {
      awareness: 'Recognizes Albanian hospitality is culturally important',
      knowledge: 'Knows specific hospitality customs and expectations',
      understanding: 'Understands the cultural values behind hospitality practices',
      integration: 'Participates naturally in hospitality exchanges'
    }
  },
  
  RELIGIOUS_SENSITIVITY: {
    name: 'Religious Awareness',
    importance: 'important',
    description: 'Respectful navigation of religious considerations',
    languageConnections: ['religious_greetings', 'respectful_expressions', 'cultural_timing'],
    scenarios: ['ramadan_awareness', 'prayer_time_respect', 'religious_holiday_participation'],
    competencyProgression: {
      awareness: 'Recognizes religious diversity exists in Albanian families',
      knowledge: 'Knows basic religious practices and considerations',
      understanding: 'Understands how to be respectful across different religious practices',
      integration: 'Naturally adapts behavior to show religious sensitivity'
    }
  }
};