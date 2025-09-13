/**
 * Course Validation Panel - Phase 4
 * Interface for validating course content quality
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';

const CourseValidationPanel = ({ courseId, courseName, onValidationComplete }) => {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResults, setValidationResults] = useState(null);
  const [error, setError] = useState(null);

  const startValidation = async () => {
    setIsValidating(true);
    setError(null);
    setValidationResults(null);

    try {
      const response = await fetch('/api/validation/course', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courseId }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Validation failed');
      }

      setValidationResults(data.validation);
      
      if (onValidationComplete) {
        onValidationComplete(data.validation);
      }

    } catch (err) {
      setError(err.message);
      console.error('Validation error:', err);
    } finally {
      setIsValidating(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getQualityGateColor = (decision) => {
    switch (decision) {
      case 'auto_approve': return 'bg-green-100 text-green-800 border-green-200';
      case 'manual_review': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'block_activation': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const renderValidationResults = () => {
    if (!validationResults) return null;

    return (
      <div className="mt-6 space-y-4">
        {/* Overall Results */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Validation Results</h3>
            <div className="flex items-center space-x-4">
              <span className={`text-2xl font-bold ${getScoreColor(validationResults.overall_score)}`}>
                {validationResults.overall_score}%
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getQualityGateColor(validationResults.quality_gate_decision)}`}>
                {validationResults.quality_gate_decision?.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </div>

          {/* Quality Gate Decision */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Quality Gate Decision</h4>
            <p className="text-gray-600 text-sm">
              {validationResults.quality_gate_decision === 'auto_approve' && 
                '✅ Course meets quality standards and can be activated for student enrollment.'}
              {validationResults.quality_gate_decision === 'manual_review' && 
                '⚠️ Course has good quality but may benefit from manual review before activation.'}
              {validationResults.quality_gate_decision === 'block_activation' && 
                '❌ Course needs improvement before it can be activated for students.'}
            </p>
          </div>

          {/* Detailed Scores */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {validationResults.validations.grammar && (
              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Grammar Accuracy</h4>
                <div className={`text-xl font-semibold ${getScoreColor(validationResults.validations.grammar.accuracy_score)}`}>
                  {validationResults.validations.grammar.accuracy_score}%
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {validationResults.validations.grammar.passed ? '✅ Passed' : '❌ Needs Work'}
                </div>
              </div>
            )}

            {validationResults.validations.progression && (
              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Academic Progression</h4>
                <div className={`text-xl font-semibold ${getScoreColor(validationResults.validations.progression.logic_score)}`}>
                  {validationResults.validations.progression.logic_score}%
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {validationResults.validations.progression.passed ? '✅ Passed' : '❌ Needs Work'}
                </div>
              </div>
            )}

            {validationResults.validations.cultural && (
              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Cultural Context</h4>
                <div className={`text-xl font-semibold ${getScoreColor(validationResults.validations.cultural.appropriateness_score)}`}>
                  {validationResults.validations.cultural.appropriateness_score}%
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {validationResults.validations.cultural.passed ? '✅ Passed' : '❌ Needs Work'}
                </div>
              </div>
            )}
          </div>

          {/* Recommendations */}
          {validationResults.recommendations && validationResults.recommendations.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium text-gray-900 mb-3">Improvement Recommendations</h4>
              <div className="space-y-3">
                {validationResults.recommendations.map((rec, index) => (
                  <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
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

          {/* Validation Metadata */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              Validated on {new Date(validationResults.timestamp).toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Course Content Validation</h2>
          <p className="text-sm text-gray-600 mt-1">
            Validate {courseName} for academic quality and accuracy
          </p>
        </div>
        
        <button
          onClick={startValidation}
          disabled={isValidating}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            isValidating
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isValidating ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              <span>Validating...</span>
            </div>
          ) : (
            'Start Validation'
          )}
        </button>
      </div>

      {/* Validation Process Info */}
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Validation Process</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <div>✓ Grammar accuracy and pedagogical soundness</div>
          <div>✓ Academic progression and concept building</div>
          <div>✓ Cultural context appropriateness and sensitivity</div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-sm font-medium text-red-900 mb-1">Validation Error</h3>
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Results */}
      {renderValidationResults()}
    </div>
  );
};

CourseValidationPanel.propTypes = {
  courseId: PropTypes.string.isRequired,
  courseName: PropTypes.string.isRequired,
  onValidationComplete: PropTypes.func
};

export default CourseValidationPanel;