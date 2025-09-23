'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import ConjugationTable from '../../../../components/ConjugationTable';
import GrammarExplanationCard from '../../../../components/GrammarExplanationCard';

interface LessonContent {
  id: string;
  english_phrase: string;
  target_phrase: string;
  pronunciation_guide: string;
  difficulty_level: number;
  content_type: string;
  cultural_context: string | null;
  grammar_notes: string | null;
  position: number;
  // New grammar fields
  word_type: string | null;
  verb_type: string | null;
  gender: string | null;
  stress_pattern: string | null;
  conjugation_data: any | null;
  grammar_category: string | null;
  difficulty_notes: string | null;
  usage_examples: any[] | null;
}

interface Lesson {
  id: string;
  name: string;
  description?: string;
  skill_name: string;
  skill_description: string;
  estimated_minutes: number;
  is_split_lesson: boolean;
  sub_lesson_count: number;
  total_sub_lessons: number;
  lesson_type: 'split' | 'single';
}

interface SubLesson {
  id: string;
  name: string;
  sequence_number: number;
  estimated_minutes: number;
  content_count: number;
  is_accessible: boolean;
  completion_status: string;
}

interface LessonInfo {
  id: string;
  name: string;
  is_sub_lesson: boolean;
  parent_lesson_id?: string;
  parent_lesson_name?: string;
  current_sub_lesson: number;
  total_sub_lessons: number;
  lesson_type: 'sub_lesson' | 'parent' | 'single';
}

interface Navigation {
  previous_lesson?: {
    id: string;
    name: string;
  } | null;
  next_lesson?: {
    id: string;
    name: string;
  } | null;
}

interface Section {
  section_id: string;
  section_type: string;
  section_order: number;
  title: string;
  description: string;
  estimated_minutes: number;
  content: LessonContent[];
}

// Create structured pedagogical flow from sections with proper content grouping
function createPedagogicalFlow(sections: Section[], fallbackContent: LessonContent[]): LessonContent[] {
  if (!sections || sections.length === 0) {
    console.log('No sections found, using fallback content');
    return fallbackContent || [];
  }

  const structuredFlow: LessonContent[] = [];

  // Extract all content from sections first
  const allContent = sections.flatMap(section => section.content || []);

  if (allContent.length === 0) {
    console.log('No content found in sections');
    return fallbackContent || [];
  }

  // Group content by type for better pedagogical organization
  const greetings = allContent.filter(c => c.grammar_category === 'greetings');
  const courtesy = allContent.filter(c => c.grammar_category === 'courtesy');
  const basicVerbs = allContent.filter(c =>
    c.word_type === 'verb' &&
    ['existence', 'movement'].includes(c.grammar_category || '') &&
    c.difficulty_progression === 1
  );
  const actionVerbs = allContent.filter(c =>
    c.word_type === 'verb' &&
    ['daily activities', 'actions'].includes(c.grammar_category || '')
  );
  const cognitiveVerbs = allContent.filter(c =>
    c.word_type === 'verb' &&
    ['cognition', 'communication'].includes(c.grammar_category || '')
  );
  const emotionVerbs = allContent.filter(c =>
    c.word_type === 'verb' &&
    ['emotions'].includes(c.grammar_category || '')
  );
  const physicalVerbs = allContent.filter(c =>
    c.word_type === 'verb' &&
    ['physical'].includes(c.grammar_category || '')
  );
  const otherContent = allContent.filter(c =>
    !['greetings', 'courtesy'].includes(c.grammar_category || '') &&
    c.word_type !== 'verb'
  );

  // Helper function to create section header
  const createSectionHeader = (id: string, emoji: string, title: string, description: string, estimatedMinutes: number = 3) => ({
    id: `section-header-${id}`,
    english_phrase: `${emoji} ${title}`,
    target_phrase: description,
    pronunciation_guide: `~${estimatedMinutes} minutes`,
    difficulty_level: 1,
    content_type: 'section_header',
    cultural_context: null,
    grammar_notes: null,
    position: structuredFlow.length + 1,
    word_type: 'section',
    verb_type: null,
    gender: null,
    stress_pattern: null,
    conjugation_data: null,
    grammar_category: 'section_header',
    difficulty_notes: null,
    usage_examples: null
  });

  // 1. Welcome Introduction
  structuredFlow.push(createSectionHeader(
    'welcome',
    '🌟',
    'Welcome to Albanian!',
    'You\'ll learn essential words and verbs in this lesson',
    2
  ));

  // 2. Basic Greetings (if any)
  if (greetings.length > 0) {
    structuredFlow.push(createSectionHeader(
      'greetings',
      '👋',
      'Basic Greetings',
      'Essential phrases for daily interactions',
      3
    ));

    greetings
      .sort((a, b) => (a.content_order || 0) - (b.content_order || 0))
      .forEach(content => {
        structuredFlow.push({
          ...content,
          position: structuredFlow.length + 1
        });
      });
  }

  // 3. Courtesy Expressions (if any)
  if (courtesy.length > 0) {
    structuredFlow.push(createSectionHeader(
      'courtesy',
      '🙏',
      'Polite Expressions',
      'Important courtesy phrases for respectful communication',
      4
    ));

    courtesy
      .sort((a, b) => (a.content_order || 0) - (b.content_order || 0))
      .forEach(content => {
        structuredFlow.push({
          ...content,
          position: structuredFlow.length + 1
        });
      });
  }

  // 4. Essential Verbs (to be, to have, to go, to come)
  if (basicVerbs.length > 0) {
    structuredFlow.push(createSectionHeader(
      'essential-verbs',
      '⭐',
      'Essential Verbs',
      'Master the most important Albanian verbs',
      8
    ));

    basicVerbs
      .sort((a, b) => (a.content_order || 0) - (b.content_order || 0))
      .forEach(content => {
        structuredFlow.push({
          ...content,
          position: structuredFlow.length + 1
        });
      });
  }

  // 5. Action Verbs (eat, drink, work, etc.)
  if (actionVerbs.length > 0) {
    structuredFlow.push(createSectionHeader(
      'action-verbs',
      '🏃',
      'Action Verbs',
      'Common verbs for daily activities',
      6
    ));

    actionVerbs
      .sort((a, b) => (a.content_order || 0) - (b.content_order || 0))
      .forEach(content => {
        structuredFlow.push({
          ...content,
          position: structuredFlow.length + 1
        });
      });
  }

  // 6. Thinking & Communication Verbs
  if (cognitiveVerbs.length > 0) {
    structuredFlow.push(createSectionHeader(
      'cognitive-verbs',
      '🧠',
      'Thinking & Communication',
      'Verbs for expressing thoughts and communication',
      5
    ));

    cognitiveVerbs
      .sort((a, b) => (a.content_order || 0) - (b.content_order || 0))
      .forEach(content => {
        structuredFlow.push({
          ...content,
          position: structuredFlow.length + 1
        });
      });
  }

  // 7. Emotion & Feeling Verbs
  if (emotionVerbs.length > 0) {
    structuredFlow.push(createSectionHeader(
      'emotion-verbs',
      '❤️',
      'Emotions & Feelings',
      'Express your emotions and feelings',
      4
    ));

    emotionVerbs
      .sort((a, b) => (a.content_order || 0) - (b.content_order || 0))
      .forEach(content => {
        structuredFlow.push({
          ...content,
          position: structuredFlow.length + 1
        });
      });
  }

  // 8. Physical Senses
  if (physicalVerbs.length > 0) {
    structuredFlow.push(createSectionHeader(
      'physical-verbs',
      '👁️',
      'Physical Senses',
      'Verbs related to the five senses',
      3
    ));

    physicalVerbs
      .sort((a, b) => (a.content_order || 0) - (b.content_order || 0))
      .forEach(content => {
        structuredFlow.push({
          ...content,
          position: structuredFlow.length + 1
        });
      });
  }

  // 9. Additional Content (if any)
  if (otherContent.length > 0) {
    structuredFlow.push(createSectionHeader(
      'additional',
      '📚',
      'Additional Vocabulary',
      'More useful words and phrases',
      3
    ));

    otherContent
      .sort((a, b) => (a.content_order || 0) - (b.content_order || 0))
      .forEach(content => {
        structuredFlow.push({
          ...content,
          position: structuredFlow.length + 1
        });
      });
  }

  // 10. Lesson Complete
  structuredFlow.push(createSectionHeader(
    'complete',
    '🎉',
    'Lesson Complete!',
    'Great job! You\'ve learned essential Albanian vocabulary',
    1
  ));

  console.log(`Created pedagogical flow: ${structuredFlow.length} cards from ${allContent.length} items`);
  console.log(`Organized into: ${greetings.length} greetings, ${courtesy.length} courtesy, ${basicVerbs.length} essential verbs, ${actionVerbs.length} action verbs, ${cognitiveVerbs.length} cognitive verbs, ${emotionVerbs.length} emotion verbs, ${physicalVerbs.length} physical verbs`);

  return structuredFlow;
}

export default function SkillLearningPage() {
  const params = useParams();
  const skillId = params.id as string;

  // State management for sub-lesson support
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [subLessons, setSubLessons] = useState<SubLesson[]>([]);
  const [currentSubLessonIndex, setCurrentSubLessonIndex] = useState(0);
  const [currentLessonInfo, setCurrentLessonInfo] = useState<LessonInfo | null>(null);
  const [currentContent, setCurrentContent] = useState<LessonContent[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [navigation, setNavigation] = useState<Navigation | null>(null);
  const [loading, setLoading] = useState(true);
  const [skillName, setSkillName] = useState('');
  const [isLoadingNextLesson, setIsLoadingNextLesson] = useState(false);
  const [lessonConjugations, setLessonConjugations] = useState<any>(null);
  const [isProcessedLesson, setIsProcessedLesson] = useState(false);
  const [processedLessons, setProcessedLessons] = useState<any[]>([]);
  const [currentProcessedLessonIndex, setCurrentProcessedLessonIndex] = useState(0);

  // Load processed lesson content from AI-generated lesson
  const loadProcessedLessonContent = async (processedLesson: any, allLessons?: any[]) => {
    try {
      console.log('🎓 Loading processed lesson:', processedLesson.title);

      // Set lesson info with proper sequencing
      const lessonsToUse = allLessons || processedLessons;
      const lessonSequenceIndex = lessonsToUse.findIndex(l => l.id === processedLesson.id);
      setCurrentLessonInfo({
        id: processedLesson.id,
        name: processedLesson.title,
        is_sub_lesson: true, // Treat as sub-lessons for progress display
        current_sub_lesson: lessonSequenceIndex + 1,
        total_sub_lessons: lessonsToUse.length,
        lesson_type: 'sub_lesson'
      });

      // Convert AI-generated lesson to learning cards
      const learningCards = convertProcessedLessonToCards(processedLesson);
      setCurrentContent(learningCards);
      setCurrentCardIndex(0);
      setIsProcessedLesson(true);

      // Set navigation for processed lessons
      const currentLessonIndex = lessonsToUse.findIndex(l => l.id === processedLesson.id);
      const hasNext = currentLessonIndex < lessonsToUse.length - 1;
      const hasPrevious = currentLessonIndex > 0;

      setNavigation({
        next_lesson: hasNext ? {
          id: lessonsToUse[currentLessonIndex + 1].id,
          name: lessonsToUse[currentLessonIndex + 1].title
        } : null,
        previous_lesson: hasPrevious ? {
          id: lessonsToUse[currentLessonIndex - 1].id,
          name: lessonsToUse[currentLessonIndex - 1].title
        } : null
      });

      // No conjugations for processed lessons yet
      setLessonConjugations(null);

    } catch (error) {
      console.error('Failed to load processed lesson:', error);
      throw error;
    }
  };

  // Convert processed lesson to learning cards
  const convertProcessedLessonToCards = (lesson: any): LessonContent[] => {
    const cards: LessonContent[] = [];
    let position = 1;

    // Add lesson introduction card
    cards.push({
      id: `intro-${lesson.id}`,
      english_phrase: `📚 ${lesson.title}`,
      target_phrase: lesson.overview?.learning_objectives?.join(', ') || 'Learn essential Albanian phrases',
      pronunciation_guide: `~${lesson.overview?.estimated_minutes || 10} minutes`,
      difficulty_level: lesson.overview?.difficulty_level || 1,
      content_type: 'section_header',
      cultural_context: null,
      grammar_notes: null,
      position: position++,
      word_type: 'section',
      verb_type: null,
      gender: null,
      stress_pattern: null,
      conjugation_data: null,
      grammar_category: 'section_header',
      difficulty_notes: null,
      usage_examples: null
    });

    // Add section cards
    if (lesson.sections && lesson.sections.length > 0) {
      lesson.sections.forEach((section: any, sectionIndex: number) => {
        // Add section header
        if (section.title) {
          cards.push({
            id: `section-${sectionIndex}-${lesson.id}`,
            english_phrase: `📖 ${section.title}`,
            target_phrase: section.content || 'Learn new vocabulary and grammar',
            pronunciation_guide: '',
            difficulty_level: lesson.overview?.difficulty_level || 1,
            content_type: 'section_header',
            cultural_context: null,
            grammar_notes: null,
            position: position++,
            word_type: 'section',
            verb_type: null,
            gender: null,
            stress_pattern: null,
            conjugation_data: null,
            grammar_category: 'section_header',
            difficulty_notes: null,
            usage_examples: null
          });
        }

        // Add exercise cards
        if (section.exercises && section.exercises.length > 0) {
          section.exercises.forEach((exercise: any, exerciseIndex: number) => {
            if (exercise.items && exercise.items.length > 0) {
              exercise.items.forEach((item: any, itemIndex: number) => {
                let englishPhrase = '';
                let targetPhrase = '';
                let pronunciationGuide = '';
                let wordType = 'phrase';
                let grammarNotes = exercise.instruction || null;

                if (typeof item === 'string') {
                  // Simple string item
                  if (item.includes(' → ')) {
                    const parts = item.split(' → ');
                    englishPhrase = parts[0].trim();
                    targetPhrase = parts[1].trim();
                  } else {
                    englishPhrase = item;
                    targetPhrase = item;
                  }
                } else if (typeof item === 'object') {
                  // Enhanced object parsing for different exercise types

                  // Flashcard format: {English: "Hello", Albanian: "Përshëndetje", Pronunciation: "..."}
                  if (item.English && item.Albanian) {
                    englishPhrase = item.English;
                    targetPhrase = item.Albanian;
                    pronunciationGuide = item.Pronunciation || '';
                  }
                  // Alternative flashcard format: {term: "One", translation: "Një", pronunciation: "nye"}
                  else if (item.term && item.translation) {
                    englishPhrase = item.term;
                    targetPhrase = item.translation;
                    pronunciationGuide = item.pronunciation || '';
                  }
                  // Question format: {albanian: "A je i lodhur?", question: "Are you tired?", pronunciation: "..."}
                  else if (item.albanian && item.question) {
                    englishPhrase = item.question;
                    targetPhrase = item.albanian;
                    pronunciationGuide = item.pronunciation || '';
                  }
                  // Multiple choice format: {question: "What is 'Four' in Albanian?", answer: "Kater", options: [...]}
                  else if (item.question && item.answer) {
                    englishPhrase = item.question;
                    targetPhrase = item.answer;
                    grammarNotes = `Multiple choice: ${item.options ? item.options.join(', ') : ''}`;
                  }
                  // Fill blank format: {sentence: "The ____ (first) person...", answer: "i pari"}
                  else if (item.sentence && item.answer) {
                    englishPhrase = item.sentence.replace('____', '______');
                    targetPhrase = item.answer;
                    grammarNotes = 'Fill in the blank';
                  }
                  // Role play format: {scenario: "Greet your partner in the morning..."}
                  else if (item.scenario) {
                    englishPhrase = `Practice scenario: ${item.scenario}`;
                    targetPhrase = 'Role play exercise';
                    grammarNotes = 'Practice speaking activity';
                    wordType = 'practice';
                  }
                  // Dialogue format: {dialogue: "A: Përshëndetje! Si jeni?\nB: ________, mirë..."}
                  else if (item.dialogue) {
                    englishPhrase = 'Complete the dialogue';
                    targetPhrase = item.dialogue.length > 100 ? item.dialogue.substring(0, 100) + '...' : item.dialogue;
                    grammarNotes = 'Dialogue completion exercise';
                    wordType = 'dialogue';
                  }
                  // General fallback
                  else {
                    englishPhrase = item.english || item.question || item.prompt || item.instruction || '';
                    targetPhrase = item.albanian || item.answer || item.target || item.translation || '';
                    pronunciationGuide = item.pronunciation || '';
                  }
                }

                if (englishPhrase && targetPhrase) {
                  cards.push({
                    id: `exercise-${sectionIndex}-${exerciseIndex}-${itemIndex}-${lesson.id}`,
                    english_phrase: englishPhrase,
                    target_phrase: targetPhrase,
                    pronunciation_guide: pronunciationGuide,
                    difficulty_level: lesson.overview?.difficulty_level || 1,
                    content_type: exercise.type || 'vocabulary',
                    cultural_context: null,
                    grammar_notes: grammarNotes,
                    position: position++,
                    word_type: wordType,
                    verb_type: null,
                    gender: null,
                    stress_pattern: pronunciationGuide,
                    conjugation_data: null,
                    grammar_category: exercise.type === 'flashcard' ? 'vocabulary' : 'practice',
                    difficulty_notes: null,
                    usage_examples: null
                  });
                }
              });
            }
          });
        }
      });
    }

    // Add completion card
    cards.push({
      id: `complete-${lesson.id}`,
      english_phrase: '🎉 Lesson Complete!',
      target_phrase: 'Excellent work! You\'ve completed this lesson.',
      pronunciation_guide: '',
      difficulty_level: 1,
      content_type: 'section_header',
      cultural_context: null,
      grammar_notes: null,
      position: position++,
      word_type: 'section',
      verb_type: null,
      gender: null,
      stress_pattern: null,
      conjugation_data: null,
      grammar_category: 'section_header',
      difficulty_notes: null,
      usage_examples: null
    });

    console.log(`Generated ${cards.length} learning cards from processed lesson`);
    return cards;
  };

  // Load lesson content for a specific lesson ID (legacy raw content)
  const loadLessonContent = async (lessonId: string) => {
    try {
      const lessonResponse = await fetch(`/api/lessons/${lessonId}/content`);

      if (!lessonResponse.ok) {
        throw new Error(`Failed to fetch lesson content: ${lessonResponse.status}`);
      }

      const lessonData = await lessonResponse.json();

      if (!lessonData.success) {
        throw new Error(`Lesson content API error: ${lessonData.error}`);
      }

      setCurrentLessonInfo(lessonData.lesson);

      // Create structured pedagogical flow from sections
      const structuredContent = createPedagogicalFlow(lessonData.sections, lessonData.content);
      setCurrentContent(structuredContent);

      setNavigation(lessonData.navigation);
      setCurrentCardIndex(0);

      // Fetch conjugation data for verbs in this lesson
      try {
        console.log(`Fetching conjugations for lesson ${lessonId}...`);
        const conjugationsResponse = await fetch(`/api/lessons/${lessonId}/conjugations`);

        if (conjugationsResponse.ok) {
          const conjugationsData = await conjugationsResponse.json();
          console.log('Conjugations API response:', conjugationsData);

          if (conjugationsData.success) {
            if (conjugationsData.verbs.length > 0) {
              console.log(`Found ${conjugationsData.verbs.length} verbs with conjugation data`);
              setLessonConjugations(conjugationsData);
            } else {
              console.log('No verbs found in this lesson');
              setLessonConjugations(null);
            }
          } else {
            console.log('Conjugations API returned success: false:', conjugationsData.error);
            setLessonConjugations(null);
          }
        } else {
          console.log(`Conjugations API failed with status ${conjugationsResponse.status}`);
          setLessonConjugations(null);
        }
      } catch (error) {
        console.log('Failed to fetch conjugation data:', error);
        setLessonConjugations(null);
      }

      return lessonData;
    } catch (error) {
      console.error('Failed to load lesson content:', error);
      throw error;
    }
  };

  // Initialize the learning experience
  useEffect(() => {
    const initializeLearning = async () => {
      try {
        // Try to get processed lessons first
        const processedResponse = await fetch(`/api/skills/${skillId}/processed-lessons`);

        if (!processedResponse.ok) {
          throw new Error(`No processed lessons available for this skill. Status: ${processedResponse.status}`);
        }

        const processedData = await processedResponse.json();

        if (!processedData.success || !processedData.lessons || processedData.lessons.length === 0) {
          throw new Error('No processed lessons found for this skill. This skill has not been processed yet.');
        }

        console.log('🎓 Using processed lessons:', processedData.lessons.length);
        setSkillName(processedData.skill.name);

        // Convert processed lessons to our format
        const convertedLessons = processedData.lessons.map((lesson: any, index: number) => ({
          id: lesson.id,
          name: lesson.title,
          description: lesson.overview?.learning_objectives?.join(', ') || '',
          skill_name: processedData.skill.name,
          skill_description: processedData.skill.description || '',
          estimated_minutes: lesson.overview?.estimated_minutes || 10,
          is_split_lesson: false,
          sub_lesson_count: 0,
          total_sub_lessons: 0,
          lesson_type: 'single' as 'split' | 'single'
        }));

        setLessons(convertedLessons);

        // Store processed lessons for navigation
        setProcessedLessons(processedData.lessons);
        setCurrentProcessedLessonIndex(0);

        // Load the first processed lesson
        await loadProcessedLessonContent(processedData.lessons[0], processedData.lessons);
        setLoading(false);

      } catch (error) {
        console.error('Failed to initialize learning:', error);
        setLoading(false);
        // Show error to user
        alert(`Failed to load lesson: ${error.message}`);
      }
    };

    if (skillId) {
      initializeLearning();
    }
  }, [skillId]);

  // Navigate to next lesson (handles both processed and raw lessons)
  const navigateToNextLesson = async () => {
    if (isLoadingNextLesson) return;

    try {
      setIsLoadingNextLesson(true);

      // Handle processed lesson navigation only
      if (navigation?.next_lesson) {
        const nextLessonIndex = processedLessons.findIndex(l => l.id === navigation.next_lesson?.id);
        if (nextLessonIndex !== -1) {
          setCurrentProcessedLessonIndex(nextLessonIndex);
          await loadProcessedLessonContent(processedLessons[nextLessonIndex]);
        }
      } else {
        // All processed lessons complete!
        alert('🎉 Congratulations! You have completed all lessons in this skill!');
      }
    } catch (error) {
      console.error('Failed to navigate to next lesson:', error);
      alert(`Failed to load next lesson: ${error.message}`);
    } finally {
      setIsLoadingNextLesson(false);
    }
  };

  const nextCard = () => {
    if (currentCardIndex < currentContent.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    } else {
      // Current lesson complete, navigate to next lesson
      navigateToNextLesson();
    }
  };

  const previousCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
    }
  };

  const renderLearningCard = (content: LessonContent) => {
    // Handle section headers with special styling
    if (content.content_type === 'section_header' || content.word_type === 'section') {
      return (
        <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-2xl shadow-lg border border-primary-200 p-8 max-w-3xl mx-auto">
          <div className="text-center space-y-4">
            <div className="text-4xl mb-4">{content.english_phrase?.split(' ')[0]}</div>
            <h2 className="text-2xl font-bold text-primary mb-2">
              {content.english_phrase?.substring(content.english_phrase.indexOf(' ') + 1)}
            </h2>
            <p className="text-lg text-text-secondary mb-4">{content.target_phrase}</p>
            {content.pronunciation_guide && (
              <div className="inline-flex items-center px-4 py-2 bg-white/60 rounded-full text-sm text-primary font-medium">
                ⏱️ {content.pronunciation_guide}
              </div>
            )}
          </div>
        </div>
      );
    }

    // Determine card type based on word_type and content_type
    const cardType = content.word_type || content.content_type || 'phrase';

    console.log(`Rendering card for "${content.english_phrase}" with type: ${cardType}, word_type: ${content.word_type}`);

    switch (cardType) {
      case 'verb':
        // Find conjugation data for this specific verb if available
        const verbConjugations = lessonConjugations?.verbs?.find(
          (verb: any) => verb.verb_id === content.id
        );
        console.log(`Verb card for "${content.english_phrase}": conjugations ${verbConjugations ? 'found' : 'not found'}`);
        return <VerbCard content={content} verbConjugations={verbConjugations} />;
      case 'noun':
        return <NounCard content={content} />;
      case 'adjective':
        return <AdjectiveCard content={content} />;
      case 'grammar_rule':
      case 'grammar':
        return <GrammarCard content={content} />;
      case 'verb_introduction':
        return <VerbIntroductionCard content={content} />;
      case 'verb_conjugation':
        // Same as verb but with emphasis on conjugation
        const verbConjugationsForPractice = lessonConjugations?.verbs?.find(
          (verb: any) => verb.verb_id === content.id
        );
        return <VerbCard content={content} verbConjugations={verbConjugationsForPractice} />;
      default:
        console.log(`Using vocabulary card for "${content.english_phrase}" (default)`);
        return <VocabularyCard content={content} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Enhanced Background */}
        <div className="absolute inset-0" style={{backgroundColor: '#f7f9fa'}}></div>

        {/* Modern Navigation */}
        <nav className="glass-nav sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <Link href="/" className="group flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                  <span className="text-white font-bold text-lg">R</span>
                </div>
                <span className="text-2xl font-bold text-primary">
                  Rare Languages
                </span>
              </Link>
            </div>
          </div>
        </nav>

        {/* Enhanced Loading State */}
        <div className="relative z-10 flex items-center justify-center min-h-[70vh]">
          <div className="text-center">
            <div className="relative mb-8">
              <div className="w-20 h-20 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 border-2 border-secondary-200 border-t-secondary-500 rounded-full animate-spin" style={{animationDelay: '0.5s'}}></div>
            </div>
            <div className="glass-card px-8 py-6 rounded-3xl inline-block">
              <p className="text-text-primary font-medium text-lg mb-2">Preparing your lesson...</p>
              <p className="text-text-secondary text-sm">Optimizing your learning experience</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentCard = currentContent[currentCardIndex];

  // Helper function to get lesson sequence display text
  const getLessonSequenceText = () => {
    if (!currentLessonInfo) return '';

    if (currentLessonInfo.is_sub_lesson) {
      return `Part ${currentLessonInfo.current_sub_lesson} of ${currentLessonInfo.total_sub_lessons}`;
    }

    return 'Single Lesson';
  };

  // Helper function to get overall progress percentage
  const getOverallProgressPercentage = () => {
    if (!currentLessonInfo) return 0;

    if (currentLessonInfo.is_sub_lesson) {
      // Calculate progress within the lesson sequence
      const lessonProgress = (currentLessonInfo.current_sub_lesson - 1) / currentLessonInfo.total_sub_lessons;
      const cardProgress = (currentCardIndex + 1) / currentContent.length / currentLessonInfo.total_sub_lessons;
      return (lessonProgress + cardProgress) * 100;
    } else {
      // Single lesson progress
      return ((currentCardIndex + 1) / currentContent.length) * 100;
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Enhanced Background */}
      <div className="absolute inset-0" style={{backgroundColor: '#f7f9fa'}}></div>

      {/* Modern Navigation Bar */}
      <nav className="glass-nav sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="group flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                <span className="text-white font-bold text-lg">R</span>
              </div>
              <span className="text-2xl font-bold text-primary">
                Rare Languages
              </span>
            </Link>

            <div className="flex items-center space-x-6">
              {/* Enhanced Progress Indicator */}
              {currentLessonInfo && (
                <div className="hidden md:flex items-center space-x-4">
                  <div className="glass-card px-4 py-2 rounded-2xl">
                    <div className="flex items-center space-x-3 text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                        <span className="text-text-primary font-medium">
                          Card {currentCardIndex + 1} of {currentContent.length}
                        </span>
                      </div>
                      {currentLessonInfo.is_sub_lesson && (
                        <>
                          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                          <span className="text-success-700 font-semibold">
                            {getLessonSequenceText()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={() => window.history.back()}
                className="btn-ghost px-4 py-2 text-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Exit
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Learning Content */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8">
        {/* Simple Progress */}
        <div className="text-center mb-6">
          {/* Lesson Title and Progress */}
          {currentLessonInfo && (
            <div className="mb-3">
              <h2 className="text-xl font-bold text-text-primary mb-1">
                {currentLessonInfo.name}
              </h2>
              <div className="text-sm font-medium text-primary">
                Lesson {currentLessonInfo.current_sub_lesson} of {currentLessonInfo.total_sub_lessons}
              </div>
            </div>
          )}
          <div className="text-sm text-text-secondary mb-2">
            Card {currentCardIndex + 1} of {currentContent.length}
          </div>
          <div className="max-w-md mx-auto bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-500"
              style={{ width: `${((currentCardIndex + 1) / currentContent.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Learning Card */}
        {currentCard && renderLearningCard(currentCard)}

        {/* Modern Navigation Controls */}
        <div className="flex justify-between items-center mt-8">
          <button
            onClick={previousCard}
            disabled={currentCardIndex === 0}
            className="btn-secondary px-8 py-4 group"
          >
            <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>

          <div className="flex-1 flex justify-center mx-8">
            <div className="glass-card px-6 py-3 rounded-2xl">
              <div className="flex items-center space-x-3">
                <div className="flex space-x-1">
                  {Array.from({ length: Math.min(currentContent.length, 5) }).map((_, i) => {
                    const isActive = i === Math.min(currentCardIndex, 4);
                    const isCompleted = i < currentCardIndex;
                    return (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          isActive
                            ? 'bg-primary scale-125'
                            : isCompleted
                            ? 'bg-primary opacity-60'
                            : 'bg-gray-300'
                        }`}
                      />
                    );
                  })}
                  {currentContent.length > 5 && (
                    <span className="text-xs text-text-secondary ml-2">...</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={nextCard}
            disabled={isLoadingNextLesson}
            className="btn-primary px-8 py-4 group relative overflow-hidden"
          >
            {isLoadingNextLesson ? (
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Loading...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span>
                  {currentCardIndex === currentContent.length - 1
                    ? (navigation?.next_lesson ? 'Next Lesson' : 'Complete!')
                    : 'Continue'
                  }
                </span>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            )}
          </button>
        </div>

        {/* Modern Next Lesson Preview */}
        {currentCardIndex === currentContent.length - 1 && navigation?.next_lesson && (
          <div className="mt-6 animate-fade-in-up">
            <div className="glass-card p-4 rounded-3xl text-center border border-primary-200/50">
              <div className="flex items-center justify-center space-x-3 mb-3">
                <div className="w-3 h-3 bg-success rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-success-700 uppercase tracking-wide">
                  Up Next
                </span>
                <div className="w-3 h-3 bg-success rounded-full animate-pulse"></div>
              </div>
              <p className="text-lg font-bold text-primary mb-2">
                {navigation.next_lesson.name}
              </p>
              <p className="text-text-secondary text-sm">
                Ready to continue your learning journey?
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Modern Card Components
const VocabularyCard = ({ content }: { content: LessonContent }) => (
  <div className="relative animate-scale-in">
    <div className="card-elevated p-8 max-w-3xl mx-auto relative overflow-hidden">
      {/* Subtle Background Pattern */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-primary-50 rounded-full -translate-y-20 translate-x-20 opacity-30"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary-50 rounded-full translate-y-16 -translate-x-16 opacity-30"></div>

      <div className="relative z-10 text-center space-y-6">
        {/* Enhanced Card Type Badge */}
        <div className="flex justify-center">
          <div className="badge-blue text-sm font-bold tracking-wide">
            {content.word_type ? content.word_type.charAt(0).toUpperCase() + content.word_type.slice(1) : 'Vocabulary'}
          </div>
        </div>

        {/* Modern Main Content */}
        <div className="space-y-4">
          <div className="space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary tracking-tight">
              {content.target_phrase}
            </h2>
            <p className="text-xl md:text-2xl text-text-secondary font-medium">
              {content.english_phrase}
            </p>
          </div>

          {/* Enhanced Pronunciation */}
          {(content.stress_pattern || content.pronunciation_guide) && (
            <div className="glass-card p-4 rounded-2xl border border-primary-200/50 hover-lift">
              <div className="flex items-center justify-center space-x-3 mb-3">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
                <span className="text-sm font-semibold text-success-700 uppercase tracking-wide">
                  Pronunciation
                </span>
              </div>
              <div className="text-emerald-800 font-bold text-xl">
                {content.stress_pattern || content.pronunciation_guide || 'No pronunciation available'}
              </div>
              {content.stress_pattern && content.pronunciation_guide !== content.stress_pattern && (
                <div className="text-success-700 text-lg mt-2">
                  {content.pronunciation_guide}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Enhanced Information Sections */}
        <div className="grid gap-4 mt-6">
          {/* Gender Information */}
          {content.gender && (
            <div className="glass-card p-4 rounded-2xl border border-purple-200/50 hover-lift">
              <div className="flex items-center justify-center space-x-3 mb-3">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <span className="text-sm font-semibold text-purple-700 uppercase tracking-wide">Gender</span>
              </div>
              <div className="text-purple-800 font-bold text-lg">{content.gender}</div>
            </div>
          )}

          {/* Cultural Context */}
          {content.cultural_context && (
            <div className="glass-card p-4 rounded-2xl border border-orange-200/50 hover-lift">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <svg className="w-5 h-5 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span className="text-sm font-semibold text-secondary-700 uppercase tracking-wide">Cultural Context</span>
              </div>
              <p className="text-secondary-800 leading-relaxed">{content.cultural_context}</p>
            </div>
          )}

          {/* Usage Examples */}
          {content.usage_examples && content.usage_examples.length > 0 && (
            <div className="glass-card p-4 rounded-2xl border border-gray-200/50 hover-lift">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="text-sm font-semibold text-text-primary uppercase tracking-wide">Usage Examples</span>
              </div>
              <div className="space-y-4">
                {content.usage_examples.slice(0, 2).map((example: any, index: number) => (
                  <div key={index} className="p-4 bg-white/50 rounded-2xl">
                    <div className="text-text-primary font-semibold text-lg mb-1">{example.albanian}</div>
                    <div className="text-text-secondary">{example.english}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grammar Notes */}
          {content.grammar_notes && (
            <div className="glass-card p-4 rounded-2xl border border-yellow-200/50 hover-lift">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span className="text-sm font-semibold text-yellow-700 uppercase tracking-wide">Grammar Notes</span>
              </div>
              <p className="text-yellow-800 leading-relaxed">{content.grammar_notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);

const VerbCard = ({ content, verbConjugations }: {
  content: LessonContent;
  verbConjugations?: {
    conjugations: {
      by_tense: any;
      available_tenses: string[];
      total_forms: number;
    };
  } | null;
}) => (
  <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 max-w-3xl mx-auto">
    <div className="space-y-6">
      {/* Card Type */}
      <div className="flex justify-between items-center">
        <span className="bg-success-100 text-success-800 px-3 py-1 rounded-full text-sm font-semibold">
          Verb {content.verb_type ? `(${content.verb_type})` : ''}
        </span>
        {content.difficulty_notes && (
          <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs">
            {content.difficulty_notes}
          </span>
        )}
      </div>

      {/* Main Content */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-text-primary">{content.target_phrase}</h2>
        <p className="text-xl text-text-secondary">{content.english_phrase}</p>

        {/* Pronunciation */}
        {(content.stress_pattern || content.pronunciation_guide) && (
          <div className="bg-success-50 border border-success-200 rounded-lg p-4">
            <div className="text-emerald-800 font-medium text-lg">
              {content.stress_pattern || content.pronunciation_guide || 'No pronunciation available'}
            </div>
          </div>
        )}
      </div>

      {/* New Conjugation System (if available) */}
      {verbConjugations?.conjugations && (
        <ConjugationTable
          verbId={content.id}
          targetPhrase={content.target_phrase}
          englishPhrase={content.english_phrase}
          conjugationsByTense={verbConjugations.conjugations.by_tense}
          availableTenses={verbConjugations.conjugations.available_tenses}
        />
      )}

      {/* Legacy Conjugation Table (backward compatibility) */}
      {!verbConjugations?.conjugations && content.conjugation_data && (
        <div className="bg-success-50 border border-success-200 rounded-lg p-6">
          <h3 className="font-bold text-green-800 mb-4">Conjugation</h3>

          {/* Present Tense */}
          {content.conjugation_data.present_tense && (
            <div className="mb-4">
              <h4 className="font-semibold text-green-700 mb-2">Present Tense</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                {Object.entries(content.conjugation_data.present_tense).map(([person, form]: [string, any]) => (
                  <div key={person} className="flex justify-between">
                    <span className="text-green-600">{person.replace('_', ' ')}:</span>
                    <span className="font-medium text-green-800">{form}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pattern Notes */}
          {content.conjugation_data.pattern_notes && (
            <div className="text-sm text-success-700 bg-success-100 p-3 rounded">
              <strong>Pattern:</strong> {content.conjugation_data.pattern_notes}
            </div>
          )}
        </div>
      )}

      {/* Grammar Notes */}
      {content.grammar_notes && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <span className="text-yellow-600 text-lg">📝</span>
            <div>
              <div className="font-medium text-yellow-800 text-sm">Grammar Notes</div>
              <div className="text-yellow-700 text-sm">{content.grammar_notes}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
);

const NounCard = ({ content }: { content: LessonContent }) => (
  <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 max-w-2xl mx-auto">
    <div className="space-y-6">
      {/* Card Type */}
      <div className="flex justify-center space-x-2">
        <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">
          Noun
        </span>
        {content.gender && (
          <span className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-sm font-semibold">
            {content.gender}
          </span>
        )}
      </div>

      {/* Main Content */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-text-primary">{content.target_phrase}</h2>
        <p className="text-xl text-text-secondary">{content.english_phrase}</p>
        
        {/* Pronunciation */}
        {(content.stress_pattern || content.pronunciation_guide) && (
          <div className="bg-success-50 border border-success-200 rounded-lg p-4">
            <div className="text-emerald-800 font-medium text-lg">
              {content.stress_pattern || content.pronunciation_guide || 'No pronunciation available'}
            </div>
          </div>
        )}
      </div>

      {/* Gender Information - Only show for advanced vocabulary, not basic greetings/numbers */}
      {content.gender &&
       content.grammar_category &&
       !['greetings', 'courtesy', 'numbers', 'time_expressions'].includes(content.grammar_category) &&
       content.english_phrase &&
       !['Hello', 'Thank you', 'Please', 'Good morning', 'Good afternoon', 'Good evening', 'Goodbye', 'How are you?'].includes(content.english_phrase) && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="text-center">
            <div className="font-medium text-purple-800 mb-2">Gender: {content.gender}</div>
            <div className="text-purple-700 text-sm">
              This noun is {content.gender} in Albanian
            </div>
          </div>
        </div>
      )}

      {/* Cultural Context */}
      {content.cultural_context && (
        <div className="bg-secondary-50 border border-secondary-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <span className="text-secondary-600 text-lg">🏛️</span>
            <div>
              <div className="font-medium text-secondary-800 text-sm">Cultural Context</div>
              <div className="text-secondary-700 text-sm">{content.cultural_context}</div>
            </div>
          </div>
        </div>
      )}

      {/* Usage Examples */}
      {content.usage_examples && content.usage_examples.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="font-medium text-gray-800 text-sm mb-2">Usage Examples</div>
          <div className="space-y-2">
            {content.usage_examples.slice(0, 2).map((example: any, index: number) => (
              <div key={index} className="text-sm">
                <div className="text-text-primary">{example.albanian}</div>
                <div className="text-text-secondary">{example.english}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  </div>
);

const AdjectiveCard = ({ content }: { content: LessonContent }) => (
  <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 max-w-2xl mx-auto">
    <div className="space-y-6">
      {/* Card Type */}
      <div className="flex justify-center">
        <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-semibold">
          Adjective
        </span>
      </div>

      {/* Main Content */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-text-primary">{content.target_phrase}</h2>
        <p className="text-xl text-text-secondary">{content.english_phrase}</p>
        
        {/* Pronunciation */}
        {(content.stress_pattern || content.pronunciation_guide) && (
          <div className="bg-success-50 border border-success-200 rounded-lg p-4">
            <div className="text-emerald-800 font-medium text-lg">
              {content.stress_pattern || content.pronunciation_guide || 'No pronunciation available'}
            </div>
          </div>
        )}
      </div>

      {/* Grammar Notes */}
      {content.grammar_notes && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <span className="text-indigo-600 text-lg">📝</span>
            <div>
              <div className="font-medium text-indigo-800 text-sm">Agreement Rules</div>
              <div className="text-indigo-700 text-sm">{content.grammar_notes}</div>
            </div>
          </div>
        </div>
      )}

      {/* Usage Examples */}
      {content.usage_examples && content.usage_examples.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="font-medium text-gray-800 text-sm mb-2">Usage Examples</div>
          <div className="space-y-2">
            {content.usage_examples.slice(0, 2).map((example: any, index: number) => (
              <div key={index} className="text-sm">
                <div className="text-text-primary">{example.albanian}</div>
                <div className="text-text-secondary">{example.english}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cultural Context */}
      {content.cultural_context && (
        <div className="bg-secondary-50 border border-secondary-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <span className="text-secondary-600 text-lg">🏛️</span>
            <div>
              <div className="font-medium text-secondary-800 text-sm">Cultural Context</div>
              <div className="text-secondary-700 text-sm">{content.cultural_context}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
);

// Grammar Card Component
const GrammarCard = ({ content }: { content: LessonContent }) => {
  const [grammarRule, setGrammarRule] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGrammarRule = async () => {
      try {
        // Try to fetch grammar rule based on content
        const concept = content.grammar_category || content.target_phrase || content.english_phrase;
        const response = await fetch(`/api/grammar/rules/${encodeURIComponent(concept)}`);

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.rule) {
            setGrammarRule(data.rule);
          }
        }
      } catch (error) {
        console.error('Failed to load grammar rule:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGrammarRule();
  }, [content]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 max-w-3xl mx-auto">
        <div className="animate-pulse text-center">
          <div className="h-6 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mb-6"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (grammarRule) {
    return <GrammarExplanationCard rule={grammarRule} />;
  }

  // Fallback to basic grammar display
  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 max-w-3xl mx-auto">
      <div className="space-y-6">
        <div className="flex justify-center">
          <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">
            Grammar Rule
          </span>
        </div>

        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-text-primary">{content.target_phrase}</h2>
          <p className="text-xl text-text-secondary">{content.english_phrase}</p>

          {content.grammar_notes && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="text-purple-800 font-medium">{content.grammar_notes}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Verb Introduction Card Component - Simplified verb introduction
const VerbIntroductionCard = ({ content }: { content: LessonContent }) => (
  <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 max-w-3xl mx-auto">
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <span className="bg-success-100 text-success-800 px-3 py-1 rounded-full text-sm font-semibold">
          Verb Introduction
        </span>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-text-secondary">Infinitive Form</span>
          <svg className="w-4 h-4 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>

      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-text-primary">{content.target_phrase}</h2>
        <p className="text-xl text-text-secondary">{content.english_phrase}</p>

        {(content.stress_pattern || content.pronunciation_guide) && (
          <div className="bg-success-50 border border-success-200 rounded-lg p-4">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <svg className="w-4 h-4 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
              <span className="text-sm font-semibold text-success-700">Pronunciation</span>
            </div>
            <div className="text-success-800 font-medium text-lg">
              {content.stress_pattern || content.pronunciation_guide}
            </div>
          </div>
        )}

        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
          <div className="text-sm text-primary-700 mb-2">💡 Learning Tip</div>
          <div className="text-primary-800 text-sm">
            This is the infinitive form of the verb. In the next lessons, you'll learn how to conjugate it for different persons and tenses.
          </div>
        </div>
      </div>
    </div>
  </div>
);