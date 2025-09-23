'use client';

import { useState, useEffect } from 'react';

export default function ContentReviewPage() {
  const [issues, setIssues] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState({
    category: 'all',
    confidence: 'all'
  });

  // Load remaining issues from the analysis report
  useEffect(() => {
    loadIssues();
  }, []);

  const loadIssues = async () => {
    try {
      const response = await fetch('/api/content-review/issues');
      const data = await response.json();
      setIssues(data.issues || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading issues:', error);
      setLoading(false);
    }
  };

  const saveChanges = async (contentId, updates) => {
    setSaving(true);
    try {
      const response = await fetch('/api/content-review/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentId,
          updates
        })
      });

      if (response.ok) {
        // Remove this issue from the list
        setIssues(prev => prev.filter(issue => issue.content_id !== contentId));
        // Move to next item
        if (currentIndex >= issues.length - 1) {
          setCurrentIndex(Math.max(0, currentIndex - 1));
        }
      }
    } catch (error) {
      console.error('Error saving changes:', error);
    }
    setSaving(false);
  };

  const deleteContent = async (contentId) => {
    if (!confirm('Are you sure you want to delete this content?')) return;

    setSaving(true);
    try {
      const response = await fetch('/api/content-review/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contentId })
      });

      if (response.ok) {
        setIssues(prev => prev.filter(issue => issue.content_id !== contentId));
        if (currentIndex >= issues.length - 1) {
          setCurrentIndex(Math.max(0, currentIndex - 1));
        }
      }
    } catch (error) {
      console.error('Error deleting content:', error);
    }
    setSaving(false);
  };

  const filteredIssues = issues.filter(issue => {
    if (filters.category !== 'all' && issue.category !== filters.category) return false;
    if (filters.confidence !== 'all') {
      const confidence = issue.confidence || 0;
      if (filters.confidence === 'low' && confidence >= 0.7) return false;
      if (filters.confidence === 'medium' && (confidence < 0.4 || confidence >= 0.7)) return false;
      if (filters.confidence === 'high' && confidence < 0.7) return false;
    }
    return true;
  });

  const currentIssue = filteredIssues[currentIndex];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading content issues...</p>
        </div>
      </div>
    );
  }

  if (filteredIssues.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">All Done! 🎉</h1>
          <p className="text-gray-600">No more content issues to review.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow-lg">
          {/* Header */}
          <div className="border-b border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold text-gray-900">Content Review</h1>
              <div className="text-sm text-gray-500">
                {currentIndex + 1} of {filteredIssues.length} issues
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / filteredIssues.length) * 100}%` }}
              ></div>
            </div>

            {/* Filters */}
            <div className="flex gap-4 mt-4">
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Categories</option>
                <option value="difficulty_mismatch">Difficulty Mismatch</option>
                <option value="labeling_error">Labeling Error</option>
                <option value="content_quality">Content Quality</option>
              </select>

              <select
                value={filters.confidence}
                onChange={(e) => setFilters(prev => ({ ...prev, confidence: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Confidence</option>
                <option value="high">High Confidence</option>
                <option value="medium">Medium Confidence</option>
                <option value="low">Low Confidence</option>
              </select>
            </div>
          </div>

          {/* Content Review */}
          {currentIssue && (
            <ContentReviewItem
              issue={currentIssue}
              onSave={saveChanges}
              onDelete={deleteContent}
              onNext={() => setCurrentIndex(prev => Math.min(filteredIssues.length - 1, prev + 1))}
              onPrevious={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
              saving={saving}
              hasNext={currentIndex < filteredIssues.length - 1}
              hasPrevious={currentIndex > 0}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ContentReviewItem({ issue, onSave, onDelete, onNext, onPrevious, saving, hasNext, hasPrevious }) {
  const [formData, setFormData] = useState({
    word_type: issue.current_word_type || '',
    grammar_category: issue.current_grammar_category || '',
    english_phrase: issue.english_phrase || '',
    target_phrase: issue.albanian_phrase || ''
  });

  const handleSave = () => {
    onSave(issue.content_id, formData);
  };

  const handleSkip = () => {
    onNext();
  };

  return (
    <div className="p-6">
      {/* Issue Summary */}
      <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="font-semibold text-red-800 mb-2">Issues Found:</h3>
        <ul className="list-disc list-inside text-red-700 text-sm space-y-1">
          {issue.issues?.map((iss, idx) => (
            <li key={idx}>{iss.message}</li>
          ))}
        </ul>
      </div>

      {/* Current Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h4 className="font-semibold text-gray-900 mb-2">Current Content</h4>
          <div className="space-y-2 text-sm">
            <div><strong>English:</strong> {issue.english_phrase}</div>
            <div><strong>Albanian:</strong> {issue.albanian_phrase}</div>
            <div><strong>Lesson:</strong> {issue.lesson_name} (Level {issue.lesson_level})</div>
            <div><strong>Skill:</strong> {issue.skill_name}</div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-gray-900 mb-2">Current Labels</h4>
          <div className="space-y-2 text-sm">
            <div><strong>Word Type:</strong> {issue.current_word_type}</div>
            <div><strong>Grammar Category:</strong> {issue.current_grammar_category}</div>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <div className="border-t pt-6">
        <h4 className="font-semibold text-gray-900 mb-4">Correct the Content</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              English Phrase
            </label>
            <input
              type="text"
              value={formData.english_phrase}
              onChange={(e) => setFormData(prev => ({ ...prev, english_phrase: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Albanian Phrase
            </label>
            <input
              type="text"
              value={formData.target_phrase}
              onChange={(e) => setFormData(prev => ({ ...prev, target_phrase: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Word Type
            </label>
            <select
              value={formData.word_type}
              onChange={(e) => setFormData(prev => ({ ...prev, word_type: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select type...</option>
              <option value="word">Word</option>
              <option value="phrase">Phrase</option>
              <option value="sentence">Sentence</option>
              <option value="question">Question</option>
              <option value="greeting">Greeting</option>
              <option value="courtesy_phrase">Courtesy Phrase</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Grammar Category
            </label>
            <select
              value={formData.grammar_category}
              onChange={(e) => setFormData(prev => ({ ...prev, grammar_category: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select category...</option>
              <option value="greetings">Greetings</option>
              <option value="courtesy">Courtesy</option>
              <option value="questions">Questions</option>
              <option value="daily_activities">Daily Activities</option>
              <option value="general_vocabulary">General Vocabulary</option>
              <option value="sentences">Sentences</option>
              <option value="travel">Travel</option>
              <option value="food">Food</option>
              <option value="family">Family</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <button
              onClick={onPrevious}
              disabled={!hasPrevious}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>
            <button
              onClick={handleSkip}
              disabled={saving}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Skip
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onDelete(issue.content_id)}
              disabled={saving}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              Delete
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save & Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}