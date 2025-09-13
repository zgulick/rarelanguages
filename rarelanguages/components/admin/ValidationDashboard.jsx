/**
 * Comprehensive Validation Dashboard - Phase 4
 * Complete course validation interface with general and Albanian-specific checks
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import CourseValidationPanel from './CourseValidationPanel';

const ValidationDashboard = ({ courseId, courseName, language }) => {
  const [generalValidation, setGeneralValidation] = useState(null);
  const [albanianValidation, setAlbanianValidation] = useState(null);
  const [isAlbanianValidating, setIsAlbanianValidating] = useState(false);
  const [albanianError, setAlbanianError] = useState(null);

  const isAlbanianCourse = language?.toLowerCase().includes('albanian') || 
                           language?.toLowerCase().includes('gheg') ||
                           courseName?.toLowerCase().includes('albanian');

  const startAlbanianValidation = async () => {
    setIsAlbanianValidating(true);
    setAlbanianError(null);
    setAlbanianValidation(null);

    try {
      const response = await fetch('/api/validation/albanian', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courseId }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Albanian validation failed');
      }

      setAlbanianValidation(data.validation);

    } catch (err) {
      setAlbanianError(err.message);
      console.error('Albanian validation error:', err);
    } finally {
      setIsAlbanianValidating(false);
    }
  };

  const getOverallValidationStatus = () => {
    if (!generalValidation) return null;
    
    let overallScore = generalValidation.overall_score;
    let status = generalValidation.quality_gate_decision;
    let factors = ['General validation'];
    
    // Factor in Albanian-specific validation if available
    if (albanianValidation && albanianValidation.validations) {
      const albanianScores = [];
      if (albanianValidation.validations.dialect?.dialect_score) {
        albanianScores.push(albanianValidation.validations.dialect.dialect_score);
      }
      if (albanianValidation.validations.cultural?.cultural_score) {
        albanianScores.push(albanianValidation.validations.cultural.cultural_score);
      }
      
      if (albanianScores.length > 0) {
        const avgAlbanianScore = albanianScores.reduce((a, b) => a + b, 0) / albanianScores.length;
        overallScore = Math.round((overallScore + avgAlbanianScore) / 2);
        factors.push('Albanian-specific validation');
        
        // Adjust status based on combined score
        if (overallScore >= 90) {
          status = 'auto_approve';
        } else if (overallScore >= 70) {
          status = 'manual_review';
        } else {
          status = 'block_activation';
        }
      }
    }
    
    return {
      score: overallScore,
      status,
      factors: factors.join(' + ')
    };
  };

  const renderOverallStatus = () => {
    const overall = getOverallValidationStatus();
    if (!overall) return null;

    const getStatusColor = (status) => {
      switch (status) {
        case 'auto_approve': return 'bg-green-100 text-green-800 border-green-200';
        case 'manual_review': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'block_activation': return 'bg-red-100 text-red-800 border-red-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    };

    const getScoreColor = (score) => {
      if (score >= 90) return 'text-green-600';
      if (score >= 70) return 'text-yellow-600';
      return 'text-red-600';
    };

    return (
      <div className="bg-white border-2 border-gray-300 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Overall Validation Status</h2>
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <span className={`text-3xl font-bold ${getScoreColor(overall.score)}`}>
              {overall.score}%
            </span>
            <div>
              <div className={`px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(overall.status)}`}>
                {overall.status?.replace('_', ' ').toUpperCase()}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Based on: {overall.factors}
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-gray-600">Course Quality Rating</div>
            <div className="text-lg font-semibold text-gray-900">
              {overall.score >= 90 ? 'Excellent' :
               overall.score >= 80 ? 'Good' :
               overall.score >= 70 ? 'Acceptable' : 'Needs Work'}
            </div>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          {overall.status === 'auto_approve' && 
            '✅ This course meets all quality standards and is ready for student enrollment.'}
          {overall.status === 'manual_review' && 
            '⚠️ This course has good quality but may benefit from manual review before activation.'}
          {overall.status === 'block_activation' && 
            '❌ This course needs improvement before it can be activated for students.'}
        </div>
      </div>
    );
  };

  const renderAlbanianValidation = () => {
    if (!isAlbanianCourse) return null;

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Albanian-Specific Validation</h2>
            <p className="text-sm text-gray-600 mt-1">
              Gheg dialect accuracy and Kosovo cultural context validation
            </p>
          </div>
          
          <button
            onClick={startAlbanianValidation}
            disabled={isAlbanianValidating}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isAlbanianValidating
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            {isAlbanianValidating ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full"></div>
                <span>Validating...</span>
              </div>
            ) : (
              'Start Albanian Validation'
            )}
          </button>
        </div>

        {/* Albanian Validation Process Info */}
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-sm font-medium text-red-900 mb-2">Albanian Validation Checks</h3>
          <div className="text-sm text-red-800 space-y-1">
            <div>🇦🇱 Gheg dialect authenticity vs Standard Albanian</div>
            <div>🏔️ Kosovo cultural context appropriateness</div>
            <div>👨‍👩‍👧‍👦 Family integration scenario validation (if applicable)</div>
          </div>
        </div>

        {/* Error Display */}
        {albanianError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="text-sm font-medium text-red-900 mb-1">Albanian Validation Error</h3>
            <p className="text-sm text-red-800">{albanianError}</p>
          </div>
        )}

        {/* Albanian Results */}
        {albanianValidation && (
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {albanianValidation.validations.dialect && (
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Gheg Dialect</h4>
                  <div className={`text-xl font-semibold ${albanianValidation.validations.dialect.dialect_score >= 85 ? 'text-green-600' : albanianValidation.validations.dialect.dialect_score >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {albanianValidation.validations.dialect.dialect_score}%
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {albanianValidation.validations.dialect.passed ? '✅ Authentic' : '❌ Needs Work'}
                  </div>
                </div>
              )}

              {albanianValidation.validations.cultural && (
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Kosovo Cultural</h4>
                  <div className={`text-xl font-semibold ${albanianValidation.validations.cultural.cultural_score >= 80 ? 'text-green-600' : albanianValidation.validations.cultural.cultural_score >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {albanianValidation.validations.cultural.cultural_score}%
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {albanianValidation.validations.cultural.passed ? '✅ Appropriate' : '❌ Needs Work'}
                  </div>
                </div>
              )}

              {albanianValidation.validations.family && albanianValidation.validations.family.family_score < 100 && (
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Family Context</h4>
                  <div className={`text-xl font-semibold ${albanianValidation.validations.family.family_score >= 85 ? 'text-green-600' : albanianValidation.validations.family.family_score >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {albanianValidation.validations.family.family_score}%
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {albanianValidation.validations.family.passed ? '✅ Appropriate' : '❌ Needs Work'}
                  </div>
                </div>
              )}
            </div>

            {/* Albanian Recommendations */}
            {albanianValidation.recommendations && albanianValidation.recommendations.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-3">Albanian-Specific Recommendations</h4>
                <div className="space-y-3">
                  {albanianValidation.recommendations.map((rec, index) => (
                    <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium mb-2 ${
                            rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                            rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {rec.priority?.toUpperCase()} PRIORITY
                          </span>
                          <p className="text-sm text-gray-900 font-medium">{rec.description}</p>
                          {rec.details && (
                            <p className="text-sm text-gray-600 mt-1">{rec.details}</p>
                          )}
                          {rec.suggestions && rec.suggestions.length > 0 && (
                            <ul className="mt-2 text-sm text-gray-600 space-y-1">
                              {rec.suggestions.map((suggestion, i) => (
                                <li key={i}>• {suggestion}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Overall Status (appears after validations) */}
      {generalValidation && renderOverallStatus()}
      
      {/* General Course Validation */}
      <CourseValidationPanel
        courseId={courseId}
        courseName={courseName}
        onValidationComplete={setGeneralValidation}
      />
      
      {/* Albanian-Specific Validation */}
      {renderAlbanianValidation()}
      
      {/* Validation Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Validation Tips</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <div>• Run general validation first to check academic quality</div>
          {isAlbanianCourse && <div>• Albanian courses should run both validations for complete assessment</div>}
          <div>• Scores ≥90% auto-approve, 70-89% need review, &lt;70% need improvement</div>
          <div>• Address high-priority recommendations first for biggest impact</div>
        </div>
      </div>
    </div>
  );
};

ValidationDashboard.propTypes = {
  courseId: PropTypes.string.isRequired,
  courseName: PropTypes.string.isRequired,
  language: PropTypes.string
};

export default ValidationDashboard;