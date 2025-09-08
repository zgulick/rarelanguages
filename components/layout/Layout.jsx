/**
 * Layout Component - Main App Shell
 * Simple, clean layout with header and navigation
 */

import React from 'react';
import PropTypes from 'prop-types';
import { useApp } from '../../contexts/AppContext';
import Header from './Header';

const Layout = ({ children }) => {
  const { currentPage } = useApp();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="pb-6">
        <div className={`
          mx-auto px-4 
          ${currentPage === 'lesson' 
            ? 'max-w-full' // Full width for lesson player
            : 'max-w-md md:max-w-2xl' // Constrained width for other pages
          }
        `}>
          {children}
        </div>
      </main>
    </div>
  );
};

Layout.propTypes = {
  children: PropTypes.node.isRequired
};

export default Layout;