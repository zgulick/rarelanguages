// File: components/clean/CleanApp.jsx (Updated LessonPage component)
// Replace the existing LessonPage with this textbook-style version

const LessonPage = () => {
  const { user, currentLesson, completeExercise, goBack } = useApp();
  const [learningMode, setLearningMode] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Auto-select textbook mode - this is what you want!
    setLearningMode('textbook');
    setLoading(false);
  }, [currentLesson]);

  if (!currentLesson) {
    return <LoadingScreen />;
  }

  if (loading) {
    return <LoadingScreen />;
  }

  // Mode selection screen (optional - you can skip this)
  if (!learningMode) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <button 
                onClick={goBack}
                className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
              >
                ← Back
              </button>
              <div className="text-center">
                <h1 className="text-lg font-bold text-gray-900">{currentLesson.name}</h1>
                <p className="text-sm text-gray-500">Choose your learning style</p>
              </div>
              <div className="w-10"></div>
            </div>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="space-y-6">
            {/* Textbook Style (Recommended) */}
            <div 
              onClick={() => setLearningMode('textbook')}
              className="bg-white rounded-xl shadow-lg p-8 cursor-pointer hover:shadow-xl transition-shadow border-2 border-indigo-200"
            >
              <div className="text-center">
                <div className="text-4xl mb-4">📚</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  Textbook Learning (Recommended)
                </h2>
                <p className="text-gray-600 mb-4">
                  Learn like in school: <strong>Teach → Practice → Test</strong>. 
                  We'll show you new words first, then practice together, then test what you learned.
                </p>
                <div className="text-sm text-indigo-600 font-medium bg-indigo-50 rounded-lg p-3">
                  ✓ Learn before testing ✓ Guided practice ✓ Cultural context ✓ Proper progression
                </div>
              </div>
            </div>

            {/* Comprehensive Cards Option */}
            <div 
              onClick={() => setLearningMode('comprehensive')}
              className="bg-white rounded-xl shadow-lg p-8 cursor-pointer hover:shadow-xl transition-shadow border-2 border-transparent hover:border-gray-200"
            >
              <div className="text-center">
                <div className="text-4xl mb-4">🎓</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  Deep Learning Cards
                </h2>
                <p className="text-gray-600 mb-4">
                  Rich, comprehensive cards with pronunciation, grammar, cultural context, and variations. 
                  For when you want to dive deep into each word.
                </p>
                <div className="text-sm text-gray-600 font-medium">
                  ✓ Pronunciation guides ✓ Gender & variations ✓ Cultural context ✓ Verb conjugations
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render the selected learning mode
  if (learningMode === 'textbook') {
    return (
      <TextbookLearningCards 
        lesson={currentLesson}
        onComplete={completeExercise}
        onExit={goBack}
      />
    );
  }

  if (learningMode === 'comprehensive') {
    return (
      <ComprehensiveLearningCards 
        lesson={currentLesson}
        onComplete={completeExercise}
        onExit={goBack}
      />
    );
  }

  // Fallback to quick exercises mode
  return <QuickExercisesMode lesson={currentLesson} onComplete={completeExercise} onExit={goBack} />;
};

// Import the new textbook component
import TextbookLearningCards from './TextbookLearningCards';
import ComprehensiveLearningCards from './ComprehensiveLearningCards';

// Also add this database update script to fix your skill names
const fixSkillNames = async () => {
  // You can run this to fix the academic skill names
  const updates = [
    {
      current: 'Phonological and Lexical Foundations',
      new: 'Albanian 1: Unit 1 - Family & Greetings',
      description: 'Learn to introduce family members and greet people politely'
    },
    {
      current: 'Morphosyntactic Development and Communication Patterns',
      new: 'Albanian 1: Unit 2 - Numbers & Time', 
      description: 'Count from 1-20 and talk about time and days'
    },
    {
      current: 'Pragmatic Competence and Cultural Integration',
      new: 'Albanian 1: Unit 3 - Food & Drinks',
      description: 'Order food, express preferences, and understand meal customs'
    },
    {
      current: 'Advanced Discourse and Academic Language Proficiency',
      new: 'Albanian 1: Unit 4 - Daily Activities',
      description: 'Describe your daily routine and make plans'
    }
  ];

  for (const update of updates) {
    await query(`
      UPDATE skills 
      SET name = $1, description = $2 
      WHERE name ILIKE $3
    `, [update.new, update.description, `%${update.current}%`]);
  }
};

// Add this function to create better lesson names too
const fixLessonNames = async () => {
  const lessonUpdates = [
    // Family & Greetings lessons
    { pattern: '%morphophonemic%', new: 'Family Vocabulary' },
    { pattern: '%phonological%', new: 'Basic Greetings' },
    { pattern: '%lexical%', new: 'Polite Expressions' },
    
    // Numbers & Time lessons  
    { pattern: '%morphosyntactic%', new: 'Numbers 1-10' },
    { pattern: '%syntactic%', new: 'Days of the Week' },
    { pattern: '%grammatical%', new: 'Telling Time' },
    
    // Food & Drinks lessons
    { pattern: '%pragmatic%', new: 'Food Vocabulary' },
    { pattern: '%discourse%', new: 'Ordering Food' },
    { pattern: '%sociolinguistic%', new: 'Meal Customs' },
    
    // Daily Activities lessons
    { pattern: '%academic%', new: 'Daily Routines' },
    { pattern: '%metalinguistic%', new: 'Making Plans' },
    { pattern: '%cognitive%', new: 'Describing Activities' }
  ];

  for (const update of lessonUpdates) {
    await query(`
      UPDATE lessons 
      SET name = $1 
      WHERE name ILIKE $2
    `, [update.new, update.pattern]);
  }
};