'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

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
      setCurrentContent(lessonData.content);
      setNavigation(lessonData.navigation);
      setCurrentCardIndex(0);

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
        return <VerbCard content={content} />;
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
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-stone-50 to-orange-50">
        <nav className="bg-white/80 backdrop-blur-sm border-b border-emerald-100 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="flex items-center space-x-2">
                <span className="text-2xl font-bold bg-gradient-to-r from-emerald-700 to-orange-600 bg-clip-text text-transparent">
                  Rare Languages
                </span>
              </Link>
            </div>
          </div>
        </nav>
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading lesson...</p>
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-stone-50 to-orange-50">
      {/* Navigation Bar */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-emerald-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold bg-gradient-to-r from-emerald-700 to-orange-600 bg-clip-text text-transparent">
                Rare Languages
              </span>
            </Link>
            <div className="flex items-center space-x-4">
              {/* Lesson Progress Indicator */}
              {currentLessonInfo && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span>Card {currentCardIndex + 1} of {currentContent.length}</span>
                  {currentLessonInfo.is_sub_lesson && (
                    <>
                      <span>•</span>
                      <span className="font-medium text-emerald-700">
                        {getLessonSequenceText()}
                      </span>
                    </>
                  )}
                </div>
              )}
              <button
                onClick={() => window.history.back()}
                className="text-emerald-700 hover:text-emerald-800 font-medium transition-colors"
              >
                ← Exit Lesson
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Learning Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Lesson Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{skillName}</h1>

          {/* Lesson Name and Sequence Info */}
          {currentLessonInfo && (
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                {currentLessonInfo.parent_lesson_name || currentLessonInfo.name}
              </h2>
              {currentLessonInfo.is_sub_lesson && (
                <div className="flex justify-center items-center space-x-2">
                  <div className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-semibold">
                    {getLessonSequenceText()}
                  </div>
                  <span className="text-gray-400">•</span>
                  <span className="text-sm text-gray-600">{currentLessonInfo.name}</span>
                </div>
              )}
            </div>
          )}

          {/* Card Type and Progress */}
          <div className="flex justify-center items-center space-x-4 text-sm text-gray-600">
            <span>Card {currentCardIndex + 1} of {currentContent.length}</span>
            <span>•</span>
            <span className="capitalize">{currentCard?.word_type || currentCard?.content_type || 'Vocabulary'}</span>
          </div>
        </div>

        {/* Enhanced Progress Section */}
        <div className="mb-8 space-y-3">
          {/* Card Progress Bar */}
          <div>
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Card Progress</span>
              <span>{currentCardIndex + 1} / {currentContent.length}</span>
            </div>
            <div className="bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-emerald-500 to-orange-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentCardIndex + 1) / currentContent.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Overall Lesson Sequence Progress (if sub-lesson) */}
          {currentLessonInfo?.is_sub_lesson && (
            <div>
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Overall Progress</span>
                <span>{Math.round(getOverallProgressPercentage())}%</span>
              </div>
              <div className="bg-gray-200 rounded-full h-1">
                <div
                  className="bg-gradient-to-r from-emerald-300 to-orange-300 h-1 rounded-full transition-all duration-500"
                  style={{ width: `${getOverallProgressPercentage()}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Learning Card */}
        {currentCard && renderLearningCard(currentCard)}

        {/* Enhanced Navigation Controls */}
        <div className="flex justify-between items-center mt-8">
          <button
            onClick={previousCard}
            disabled={currentCardIndex === 0}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>

          <button
            onClick={nextCard}
            disabled={isLoadingNextLesson}
            className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-orange-600 text-white rounded-lg font-semibold hover:from-emerald-700 hover:to-orange-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
          >
            {isLoadingNextLesson ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Loading...</span>
              </>
            ) : (
              <span>
                {currentCardIndex === currentContent.length - 1
                  ? (navigation?.next_lesson ? 'Next Lesson' : 'Complete!')
                  : 'Next →'
                }
              </span>
            )}
          </button>
        </div>

        {/* Next Lesson Preview */}
        {currentCardIndex === currentContent.length - 1 && navigation?.next_lesson && (
          <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
            <p className="text-emerald-800 font-medium">
              Next: {navigation.next_lesson.name}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

// Card Components
const VocabularyCard = ({ content }: { content: LessonContent }) => (
  <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 max-w-2xl mx-auto">
    <div className="text-center space-y-6">
      {/* Card Type */}
      <div className="flex justify-center">
        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
          {content.word_type ? content.word_type.charAt(0).toUpperCase() + content.word_type.slice(1) : 'Vocabulary'}
        </span>
      </div>

      {/* Main Content */}
      <div className="space-y-4">
        <h2 className="text-4xl font-bold text-gray-900">{content.target_phrase}</h2>
        <p className="text-2xl text-gray-600">{content.english_phrase}</p>
        
        {/* Pronunciation */}
        {(content.stress_pattern || content.pronunciation_guide) && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <div className="text-emerald-800 font-medium text-lg">
              {content.stress_pattern || content.pronunciation_guide || 'No pronunciation available'}
            </div>
            {content.stress_pattern && content.pronunciation_guide !== content.stress_pattern && (
              <div className="text-emerald-700 text-sm mt-1">
                {content.pronunciation_guide}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Gender (for nouns) */}
      {content.gender && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
          <span className="text-purple-800 font-medium">Gender: {content.gender}</span>
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

const VerbCard = ({ content }: { content: LessonContent }) => (
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
        <h2 className="text-4xl font-bold text-gray-900">{content.target_phrase}</h2>
        <p className="text-2xl text-gray-600">{content.english_phrase}</p>
        
        {/* Pronunciation */}
        {(content.stress_pattern || content.pronunciation_guide) && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <div className="text-emerald-800 font-medium text-lg">
              {content.stress_pattern || content.pronunciation_guide || 'No pronunciation available'}
            </div>
          </div>
        )}
      </div>

      {/* Conjugation Table */}
      {content.conjugation_data && (
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
        <h2 className="text-4xl font-bold text-gray-900">{content.target_phrase}</h2>
        <p className="text-2xl text-gray-600">{content.english_phrase}</p>
        
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
        <h2 className="text-4xl font-bold text-gray-900">{content.target_phrase}</h2>
        <p className="text-2xl text-gray-600">{content.english_phrase}</p>
        
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