/**
 * Simplified App Context for Professional UI/UX 
 * Works with new navigation flow: Landing → Catalog → Dashboard → Lessons
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Simplified user state
  const [currentUser, setCurrentUser] = useState({
    id: 'guest-user-' + Math.random().toString(36).substr(2, 9),
    name: 'Guest User',
    isGuest: true
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Simple preferences
  const [preferences, setPreferences] = useState({
    audioEnabled: true,
    theme: 'light'
  });

  // Initialize user on app load
  useEffect(() => {
    // Simple initialization - no API calls needed for now
    console.log('App initialized with user:', currentUser.id);
  }, []);

  const updatePreferences = (newPreferences) => {
    setPreferences(prev => ({ ...prev, ...newPreferences }));
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    // User state
    currentUser,
    setCurrentUser,
    
    // App state
    loading,
    setLoading,
    error,
    setError,
    clearError,
    
    // Preferences
    preferences,
    updatePreferences
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

AppProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};