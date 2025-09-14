import React, { useState } from 'react';
import { AppProvider, useApp } from '../contexts/AppContext';
import Layout from './layout/Layout';
import CourseCatalog from './pages/CourseCatalog';
import CourseDashboard from './pages/CourseDashboard';
import AcademicLesson from './exercises/AcademicLesson';

// Main app component focused on learning
const AppRouter = () => {
  const { currentUser } = useApp();
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const [lessonMode, setLessonMode] = useState(false);

  const handleSelectCourse = (courseId) => {
    setSelectedCourseId(courseId);
  };

  const handleStartLesson = (lessonId, courseId) => {
    setSelectedLessonId(lessonId);
    setSelectedCourseId(courseId);
    setLessonMode(true);
  };

  const handleLessonComplete = (completionData) => {
    console.log('Lesson completed:', completionData);
    setLessonMode(false);
    // Could add progress update logic here
  };

  const handleBackToCatalog = () => {
    setSelectedCourseId(null);
    setSelectedLessonId(null);
    setLessonMode(false);
  };

  const handleBackToCourse = () => {
    setLessonMode(false);
    setSelectedLessonId(null);
  };

  return (
    <Layout>
      {lessonMode && selectedLessonId ? (
        <AcademicLesson
          lessonId={selectedLessonId}
          courseId={selectedCourseId}
          onComplete={handleLessonComplete}
          onExit={handleBackToCourse}
        />
      ) : selectedCourseId ? (
        <CourseDashboard
          courseId={selectedCourseId}
          currentUser={currentUser}
          onStartLesson={handleStartLesson}
          onBack={handleBackToCatalog}
        />
      ) : (
        <CourseCatalog
          onSelectCourse={handleSelectCourse}
          currentUser={currentUser}
        />
      )}
    </Layout>
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