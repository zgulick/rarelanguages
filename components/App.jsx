/**
 * App Component - Main Application Entry Point
 * Phase 2: Academic UX Transformation - Course-based Navigation System
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from '../contexts/AppContext';
import Layout from './layout/Layout';
import HomePage from './pages/HomePage';
import LessonDashboard from './pages/LessonDashboard';
import LessonPlayer from './pages/LessonPlayer';
import PracticeHub from './pages/PracticeHub';

// Phase 2: Academic Components
import CourseCatalog from './pages/CourseCatalog';
import CourseDetail from './pages/CourseDetail';
import CourseDashboard from './pages/CourseDashboard';
import AcademicLesson from './exercises/AcademicLesson';
import PrerequisiteGate from './academic/PrerequisiteGate';
import LanguageLanding from './pages/LanguageLanding';
import AlbanianDashboard from './pages/AlbanianDashboard';
import AlbanianLesson from './pages/AlbanianLesson';

// Main app component that handles routing based on AppContext state
const AppRouter = () => {
  const { currentPage, currentUser } = useApp();
  
  // Academic navigation state for Phase 2
  const [academicMode, setAcademicMode] = useState(true);
  const [showLanding, setShowLanding] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const [courseDetailMode, setCourseDetailMode] = useState(false);
  const [academicLessonMode, setAcademicLessonMode] = useState(false);

  // Handle course selection from catalog
  const handleSelectCourse = (courseId, action = 'view') => {
    setSelectedCourseId(courseId);
    if (action === 'continue') {
      // User has access, go to course dashboard
      setCourseDetailMode(false);
    } else {
      // Show course details for enrollment
      setCourseDetailMode(true);
    }
  };

  // Handle course enrollment
  const handleEnrollInCourse = (courseId, courseData) => {
    setSelectedCourseId(courseId);
    setCourseDetailMode(false);
    // Successfully enrolled, show course dashboard
  };

  // Handle starting a lesson
  const handleStartLesson = (lessonId, courseId) => {
    setSelectedLessonId(lessonId);
    setSelectedCourseId(courseId);
    setAcademicLessonMode(true);
  };

  // Handle lesson completion
  const handleLessonComplete = (completionData) => {
    console.log('Lesson completed:', completionData);
    
    // Show completion celebration briefly
    setAcademicLessonMode(false);
    setSelectedLessonId(null);
    
    // Force dashboard reload to show updated progress
    if (selectedCourseId) {
      // This will trigger a re-render of the dashboard with updated data
      // Note: Dashboard will automatically refresh via event listener
    }
    
    // Return to course dashboard
  };

  // Handle navigation back to catalog
  const handleBackToCatalog = () => {
    setSelectedCourseId(null);
    setCourseDetailMode(false);
    setAcademicLessonMode(false);
    setSelectedLessonId(null);
  };

  // Handle starting learning from landing
  const handleStartLearning = () => {
    setShowLanding(false);
    // Auto-enroll in Albanian course if available
    const albanianCourseId = 'b29f6608-a91e-420c-bc0b-22dfb71c846e'; // Our Albanian course
    setSelectedCourseId(albanianCourseId);
    setCourseDetailMode(false);
  };

  // Handle navigation back to course dashboard
  const handleBackToCourse = () => {
    setAcademicLessonMode(false);
    setSelectedLessonId(null);
    setCourseDetailMode(false);
  };

  // Toggle between academic and traditional modes
  const toggleMode = () => {
    setAcademicMode(!academicMode);
    // Reset navigation state when switching modes
    setShowLanding(true);
    setSelectedCourseId(null);
    setCourseDetailMode(false);
    setAcademicLessonMode(false);
    setSelectedLessonId(null);
  };

  const renderAcademicFlow = () => {
    // Language Landing Experience (First Time)
    if (showLanding) {
      return (
        <LanguageLanding 
          language="Albanian"
          languageCode="sq"
          flag="🇦🇱"
          onStartLearning={handleStartLearning}
          onEnrollCourse={handleStartLearning}
          onSelectLanguage={() => {
            // TODO: Show language selection modal
            console.log('Language selection requested');
          }}
        />
      );
    }

    // Academic Lesson with Prerequisite Gate
    if (academicLessonMode && selectedLessonId) {
      const isAlbanianCourse = selectedCourseId === 'b29f6608-a91e-420c-bc0b-22dfb71c846e';
      
      // Use Albanian-specific lesson for Albanian course
      if (isAlbanianCourse) {
        return (
          <AlbanianLesson
            lessonId={selectedLessonId}
            courseId={selectedCourseId}
            onComplete={handleLessonComplete}
            onExit={handleBackToCourse}
          />
        );
      }
      
      return (
        <PrerequisiteGate
          userId={currentUser?.id}
          targetLessonId={selectedLessonId}
          onAccessGranted={() => console.log('Lesson access granted')}
          onAccessDenied={() => setAcademicLessonMode(false)}
        >
          <AcademicLesson
            lesson={{ id: selectedLessonId }}
            courseId={selectedCourseId}
            currentUser={currentUser}
            onComplete={handleLessonComplete}
            onExit={handleBackToCourse}
          />
        </PrerequisiteGate>
      );
    }

    // Course Detail Page
    if (courseDetailMode && selectedCourseId) {
      return (
        <CourseDetail
          courseId={selectedCourseId}
          currentUser={currentUser}
          onEnroll={handleEnrollInCourse}
          onContinue={() => setCourseDetailMode(false)}
          onBack={handleBackToCatalog}
        />
      );
    }

    // Course Dashboard - Use Albanian-specific dashboard for Albanian course
    if (selectedCourseId && !courseDetailMode) {
      const isAlbanianCourse = selectedCourseId === 'b29f6608-a91e-420c-bc0b-22dfb71c846e';
      
      if (isAlbanianCourse) {
        return (
          <AlbanianDashboard
            courseId={selectedCourseId}
            currentUser={currentUser}
            onStartLesson={handleStartLesson}
            onBack={handleBackToCatalog}
          />
        );
      } else {
        return (
          <CourseDashboard
            courseId={selectedCourseId}
            currentUser={currentUser}
            onStartLesson={handleStartLesson}
            onStartAssessment={(assessmentId, courseId) => {
              console.log('Start assessment:', assessmentId, courseId);
            }}
            onBack={handleBackToCatalog}
          />
        );
      }
    }

    // Course Catalog (default academic mode)
    return (
      <CourseCatalog
        onSelectCourse={handleSelectCourse}
        onEnrollInCourse={handleEnrollInCourse}
        currentUser={currentUser}
      />
    );
  };

  const renderTraditionalFlow = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />;
      case 'dashboard':
        return <LessonDashboard />;
      case 'lesson':
        return <LessonPlayer />;
      case 'practice':
        return <PracticeHub />;
      default:
        return <HomePage />;
    }
  };
  
  return (
    <Layout>
      {/* Mode Toggle Button - Hide on landing */}
      {!showLanding && (
        <div className="fixed top-4 right-4 z-50">
          <button
            onClick={toggleMode}
            className={`px-4 py-2 rounded-lg font-medium transition-all shadow-lg ${
              academicMode 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
            title={`Switch to ${academicMode ? 'Skill Tree' : 'Academic'} Mode`}
          >
            {academicMode ? '🎓 Academic Mode' : '🌳 Skill Tree Mode'}
          </button>
        </div>
      )}

      {/* Render appropriate flow based on mode */}
      {academicMode ? renderAcademicFlow() : renderTraditionalFlow()}
    </Layout>
  );
};

// Root app component with context provider
const App = () => {
  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  );
};

export default App;