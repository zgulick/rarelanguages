import React from 'react';
import Link from 'next/link';

const LessonSummaryCard = ({ lesson, index }) => {
  const getDifficultyColor = (level) => {
    switch (level) {
      case 1: return 'bg-green-100 text-green-800';
      case 2: return 'bg-blue-100 text-blue-800';
      case 3: return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white/50 backdrop-blur-sm border border-gray-100 rounded-xl p-4 hover:bg-white hover:shadow-md transition-all duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-sm">
            {index + 1}
          </div>
          <div>
            <h4 className="font-bold text-gray-900">{lesson.name || lesson.title}</h4>
            <div className="flex items-center space-x-3 text-xs mt-1">
              <span className={`px-2 py-0.5 rounded-full font-medium ${getDifficultyColor(lesson.difficulty_level || 1)}`}>
                Level {lesson.difficulty_level || 1}
              </span>
              <span className="text-gray-500 flex items-center">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {lesson.estimated_minutes || 15} min
              </span>
            </div>
          </div>
        </div>

        <Link
          href={`/learn/${lesson.id}`}
          className="btn-primary px-4 py-2 text-sm flex items-center"
        >
          Start
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
      
      {lesson.description && (
        <p className="text-gray-600 text-sm mt-3 ml-14 line-clamp-2">
          {lesson.description}
        </p>
      )}
    </div>
  );
};

export default LessonSummaryCard;
