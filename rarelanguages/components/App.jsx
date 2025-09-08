/**
 * App Component - Main Application Entry Point
 * Phase 3.1 Navigation System with AppContext
 */

import React from 'react';
import { AppProvider, useApp } from '../contexts/AppContext';
import Layout from './layout/Layout';
import HomePage from './pages/HomePage';
import LessonDashboard from './pages/LessonDashboard';
import LessonPlayer from './pages/LessonPlayer';
import PracticeHub from './pages/PracticeHub';

// Main app component that handles routing based on AppContext state
const AppRouter = () => {
  const { currentPage } = useApp();
  
  const renderCurrentPage = () => {
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
      {renderCurrentPage()}
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