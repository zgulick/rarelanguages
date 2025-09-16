import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { designSystem, getButtonClass, getCardClass, getTextGradient } from '../../styles/designSystem';
import { useApp } from '../../contexts/AppContext';

const CourseSyllabus = ({ course, language, onLessonSelect, onBack }) => {
  const { currentUser } = useApp();
  const [courseContent, setCourseContent] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedUnits, setExpandedUnits] = useState(new Set([1])); // First unit expanded by default

  useEffect(() => {
    loadCourseContent();
  }, [course]);

  const loadCourseContent = async () => {
    try {
      setLoading(true);
      
      // Try to fetch course content from API
      const response = await fetch(`/api/courses/${course.id}/dashboard?userId=${currentUser.id}`);
      if (response.ok) {
        const data = await response.json();
        setCourseContent(data);
      } else {
        // Generate fallback syllabus structure
        setCourseContent(generateFallbackSyllabus());
      }
    } catch (error) {
      console.error('Error loading course content:', error);
      setCourseContent(generateFallbackSyllabus());
    } finally {
      setLoading(false);
    }
  };

  const generateFallbackSyllabus = () => {
    const units = [
      {
        id: 1,
        title: 'Family and Introductions',
        subtitle: 'Familja dhe Prezantimet',
        description: 'Learn essential vocabulary for family relationships and basic introductions',
        duration: '6 lessons • 8-10 hours',
        objectives: [
          'Master 25+ family relationship terms including extended family',
          'Use possessive pronouns (im/ime) with correct gender agreement',
          'Build sentences for family introductions and descriptions',
          'Learn numbers 1-10 and basic present tense constructions',
          'Understand Albanian family cultural values and traditions',
          'Practice pronunciation of family-related vocabulary'
        ],
        lessons: [
          { 
            id: 1, 
            title: 'Family Members & Relationships', 
            subtitle: 'Anëtarët e Familjes dhe Marrëdhëniet', 
            type: 'vocabulary', 
            duration: '45 min', 
            completed: false, 
            locked: false,
            preview: 'Learn 25+ family terms, possessive pronouns (im/ime), and how to say "This is my..."',
            topics: ['Family vocabulary', 'Possessive pronouns', 'Introduction phrases', 'Gender agreement']
          },
          { 
            id: 2, 
            title: 'Talking About Your Family', 
            subtitle: 'Duke Folur për Familjen Tuaj', 
            type: 'grammar', 
            duration: '50 min', 
            completed: false, 
            locked: false,
            preview: 'Build sentences like "I have two sisters" and "My father works as..."',
            topics: ['Present tense "kam" (to have)', 'Numbers 1-10', 'Occupations', 'Family descriptions']
          },
          { 
            id: 3, 
            title: 'Family Conversations', 
            subtitle: 'Biseda Familjare', 
            type: 'dialogue', 
            duration: '45 min', 
            completed: false, 
            locked: true,
            preview: 'Practice real conversations: asking about family, sharing family stories',
            topics: ['Question formation', 'Family-related questions', 'Responses', 'Follow-up questions']
          },
          { 
            id: 4, 
            title: 'Meeting the Extended Family', 
            subtitle: 'Takimi me Familjen e Zgjeruar', 
            type: 'cultural', 
            duration: '40 min', 
            completed: false, 
            locked: true,
            preview: 'Albanian family traditions, respectful greetings, and cultural expectations',
            topics: ['Extended family terms', 'Formal greetings', 'Cultural etiquette', 'Family roles']
          },
          { 
            id: 5, 
            title: 'Family Stories & Memories', 
            subtitle: 'Tregime dhe Kujtime Familjare', 
            type: 'conversation', 
            duration: '55 min', 
            completed: false, 
            locked: true,
            preview: 'Tell family stories using past tense, describe family events and traditions',
            topics: ['Past tense basics', 'Time expressions', 'Family events', 'Storytelling phrases']
          },
          { 
            id: 6, 
            title: 'Family Unit Practice', 
            subtitle: 'Praktikë e Njësisë Familjare', 
            type: 'assessment', 
            duration: '30 min', 
            completed: false, 
            locked: true,
            preview: 'Test your knowledge: family vocabulary, introductions, and conversations',
            topics: ['Vocabulary review', 'Grammar application', 'Speaking practice', 'Cultural awareness']
          }
        ],
        culturalNote: 'Albanian family structures reflect strong cultural traditions of extended family connections and hospitality.',
        progress: 0,
        unlocked: true
      },
      {
        id: 2,
        title: 'Home and Daily Life',
        subtitle: 'Shtëpia dhe Jeta e Përditshme',
        description: 'Explore vocabulary and expressions for home environments and daily routines',
        duration: '7 lessons • 9-12 hours',
        objectives: [
          'Describe home environments and rooms',
          'Express daily routines and activities',
          'Use time expressions correctly',
          'Practice past tense constructions'
        ],
        lessons: [
          { 
            id: 7, 
            title: 'Home & Living Spaces', 
            subtitle: 'Shtëpia dhe Hapësirat e Jetesës', 
            type: 'vocabulary', 
            duration: '45 min', 
            completed: false, 
            locked: true,
            preview: 'Learn 30+ words for rooms, furniture, and household items with locative expressions',
            topics: ['Room names', 'Furniture vocabulary', 'Prepositions of place', 'Home descriptions']
          },
          { 
            id: 8, 
            title: 'Daily Routines & Time', 
            subtitle: 'Rutina Ditore dhe Koha', 
            type: 'grammar', 
            duration: '50 min', 
            completed: false, 
            locked: true,
            preview: 'Tell time, describe daily activities using present tense verbs and time expressions',
            topics: ['Time expressions', 'Daily activity verbs', 'Present tense conjugation', 'Sequencing words']
          },
          { 
            id: 9, 
            title: 'Home Conversations', 
            subtitle: 'Biseda në Shtëpi', 
            type: 'dialogue', 
            duration: '40 min', 
            completed: false, 
            locked: true,
            preview: 'Practice household conversations: asking for help, discussing chores, making plans',
            topics: ['Household requests', 'Offering help', 'Making suggestions', 'Household chores']
          },
          { 
            id: 10, 
            title: 'Albanian Home Life', 
            subtitle: 'Jeta në Shtëpinë Shqiptare', 
            type: 'cultural', 
            duration: '45 min', 
            completed: false, 
            locked: true,
            preview: 'Understand Albanian household customs, hospitality traditions, and family dynamics',
            topics: ['Hospitality customs', 'Guest etiquette', 'Household roles', 'Traditional vs modern homes']
          },
          { 
            id: 11, 
            title: 'A Day in an Albanian Home', 
            subtitle: 'Një Ditë në një Shtëpi Shqiptare', 
            type: 'conversation', 
            duration: '60 min', 
            completed: false, 
            locked: true,
            preview: 'Experience a full day: morning routines, meals, activities, evening traditions',
            topics: ['Morning routines', 'Meal times', 'Afternoon activities', 'Evening traditions']
          },
          { 
            id: 12, 
            title: 'Describing Home & Routine', 
            subtitle: 'Përshkrimi i Shtëpisë dhe Rutinës', 
            type: 'conversation', 
            duration: '50 min', 
            completed: false, 
            locked: true,
            preview: 'Put it all together: describe your home, compare routines, share experiences',
            topics: ['Home descriptions', 'Routine comparisons', 'Personal experiences', 'Future plans']
          },
          { 
            id: 13, 
            title: 'Home & Daily Life Assessment', 
            subtitle: 'Vlerësimi i Shtëpisë dhe Jetës Ditore', 
            type: 'assessment', 
            duration: '35 min', 
            completed: false, 
            locked: true,
            preview: 'Demonstrate mastery of home vocabulary, time expressions, and daily routine descriptions',
            topics: ['Vocabulary mastery', 'Time telling', 'Routine descriptions', 'Cultural understanding']
          }
        ],
        culturalNote: 'Traditional Albanian homes often include multiple generations, with specific customs around hospitality and guest reception.',
        progress: 0,
        unlocked: false
      },
      {
        id: 3,
        title: 'Food and Hospitality',
        subtitle: 'Ushqimi dhe Mikpritja',
        description: 'Discover food vocabulary and the central role of hospitality in Albanian culture',
        duration: '8 lessons • 10-13 hours',
        objectives: [
          'Master food and cooking vocabulary',
          'Understand cultural dining customs',
          'Express preferences and opinions',
          'Practice future tense constructions'
        ],
        lessons: [
          { id: 14, title: 'Traditional Foods', subtitle: 'Ushqime Tradicionale', type: 'vocabulary', duration: '50 min', completed: false, locked: true },
          { id: 15, title: 'At the Restaurant', subtitle: 'Në Restorant', type: 'dialogue', duration: '45 min', completed: false, locked: true },
          { id: 16, title: 'Cooking Instructions', subtitle: 'Udhëzime Gatimi', type: 'functional', duration: '55 min', completed: false, locked: true },
          { id: 17, title: 'Hospitality Customs', subtitle: 'Zakonet e Mikpritjes', type: 'cultural', duration: '60 min', completed: false, locked: true },
          { id: 18, title: 'Family Feast', subtitle: 'Gosti Familjar', type: 'conversation', duration: '50 min', completed: false, locked: true },
          { id: 19, title: 'Food Stories', subtitle: 'Tregime Ushqimi', type: 'reading', duration: '45 min', completed: false, locked: true },
          { id: 20, title: 'Recipe Sharing', subtitle: 'Ndarja e Recetave', type: 'writing', duration: '40 min', completed: false, locked: true },
          { id: 21, title: 'Unit Assessment', subtitle: 'Vlerësimi i Njësisë', type: 'assessment', duration: '35 min', completed: false, locked: true }
        ],
        culturalNote: 'Hospitality (mikpritja) is fundamental to Albanian culture, with elaborate customs around food preparation and guest treatment.',
        progress: 0,
        unlocked: false
      },
      {
        id: 4,
        title: 'Community and Traditions',
        subtitle: 'Komuniteti dhe Traditat',
        description: 'Explore community structures, cultural traditions, and social relationships',
        duration: '9 lessons • 11-15 hours',
        objectives: [
          'Understand community social structures',
          'Learn about cultural celebrations',
          'Express complex social relationships',
          'Master conditional tense usage'
        ],
        lessons: [
          { id: 22, title: 'Village Life', subtitle: 'Jeta e Fshatit', type: 'cultural', duration: '55 min', completed: false, locked: true },
          { id: 23, title: 'Celebrations', subtitle: 'Festimet', type: 'vocabulary', duration: '45 min', completed: false, locked: true },
          { id: 24, title: 'Traditional Crafts', subtitle: 'Zanatet Tradicionale', type: 'cultural', duration: '60 min', completed: false, locked: true },
          { id: 25, title: 'Social Relationships', subtitle: 'Marrëdhënie Shoqërore', type: 'dialogue', duration: '50 min', completed: false, locked: true },
          { id: 26, title: 'Folk Tales', subtitle: 'Përralla Popullore', type: 'reading', duration: '65 min', completed: false, locked: true },
          { id: 27, title: 'Community Events', subtitle: 'Ngjarje Komunitare', type: 'conversation', duration: '45 min', completed: false, locked: true },
          { id: 28, title: 'Cultural Comparison', subtitle: 'Krahasim Kulturor', type: 'writing', duration: '50 min', completed: false, locked: true },
          { id: 29, title: 'Final Project', subtitle: 'Projekti Final', type: 'project', duration: '90 min', completed: false, locked: true },
          { id: 30, title: 'Course Assessment', subtitle: 'Vlerësimi i Kursit', type: 'assessment', duration: '45 min', completed: false, locked: true }
        ],
        culturalNote: 'Albanian community traditions maintain strong connections to historical practices while adapting to modern social contexts.',
        progress: 0,
        unlocked: false
      }
    ];

    return {
      course: {
        ...course,
        description: `Complete ${course.displayLevel} curriculum with comprehensive vocabulary, grammar, cultural context, and practical conversation skills. Each lesson includes 25+ vocabulary items, grammar patterns, cultural insights, and extensive practice exercises.`,
        totalLessons: units.reduce((acc, unit) => acc + unit.lessons.length, 0),
        totalHours: units.reduce((acc, unit) => acc + unit.lessons.reduce((sum, lesson) => sum + parseInt(lesson.duration), 0) / 60, 0),
        completion: 0
      },
      units,
      instructor: {
        name: 'Prof. Digital Curriculum',
        credentials: 'Generated by Advanced Language AI',
        office_hours: 'Available 24/7'
      }
    };
  };

  const toggleUnit = (unitId) => {
    const newExpanded = new Set(expandedUnits);
    if (newExpanded.has(unitId)) {
      newExpanded.delete(unitId);
    } else {
      newExpanded.add(unitId);
    }
    setExpandedUnits(newExpanded);
  };

  const getLessonIcon = (type) => {
    const icons = {
      vocabulary: '📚',
      dialogue: '💬',
      conversation: '🗣️',
      grammar: '📝',
      audio: '🎧',
      reading: '📖',
      writing: '✍️',
      cultural: '🏛️',
      functional: '⚙️',
      assessment: '✅',
      project: '🎯'
    };
    return icons[type] || '📄';
  };

  const getCEFRColor = (level) => {
    const colors = {
      A1: 'from-green-400 to-green-600',
      A2: 'from-blue-400 to-blue-600',
      B1: 'from-yellow-400 to-yellow-600',
      B2: 'from-orange-400 to-orange-600'
    };
    return colors[level] || 'from-gray-400 to-gray-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: designSystem.gradients.pageBackground }}>
        <div className="text-center">
          <div className="relative mb-8">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-100/50 to-purple-100/50 animate-pulse"></div>
          </div>
          <p className="text-xl font-medium" style={{ color: designSystem.colors.text.primary }}>Loading course syllabus...</p>
          <p className="text-sm mt-2" style={{ color: designSystem.colors.text.secondary }}>Preparing your learning journey</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: designSystem.gradients.pageBackground }}>
      {/* Header */}
      <header className="relative z-10 px-6 py-8 bg-black/10 backdrop-blur-xl border-b border-white/10">
        <div className="container mx-auto flex items-center justify-between">
          <motion.button 
            onClick={onBack}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={getButtonClass('secondary')}
            style={{ minWidth: '160px' }}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to Courses</span>
          </motion.button>
          
          <div className="text-center">
            <div className={`text-3xl font-bold ${getTextGradient(['from-blue-300', 'via-purple-300', 'to-cyan-300'])}`}>
              {course.displayLevel} Syllabus
            </div>
            <div className="text-white/70 mt-2 font-medium">
              {language.flag} {language.name} • {courseContent?.course?.totalLessons} Lessons
            </div>
          </div>

          <div className="space-x-4">
            <button className={getButtonClass('primary')} style={{ minWidth: '120px' }}>
              Enroll
            </button>
          </div>
        </div>
      </header>

      {/* Course Overview */}
      <section className="px-6 py-12 bg-gradient-to-b from-black/5 to-transparent">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-10">
            
            {/* Course Info */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`${getCardClass('primary')} p-10 h-full`}
                style={{
                  background: designSystem.colors.surface.card,
                  border: `1px solid ${designSystem.colors.border.light}`,
                  boxShadow: designSystem.shadows.lg
                }}
              >
                <div className="flex items-start justify-between mb-8">
                  <div>
                    <h1 className={`text-4xl font-bold mb-4 ${getTextGradient(['from-blue-300', 'to-purple-300'])}`}>
                      {course.name || `${language.name} ${course.academicName}`}
                    </h1>
                    <p className="text-white/90 text-lg leading-relaxed">
                      {courseContent?.course?.description || course.description}
                    </p>
                  </div>
                  <span className={`px-6 py-3 rounded-xl text-sm font-bold bg-gradient-to-r ${getCEFRColor(course.cefrLevel)} text-white shadow-lg`} style={{
                    backdropFilter: 'blur(10px)'
                  }}>
                    CEFR {course.cefrLevel}
                  </span>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className={`text-center p-8 ${getCardClass('lesson')}`} style={{
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.1) 100%)'
                  }}>
                    <div className="text-4xl font-bold text-blue-300 mb-2">{courseContent?.course?.totalLessons}</div>
                    <div className="text-blue-100 font-medium">Total Lessons</div>
                    <div className="w-12 h-1 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full mx-auto mt-3"></div>
                  </div>
                  <div className={`text-center p-8 ${getCardClass('lesson')}`} style={{
                    background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.15) 0%, rgba(126, 34, 206, 0.1) 100%)'
                  }}>
                    <div className="text-4xl font-bold text-purple-300 mb-2">{Math.ceil(courseContent?.course?.totalHours) || course.estimatedHours}</div>
                    <div className="text-purple-100 font-medium">Contact Hours</div>
                    <div className="w-12 h-1 bg-gradient-to-r from-purple-400 to-purple-500 rounded-full mx-auto mt-3"></div>
                  </div>
                  <div className={`text-center p-8 ${getCardClass('lesson')}`} style={{
                    background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(8, 145, 178, 0.1) 100%)'
                  }}>
                    <div className="text-4xl font-bold text-cyan-300 mb-2">{courseContent?.units?.length || 4}</div>
                    <div className="text-cyan-100 font-medium">Units</div>
                    <div className="w-12 h-1 bg-gradient-to-r from-cyan-400 to-cyan-500 rounded-full mx-auto mt-3"></div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Instructor Info */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={`${getCardClass('primary')} p-10 h-full`}
                style={{
                  background: designSystem.colors.surface.card,
                  border: `1px solid ${designSystem.colors.border.light}`,
                  boxShadow: designSystem.shadows.lg
                }}
              >
                <h3 className="text-xl font-bold mb-8 text-center" style={{ color: designSystem.colors.text.primary }}>Instructor</h3>
                <div className="space-y-6">
                  <div className="flex items-center space-x-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-full flex items-center justify-center shadow-xl">
                      <span className="text-white font-bold text-xl">AI</span>
                    </div>
                    <div>
                      <div className="font-bold text-lg" style={{ color: designSystem.colors.text.primary }}>{courseContent?.instructor?.name}</div>
                      <div className="font-medium" style={{ color: designSystem.colors.text.secondary }}>{courseContent?.instructor?.credentials}</div>
                    </div>
                  </div>
                  <div className={`${getCardClass('lesson')} p-6`} style={{
                    background: designSystem.gradients.accentGreen,
                    border: `1px solid ${designSystem.colors.border.light}`
                  }}>
                    <div className="font-bold mb-3 text-emerald-700 text-center">Office Hours</div>
                    <div className="text-emerald-600 text-center">{courseContent?.instructor?.office_hours}</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Course Units - Table of Contents */}
      <section className="px-6 py-16">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className={`text-4xl font-bold mb-16 text-center ${getTextGradient(['from-blue-600', 'via-purple-600', 'to-indigo-600'])}`}>
              Course Table of Contents
            </h2>

            <div className="grid lg:grid-cols-2 gap-10">
              {courseContent?.units?.map((unit, unitIndex) => (
                <motion.div
                  key={unit.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: unitIndex * 0.1 }}
                  className={`${getCardClass('primary', true)} overflow-hidden`}
                  style={{
                    background: designSystem.colors.surface.card,
                    border: `1px solid ${designSystem.colors.border.light}`,
                    boxShadow: designSystem.shadows.lg
                  }}
                >
                  {/* Unit Header */}
                  <div 
                    onClick={() => toggleUnit(unit.id)}
                    className={`p-8 cursor-pointer transition-all duration-300 ${
                      !unit.unlocked ? 'opacity-60' : 'hover:bg-white/8'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-6">
                          <span className={`text-3xl font-bold ${getTextGradient([
                            unitIndex === 0 ? 'from-emerald-300' : unitIndex === 1 ? 'from-blue-300' : unitIndex === 2 ? 'from-purple-300' : 'from-pink-300',
                            unitIndex === 0 ? 'to-blue-300' : unitIndex === 1 ? 'to-purple-300' : unitIndex === 2 ? 'to-pink-300' : 'to-orange-300'
                          ])}`}>
                            Unit {unit.id}
                          </span>
                          {!unit.unlocked && (
                            <div className="p-2 bg-amber-400/20 border border-amber-300/30 rounded-lg">
                              <svg className="w-5 h-5 text-amber-300" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                        
                        <h3 className="text-2xl font-bold mb-3" style={{ color: designSystem.colors.text.primary }}>{unit.title}</h3>
                        <p className="font-semibold italic mb-3" style={{ color: designSystem.colors.text.secondary }}>{unit.subtitle}</p>
                        <p className="mb-6 leading-relaxed" style={{ color: designSystem.colors.text.secondary }}>{unit.description}</p>
                        
                        <div className="flex items-center justify-between">
                          <span className="font-medium" style={{ color: designSystem.colors.text.tertiary }}>{unit.duration}</span>
                          <span className="font-medium" style={{ color: designSystem.colors.text.tertiary }}>Progress: {unit.progress}%</span>
                        </div>
                      </div>
                      
                      <div className="ml-6 flex items-center space-x-3">
                        <div className={`w-5 h-5 rounded-full shadow-lg ${
                          unit.progress === 100 ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
                          unit.progress > 0 ? 'bg-gradient-to-r from-yellow-500 to-orange-600' : 'bg-gradient-to-r from-gray-400 to-gray-500'
                        }`}></div>
                        <svg className={`w-6 h-6 transform transition-transform duration-300 ${
                          expandedUnits.has(unit.id) ? 'rotate-180' : ''
                        }`} fill="currentColor" viewBox="0 0 20 20" style={{ color: designSystem.colors.text.tertiary }}>
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Unit Content */}
                  {expandedUnits.has(unit.id) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-slate-200"
                    >
                      {/* Learning Objectives */}
                      <div className="p-8 bg-gradient-to-r from-slate-50 to-white border-t border-slate-200">
                        <h4 className="font-bold text-lg mb-6 text-center" style={{ color: designSystem.colors.text.primary }}>Learning Objectives</h4>
                        <div className="grid md:grid-cols-2 gap-4">
                          {unit.objectives?.map((objective, idx) => (
                            <div key={idx} className="flex items-start space-x-3">
                              <div className={`w-2 h-2 rounded-full mt-3 flex-shrink-0 ${
                                unitIndex === 0 ? 'bg-gradient-to-r from-emerald-500 to-blue-500' :
                                unitIndex === 1 ? 'bg-gradient-to-r from-blue-500 to-purple-500' :
                                unitIndex === 2 ? 'bg-gradient-to-r from-purple-500 to-pink-500' :
                                'bg-gradient-to-r from-pink-500 to-orange-500'
                              }`}></div>
                              <span className="leading-relaxed" style={{ color: designSystem.colors.text.secondary }}>{objective}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Lessons */}
                      <div className="p-8">
                        <h4 className="font-bold text-lg mb-6 text-center" style={{ color: designSystem.colors.text.primary }}>Lessons</h4>
                        <div className="space-y-4">
                          {unit.lessons?.map((lesson, lessonIdx) => (
                            <motion.div
                              key={lesson.id}
                              whileHover={{ 
                                scale: lesson.locked ? 1 : 1.02, 
                                boxShadow: lesson.locked ? "none" : "0 25px 50px -12px rgba(0, 0, 0, 0.25)" 
                              }}
                              onClick={() => !lesson.locked && onLessonSelect(lesson, unit)}
                              className={`${getCardClass('lesson', !lesson.locked)} p-6 transition-all duration-300 ${
                                lesson.locked
                                  ? 'opacity-60 cursor-not-allowed'
                                  : lesson.completed
                                  ? 'shadow-lg hover:shadow-emerald-500/25'
                                  : 'shadow-lg'
                              }`}
                              style={{
                                background: lesson.locked
                                  ? designSystem.colors.background.muted
                                  : lesson.completed
                                  ? designSystem.gradients.accentGreen
                                  : lessonIdx % 3 === 0
                                  ? designSystem.gradients.accentBlue
                                  : lessonIdx % 3 === 1
                                  ? designSystem.gradients.accentPurple
                                  : designSystem.gradients.accentBlue,
                                border: `1px solid ${designSystem.colors.border.light}`
                              }}
                            >
                              <div className="flex items-center space-x-6 flex-1">
                                <div className="text-3xl">
                                  {lesson.completed ? '✅' : lesson.locked ? '🔒' : getLessonIcon(lesson.type)}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3 mb-2">
                                    <span className={`font-bold ${
                                      lesson.locked ? 'text-slate-500' :
                                      lesson.completed ? 'text-emerald-700' :
                                      lessonIdx % 3 === 0 ? 'text-blue-700' :
                                      lessonIdx % 3 === 1 ? 'text-purple-700' :
                                      'text-blue-700'
                                    }`}>
                                      Lesson {lesson.id}
                                    </span>
                                    <span style={{ color: designSystem.colors.text.muted }}>•</span>
                                    <span className={`text-xs uppercase tracking-wide font-bold px-2 py-1 rounded-full ${
                                      lesson.locked ? 'text-slate-600 bg-slate-200' :
                                      lesson.completed ? 'text-emerald-700 bg-emerald-100' :
                                      lessonIdx % 3 === 0 ? 'text-blue-700 bg-blue-100' :
                                      lessonIdx % 3 === 1 ? 'text-purple-700 bg-purple-100' :
                                      'text-blue-700 bg-blue-100'
                                    }`}>
                                      {lesson.type}
                                    </span>
                                  </div>
                                  <h5 className="font-bold text-lg mb-1" style={{ color: designSystem.colors.text.primary }}>{lesson.title}</h5>
                                  <p className="italic mb-2" style={{ color: designSystem.colors.text.secondary }}>{lesson.subtitle}</p>
                                  {lesson.preview && (
                                    <p className="text-sm mb-3 leading-relaxed" style={{ color: designSystem.colors.text.tertiary }}>{lesson.preview}</p>
                                  )}
                                  {lesson.topics && lesson.topics.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                      {lesson.topics.slice(0, 3).map((topic, idx) => (
                                        <span key={idx} className="px-3 py-1 text-xs rounded-full font-medium" style={{
                                          background: designSystem.colors.background.secondary,
                                          color: designSystem.colors.text.tertiary,
                                          border: `1px solid ${designSystem.colors.border.light}`
                                        }}>
                                          {topic}
                                        </span>
                                      ))}
                                      {lesson.topics.length > 3 && (
                                        <span className="px-3 py-1 text-xs rounded-full" style={{
                                          background: designSystem.colors.background.muted,
                                          color: designSystem.colors.text.muted
                                        }}>
                                          +{lesson.topics.length - 3} more
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className={`font-bold text-lg ${
                                lesson.locked ? 'text-slate-500' :
                                lesson.completed ? 'text-emerald-700' :
                                'text-slate-600'
                              }`}>{lesson.duration}</div>
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      {/* Cultural Note */}
                      {unit.culturalNote && (
                        <div className="p-8 border-t border-slate-200" style={{
                          background: designSystem.gradients.accentPurple
                        }}>
                          <div className="text-center">
                            <div className="text-4xl mb-4">🏛️</div>
                            <h5 className="font-bold text-lg mb-4" style={{ color: designSystem.colors.text.primary }}>Cultural Context</h5>
                            <p className="leading-relaxed" style={{ color: designSystem.colors.text.secondary }}>{unit.culturalNote}</p>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default CourseSyllabus;