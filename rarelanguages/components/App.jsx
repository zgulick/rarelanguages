import React, { useState } from 'react';
import { AppProvider, useApp } from '../contexts/AppContext';
import Layout from './layout/Layout';

// Import the new high school language learning flow components
import LanguageSelection from './pages/LanguageSelection';
import CourseLevelSelection from './pages/CourseLevelSelection';
import CourseSyllabus from './pages/CourseSyllabus';
import AcademicLesson from './exercises/AcademicLesson';

// Main app component implementing high school language learning flow
const AppRouter = () => {
  const { currentUser } = useApp();
  
  // Navigation state for the high school flow
  const [currentView, setCurrentView] = useState('language-selection'); // language-selection -> course-level -> syllabus -> lesson
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);

  // Language Selection Flow (Step 1: Choose Spanish vs French equivalent)
  const handleLanguageSelected = (language) => {
    setSelectedLanguage(language);
    setCurrentView('course-level');
  };

  // Course Level Selection Flow (Step 2: Choose Albanian 101, 201, 301, 401)
  const handleCourseSelected = (course) => {
    setSelectedCourse(course);
    setCurrentView('syllabus');
  };

  // Syllabus/Table of Contents Flow (Step 3: View textbook structure)
  const handleLessonSelected = (lesson, unit) => {
    setSelectedLesson({ ...lesson, unit });
    setCurrentView('lesson');
  };

  const handleLessonComplete = (completionData) => {
    console.log('Lesson completed:', completionData);
    setCurrentView('syllabus'); // Return to syllabus
  };

  // Navigation handlers
  const handleBackToLanguages = () => {
    setSelectedLanguage(null);
    setSelectedCourse(null);
    setSelectedLesson(null);
    setCurrentView('language-selection');
  };

  const handleBackToCourses = () => {
    setSelectedCourse(null);
    setSelectedLesson(null);
    setCurrentView('course-level');
  };

  const handleBackToSyllabus = () => {
    setSelectedLesson(null);
    setCurrentView('syllabus');
  };

  const handleBackToWelcome = () => {
    // This could navigate to a welcome/marketing page
    setCurrentView('language-selection');
  };

  // Render the appropriate view based on the high school flow
  const renderCurrentView = () => {
    switch (currentView) {
      case 'language-selection':
        return (
          <LanguageSelection
            onLanguageSelected={handleLanguageSelected}
            onBack={handleBackToWelcome}
          />
        );

      case 'course-level':
        return (
          <CourseLevelSelection
            language={selectedLanguage}
            onCourseSelect={handleCourseSelected}
            onBack={handleBackToLanguages}
          />
        );

      case 'syllabus':
        return (
          <CourseSyllabus
            course={selectedCourse}
            language={selectedLanguage}
            onLessonSelect={handleLessonSelected}
            onBack={handleBackToCourses}
          />
        );

      case 'lesson':
        return (
          <AcademicLesson
            lessonId={selectedLesson?.id}
            courseId={selectedCourse?.id}
            lesson={selectedLesson}
            course={selectedCourse}
            language={selectedLanguage}
            onComplete={handleLessonComplete}
            onExit={handleBackToSyllabus}
          />
        );

      default:
        return (
          <LanguageSelection
            onLanguageSelected={handleLanguageSelected}
            onBack={handleBackToWelcome}
          />
        );
    }
  };

  return (
    <div className="app-container">
      {renderCurrentView()}
    </div>
  );
};

const App = () => {
  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  );
};

export default App;