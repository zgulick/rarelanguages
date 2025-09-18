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
  description: string;
  skill_name: string;
  skill_description: string;
  estimated_minutes: number;
}

export default function SkillLearningPage() {
  const params = useParams();
  const skillId = params.id as string;
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [currentContent, setCurrentContent] = useState<LessonContent[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [skillName, setSkillName] = useState('');

  useEffect(() => {
    const fetchSkillLessons = async () => {
      try {
        // First, get all lessons for this skill
        // For now, we'll get the first lesson and its content
        // TODO: Create API endpoint to get all lessons for a skill
        
        // Temporarily use a lesson ID - in real implementation, this should fetch lessons for the skill
        const lessonResponse = await fetch(`/api/lessons/${skillId}/content`);
        
        if (!lessonResponse.ok) {
          throw new Error(`Failed to fetch lesson content: ${lessonResponse.status}`);
        }

        const lessonData = await lessonResponse.json();
        
        if (!lessonData.success) {
          throw new Error(`Lesson API error: ${lessonData.error}`);
        }

        setSkillName(lessonData.lesson.skill_name);
        setCurrentContent(lessonData.content);
        setLoading(false);

      } catch (error) {
        console.error('Failed to fetch skill lessons:', error);
        throw error;
      }
    };

    if (skillId) {
      fetchSkillLessons();
    }
  }, [skillId]);

  const nextCard = () => {
    if (currentCardIndex < currentContent.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    } else {
      // Lesson complete
      alert('Lesson complete! (TODO: Navigate to next lesson or skill completion)');
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
              <span className="text-sm text-gray-600">
                {currentCardIndex + 1} of {currentContent.length}
              </span>
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
        {/* Skill Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{skillName}</h1>
          <div className="flex justify-center items-center space-x-4 text-sm text-gray-600">
            <span>Card {currentCardIndex + 1} of {currentContent.length}</span>
            <span>•</span>
            <span className="capitalize">{currentCard?.word_type || currentCard?.content_type || 'Vocabulary'}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-orange-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentCardIndex + 1) / currentContent.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Learning Card */}
        {currentCard && renderLearningCard(currentCard)}

        {/* Navigation Controls */}
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
            className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-orange-600 text-white rounded-lg font-semibold hover:from-emerald-700 hover:to-orange-700 transition-colors"
          >
            {currentCardIndex === currentContent.length - 1 ? 'Complete Lesson' : 'Next →'}
          </button>
        </div>
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
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <div className="text-emerald-800 font-medium text-lg">
            {content.stress_pattern || content.pronunciation_guide}
          </div>
          {content.stress_pattern && content.pronunciation_guide !== content.stress_pattern && (
            <div className="text-emerald-700 text-sm mt-1">
              {content.pronunciation_guide}
            </div>
          )}
        </div>
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
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <div className="text-emerald-800 font-medium text-lg">
            {content.stress_pattern || content.pronunciation_guide}
          </div>
        </div>
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
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <div className="text-emerald-800 font-medium text-lg">
            {content.stress_pattern || content.pronunciation_guide}
          </div>
        </div>
      </div>

      {/* Gender Information */}
      {content.gender && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="text-center">
            <div className="font-medium text-purple-800 mb-2">Gender: {content.gender}</div>
            <div className="text-purple-700 text-sm">
              Remember to use appropriate articles and adjective agreements
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
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <div className="text-emerald-800 font-medium text-lg">
            {content.stress_pattern || content.pronunciation_guide}
          </div>
        </div>
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