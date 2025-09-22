'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import ConjugationTable from '../../../../components/ConjugationTable';

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

// Create structured pedagogical flow from sections
function createPedagogicalFlow(sections: Section[], fallbackContent: LessonContent[]): LessonContent[] {
  if (!sections || sections.length === 0) {
    console.log('No sections found, using fallback content');
    return fallbackContent || [];
  }

  const structuredFlow: LessonContent[] = [];

  // Sort sections by pedagogical order
  const sortedSections = [...sections].sort((a, b) => {
    const order = {
      'introduction': 1,
      'vocabulary': 2,
      'pronunciation': 3,
      'grammar': 4,
      'sentences': 5,
      'practice': 6
    };
    return (order[a.section_type] || 7) - (order[b.section_type] || 7);
  });

  for (const section of sortedSections) {
    if (section.content && section.content.length > 0) {
      // Add section header card
      structuredFlow.push({
        id: `section-header-${section.section_id}`,
        english_phrase: `📚 ${section.title}`,
        target_phrase: section.description,
        pronunciation_guide: '',
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
        grammar_category: section.section_type,
        difficulty_notes: null,
        usage_examples: null
      });

      // Add section content in order
      const sortedContent = [...section.content].sort((a, b) => (a.content_order || 0) - (b.content_order || 0));
      for (const content of sortedContent) {
        structuredFlow.push({
          ...content,
          position: structuredFlow.length + 1,
          grammar_category: content.grammar_category || section.section_type
        });
      }
    }
  }

  console.log(`Created pedagogical flow: ${structuredFlow.length} cards from ${sections.length} sections`);
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

  // Load lesson content for a specific lesson ID
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

      // Try to fetch conjugation data for verbs in this lesson (optional enhancement)
      try {
        const conjugationsResponse = await fetch(`/api/lessons/${lessonId}/conjugations`);
        if (conjugationsResponse.ok) {
          const conjugationsData = await conjugationsResponse.json();
          if (conjugationsData.success && conjugationsData.verbs.length > 0) {
            setLessonConjugations(conjugationsData);
          }
        }
      } catch (error) {
        // Conjugation data is optional - don't fail if not available
        console.log('Conjugation data not available for this lesson:', error);
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
        // First, get all parent lessons for this skill
        const skillResponse = await fetch(`/api/skills/${skillId}/lessons`);

        if (!skillResponse.ok) {
          throw new Error(`Failed to fetch skill lessons: ${skillResponse.status}`);
        }

        const skillData = await skillResponse.json();

        if (!skillData.success) {
          throw new Error(`Skill API error: ${skillData.error}`);
        }

        if (!skillData.lessons || skillData.lessons.length === 0) {
          throw new Error(`No lessons found for skill: ${skillId}`);
        }

        setSkillName(skillData.skill.name);
        setLessons(skillData.lessons);

        // Get the first lesson and determine if it has sub-lessons
        const firstLesson = skillData.lessons[0];

        if (firstLesson.is_split_lesson) {
          // This lesson has sub-lessons, get them
          const subLessonsResponse = await fetch(`/api/lessons/${firstLesson.id}/sub-lessons`);

          if (!subLessonsResponse.ok) {
            throw new Error(`Failed to fetch sub-lessons: ${subLessonsResponse.status}`);
          }

          const subLessonsData = await subLessonsResponse.json();

          if (!subLessonsData.success) {
            throw new Error(`Sub-lessons API error: ${subLessonsData.error}`);
          }

          setSubLessons(subLessonsData.sub_lessons);

          // Load content for the first sub-lesson
          const firstSubLesson = subLessonsData.sub_lessons[0];
          await loadLessonContent(firstSubLesson.id);
        } else {
          // This is a regular lesson, load it directly
          await loadLessonContent(firstLesson.id);
        }

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

  // Navigate to next lesson (sub-lesson or next parent lesson)
  const navigateToNextLesson = async () => {
    if (isLoadingNextLesson) return;

    try {
      setIsLoadingNextLesson(true);

      // Check if there's a next lesson in navigation
      if (navigation?.next_lesson) {
        await loadLessonContent(navigation.next_lesson.id);

        // Update sub-lesson index if we're in a sub-lesson sequence
        if (currentLessonInfo?.is_sub_lesson && subLessons.length > 0) {
          const nextIndex = subLessons.findIndex(sl => sl.id === navigation.next_lesson?.id);
          if (nextIndex !== -1) {
            setCurrentSubLessonIndex(nextIndex);
          }
        }
      } else {
        // No more sub-lessons, check if there's a next parent lesson
        const currentParentIndex = lessons.findIndex(l =>
          l.id === (currentLessonInfo?.parent_lesson_id || currentLessonInfo?.id)
        );

        if (currentParentIndex < lessons.length - 1) {
          // Move to next parent lesson
          const nextParentLesson = lessons[currentParentIndex + 1];
          setCurrentLessonIndex(currentParentIndex + 1);

          if (nextParentLesson.is_split_lesson) {
            // Load sub-lessons for the next parent lesson
            const subLessonsResponse = await fetch(`/api/lessons/${nextParentLesson.id}/sub-lessons`);
            const subLessonsData = await subLessonsResponse.json();

            if (subLessonsData.success) {
              setSubLessons(subLessonsData.sub_lessons);
              setCurrentSubLessonIndex(0);
              await loadLessonContent(subLessonsData.sub_lessons[0].id);
            }
          } else {
            // Regular lesson
            setSubLessons([]);
            setCurrentSubLessonIndex(0);
            await loadLessonContent(nextParentLesson.id);
          }
        } else {
          // All lessons complete!
          alert('🎉 Congratulations! You have completed all lessons in this skill!');
          // TODO: Navigate back to skill selection or show completion screen
        }
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
    // Determine card type based on word_type and content_type
    const cardType = content.word_type || content.content_type || 'phrase';

    switch (cardType) {
      case 'verb':
        // Find conjugation data for this specific verb if available
        const verbConjugations = lessonConjugations?.verbs?.find(
          (verb: any) => verb.verb_id === content.id
        );
        return <VerbCard content={content} verbConjugations={verbConjugations} />;
      case 'noun':
        return <NounCard content={content} />;
      case 'adjective':
        return <AdjectiveCard content={content} />;
      default:
        return <VocabularyCard content={content} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Enhanced Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/50"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-100/20 via-transparent to-orange-100/20"></div>

        {/* Modern Navigation */}
        <nav className="glass-nav sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <Link href="/" className="group flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-orange-500 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                  <span className="text-white font-bold text-lg">R</span>
                </div>
                <span className="text-2xl font-bold gradient-text">
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
              <div className="w-20 h-20 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" style={{animationDelay: '0.5s'}}></div>
            </div>
            <div className="glass-card px-8 py-6 rounded-3xl inline-block">
              <p className="text-gray-700 font-medium text-lg mb-2">Preparing your lesson...</p>
              <p className="text-gray-500 text-sm">Optimizing your learning experience</p>
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
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/50"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-100/20 via-transparent to-orange-100/20"></div>

      {/* Modern Navigation Bar */}
      <nav className="glass-nav sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="group flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-orange-500 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                <span className="text-white font-bold text-lg">R</span>
              </div>
              <span className="text-2xl font-bold gradient-text">
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
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-gray-700 font-medium">
                          Card {currentCardIndex + 1} of {currentContent.length}
                        </span>
                      </div>
                      {currentLessonInfo.is_sub_lesson && (
                        <>
                          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                          <span className="text-emerald-700 font-semibold">
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
          <div className="text-sm text-gray-600 mb-2">
            Card {currentCardIndex + 1} of {currentContent.length}
          </div>
          <div className="max-w-md mx-auto bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-emerald-500 to-orange-500 h-2 rounded-full transition-all duration-500"
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
                            ? 'bg-gradient-to-r from-emerald-500 to-orange-500 scale-125'
                            : isCompleted
                            ? 'bg-emerald-400'
                            : 'bg-gray-300'
                        }`}
                      />
                    );
                  })}
                  {currentContent.length > 5 && (
                    <span className="text-xs text-gray-500 ml-2">...</span>
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
            <div className="glass-card p-4 rounded-3xl text-center border border-emerald-200/50">
              <div className="flex items-center justify-center space-x-3 mb-3">
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-emerald-700 uppercase tracking-wide">
                  Up Next
                </span>
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
              </div>
              <p className="text-lg font-bold gradient-text mb-2">
                {navigation.next_lesson.name}
              </p>
              <p className="text-gray-600 text-sm">
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
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-50 to-emerald-50 rounded-full -translate-y-20 translate-x-20 opacity-30"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-orange-50 to-purple-50 rounded-full translate-y-16 -translate-x-16 opacity-30"></div>

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
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
              {content.target_phrase}
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 font-medium">
              {content.english_phrase}
            </p>
          </div>

          {/* Enhanced Pronunciation */}
          {(content.stress_pattern || content.pronunciation_guide) && (
            <div className="glass-card p-4 rounded-2xl border border-emerald-200/50 hover-lift">
              <div className="flex items-center justify-center space-x-3 mb-3">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
                <span className="text-sm font-semibold text-emerald-700 uppercase tracking-wide">
                  Pronunciation
                </span>
              </div>
              <div className="text-emerald-800 font-bold text-xl">
                {content.stress_pattern || content.pronunciation_guide || 'No pronunciation available'}
              </div>
              {content.stress_pattern && content.pronunciation_guide !== content.stress_pattern && (
                <div className="text-emerald-700 text-lg mt-2">
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
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span className="text-sm font-semibold text-orange-700 uppercase tracking-wide">Cultural Context</span>
              </div>
              <p className="text-orange-800 leading-relaxed">{content.cultural_context}</p>
            </div>
          )}

          {/* Usage Examples */}
          {content.usage_examples && content.usage_examples.length > 0 && (
            <div className="glass-card p-4 rounded-2xl border border-gray-200/50 hover-lift">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Usage Examples</span>
              </div>
              <div className="space-y-4">
                {content.usage_examples.slice(0, 2).map((example: any, index: number) => (
                  <div key={index} className="p-4 bg-white/50 rounded-2xl">
                    <div className="text-gray-900 font-semibold text-lg mb-1">{example.albanian}</div>
                    <div className="text-gray-600">{example.english}</div>
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
        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
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
        <h2 className="text-3xl font-bold text-gray-900">{content.target_phrase}</h2>
        <p className="text-xl text-gray-600">{content.english_phrase}</p>

        {/* Pronunciation */}
        {(content.stress_pattern || content.pronunciation_guide) && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
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
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
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
            <div className="text-sm text-green-700 bg-green-100 p-3 rounded">
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
        <h2 className="text-3xl font-bold text-gray-900">{content.target_phrase}</h2>
        <p className="text-xl text-gray-600">{content.english_phrase}</p>
        
        {/* Pronunciation */}
        {(content.stress_pattern || content.pronunciation_guide) && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
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
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <span className="text-orange-600 text-lg">🏛️</span>
            <div>
              <div className="font-medium text-orange-800 text-sm">Cultural Context</div>
              <div className="text-orange-700 text-sm">{content.cultural_context}</div>
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
                <div className="text-gray-900">{example.albanian}</div>
                <div className="text-gray-600">{example.english}</div>
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
        <h2 className="text-3xl font-bold text-gray-900">{content.target_phrase}</h2>
        <p className="text-xl text-gray-600">{content.english_phrase}</p>
        
        {/* Pronunciation */}
        {(content.stress_pattern || content.pronunciation_guide) && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
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
                <div className="text-gray-900">{example.albanian}</div>
                <div className="text-gray-600">{example.english}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cultural Context */}
      {content.cultural_context && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <span className="text-orange-600 text-lg">🏛️</span>
            <div>
              <div className="font-medium text-orange-800 text-sm">Cultural Context</div>
              <div className="text-orange-700 text-sm">{content.cultural_context}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
);