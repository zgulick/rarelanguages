'use client';

import { useState, useEffect } from 'react';

export default function LessonGenerationPage() {
  const [skills, setSkills] = useState([]);
  const [selectedSkill, setSelectedSkill] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState(null);
  const [processedLessons, setProcessedLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSkills();
  }, []);

  const loadSkills = async () => {
    try {
      const response = await fetch('/api/skills');
      const data = await response.json();
      // API returns array directly, not wrapped in { skills: [] }
      setSkills(Array.isArray(data) ? data : data.skills || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading skills:', error);
      setLoading(false);
    }
  };

  const checkSkillStatus = async (skillId) => {
    try {
      const response = await fetch(`/api/lesson-generation/generate?skillId=${skillId}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error checking skill status:', error);
      return null;
    }
  };

  const generateLessons = async () => {
    if (!selectedSkill) return;

    setGenerating(true);
    setGenerationResult(null);

    try {
      const response = await fetch('/api/lesson-generation/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          skillId: selectedSkill
        })
      });

      const result = await response.json();

      if (response.ok) {
        setGenerationResult(result);
        // Reload processed lessons for this skill
        loadProcessedLessons(selectedSkill);
      } else {
        setGenerationResult({
          success: false,
          error: result.error,
          details: result.details
        });
      }
    } catch (error) {
      console.error('Error generating lessons:', error);
      setGenerationResult({
        success: false,
        error: 'Network error',
        details: error.message
      });
    }

    setGenerating(false);
  };

  const loadProcessedLessons = async (skillId) => {
    if (!skillId) return;

    try {
      const response = await fetch(`/api/lesson-generation/lessons?skillId=${skillId}`);
      const data = await response.json();

      if (response.ok) {
        setProcessedLessons(data.lessons || []);
      }
    } catch (error) {
      console.error('Error loading processed lessons:', error);
    }
  };

  useEffect(() => {
    if (selectedSkill) {
      loadProcessedLessons(selectedSkill);
    }
  }, [selectedSkill]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading skills...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow-lg">
          {/* Header */}
          <div className="border-b border-gray-200 p-6">
            <h1 className="text-3xl font-bold text-gray-900">LLM Lesson Generator</h1>
            <p className="mt-2 text-gray-600">
              Generate structured, pedagogical lessons from cleaned content using AI
            </p>
          </div>

          {/* Controls */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Skill
                </label>
                <select
                  value={selectedSkill}
                  onChange={(e) => setSelectedSkill(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={generating}
                >
                  <option value="">Choose a skill...</option>
                  {skills.map(skill => (
                    <option key={skill.id} value={skill.id}>
                      {skill.name} ({skill.cefr_level || 'A1'})
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={generateLessons}
                disabled={!selectedSkill || generating}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? 'Generating...' : 'Generate Lessons'}
              </button>
            </div>
          </div>

          {/* Generation Result */}
          {generationResult && (
            <div className="p-6 border-b border-gray-200">
              {generationResult.success ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-800 mb-2">✅ Generation Successful!</h3>
                  <div className="text-green-700 text-sm space-y-1">
                    <div>Lessons Generated: {generationResult.lessonsGenerated}</div>
                    <div>Processing Time: {(generationResult.processingTime / 1000).toFixed(1)}s</div>
                    <div>Total Cost: ${generationResult.costSummary?.totalCost?.toFixed(4) || '0.0000'}</div>
                    <div>API Calls: {generationResult.costSummary?.totalCalls || 0}</div>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-semibold text-red-800 mb-2">❌ Generation Failed</h3>
                  <div className="text-red-700 text-sm">
                    <div><strong>Error:</strong> {generationResult.error}</div>
                    {generationResult.details && (
                      <div className="mt-1"><strong>Details:</strong> {generationResult.details}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Processing Status */}
          {generating && (
            <div className="p-6 border-b border-gray-200">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                  <div>
                    <h3 className="font-semibold text-blue-800">Processing...</h3>
                    <p className="text-blue-700 text-sm">
                      Analyzing content, grouping themes, and generating lessons with AI
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Processed Lessons */}
          {processedLessons.length > 0 && (
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Generated Lessons ({processedLessons.length})
              </h3>

              <div className="space-y-4">
                {processedLessons.map(lesson => (
                  <div key={lesson.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">{lesson.title}</h4>
                        <div className="text-sm text-gray-600 mt-1">
                          Difficulty: {lesson.overview.difficulty_level}/5 •
                          Duration: {lesson.overview.estimated_minutes} min •
                          Sources: {lesson.sourceContentCount} items
                        </div>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        <div>Generated: {new Date(lesson.generatedAt).toLocaleDateString()}</div>
                        <div>Cost: ${parseFloat(lesson.generationCost || 0).toFixed(4)}</div>
                      </div>
                    </div>

                    <div className="text-sm text-gray-700 mb-3">
                      <strong>Objectives:</strong> {lesson.overview.learning_objectives?.join(', ')}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-medium text-gray-800 mb-2">Sections ({lesson.sections?.length || 0})</h5>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {lesson.sections?.slice(0, 3).map((section, idx) => (
                            <li key={idx}>• {section.title || section.type}</li>
                          ))}
                          {lesson.sections?.length > 3 && (
                            <li className="text-gray-500">... and {lesson.sections.length - 3} more</li>
                          )}
                        </ul>
                      </div>

                      <div>
                        <h5 className="font-medium text-gray-800 mb-2">Assessment</h5>
                        <div className="text-sm text-gray-600">
                          <div>Formative: {lesson.assessment?.formative?.length || 0} exercises</div>
                          <div>Summative: {lesson.assessment?.summative?.length || 0} exercises</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {selectedSkill && processedLessons.length === 0 && !generating && (
            <div className="p-6 text-center text-gray-500">
              <p>No processed lessons found for this skill.</p>
              <p className="mt-1">Click "Generate Lessons" to create AI-powered lessons from the cleaned content.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}