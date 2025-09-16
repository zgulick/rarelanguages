import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const CourseLevelSelection = ({ language, onCourseSelect, onBack }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);

  useEffect(() => {
    loadCourses();
  }, [language]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/courses/catalog`);
      const data = await response.json();
      
      if (data.success) {
        // Filter courses for selected language and sort by level
        const languageCourses = data.courses
          .filter(course => course.language_code === language.code)
          .sort((a, b) => a.level - b.level);
        
        // Transform to high school style naming
        const transformedCourses = languageCourses.map((course, index) => ({
          ...course,
          displayLevel: `${language.name.split(' ')[0]} ${(index + 1) * 100 + 1}`, // Albanian 101, 201, etc
          academicName: getAcademicName(course.level || (index + 1)),
          prerequisites: course.level > 1 ? [`${language.name.split(' ')[0]} ${index * 100 + 1}`] : [],
          estimatedHours: course.estimated_hours || 45,
          cefrLevel: getCEFRLevel(course.level || (index + 1)),
          unlocked: course.level === 1, // First level is always unlocked
          totalUnits: course.total_units || 8, // Use API data or fallback
          totalSkills: course.total_skills || course.totalSkills || 24
        }));

        setCourses(transformedCourses);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
      // Fallback to generated course structure
      setCourses(generateFallbackCourses());
    } finally {
      setLoading(false);
    }
  };

  const generateFallbackCourses = () => {
    const levels = [
      {
        level: 1,
        displayLevel: `${language.name.split(' ')[0]} 101`,
        name: `${language.name} I: Fundamentals`,
        academicName: 'Elementary I',
        description: 'Introduction to basic vocabulary, pronunciation, and essential grammar structures. Focus on family relationships and daily interactions.',
        cefrLevel: 'A1',
        estimatedHours: 45,
        totalUnits: 8,
        totalSkills: 24,
        learningObjectives: [
          'Master basic pronunciation and alphabet',
          'Learn essential family and social vocabulary',
          'Understand present tense constructions',
          'Engage in simple conversations'
        ],
        prerequisites: [],
        unlocked: true
      },
      {
        level: 2,
        displayLevel: `${language.name.split(' ')[0]} 201`,
        name: `${language.name} II: Building Foundations`,
        academicName: 'Elementary II',
        description: 'Expanding vocabulary and grammar complexity. Introduction to past tense and cultural contexts of daily life.',
        cefrLevel: 'A2',
        estimatedHours: 48,
        totalUnits: 10,
        totalSkills: 30,
        learningObjectives: [
          'Master past tense constructions',
          'Expand vocabulary for describing experiences',
          'Understand cultural contexts and customs',
          'Handle more complex conversations'
        ],
        prerequisites: [`${language.name.split(' ')[0]} 101`],
        unlocked: false
      },
      {
        level: 3,
        displayLevel: `${language.name.split(' ')[0]} 301`,
        name: `${language.name} III: Intermediate Proficiency`,
        academicName: 'Intermediate I',
        description: 'Advanced grammar structures, cultural immersion, and complex communication scenarios. Future tense and conditional statements.',
        cefrLevel: 'B1',
        estimatedHours: 52,
        totalUnits: 12,
        totalSkills: 36,
        learningObjectives: [
          'Master future and conditional tenses',
          'Navigate complex cultural situations',
          'Express opinions and abstract concepts',
          'Understand cultural nuances and context'
        ],
        prerequisites: [`${language.name.split(' ')[0]} 201`],
        unlocked: false
      },
      {
        level: 4,
        displayLevel: `${language.name.split(' ')[0]} 401`,
        name: `${language.name} IV: Advanced Studies`,
        academicName: 'Intermediate II',
        description: 'Near-native proficiency development. Complex literature, media analysis, and advanced cultural competency.',
        cefrLevel: 'B2',
        estimatedHours: 55,
        totalUnits: 14,
        totalSkills: 42,
        learningObjectives: [
          'Achieve near-native pronunciation',
          'Analyze cultural texts and media',
          'Express complex ideas fluently',
          'Demonstrate advanced cultural competency'
        ],
        prerequisites: [`${language.name.split(' ')[0]} 301`],
        unlocked: false
      }
    ];

    return levels;
  };

  const getAcademicName = (level) => {
    const names = {
      1: 'Elementary I',
      2: 'Elementary II', 
      3: 'Intermediate I',
      4: 'Intermediate II'
    };
    return names[level] || `Level ${level}`;
  };

  const getCEFRLevel = (level) => {
    const cefrMap = { 1: 'A1', 2: 'A2', 3: 'B1', 4: 'B2' };
    return cefrMap[level] || 'A1';
  };

  const handleCourseSelect = (course) => {
    setSelectedCourse(course);
  };

  const handleContinue = () => {
    if (selectedCourse) {
      onCourseSelect(selectedCourse);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-400 border-t-transparent mx-auto mb-6"></div>
          <p className="text-blue-100 text-lg">Loading course levels...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="w-full h-full bg-gradient-to-br from-blue-900/10 via-transparent to-purple-900/10"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 px-4 py-6">
        <div className="container mx-auto flex items-center justify-between">
          <motion.button 
            onClick={onBack}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-white/10 backdrop-blur-sm border border-white/20 text-blue-100 hover:text-white hover:bg-white/20 flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300"
          >
            <span>←</span>
            <span>Back to Languages</span>
          </motion.button>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              RareLanguages
            </div>
            <div className="text-sm text-blue-200 mt-1">
              {language.flag} {language.name}
            </div>
          </div>

          <div className="space-x-4">
            <button className="bg-white/10 backdrop-blur-sm border border-white/20 text-blue-100 hover:text-white hover:bg-white/20 px-4 py-2 rounded-lg transition-all duration-300">
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* Progress Indicator */}
      <div className="relative z-10 px-4 py-4">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center justify-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-400 text-white rounded-full flex items-center justify-center font-bold shadow-lg">✓</div>
              <span className="text-green-200">Welcome</span>
            </div>
            <div className="w-12 h-0.5 bg-blue-300/50"></div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-400 text-white rounded-full flex items-center justify-center font-bold shadow-lg">✓</div>
              <span className="text-green-200">Language Selected</span>
            </div>
            <div className="w-12 h-0.5 bg-blue-300/50"></div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-400 text-white rounded-full flex items-center justify-center font-bold shadow-lg">3</div>
              <span className="text-blue-200 font-medium">Choose Course Level</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <section className="relative z-10 px-4 py-8">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-purple-300 to-cyan-300 mb-4">
              {language.name} Academic Sequence
            </h1>
            <p className="text-xl text-blue-100 font-light max-w-3xl mx-auto leading-relaxed">
              Choose your starting level. Like traditional high school language courses, 
              each level builds systematically on the previous one.
            </p>
          </motion.div>

          {/* Course Level Cards */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 max-w-6xl mx-auto mb-12"
          >
            {courses.map((course, index) => (
              <motion.div
                key={course.displayLevel}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => course.unlocked && handleCourseSelect(course)}
                className={`relative group cursor-pointer ${
                  selectedCourse?.displayLevel === course.displayLevel ? 'ring-4 ring-blue-400/60' : ''
                } ${
                  !course.unlocked ? 'opacity-60 cursor-not-allowed' : ''
                }`}
              >
                <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-500 shadow-2xl group-hover:shadow-blue-500/25">
                  
                  {/* Course Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300">
                          {course.displayLevel}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          course.cefrLevel === 'A1' ? 'bg-green-500/20 text-green-200 border border-green-400/30' :
                          course.cefrLevel === 'A2' ? 'bg-blue-500/20 text-blue-200 border border-blue-400/30' :
                          course.cefrLevel === 'B1' ? 'bg-yellow-500/20 text-yellow-200 border border-yellow-400/30' :
                          'bg-orange-500/20 text-orange-200 border border-orange-400/30'
                        }`}>
                          CEFR {course.cefrLevel}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-1 leading-tight">
                        {course.name || `${language.name} ${course.academicName}`}
                      </h3>
                      <p className="text-blue-200/80 text-sm">
                        {course.academicName} • {course.estimatedHours} Contact Hours
                      </p>
                    </div>
                    
                    {!course.unlocked && (
                      <div className="text-yellow-200">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Course Description */}
                  <p className="text-blue-100/90 mb-4 leading-relaxed text-sm line-clamp-3">
                    {course.description}
                  </p>

                  {/* Course Stats */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-300">{course.totalUnits || 8}</div>
                      <div className="text-xs text-blue-200/70">Units</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-300">{course.totalSkills || 24}</div>
                      <div className="text-xs text-blue-200/70">Skills</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-cyan-300">{course.estimatedHours}</div>
                      <div className="text-xs text-blue-200/70">Hours</div>
                    </div>
                  </div>

                  {/* Learning Objectives */}
                  <div className="mb-4">
                    <h4 className="text-white font-medium mb-2 text-sm">Learning Objectives:</h4>
                    <ul className="space-y-1 text-xs text-blue-100/80">
                      {(course.learningObjectives || []).slice(0, 3).map((objective, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <span className="text-blue-400 mt-1">•</span>
                          <span>{objective}</span>
                        </li>
                      ))}
                      {course.learningObjectives && course.learningObjectives.length > 3 && (
                        <li className="text-blue-200/60 text-xs">+ {course.learningObjectives.length - 3} more objectives</li>
                      )}
                    </ul>
                  </div>

                  {/* Prerequisites */}
                  {course.prerequisites && course.prerequisites.length > 0 && (
                    <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-400/30 rounded-lg">
                      <div className="text-yellow-200 text-xs font-medium mb-1">Prerequisites:</div>
                      <div className="text-yellow-100/80 text-xs">
                        Complete {course.prerequisites.join(', ')} with passing grade
                      </div>
                    </div>
                  )}

                  {/* Selection Indicator */}
                  {selectedCourse?.displayLevel === course.displayLevel && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-2xl border-2 border-blue-400/50"
                    >
                      <div className="absolute top-4 right-4">
                        <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center shadow-lg">
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Continue Button */}
          {selectedCourse && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <motion.button 
                onClick={handleContinue}
                whileHover={{ scale: 1.05, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-lg font-semibold px-12 py-4 rounded-2xl shadow-2xl transition-all duration-300"
              >
                View {selectedCourse.displayLevel} Course Syllabus →
              </motion.button>
              
              <p className="text-blue-200 text-sm mt-4">
                Access your digital textbook and complete lesson structure
              </p>
            </motion.div>
          )}

          {/* Coming Soon Notice for Additional Levels */}
          {courses.length === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-center mt-12"
            >
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 max-w-2xl mx-auto">
                <h3 className="text-xl font-semibold text-blue-200 mb-3">Additional Levels Coming Soon</h3>
                <p className="text-blue-100/80 text-sm mb-4">
                  {language.name} 201, 301, and 401 courses are in development. 
                  Complete Level 101 to unlock the next stage of your language journey.
                </p>
                <div className="flex justify-center space-x-4">
                  {['201', '301', '401'].map((level) => (
                    <div 
                      key={level}
                      className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-blue-200/60 text-sm"
                    >
                      {language.name.split(' ')[0]} {level}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
};

export default CourseLevelSelection;