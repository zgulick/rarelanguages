const express = require('express');
const { query } = require('./lib/database');
const path = require('path');

const app = express();
const port = 3002; // New port for React version

app.use(express.json());
app.use(express.static('public'));

// Development: No cache for instant updates
app.use((req, res, next) => {
  res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
  next();
});

// Main React application
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🇦🇱 Learn Albanian - Kosovo Family Integration</title>
    
    <!-- React CDN -->
    <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #333;
        }
        
        .app-container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
            min-height: 100vh;
        }
        
        /* Landing Dashboard Styles */
        .dashboard {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            color: white;
            padding: 40px 20px;
        }
        
        .app-header {
            margin-bottom: 50px;
        }
        
        .app-title {
            font-size: 4em;
            margin-bottom: 15px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            font-weight: 700;
        }
        
        .app-subtitle {
            font-size: 1.4em;
            opacity: 0.9;
            font-weight: 300;
            margin-bottom: 10px;
        }
        
        .app-tagline {
            font-size: 1.1em;
            opacity: 0.8;
            font-style: italic;
        }
        
        .continue-section {
            margin-bottom: 60px;
        }
        
        .continue-button {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            border: none;
            border-radius: 20px;
            padding: 25px 50px;
            font-size: 1.3em;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
            min-width: 300px;
        }
        
        .continue-button:hover {
            transform: translateY(-3px);
            box-shadow: 0 12px 35px rgba(16, 185, 129, 0.4);
        }
        
        .continue-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
        }
        
        .learning-paths {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 30px;
            margin-bottom: 40px;
            width: 100%;
            max-width: 800px;
        }
        
        .path-card {
            background: white;
            border-radius: 20px;
            padding: 40px 30px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            border: 3px solid transparent;
        }
        
        .path-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 20px 40px rgba(0,0,0,0.15);
            border-color: #667eea;
        }
        
        .path-icon {
            font-size: 3.5em;
            margin-bottom: 20px;
            display: block;
        }
        
        .path-title {
            font-size: 1.6em;
            font-weight: 700;
            color: #333;
            margin-bottom: 15px;
        }
        
        .path-description {
            color: #666;
            font-size: 1.1em;
            line-height: 1.6;
        }
        
        .quick-stats {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            padding: 25px;
            backdrop-filter: blur(10px);
            margin-top: 40px;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 20px;
        }
        
        .stat-item {
            text-align: center;
        }
        
        .stat-number {
            font-size: 2.5em;
            font-weight: bold;
            color: #10b981;
            display: block;
        }
        
        .stat-label {
            font-size: 1em;
            opacity: 0.9;
        }
        
        /* Topic Selection Styles */
        .topic-selection {
            background: white;
            border-radius: 25px;
            padding: 40px;
            margin: 20px 0;
            box-shadow: 0 15px 35px rgba(0,0,0,0.1);
        }
        
        .topic-header {
            text-align: center;
            margin-bottom: 40px;
        }
        
        .topic-title {
            font-size: 2.5em;
            color: #333;
            margin-bottom: 15px;
            font-weight: 700;
        }
        
        .topic-subtitle {
            font-size: 1.3em;
            color: #666;
            font-weight: 300;
        }
        
        .topics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 25px;
        }
        
        .topic-card {
            background: linear-gradient(135deg, #f8faff 0%, #ffffff 100%);
            border: 2px solid #e2e8f0;
            border-radius: 20px;
            padding: 30px;
            cursor: pointer;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        
        .topic-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #667eea, #764ba2);
            transform: scaleX(0);
            transition: transform 0.3s ease;
        }
        
        .topic-card:hover::before {
            transform: scaleX(1);
        }
        
        .topic-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 30px rgba(102, 126, 234, 0.2);
            border-color: #667eea;
        }
        
        .topic-card-header {
            display: flex;
            align-items: center;
            margin-bottom: 20px;
        }
        
        .topic-emoji {
            font-size: 2.5em;
            margin-right: 15px;
        }
        
        .topic-card-title {
            font-size: 1.5em;
            font-weight: 700;
            color: #333;
        }
        
        .topic-description {
            color: #666;
            font-size: 1.1em;
            line-height: 1.6;
            margin-bottom: 20px;
        }
        
        .topic-stats {
            display: flex;
            justify-content: space-between;
            font-size: 0.9em;
            color: #888;
            margin-bottom: 20px;
        }
        
        .topic-grammar {
            background: #f0f4ff;
            border-left: 4px solid #667eea;
            padding: 12px 16px;
            border-radius: 8px;
            font-style: italic;
            color: #4c51bf;
            margin-bottom: 20px;
        }
        
        .start-topic-btn {
            width: 100%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 12px;
            padding: 15px;
            font-size: 1.1em;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .start-topic-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
        }
        
        /* Topic Lesson Styles */
        .topic-lesson {
            background: white;
            border-radius: 25px;
            padding: 40px;
            margin: 20px 0;
            box-shadow: 0 15px 35px rgba(0,0,0,0.1);
            min-height: 70vh;
        }
        
        .lesson-header {
            display: flex;
            justify-content: between;
            align-items: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #f0f4ff;
        }
        
        .lesson-title-section h2 {
            font-size: 2em;
            color: #333;
            margin-bottom: 5px;
        }
        
        .lesson-subtitle {
            color: #666;
            font-size: 1.1em;
        }
        
        .lesson-progress {
            background: #f8faff;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 30px;
        }
        
        .progress-bar {
            background: #e2e8f0;
            border-radius: 8px;
            height: 12px;
            overflow: hidden;
            margin-bottom: 15px;
        }
        
        .progress-fill {
            background: linear-gradient(90deg, #667eea, #764ba2);
            height: 100%;
            transition: width 0.5s ease;
        }
        
        .progress-steps {
            display: flex;
            justify-content: space-between;
            font-size: 0.9em;
            color: #666;
        }
        
        .progress-step {
            padding: 5px 10px;
            border-radius: 6px;
            transition: all 0.3s ease;
        }
        
        .progress-step.active {
            background: #667eea;
            color: white;
            font-weight: 600;
        }
        
        .progress-step.completed {
            background: #10b981;
            color: white;
        }
        
        /* Theory Section Styles */
        .theory-section {
            padding: 30px 0;
        }
        
        .cultural-context {
            background: linear-gradient(135deg, #fef9e7 0%, #fef3c7 100%);
            border-left: 5px solid #f59e0b;
            border-radius: 12px;
            padding: 25px;
            margin-bottom: 30px;
        }
        
        .cultural-context h3 {
            color: #92400e;
            font-size: 1.4em;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
        }
        
        .cultural-context h3::before {
            content: '🏛️';
            margin-right: 10px;
        }
        
        .grammar-focus {
            background: linear-gradient(135deg, #f0f4ff 0%, #e7f1ff 100%);
            border-left: 5px solid #667eea;
            border-radius: 12px;
            padding: 25px;
            margin-bottom: 30px;
        }
        
        .grammar-focus h3 {
            color: #4c51bf;
            font-size: 1.4em;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
        }
        
        .grammar-focus h3::before {
            content: '📚';
            margin-right: 10px;
        }
        
        .grammar-examples {
            background: white;
            border-radius: 8px;
            padding: 20px;
            margin-top: 15px;
        }
        
        .example-sentence {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #f0f0f0;
        }
        
        .example-sentence:last-child {
            border-bottom: none;
        }
        
        .lesson-preview {
            background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
            border-left: 5px solid #10b981;
            border-radius: 12px;
            padding: 25px;
            margin-bottom: 30px;
        }
        
        .lesson-preview h3 {
            color: #166534;
            font-size: 1.4em;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
        }
        
        .lesson-preview h3::before {
            content: '🎯';
            margin-right: 10px;
        }
        
        .lesson-preview ul {
            list-style: none;
            padding: 0;
        }
        
        .lesson-preview li {
            padding: 8px 0;
            position: relative;
            padding-left: 25px;
        }
        
        .lesson-preview li::before {
            content: '✓';
            position: absolute;
            left: 0;
            color: #10b981;
            font-weight: bold;
        }
        
        /* Exercise Styles */
        .exercise-container {
            background: linear-gradient(135deg, #f8faff 0%, #ffffff 100%);
            border: 2px solid #e2e8f0;
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            min-height: 500px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            position: relative;
        }
        
        .exercise-type {
            position: absolute;
            top: 20px;
            right: 25px;
            background: #667eea;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 0.9em;
            font-weight: 600;
        }
        
        .flashcard-front, .flashcard-back {
            padding: 40px 20px;
        }
        
        .english-prompt {
            font-size: 2.2em;
            color: #333;
            margin-bottom: 30px;
            font-weight: 500;
            line-height: 1.3;
        }
        
        .albanian-answer {
            font-size: 2.8em;
            color: #667eea;
            font-weight: bold;
            margin: 20px 0;
            line-height: 1.2;
        }
        
        .pronunciation {
            font-size: 1.3em;
            color: #888;
            font-style: italic;
            margin: 10px 0;
        }
        
        .cultural-note {
            background: #fef9e7;
            border-left: 4px solid #f59e0b;
            padding: 15px 20px;
            margin: 20px 0;
            border-radius: 8px;
            font-style: italic;
            color: #78350f;
            text-align: left;
        }
        
        .difficulty-stars {
            display: flex;
            justify-content: center;
            gap: 5px;
            margin: 20px 0;
        }
        
        .star {
            font-size: 1.5em;
            color: #fbbf24;
        }
        
        .star.empty {
            color: #e5e7eb;
        }
        
        /* Button Styles */
        .btn {
            padding: 15px 30px;
            border: none;
            border-radius: 12px;
            font-size: 1.1em;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            margin: 10px;
            min-width: 140px;
        }
        
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(0,0,0,0.15);
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        
        .btn-success {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
        }
        
        .btn-warning {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            color: white;
        }
        
        .btn-danger {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            color: white;
        }
        
        .btn-secondary {
            background: linear-gradient(135deg, #64748b 0%, #475569 100%);
            color: white;
        }
        
        .btn-outline {
            background: transparent;
            border: 2px solid #667eea;
            color: #667eea;
        }
        
        .btn-outline:hover {
            background: #667eea;
            color: white;
        }
        
        /* Navigation */
        .nav-bar {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 15px 25px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            color: white;
        }
        
        .nav-back {
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .nav-back:hover {
            background: rgba(255, 255, 255, 0.3);
        }
        
        .nav-title {
            font-size: 1.3em;
            font-weight: 600;
        }
        
        .nav-progress {
            font-size: 0.9em;
            opacity: 0.9;
        }
        
        /* Responsive Design */
        @media (max-width: 768px) {
            .app-title {
                font-size: 2.5em;
            }
            
            .learning-paths {
                grid-template-columns: 1fr;
            }
            
            .topics-grid {
                grid-template-columns: 1fr;
            }
            
            .topic-lesson {
                padding: 20px;
            }
            
            .exercise-container {
                padding: 20px;
            }
            
            .english-prompt {
                font-size: 1.8em;
            }
            
            .albanian-answer {
                font-size: 2.2em;
            }
        }
        
        /* Animations */
        .fade-in {
            animation: fadeIn 0.5s ease-in;
        }
        
        .slide-in {
            animation: slideIn 0.5s ease-out;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideIn {
            from { opacity: 0; transform: translateX(30px); }
            to { opacity: 1; transform: translateX(0); }
        }
        
        .pulse {
            animation: pulse 1s infinite;
        }
        
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
        
        /* Loading States */
        .loading {
            opacity: 0.6;
            pointer-events: none;
        }
        
        .spinner {
            border: 3px solid #f3f3f3;
            border-top: 3px solid #667eea;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 20px auto;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        /* Exercise Specific Styles */
        .conversation-scenario {
            background: #f8faff;
            border-radius: 12px;
            padding: 25px;
            margin: 20px 0;
            text-align: left;
        }
        
        .conversation-character {
            font-weight: 600;
            color: #667eea;
            margin-bottom: 10px;
        }
        
        .conversation-options {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin: 20px 0;
        }
        
        .option-button {
            background: white;
            border: 2px solid #e2e8f0;
            border-radius: 10px;
            padding: 15px 20px;
            text-align: left;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .option-button:hover {
            border-color: #667eea;
            background: #f8faff;
        }
        
        .option-button.selected {
            border-color: #667eea;
            background: #667eea;
            color: white;
        }
        
        .audio-controls {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin: 30px 0;
        }
        
        .audio-btn {
            background: #667eea;
            color: white;
            border: none;
            border-radius: 50px;
            padding: 20px;
            font-size: 1.5em;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .audio-btn:hover {
            background: #5a67d8;
            transform: scale(1.1);
        }
        
        .visual-exercise {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        
        .visual-option {
            background: white;
            border: 3px solid #e2e8f0;
            border-radius: 12px;
            padding: 20px;
            cursor: pointer;
            transition: all 0.3s ease;
            text-align: center;
            font-size: 3em;
        }
        
        .visual-option:hover {
            border-color: #667eea;
            transform: scale(1.05);
        }
        
        .visual-option.selected {
            border-color: #667eea;
            background: #f8faff;
        }
    </style>
</head>
<body>
    <div id="root"></div>

    <script type="text/babel">
        const { useState, useEffect, useCallback } = React;
        
        // Main App Component
        const App = () => {
            const [currentView, setCurrentView] = useState('home');
            const [currentTopic, setCurrentTopic] = useState(null);
            const [currentLesson, setCurrentLesson] = useState(null);
            const [appData, setAppData] = useState({
                totalPhrases: 0,
                learnedCount: 0,
                topics: [],
                userProgress: {}
            });
            const [loading, setLoading] = useState(false);
            
            // Load app data on mount
            useEffect(() => {
                loadAppData();
                loadUserProgress();
            }, []);
            
            // Scroll to top when view changes
            useEffect(() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }, [currentView, currentTopic]);
            
            const loadAppData = async () => {
                setLoading(true);
                try {
                    const [countResponse, categoriesResponse] = await Promise.all([
                        fetch('/api/count'),
                        fetch('/api/categories')
                    ]);
                    
                    const countData = await countResponse.json();
                    const categoriesData = await categoriesResponse.json();
                    
                    setAppData(prev => ({
                        ...prev,
                        totalPhrases: parseInt(countData.count),
                        topics: categoriesData.map(cat => ({
                            id: cat.name.toLowerCase().replace(/\\s+/g, '_'),
                            name: cat.name,
                            count: parseInt(cat.count),
                            icon: getTopicIcon(cat.name),
                            description: getTopicDescription(cat.name),
                            grammar: getTopicGrammar(cat.name)
                        }))
                    }));
                } catch (error) {
                    console.error('Failed to load app data:', error);
                } finally {
                    setLoading(false);
                }
            };
            
            const loadUserProgress = () => {
                const saved = localStorage.getItem('albanianLearningProgress');
                if (saved) {
                    const progress = JSON.parse(saved);
                    setAppData(prev => ({
                        ...prev,
                        learnedCount: progress.learnedCount || 0,
                        userProgress: progress.topics || {}
                    }));
                }
            };
            
            const saveUserProgress = (updates) => {
                const currentProgress = JSON.parse(localStorage.getItem('albanianLearningProgress') || '{}');
                const newProgress = { ...currentProgress, ...updates };
                localStorage.setItem('albanianLearningProgress', JSON.stringify(newProgress));
                setAppData(prev => ({ ...prev, ...updates }));
            };
            
            const getTopicIcon = (name) => {
                const iconMap = {
                    'Playing Cards': '🃏',
                    'Card Game Terms': '🎯',
                    'Hello and Goodbye': '👋',
                    'Winning & Losing': '🏆',
                    'Food Names': '🍽️',
                    'Home & Rooms': '🏠',
                    'Daily Activities': '🌅',
                    'Expressing Opinions': '💭',
                    'Emotions & Feelings': '😊',
                    'Coffee': '☕',
                    'Family': '👨‍👩‍👧‍👦',
                    'Greetings': '🤝'
                };
                
                for (const [key, icon] of Object.entries(iconMap)) {
                    if (name.toLowerCase().includes(key.toLowerCase())) {
                        return icon;
                    }
                }
                return '📚';
            };
            
            const getTopicDescription = (name) => {
                const descriptions = {
                    'Playing Cards': 'Learn card game vocabulary & competitive conversation',
                    'Card Game Terms': 'Master card-related expressions and game rules',
                    'Hello and Goodbye': 'Essential greetings for family interactions',
                    'Food Names': 'Albanian cuisine and dining vocabulary',
                    'Home & Rooms': 'Navigate household conversations confidently',
                    'Daily Activities': 'Express daily routines and schedules',
                    'Expressing Opinions': 'Share thoughts and preferences naturally',
                    'Emotions & Feelings': 'Communicate emotions in family settings'
                };
                
                for (const [key, desc] of Object.entries(descriptions)) {
                    if (name.toLowerCase().includes(key.toLowerCase())) {
                        return desc;
                    }
                }
                return 'Essential Albanian phrases for family integration';
            };
            
            const getTopicGrammar = (name) => {
                const grammar = {
                    'Playing Cards': 'Verb conjugation: -oj verbs (luaj, fitoj)',
                    'Food Names': 'Food-related verbs & expressions',
                    'Hello and Goodbye': 'Formal vs informal greetings',
                    'Daily Activities': 'Present tense daily routine verbs',
                    'Expressing Opinions': 'Opinion formation & agreement'
                };
                
                for (const [key, gram] of Object.entries(grammar)) {
                    if (name.toLowerCase().includes(key.toLowerCase())) {
                        return gram;
                    }
                }
                return 'Essential grammar patterns';
            };
            
            const handleContinue = () => {
                const lastTopic = localStorage.getItem('lastTopic');
                const lastLesson = localStorage.getItem('lastLesson');
                
                if (lastTopic && appData.topics.find(t => t.id === lastTopic)) {
                    setCurrentTopic(appData.topics.find(t => t.id === lastTopic));
                    setCurrentView('lesson');
                } else {
                    setCurrentView('guided');
                }
            };
            
            const startTopic = (topic) => {
                setCurrentTopic(topic);
                setCurrentView('lesson');
                localStorage.setItem('lastTopic', topic.id);
            };
            
            const goHome = () => {
                setCurrentView('home');
                setCurrentTopic(null);
                setCurrentLesson(null);
            };
            
            return (
                <div className="app-container">
                    {currentView !== 'home' && (
                        <nav className="nav-bar">
                            <button className="nav-back" onClick={goHome}>
                                ← Back to Home
                            </button>
                            <div className="nav-title">
                                {currentView === 'guided' && 'Choose Your Topic'}
                                {currentView === 'solo' && 'Solo Practice'}
                                {currentView === 'lesson' && currentTopic?.name}
                            </div>
                            <div className="nav-progress">
                                {Math.round((appData.learnedCount / appData.totalPhrases) * 100) || 0}% Complete
                            </div>
                        </nav>
                    )}
                    
                    {currentView === 'home' && (
                        <HomePage 
                            appData={appData}
                            onContinue={handleContinue}
                            onNavigate={setCurrentView}
                            loading={loading}
                        />
                    )}
                    
                    {currentView === 'guided' && (
                        <TopicSelection 
                            topics={appData.topics}
                            onStartTopic={startTopic}
                            userProgress={appData.userProgress}
                        />
                    )}
                    
                    {currentView === 'solo' && (
                        <SoloPractice 
                            topics={appData.topics}
                            appData={appData}
                            saveProgress={saveUserProgress}
                        />
                    )}
                    
                    {currentView === 'lesson' && currentTopic && (
                        <TopicLesson 
                            topic={currentTopic}
                            appData={appData}
                            saveProgress={saveUserProgress}
                            onComplete={() => setCurrentView('guided')}
                        />
                    )}
                </div>
            );
        };
        
        // HomePage Component
        const HomePage = ({ appData, onContinue, onNavigate, loading }) => {
            const hasProgress = appData.learnedCount > 0;
            const lastTopic = localStorage.getItem('lastTopic');
            const topicName = lastTopic ? 
                appData.topics.find(t => t.id === lastTopic)?.name || 'Your Learning' : 
                'Your Learning';
            
            return (
                <div className="dashboard fade-in">
                    <div className="app-header">
                        <h1 className="app-title">🇦🇱 Learn Albanian</h1>
                        <p className="app-subtitle">Master Kosovo Albanian with Cultural Context</p>
                        <p className="app-tagline">Real family integration through language</p>
                    </div>
                    
                    <div className="continue-section">
                        <button 
                            className="continue-button"
                            onClick={onContinue}
                            disabled={loading}
                        >
                            {hasProgress ? (
                                <>
                                    <div>CONTINUE</div>
                                    <div style={{fontSize: '0.8em', opacity: 0.9, marginTop: '5px'}}>
                                        {topicName}
                                    </div>
                                </>
                            ) : (
                                'START LEARNING'
                            )}
                        </button>
                    </div>
                    
                    <div className="learning-paths">
                        <div className="path-card" onClick={() => onNavigate('guided')}>
                            <span className="path-icon">🎯</span>
                            <h3 className="path-title">Guided Practice</h3>
                            <p className="path-description">
                                Follow structured lessons by real-life topics like playing cards, family dinners, and coffee conversations
                            </p>
                        </div>
                        
                        <div className="path-card" onClick={() => onNavigate('solo')}>
                            <span className="path-icon">🎲</span>
                            <h3 className="path-title">Solo Practice</h3>
                            <p className="path-description">
                                Choose your own topics and pace with flashcards, vocabulary, and pronunciation practice
                            </p>
                        </div>
                    </div>
                    
                    <div className="quick-stats">
                        <div className="stats-grid">
                            <div className="stat-item">
                                <span className="stat-number">{appData.totalPhrases}</span>
                                <span className="stat-label">Albanian Phrases</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-number">{appData.learnedCount}</span>
                                <span className="stat-label">Learned</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-number">{appData.topics.length}</span>
                                <span className="stat-label">Topics</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-number">
                                    {Math.round((appData.learnedCount / appData.totalPhrases) * 100) || 0}%
                                </span>
                                <span className="stat-label">Progress</span>
                            </div>
                        </div>
                    </div>
                </div>
            );
        };
        
        // TopicSelection Component  
        const TopicSelection = ({ topics, onStartTopic, userProgress }) => {
            return (
                <div className="topic-selection fade-in">
                    <div className="topic-header">
                        <h2 className="topic-title">Guided Practice</h2>
                        <p className="topic-subtitle">Learn Albanian through real-life family situations</p>
                    </div>
                    
                    <div className="topics-grid">
                        {topics.slice(0, 8).map(topic => (
                            <TopicCard 
                                key={topic.id}
                                topic={topic}
                                onStart={() => onStartTopic(topic)}
                                progress={userProgress[topic.id] || 0}
                            />
                        ))}
                    </div>
                </div>
            );
        };
        
        // TopicCard Component
        const TopicCard = ({ topic, onStart, progress }) => {
            return (
                <div className="topic-card">
                    <div className="topic-card-header">
                        <span className="topic-emoji">{topic.icon}</span>
                        <h3 className="topic-card-title">{topic.name}</h3>
                    </div>
                    
                    <p className="topic-description">{topic.description}</p>
                    
                    <div className="topic-stats">
                        <span>{topic.count} phrases</span>
                        <span>{progress}% complete</span>
                    </div>
                    
                    <div className="topic-grammar">
                        Grammar: {topic.grammar}
                    </div>
                    
                    <button className="start-topic-btn" onClick={onStart}>
                        Start Topic
                    </button>
                </div>
            );
        };
        
        // TopicLesson Component
        const TopicLesson = ({ topic, appData, saveProgress, onComplete }) => {
            const [currentStep, setCurrentStep] = useState('theory');
            const [stepProgress, setStepProgress] = useState(0);
            const lessonSteps = ['theory', 'vocabulary', 'verbs', 'practice'];
            const currentStepIndex = lessonSteps.indexOf(currentStep);
            const progressPercentage = ((currentStepIndex + 1) / lessonSteps.length) * 100;
            
            // Scroll to top when step changes
            useEffect(() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }, [currentStep]);
            
            const nextStep = () => {
                const nextIndex = currentStepIndex + 1;
                if (nextIndex < lessonSteps.length) {
                    setCurrentStep(lessonSteps[nextIndex]);
                } else {
                    onComplete();
                }
            };
            
            const prevStep = () => {
                const prevIndex = currentStepIndex - 1;
                if (prevIndex >= 0) {
                    setCurrentStep(lessonSteps[prevIndex]);
                }
            };
            
            return (
                <div className="topic-lesson fade-in">
                    <div className="lesson-header">
                        <div className="lesson-title-section">
                            <h2>{topic.icon} {topic.name}</h2>
                            <p className="lesson-subtitle">
                                Step {currentStepIndex + 1} of {lessonSteps.length}: {currentStep.charAt(0).toUpperCase() + currentStep.slice(1)}
                            </p>
                        </div>
                    </div>
                    
                    <div className="lesson-progress">
                        <div className="progress-bar">
                            <div 
                                className="progress-fill" 
                                style={{ width: progressPercentage + '%' }}
                            ></div>
                        </div>
                        <div className="progress-steps">
                            {lessonSteps.map((step, index) => (
                                <div 
                                    key={step}
                                    className={\`progress-step \${index < currentStepIndex ? 'completed' : ''} \${index === currentStepIndex ? 'active' : ''}\`}
                                >
                                    {step.charAt(0).toUpperCase() + step.slice(1)}
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {currentStep === 'theory' && (
                        <TheorySection topic={topic} onNext={nextStep} />
                    )}
                    
                    {currentStep === 'vocabulary' && (
                        <VocabularySection topic={topic} onNext={nextStep} onPrev={prevStep} />
                    )}
                    
                    {currentStep === 'verbs' && (
                        <VerbSection topic={topic} onNext={nextStep} onPrev={prevStep} />
                    )}
                    
                    {currentStep === 'practice' && (
                        <PracticeSection 
                            topic={topic} 
                            onNext={nextStep} 
                            onPrev={prevStep}
                            saveProgress={saveProgress}
                            totalPhrases={appData.totalPhrases}
                        />
                    )}
                </div>
            );
        };
        
        // TheorySection Component
        const TheorySection = ({ topic, onNext }) => {
            const getTheoryContent = (topicName) => {
                const theories = {
                    'Playing Cards': {
                        cultural: "In Kosovo Albanian families, card games are powerful social bonding activities. They're not just about winning - they create opportunities for conversation, teach children counting and strategy, and strengthen family relationships. Common expressions of encouragement and friendly competition help build linguistic confidence.",
                        grammar: "The -oj verb pattern is essential for activities: luaj (to play), fitoj (to win), humbas (to lose). These verbs conjugate regularly: luaj → luaj, luan, luajmë, luani, luajnë.",
                        examples: [
                            { albanian: "Luaj kartë me familjen", english: "I play cards with the family" },
                            { albanian: "Ti fiton shpesh", english: "You win often" },
                            { albanian: "Ne luajmë çdo mbrëmje", english: "We play every evening" }
                        ]
                    },
                    'Game Conversation': {
                        cultural: "Card games in Albanian families are deeply social experiences that go beyond simple competition. They're evening rituals where multiple generations gather, stories are shared, and relationships are strengthened. The language used is encouraging and inclusive - even when someone loses, the focus is on 'lojë e mirë' (good game) and 'mirë luajt' (well played). Players take turns being the dealer ('Unë do të ndaj të parët' - I'll deal first), and there's a strong emphasis on fairness and sportsmanship. These games teach children patience, strategy, and most importantly, how to interact respectfully with family members of all ages.",
                        grammar: "Card game verbs follow key patterns: luaj (to play), fitoj (to win), ndaj (to deal/distribute), kaloj (to pass). The verb 'luaj' is irregular: luaj, luan, luajmë, luani, luajnë. Game flow uses present tense for immediate actions ('Unë kaloj' - I pass) and future for intentions ('do të luajmë përsëri' - want to play again). Polite expressions use imperative forms softened with courtesy markers.",
                        examples: [
                            { albanian: "Të gjithë gati?", english: "Everyone ready?" },
                            { albanian: "Është radha jote", english: "It's your turn" },
                            { albanian: "Dorë e mirë!", english: "Nice hand!" },
                            { albanian: "Lojë e mirë", english: "Good game" },
                            { albanian: "Mirë luajt", english: "Well played" }
                        ]
                    },
                    'Hello and Goodbye': {
                        cultural: "Albanian greetings are deeply rooted in respect, hospitality, and family connection. In Kosovo Albanian culture, greetings aren't just polite formalities - they're genuine inquiries about well-being, family health, and life circumstances. The time of day matters greatly: 'Mirëmëngjes' (good morning) until 11 AM, 'Mirëdita' (good day) until evening, and 'Mirëmbrëma' (good evening) after sunset. When meeting family for the first time, longer greetings show respect and interest. 'Ndihuni si në shtëpi' (make yourself at home) demonstrates the Albanian principle of treating guests like family.",
                        grammar: "Albanian greetings use formal vs informal patterns. 'Si je?' (how are you - informal) vs 'Si jeni?' (formal/plural). Response patterns include 'Jam mirë' (I'm well) + reciprocal question. Time expressions like 'këtë mëngjes' (this morning), 'së fundmi' (recently) are essential for natural conversation flow. Farewell phrases literally translate to wishes for well-being: 'Mirupafshim' means 'see you well'.",
                        examples: [
                            { albanian: "Mirëmëngjes, si jeni?", english: "Good morning, how are you?" },
                            { albanian: "Ndihuni si në shtëpi", english: "Make yourself at home" },
                            { albanian: "Këtë mëngjes jam zgjuar herët", english: "This morning I woke up early" },
                            { albanian: "Mirupafshim, shihemi së shpejti", english: "Goodbye, see you soon" },
                            { albanian: "Jo shumë kohë më parë", english: "Not long ago" }
                        ]
                    },
                    'Card Game Terms': {
                        cultural: "Card games in Albanian culture have specific terminology that shows your familiarity with family traditions. Knowing when to say 'unë përkul' (I fold) vs 'kush do të luajë letrat?' (who wants to play cards?) demonstrates social awareness. Card games often involve multiple generations, so using proper terminology shows respect for elders and inclusion of younger family members. The phrase 'të gjithë gati?' (everyone ready?) is essential for ensuring all players feel included before starting.",
                        grammar: "Card game vocabulary uses specific verb forms: 'luaj' (to play), 'përkul' (to fold), 'ndaj' (to deal). Questions often use 'kush' (who) + verb structure. Numbers and counting are integrated: 'një, dy, tre' for card values. Present tense dominates for immediate game actions, with future tense for planning next moves.",
                        examples: [
                            { albanian: "Kush do të luajë letrat?", english: "Who wants to play cards?" },
                            { albanian: "Unë përkul", english: "I fold" },
                            { albanian: "Të gjithë gati?", english: "Everyone ready?" },
                            { albanian: "Deka është e përzier", english: "The deck is shuffled" },
                            { albanian: "Kjo është interesante", english: "This is interesting" }
                        ]
                    },
                    'Winning & Losing': {
                        cultural: "In Albanian family games, winning and losing are handled with grace and sportsmanship. The concept of 'i pa fat' (unlucky) removes personal blame and maintains family harmony. Winners are modest, losers are gracious. Phrases like 'lojë e mirë' acknowledge everyone's effort. Understanding card hierarchy ('xhak' for jack, 'mbret' for king) shows cultural card game knowledge. The question 'kush është radha?' (who's next?) keeps games flowing smoothly and includes everyone.",
                        grammar: "Win/lose vocabulary centers on 'fitoj' (to win) and 'humbas' (to lose) with emotional modifiers. 'I pa fat' (unlucky) uses adjective agreement. 'Kush është radha?' uses question word + verb structure. Card names are often borrowed but adapted to Albanian phonetics.",
                        examples: [
                            { albanian: "Kjo lojë është e mirë", english: "This game is good" },
                            { albanian: "Jam i pa fat sot", english: "I'm unlucky today" },
                            { albanian: "Xhaku fiton mbi dhjetën", english: "Jack wins over ten" },
                            { albanian: "Kush është radha tani?", english: "Who's next now?" },
                            { albanian: "Kush do të luajë me letra?", english: "Who wants to play with cards?" }
                        ]
                    },
                    'Food Names': {
                        cultural: "Albanian cuisine is central to family life and cultural identity. Meals are communal experiences where multiple generations share stories, discuss daily events, and strengthen family bonds. Traditional dishes like byrek, qofte, and fërgesë carry deep cultural significance. When learning food vocabulary, you're not just memorizing words - you're entering the heart of Albanian hospitality. Knowing food names shows respect for cultural traditions and enables meaningful participation in family meals. The phrase 'hajde të hamë së bashku' (let's eat together) embodies the Albanian spirit of inclusivity and warmth.",
                        grammar: "Food vocabulary uses specific article patterns: masculine food items take 'i' (buka i bardhë - white bread), feminine items take 'e' (mishi e kuq - red meat). Quantity expressions use 'pak' (little), 'shumë' (much), 'mjaft' (enough). Food preparation verbs follow regular conjugation patterns: gatuaj (to cook), përgatis (to prepare), shërben (to serve). Taste descriptions use adjective agreement with the food item's gender.",
                        examples: [
                            { albanian: "Buka është e freskët", english: "The bread is fresh" },
                            { albanian: "A do pak mish?", english: "Do you want some meat?" },
                            { albanian: "Mamaja gatuan byrek", english: "Mom is cooking byrek" },
                            { albanian: "Perime të freskëta janë të shëndetshme", english: "Fresh vegetables are healthy" },
                            { albanian: "Hajde të hamë së bashku", english: "Let's eat together" }
                        ]
                    },
                    'Home & Rooms': {
                        cultural: "The Albanian home is a sacred space where family honor, hospitality, and traditions are maintained. Each room has specific cultural significance - the living room (dhoma e ndenjes) is where guests are welcomed with coffee and conversation, the kitchen (kuzhina) is the heart of family activity where meals bring everyone together, and bedrooms are private family spaces. Understanding room vocabulary helps you navigate household dynamics respectfully. Phrases like 'kjo është dhoma ime' (this is my room) or 'kuzhina është e madhe' (the kitchen is big) show your integration into family spatial awareness.",
                        grammar: "Room vocabulary uses definite articles with location: 'në kuzhinë' (in the kitchen), 'te dhoma' (at the room). Possession is expressed with pronouns: 'dhoma ime' (my room), 'shtëpia jonë' (our house). Prepositions of place are crucial: 'mbi' (above), 'nën' (under), 'pranë' (next to). Room descriptions use adjective-noun agreement patterns.",
                        examples: [
                            { albanian: "Kuzhina është e madhe", english: "The kitchen is big" },
                            { albanian: "Dhoma ime është lart", english: "My room is upstairs" },
                            { albanian: "Ne hamë në sufrageri", english: "We eat in the dining room" },
                            { albanian: "Banjo është pranë dhomës", english: "The bathroom is next to the room" },
                            { albanian: "Kjo shtëpi është e bukur", english: "This house is beautiful" }
                        ]
                    },
                    'Daily Activities': {
                        cultural: "Daily routines in Albanian families follow traditional patterns that emphasize family connection and respect for elders. Morning activities begin with coffee (kafe) and family check-ins, work and school responsibilities come next, and evenings center around shared meals and conversation. Weekend routines often include extended family visits and cultural activities. Learning daily activity vocabulary helps you participate in family scheduling discussions and shows respect for household rhythms. The phrase 'çfarë po bën?' (what are you doing?) is a common way family members connect throughout the day.",
                        grammar: "Daily activity verbs predominantly use present tense for current actions: 'po lexoj' (I'm reading), 'po punoj' (I'm working). Time expressions are essential: 'në mëngjes' (in the morning), 'pasdite' (afternoon), 'mbrëmje' (evening). Frequency adverbs modify daily verbs: 'gjithmonë' (always), 'shpesh' (often), 'ndonjëherë' (sometimes). Question formation for activities uses 'çfarë' (what) + present progressive.",
                        examples: [
                            { albanian: "Çfarë po bën tani?", english: "What are you doing now?" },
                            { albanian: "Unë punoj në mëngjes", english: "I work in the morning" },
                            { albanian: "Ajo lexon çdo ditë", english: "She reads every day" },
                            { albanian: "Ne hamë në orën tetë", english: "We eat at eight o'clock" },
                            { albanian: "Pasdite shoh televizor", english: "In the afternoon I watch TV" }
                        ]
                    },
                    'Expressing Opinions': {
                        cultural: "In Albanian families, expressing opinions respectfully is a valued skill that demonstrates maturity and family integration. Opinions are shared through discussion, not confrontation. Elder opinions are given special respect, while younger family members are encouraged to express thoughtful viewpoints. Learning to express preferences, agreements, and respectful disagreements shows cultural understanding. Phrases like 'mendoj se' (I think that) and 'jam dakord' (I agree) facilitate meaningful family discussions. Cultural topics like food preferences, holiday plans, and family decisions are common opinion-sharing contexts.",
                        grammar: "Opinion expressions use 'mendoj se' (I think that) + subjunctive clause. Agreement patterns include 'jam dakord' (I agree) with optional 'me ty/ju' (with you). Preference expressions use 'më pëlqen' (I like) with varying objects. Degrees of certainty are expressed through modal verbs: 'besoj' (I believe), 'mendoj' (I think), 'jam i sigurt' (I'm sure). Opinion questions use 'si mendon?' (what do you think?).",
                        examples: [
                            { albanian: "Mendoj se kjo është e mirë", english: "I think this is good" },
                            { albanian: "Jam dakord me ty", english: "I agree with you" },
                            { albanian: "Më pëlqen ky film", english: "I like this movie" },
                            { albanian: "Si mendon për këtë ide?", english: "What do you think about this idea?" },
                            { albanian: "Besoj se është e drejtë", english: "I believe it's right" }
                        ]
                    },
                    'Emotions & Feelings': {
                        cultural: "Emotional expression in Albanian families balances authenticity with respect for family harmony. Positive emotions like happiness (gëzim) and excitement (entuziazëm) are shared openly to strengthen family bonds. Difficult emotions like sadness (trishtim) or worry (shqetësim) are acknowledged with family support. Albanian culture values emotional honesty while maintaining family stability. Learning emotion vocabulary helps you participate in family emotional support systems and express your feelings appropriately. The phrase 'si ndihesh?' (how do you feel?) shows genuine care and family connection.",
                        grammar: "Emotion vocabulary uses 'ndihem' (I feel) + adjective: 'ndihem mirë' (I feel good). Emotional states can be temporary 'jam i lumtur' (I am happy) or characteristic 'jam person i gëzuar' (I am a happy person). Emotional questions use 'si ndihesh?' (how do you feel?) or 'çfarë të ka ndodhur?' (what happened to you?). Emotion intensity is expressed through adverbs: 'shumë' (very), 'paksa' (a bit), 'jashtëzakonisht' (extremely).",
                        examples: [
                            { albanian: "Si ndihesh sot?", english: "How do you feel today?" },
                            { albanian: "Jam shumë i lumtur", english: "I am very happy" },
                            { albanian: "Ajo duket e trishtuar", english: "She looks sad" },
                            { albanian: "Ndihem pak i lodhur", english: "I feel a bit tired" },
                            { albanian: "Jemi të gëzuar për ty", english: "We are happy for you" }
                        ]
                    }
                };
                
                return theories[topicName] || {
                    cultural: "This topic focuses on essential Albanian family communication patterns and cultural context that will help you integrate naturally into conversations.",
                    grammar: "Key grammatical structures and verb patterns that form the foundation for natural conversation in this context.",
                    examples: [
                        { albanian: "Example phrase", english: "English translation" }
                    ]
                };
            };
            
            const theory = getTheoryContent(topic.name);
            
            return (
                <div className="theory-section">
                    <div className="cultural-context">
                        <h3>Cultural Context</h3>
                        <p>{theory.cultural}</p>
                    </div>
                    
                    <div className="grammar-focus">
                        <h3>Grammar Focus</h3>
                        <p>{theory.grammar}</p>
                        <div className="grammar-examples">
                            {theory.examples.map((example, index) => (
                                <div key={index} className="example-sentence">
                                    <span style={{fontWeight: 'bold', color: '#667eea'}}>
                                        {example.albanian}
                                    </span>
                                    <span style={{color: '#666'}}>
                                        {example.english}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="lesson-preview">
                        <h3>What You'll Learn</h3>
                        <ul>
                            <li>{topic.count} essential phrases</li>
                            <li>Key verb conjugations</li>
                            <li>Cultural conversation patterns</li>
                            <li>Multiple exercise types</li>
                        </ul>
                    </div>
                    
                    <div style={{textAlign: 'center', marginTop: '40px'}}>
                        <button className="btn btn-primary" onClick={onNext}>
                            Start Learning Vocabulary →
                        </button>
                    </div>
                </div>
            );
        };
        
        // VocabularySection Component
        const VocabularySection = ({ topic, onNext, onPrev }) => {
            const [vocabularyData, setVocabularyData] = useState([]);
            const [loading, setLoading] = useState(true);
            const [currentWordIndex, setCurrentWordIndex] = useState(0);
            const [showPronunciation, setShowPronunciation] = useState({});
            
            useEffect(() => {
                loadVocabulary();
            }, [topic.name]);
            
            const loadVocabulary = async () => {
                setLoading(true);
                try {
                    const response = await fetch(\`/api/vocabulary/\${encodeURIComponent(topic.name)}\`);
                    const data = await response.json();
                    
                    // Transform database data to include pronunciation and usage hints
                    const transformedData = data.map((item, index) => ({
                        english: item.english_phrase,
                        albanian: item.target_phrase,
                        pronunciation: generatePronunciation(item.target_phrase),
                        usage: item.cultural_context || \`Essential \${topic.name.toLowerCase()} phrase\`,
                        example: \`\${item.target_phrase} (\${item.english_phrase})\`
                    }));
                    
                    setVocabularyData(transformedData.slice(0, 15)); // Show first 15 words
                } catch (error) {
                    console.error('Failed to load vocabulary:', error);
                    // Show error message instead of falling back
                    setVocabularyData([{
                        english: 'Error loading vocabulary',
                        albanian: 'Gabim në ngarkim',
                        pronunciation: 'gah-BEEM nuh ngar-KEEM',
                        usage: 'Please check your connection and try again',
                        example: 'Unable to connect to database'
                    }]);
                } finally {
                    setLoading(false);
                }
            };
            
            // Helper function to generate basic pronunciation guides
            const generatePronunciation = (albanian) => {
                // Simple pronunciation mapping for Albanian sounds
                return albanian
                    .replace(/ë/g, 'uh')
                    .replace(/ç/g, 'ch')
                    .replace(/zh/g, 'zh')
                    .replace(/sh/g, 'sh')
                    .replace(/dh/g, 'dh')
                    .replace(/th/g, 'th')
                    .replace(/nj/g, 'ny')
                    .replace(/ll/g, 'l')
                    .replace(/rr/g, 'r')
                    .toUpperCase();
            };
            
            const togglePronunciation = (index) => {
                setShowPronunciation(prev => ({
                    ...prev,
                    [index]: !prev[index]
                }));
            };
            
            if (loading) {
                return (
                    <div style={{textAlign: 'center', padding: '100px 20px'}}>
                        <div className="spinner"></div>
                        <p>Loading vocabulary...</p>
                    </div>
                );
            }
            
            const vocabularyToShow = vocabularyData;
            
            return (
                <div className="vocabulary-section">
                    <div style={{maxWidth: '800px', margin: '0 auto'}}>
                        <div style={{textAlign: 'center', marginBottom: '40px'}}>
                            <h3 style={{fontSize: '2em', marginBottom: '15px', color: '#333'}}>
                                Essential Vocabulary
                            </h3>
                            <p style={{fontSize: '1.2em', color: '#666'}}>
                                Master these key words for {topic.name.toLowerCase()}
                            </p>
                        </div>
                        
                        <div style={{display: 'grid', gap: '20px', marginBottom: '40px'}}>
                            {vocabularyToShow.map((word, index) => (
                                <div key={index} style={{
                                    background: index % 2 === 0 ? '#f8faff' : '#ffffff',
                                    border: '2px solid #e2e8f0',
                                    borderRadius: '15px',
                                    padding: '25px',
                                    transition: 'all 0.3s ease'
                                }}>
                                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
                                        <div>
                                            <div style={{fontSize: '1.5em', fontWeight: '600', color: '#333', marginBottom: '5px'}}>
                                                {word.english}
                                            </div>
                                            <div style={{fontSize: '2em', fontWeight: 'bold', color: '#667eea'}}>
                                                {word.albanian}
                                            </div>
                                        </div>
                                        <button 
                                            className="btn btn-secondary"
                                            style={{padding: '8px 16px', fontSize: '0.9em'}}
                                            onClick={() => togglePronunciation(index)}
                                        >
                                            🔊 Pronunciation
                                        </button>
                                    </div>
                                    
                                    {showPronunciation[index] && (
                                        <div style={{
                                            background: '#667eea',
                                            color: 'white',
                                            padding: '15px',
                                            borderRadius: '10px',
                                            marginBottom: '15px',
                                            fontStyle: 'italic',
                                            fontSize: '1.2em'
                                        }}>
                                            /{word.pronunciation}/
                                        </div>
                                    )}
                                    
                                    <div style={{
                                        background: '#f0fdf4',
                                        borderLeft: '4px solid #10b981',
                                        padding: '15px',
                                        borderRadius: '8px',
                                        marginBottom: '10px'
                                    }}>
                                        <strong style={{color: '#166534'}}>Usage:</strong> {word.usage}
                                    </div>
                                    
                                    <div style={{
                                        fontStyle: 'italic',
                                        color: '#666',
                                        fontSize: '1.1em'
                                    }}>
                                        <strong>Example:</strong> {word.example}
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div style={{
                            background: '#fef9e7',
                            borderLeft: '5px solid #f59e0b',
                            padding: '20px',
                            borderRadius: '10px',
                            marginBottom: '30px'
                        }}>
                            <p style={{color: '#92400e', fontWeight: '600', marginBottom: '10px'}}>
                                💡 Study Tip
                            </p>
                            <p style={{color: '#78350f'}}>
                                Practice these words by using them in context during family card games. 
                                Albanian families appreciate when you make an effort to use the correct terminology!
                            </p>
                        </div>
                        
                        <div style={{display: 'flex', justifyContent: 'center', gap: '20px'}}>
                            <button className="btn btn-outline" onClick={onPrev}>
                                ← Back to Theory
                            </button>
                            <button className="btn btn-primary" onClick={onNext}>
                                Continue to Verbs →
                            </button>
                        </div>
                    </div>
                </div>
            );
        };
        
        // VerbSection Component  
        const VerbSection = ({ topic, onNext, onPrev }) => {
            const [activeVerb, setActiveVerb] = useState(0);
            
            const getVerbData = (topicName) => {
                const verbData = {
                    'Game Conversation': {
                        primaryVerbs: [
                            {
                                infinitive: 'luaj',
                                english: 'to play',
                                type: 'irregular',
                                conjugations: {
                                    'unë': { form: 'luaj', english: 'I play' },
                                    'ti': { form: 'luan', english: 'you play' },
                                    'ai/ajo': { form: 'luan', english: 'he/she plays' },
                                    'ne': { form: 'luajmë', english: 'we play' },
                                    'ju': { form: 'luani', english: 'you (plural) play' },
                                    'ata/ato': { form: 'luajnë', english: 'they play' }
                                },
                                examples: [
                                    { albanian: 'Unë luaj me familjen', english: 'I play with the family' },
                                    { albanian: 'Ti luan mirë', english: 'You play well' },
                                    { albanian: 'Ne luajmë çdo mbrëmje', english: 'We play every evening' }
                                ]
                            },
                            {
                                infinitive: 'fitoj',
                                english: 'to win',
                                type: 'regular (-oj)',
                                conjugations: {
                                    'unë': { form: 'fitoj', english: 'I win' },
                                    'ti': { form: 'fiton', english: 'you win' },
                                    'ai/ajo': { form: 'fiton', english: 'he/she wins' },
                                    'ne': { form: 'fitojmë', english: 'we win' },
                                    'ju': { form: 'fitoni', english: 'you (plural) win' },
                                    'ata/ato': { form: 'fitojnë', english: 'they win' }
                                },
                                examples: [
                                    { albanian: 'Unë fitoj shpesh', english: 'I win often' },
                                    { albanian: 'Ajo fiton gjithmonë', english: 'She always wins' },
                                    { albanian: 'Ata fitojnë sot', english: 'They win today' }
                                ]
                            },
                            {
                                infinitive: 'ndaj',
                                english: 'to deal/distribute',
                                type: 'irregular',
                                conjugations: {
                                    'unë': { form: 'ndaj', english: 'I deal' },
                                    'ti': { form: 'ndan', english: 'you deal' },
                                    'ai/ajo': { form: 'ndan', english: 'he/she deals' },
                                    'ne': { form: 'ndajmë', english: 'we deal' },
                                    'ju': { form: 'ndani', english: 'you (plural) deal' },
                                    'ata/ato': { form: 'ndajnë', english: 'they deal' }
                                },
                                examples: [
                                    { albanian: 'Unë ndaj letërkët', english: 'I deal the cards' },
                                    { albanian: 'Ti ndan mirë', english: 'You deal well' },
                                    { albanian: 'Kush ndan këtë herë?', english: 'Who deals this time?' }
                                ]
                            }
                        ],
                        commonPhrases: [
                            { pattern: 'present tense + adverb', example: 'Luaj mirë (Play well)', usage: 'Encouraging someone during the game' },
                            { pattern: 'question with auxiliary', example: 'A do të luajmë? (Shall we play?)', usage: 'Suggesting to start a game' },
                            { pattern: 'imperative + object', example: 'Ndani letërkët! (Deal the cards!)', usage: 'Requesting someone to start the game' }
                        ]
                    },
                    'Playing Cards': {
                        primaryVerbs: [
                            {
                                infinitive: 'luaj',
                                english: 'to play',
                                type: 'irregular',
                                conjugations: {
                                    'unë': { form: 'luaj', english: 'I play' },
                                    'ti': { form: 'luan', english: 'you play' },
                                    'ai/ajo': { form: 'luan', english: 'he/she plays' },
                                    'ne': { form: 'luajmë', english: 'we play' },
                                    'ju': { form: 'luani', english: 'you (plural) play' },
                                    'ata/ato': { form: 'luajnë', english: 'they play' }
                                },
                                examples: [
                                    { albanian: 'Luaj kartë me mua', english: 'Play cards with me' },
                                    { albanian: 'Ata luajnë gjithë ditën', english: 'They play all day' }
                                ]
                            }
                        ],
                        commonPhrases: []
                    },
                    'Food Names': {
                        primaryVerbs: [
                            {
                                infinitive: 'ha',
                                english: 'to eat',
                                type: 'irregular',
                                conjugations: {
                                    'unë': { form: 'ha', english: 'I eat' },
                                    'ti': { form: 'ha', english: 'you eat' },
                                    'ai/ajo': { form: 'ha', english: 'he/she eats' },
                                    'ne': { form: 'hamë', english: 'we eat' },
                                    'ju': { form: 'hani', english: 'you (plural) eat' },
                                    'ata/ato': { form: 'hanë', english: 'they eat' }
                                },
                                examples: [
                                    { albanian: 'Unë ha bukë çdo ditë', english: 'I eat bread every day' },
                                    { albanian: 'Ne hamë së bashku', english: 'We eat together' },
                                    { albanian: 'Ajo ha perime të freskëta', english: 'She eats fresh vegetables' }
                                ]
                            },
                            {
                                infinitive: 'gatuaj',
                                english: 'to cook',
                                type: 'regular (-aj)',
                                conjugations: {
                                    'unë': { form: 'gatuaj', english: 'I cook' },
                                    'ti': { form: 'gatuan', english: 'you cook' },
                                    'ai/ajo': { form: 'gatuan', english: 'he/she cooks' },
                                    'ne': { form: 'gatuajmë', english: 'we cook' },
                                    'ju': { form: 'gatuani', english: 'you (plural) cook' },
                                    'ata/ato': { form: 'gatuajnë', english: 'they cook' }
                                },
                                examples: [
                                    { albanian: 'Mamaja gatuan byrek', english: 'Mom cooks byrek' },
                                    { albanian: 'Unë gatuaj mish në furrë', english: 'I cook meat in the oven' },
                                    { albanian: 'Ne gatuajmë së bashku', english: 'We cook together' }
                                ]
                            },
                            {
                                infinitive: 'shërben',
                                english: 'to serve',
                                type: 'regular (-en)',
                                conjugations: {
                                    'unë': { form: 'shërbej', english: 'I serve' },
                                    'ti': { form: 'shërben', english: 'you serve' },
                                    'ai/ajo': { form: 'shërben', english: 'he/she serves' },
                                    'ne': { form: 'shërbejmë', english: 'we serve' },
                                    'ju': { form: 'shërbeni', english: 'you (plural) serve' },
                                    'ata/ato': { form: 'shërbejnë', english: 'they serve' }
                                },
                                examples: [
                                    { albanian: 'Shërbej darkën për familjen', english: 'I serve dinner for the family' },
                                    { albanian: 'Ti shërben mirë miqtë', english: 'You serve guests well' },
                                    { albanian: 'Ata shërbejnë bukë të ngrohtë', english: 'They serve warm bread' }
                                ]
                            }
                        ],
                        commonPhrases: [
                            { pattern: 'invitation + subjunctive', example: 'Hajde të hamë (Let\\'s eat)', usage: 'Inviting family to share a meal' },
                            { pattern: 'quantity question', example: 'A do pak mish? (Do you want some meat?)', usage: 'Offering food portions politely' },
                            { pattern: 'taste description', example: 'Është e shijshme (It\\'s tasty)', usage: 'Complimenting the cook' }
                        ]
                    },
                    'Home & Rooms': {
                        primaryVerbs: [
                            {
                                infinitive: 'jetoj',
                                english: 'to live',
                                type: 'regular (-oj)',
                                conjugations: {
                                    'unë': { form: 'jetoj', english: 'I live' },
                                    'ti': { form: 'jeton', english: 'you live' },
                                    'ai/ajo': { form: 'jeton', english: 'he/she lives' },
                                    'ne': { form: 'jetojmë', english: 'we live' },
                                    'ju': { form: 'jetoni', english: 'you (plural) live' },
                                    'ata/ato': { form: 'jetojnë', english: 'they live' }
                                },
                                examples: [
                                    { albanian: 'Jetoj në shtëpi të madhe', english: 'I live in a big house' },
                                    { albanian: 'Ne jetojmë së bashku', english: 'We live together' },
                                    { albanian: 'Ajo jeton lart', english: 'She lives upstairs' }
                                ]
                            },
                            {
                                infinitive: 'shkoj',
                                english: 'to go',
                                type: 'irregular',
                                conjugations: {
                                    'unë': { form: 'shkoj', english: 'I go' },
                                    'ti': { form: 'shkon', english: 'you go' },
                                    'ai/ajo': { form: 'shkon', english: 'he/she goes' },
                                    'ne': { form: 'shkojmë', english: 'we go' },
                                    'ju': { form: 'shkoni', english: 'you (plural) go' },
                                    'ata/ato': { form: 'shkojnë', english: 'they go' }
                                },
                                examples: [
                                    { albanian: 'Shkoj në kuzhinë', english: 'I go to the kitchen' },
                                    { albanian: 'Shkojmë në dhomën e ndenjes', english: 'We go to the living room' },
                                    { albanian: 'Ajo shkon lart në dhomë', english: 'She goes upstairs to the room' }
                                ]
                            },
                            {
                                infinitive: 'qëndroj',
                                english: 'to stay',
                                type: 'regular (-oj)',
                                conjugations: {
                                    'unë': { form: 'qëndroj', english: 'I stay' },
                                    'ti': { form: 'qëndron', english: 'you stay' },
                                    'ai/ajo': { form: 'qëndron', english: 'he/she stays' },
                                    'ne': { form: 'qëndrojmë', english: 'we stay' },
                                    'ju': { form: 'qëndroni', english: 'you (plural) stay' },
                                    'ata/ato': { form: 'qëndrojnë', english: 'they stay' }
                                },
                                examples: [
                                    { albanian: 'Qëndroj në dhomën time', english: 'I stay in my room' },
                                    { albanian: 'Ne qëndrojmë në sufrageri', english: 'We stay in the dining room' },
                                    { albanian: 'Ti qëndron këtu sot', english: 'You stay here today' }
                                ]
                            }
                        ],
                        commonPhrases: [
                            { pattern: 'location + definite article', example: 'Në kuzhinë (In the kitchen)', usage: 'Describing where activities happen' },
                            { pattern: 'possession + location', example: 'Dhoma ime është lart (My room is upstairs)', usage: 'Explaining personal space' },
                            { pattern: 'invitation to room', example: 'Ejani në sufrageri (Come to the dining room)', usage: 'Directing family members' }
                        ]
                    },
                    'Daily Activities': {
                        primaryVerbs: [
                            {
                                infinitive: 'punoj',
                                english: 'to work',
                                type: 'regular (-oj)',
                                conjugations: {
                                    'unë': { form: 'punoj', english: 'I work' },
                                    'ti': { form: 'punon', english: 'you work' },
                                    'ai/ajo': { form: 'punon', english: 'he/she works' },
                                    'ne': { form: 'punojmë', english: 'we work' },
                                    'ju': { form: 'punoni', english: 'you (plural) work' },
                                    'ata/ato': { form: 'punojnë', english: 'they work' }
                                },
                                examples: [
                                    { albanian: 'Punoj në mëngjes', english: 'I work in the morning' },
                                    { albanian: 'Ajo punon shumë', english: 'She works a lot' },
                                    { albanian: 'Ne punojmë së bashku', english: 'We work together' }
                                ]
                            },
                            {
                                infinitive: 'lexoj',
                                english: 'to read',
                                type: 'regular (-oj)',
                                conjugations: {
                                    'unë': { form: 'lexoj', english: 'I read' },
                                    'ti': { form: 'lexon', english: 'you read' },
                                    'ai/ajo': { form: 'lexon', english: 'he/she reads' },
                                    'ne': { form: 'lexojmë', english: 'we read' },
                                    'ju': { form: 'lexoni', english: 'you (plural) read' },
                                    'ata/ato': { form: 'lexojnë', english: 'they read' }
                                },
                                examples: [
                                    { albanian: 'Lexoj çdo ditë', english: 'I read every day' },
                                    { albanian: 'Ti lexon libra shqip', english: 'You read Albanian books' },
                                    { albanian: 'Ata lexojnë gazeta', english: 'They read newspapers' }
                                ]
                            },
                            {
                                infinitive: 'fle',
                                english: 'to sleep',
                                type: 'irregular',
                                conjugations: {
                                    'unë': { form: 'fle', english: 'I sleep' },
                                    'ti': { form: 'fle', english: 'you sleep' },
                                    'ai/ajo': { form: 'fle', english: 'he/she sleeps' },
                                    'ne': { form: 'flemë', english: 'we sleep' },
                                    'ju': { form: 'flini', english: 'you (plural) sleep' },
                                    'ata/ato': { form: 'flenë', english: 'they sleep' }
                                },
                                examples: [
                                    { albanian: 'Fle tetë orë', english: 'I sleep eight hours' },
                                    { albanian: 'Ne flemë herët', english: 'We sleep early' },
                                    { albanian: 'Ajo fle mirë', english: 'She sleeps well' }
                                ]
                            }
                        ],
                        commonPhrases: [
                            { pattern: 'activity + time', example: 'Punoj në mëngjes (I work in the morning)', usage: 'Describing daily schedule' },
                            { pattern: 'frequency + activity', example: 'Lexoj çdo ditë (I read every day)', usage: 'Expressing regular habits' },
                            { pattern: 'question about activity', example: 'Çfarë po bën? (What are you doing?)', usage: 'Family check-in conversation' }
                        ]
                    },
                    'Expressing Opinions': {
                        primaryVerbs: [
                            {
                                infinitive: 'mendoj',
                                english: 'to think',
                                type: 'regular (-oj)',
                                conjugations: {
                                    'unë': { form: 'mendoj', english: 'I think' },
                                    'ti': { form: 'mendon', english: 'you think' },
                                    'ai/ajo': { form: 'mendon', english: 'he/she thinks' },
                                    'ne': { form: 'mendojmë', english: 'we think' },
                                    'ju': { form: 'mendoni', english: 'you (plural) think' },
                                    'ata/ato': { form: 'mendojnë', english: 'they think' }
                                },
                                examples: [
                                    { albanian: 'Mendoj se është mirë', english: 'I think it\\'s good' },
                                    { albanian: 'Si mendon për këtë?', english: 'What do you think about this?' },
                                    { albanian: 'Ne mendojmë njësoj', english: 'We think the same' }
                                ]
                            },
                            {
                                infinitive: 'besoj',
                                english: 'to believe',
                                type: 'regular (-oj)',
                                conjugations: {
                                    'unë': { form: 'besoj', english: 'I believe' },
                                    'ti': { form: 'beson', english: 'you believe' },
                                    'ai/ajo': { form: 'beson', english: 'he/she believes' },
                                    'ne': { form: 'besojmë', english: 'we believe' },
                                    'ju': { form: 'besoni', english: 'you (plural) believe' },
                                    'ata/ato': { form: 'besojnë', english: 'they believe' }
                                },
                                examples: [
                                    { albanian: 'Besoj se është e drejtë', english: 'I believe it\\'s right' },
                                    { albanian: 'Ne besojmë në ty', english: 'We believe in you' },
                                    { albanian: 'Ajo beson në familje', english: 'She believes in family' }
                                ]
                            },
                            {
                                infinitive: 'preferoj',
                                english: 'to prefer',
                                type: 'regular (-oj)',
                                conjugations: {
                                    'unë': { form: 'preferoj', english: 'I prefer' },
                                    'ti': { form: 'preferon', english: 'you prefer' },
                                    'ai/ajo': { form: 'preferon', english: 'he/she prefers' },
                                    'ne': { form: 'preferojmë', english: 'we prefer' },
                                    'ju': { form: 'preferoni', english: 'you (plural) prefer' },
                                    'ata/ato': { form: 'preferojnë', english: 'they prefer' }
                                },
                                examples: [
                                    { albanian: 'Preferoj këtë film', english: 'I prefer this movie' },
                                    { albanian: 'Ti preferon çaj', english: 'You prefer tea' },
                                    { albanian: 'Ata preferojnë shtëpinë', english: 'They prefer the house' }
                                ]
                            }
                        ],
                        commonPhrases: [
                            { pattern: 'opinion + subjunctive', example: 'Mendoj se është mirë (I think it\\'s good)', usage: 'Expressing thoughts respectfully' },
                            { pattern: 'agreement expression', example: 'Jam dakord me ty (I agree with you)', usage: 'Showing family unity' },
                            { pattern: 'preference statement', example: 'Më pëlqen kjo (I like this)', usage: 'Expressing personal taste' }
                        ]
                    },
                    'Emotions & Feelings': {
                        primaryVerbs: [
                            {
                                infinitive: 'ndihem',
                                english: 'to feel',
                                type: 'regular (-em)',
                                conjugations: {
                                    'unë': { form: 'ndihem', english: 'I feel' },
                                    'ti': { form: 'ndihesh', english: 'you feel' },
                                    'ai/ajo': { form: 'ndihet', english: 'he/she feels' },
                                    'ne': { form: 'ndihemi', english: 'we feel' },
                                    'ju': { form: 'ndiheni', english: 'you (plural) feel' },
                                    'ata/ato': { form: 'ndihen', english: 'they feel' }
                                },
                                examples: [
                                    { albanian: 'Ndihem mirë sot', english: 'I feel good today' },
                                    { albanian: 'Si ndihesh?', english: 'How do you feel?' },
                                    { albanian: 'Ne ndihemi të lumtur', english: 'We feel happy' }
                                ]
                            },
                            {
                                infinitive: 'jam',
                                english: 'to be',
                                type: 'irregular (copula)',
                                conjugations: {
                                    'unë': { form: 'jam', english: 'I am' },
                                    'ti': { form: 'je', english: 'you are' },
                                    'ai/ajo': { form: 'është', english: 'he/she is' },
                                    'ne': { form: 'jemi', english: 'we are' },
                                    'ju': { form: 'jeni', english: 'you (plural) are' },
                                    'ata/ato': { form: 'janë', english: 'they are' }
                                },
                                examples: [
                                    { albanian: 'Jam i lumtur', english: 'I am happy' },
                                    { albanian: 'Je i trishtuar?', english: 'Are you sad?' },
                                    { albanian: 'Jemi krenarë për ty', english: 'We are proud of you' }
                                ]
                            },
                            {
                                infinitive: 'dukem',
                                english: 'to look/appear',
                                type: 'regular (-em)',
                                conjugations: {
                                    'unë': { form: 'dukem', english: 'I look' },
                                    'ti': { form: 'dukesh', english: 'you look' },
                                    'ai/ajo': { form: 'duket', english: 'he/she looks' },
                                    'ne': { form: 'dukemi', english: 'we look' },
                                    'ju': { form: 'dukeni', english: 'you (plural) look' },
                                    'ata/ato': { form: 'duken', english: 'they look' }
                                },
                                examples: [
                                    { albanian: 'Dukesh i lodhur', english: 'You look tired' },
                                    { albanian: 'Ajo duket e lumtur', english: 'She looks happy' },
                                    { albanian: 'Dukem i shqetësuar', english: 'I look worried' }
                                ]
                            }
                        ],
                        commonPhrases: [
                            { pattern: 'feeling inquiry', example: 'Si ndihesh? (How do you feel?)', usage: 'Showing care for family member' },
                            { pattern: 'emotion + intensifier', example: 'Jam shumë i lumtur (I am very happy)', usage: 'Expressing strong positive feelings' },
                            { pattern: 'observation + emotion', example: 'Dukesh i trishtuar (You look sad)', usage: 'Noticing family member\\'s emotional state' }
                        ]
                    },
                    'Hello and Goodbye': {
                        primaryVerbs: [
                            {
                                infinitive: 'them',
                                english: 'to say',
                                type: 'irregular',
                                conjugations: {
                                    'unë': { form: 'them', english: 'I say' },
                                    'ti': { form: 'thua', english: 'you say' },
                                    'ai/ajo': { form: 'thotë', english: 'he/she says' },
                                    'ne': { form: 'themi', english: 'we say' },
                                    'ju': { form: 'thoni', english: 'you (plural) say' },
                                    'ata/ato': { form: 'thonë', english: 'they say' }
                                },
                                examples: [
                                    { albanian: 'Them mirëmëngjes çdo ditë', english: 'I say good morning every day' },
                                    { albanian: 'Ti thua mirupafshim bukur', english: 'You say goodbye nicely' },
                                    { albanian: 'Ne themi faleminderit', english: 'We say thank you' }
                                ]
                            },
                            {
                                infinitive: 'vij',
                                english: 'to come',
                                type: 'irregular',
                                conjugations: {
                                    'unë': { form: 'vij', english: 'I come' },
                                    'ti': { form: 'vjen', english: 'you come' },
                                    'ai/ajo': { form: 'vjen', english: 'he/she comes' },
                                    'ne': { form: 'vijmë', english: 'we come' },
                                    'ju': { form: 'vini', english: 'you (plural) come' },
                                    'ata/ato': { form: 'vijnë', english: 'they come' }
                                },
                                examples: [
                                    { albanian: 'Vij nesër në mëngjes', english: 'I come tomorrow morning' },
                                    { albanian: 'Ajo vjen shpesh këtu', english: 'She comes here often' },
                                    { albanian: 'Vijmë për darkë', english: 'We come for dinner' }
                                ]
                            },
                            {
                                infinitive: 'shkoj',
                                english: 'to go',
                                type: 'irregular',
                                conjugations: {
                                    'unë': { form: 'shkoj', english: 'I go' },
                                    'ti': { form: 'shkon', english: 'you go' },
                                    'ai/ajo': { form: 'shkon', english: 'he/she goes' },
                                    'ne': { form: 'shkojmë', english: 'we go' },
                                    'ju': { form: 'shkoni', english: 'you (plural) go' },
                                    'ata/ato': { form: 'shkojnë', english: 'they go' }
                                },
                                examples: [
                                    { albanian: 'Shkoj në punë të hënën', english: 'I go to work on Monday' },
                                    { albanian: 'Ne shkojmë së bashku', english: 'We go together' },
                                    { albanian: 'Ata shkojnë herët', english: 'They go early' }
                                ]
                            }
                        ],
                        commonPhrases: [
                            { pattern: 'greeting + time', example: 'Them mirëmëngjes në orën 8 (I say good morning at 8 o\\'clock)', usage: 'Daily greeting routine' },
                            { pattern: 'movement + purpose', example: 'Vij për vizitë (I come for a visit)', usage: 'Explaining visit purpose' },
                            { pattern: 'departure + time', example: 'Shkoj nesër (I go tomorrow)', usage: 'Announcing departure plans' }
                        ]
                    },
                    'Card Game Terms': {
                        primaryVerbs: [
                            {
                                infinitive: 'filloj',
                                english: 'to start',
                                type: 'regular (-oj)',
                                conjugations: {
                                    'unë': { form: 'filloj', english: 'I start' },
                                    'ti': { form: 'fillon', english: 'you start' },
                                    'ai/ajo': { form: 'fillon', english: 'he/she starts' },
                                    'ne': { form: 'fillojmë', english: 'we start' },
                                    'ju': { form: 'filloni', english: 'you (plural) start' },
                                    'ata/ato': { form: 'fillojnë', english: 'they start' }
                                },
                                examples: [
                                    { albanian: 'Filloj lojën e re', english: 'I start the new game' },
                                    { albanian: 'Ti fillon mirë', english: 'You start well' },
                                    { albanian: 'Ne fillojmë mbrëmjen', english: 'We start the evening' }
                                ]
                            },
                            {
                                infinitive: 'ndal',
                                english: 'to stop',
                                type: 'irregular',
                                conjugations: {
                                    'unë': { form: 'ndal', english: 'I stop' },
                                    'ti': { form: 'ndalon', english: 'you stop' },
                                    'ai/ajo': { form: 'ndalon', english: 'he/she stops' },
                                    'ne': { form: 'ndalim', english: 'we stop' },
                                    'ju': { form: 'ndaloni', english: 'you (plural) stop' },
                                    'ata/ato': { form: 'ndalohin', english: 'they stop' }
                                },
                                examples: [
                                    { albanian: 'Ndal për pak', english: 'I stop for a bit' },
                                    { albanian: 'Ajo ndalon lojën', english: 'She stops the game' },
                                    { albanian: 'Ndalim për pushim', english: 'We stop for a break' }
                                ]
                            },
                            {
                                infinitive: 'dua',
                                english: 'to want',
                                type: 'irregular',
                                conjugations: {
                                    'unë': { form: 'dua', english: 'I want' },
                                    'ti': { form: 'do', english: 'you want' },
                                    'ai/ajo': { form: 'do', english: 'he/she wants' },
                                    'ne': { form: 'duam', english: 'we want' },
                                    'ju': { form: 'doni', english: 'you (plural) want' },
                                    'ata/ato': { form: 'duan', english: 'they want' }
                                },
                                examples: [
                                    { albanian: 'Dua të luaj letrat', english: 'I want to play cards' },
                                    { albanian: 'Do një lojë tjetër', english: 'You want another game' },
                                    { albanian: 'Duam të fillojmë', english: 'We want to start' }
                                ]
                            }
                        ],
                        commonPhrases: [
                            { pattern: 'want + infinitive', example: 'Dua të luaj (I want to play)', usage: 'Expressing desire to participate' },
                            { pattern: 'start + object', example: 'Filloj një lojë (I start a game)', usage: 'Initiating card games' },
                            { pattern: 'stop + reason', example: 'Ndal për pushim (I stop for a break)', usage: 'Taking game breaks' }
                        ]
                    },
                    'Winning & Losing': {
                        primaryVerbs: [
                            {
                                infinitive: 'fitoj',
                                english: 'to win',
                                type: 'regular (-oj)',
                                conjugations: {
                                    'unë': { form: 'fitoj', english: 'I win' },
                                    'ti': { form: 'fiton', english: 'you win' },
                                    'ai/ajo': { form: 'fiton', english: 'he/she wins' },
                                    'ne': { form: 'fitojmë', english: 'we win' },
                                    'ju': { form: 'fitoni', english: 'you (plural) win' },
                                    'ata/ato': { form: 'fitojnë', english: 'they win' }
                                },
                                examples: [
                                    { albanian: 'Fitoj rrallëherë', english: 'I win rarely' },
                                    { albanian: 'Ti fiton shpesh', english: 'You win often' },
                                    { albanian: 'Ata fitojnë së bashku', english: 'They win together' }
                                ]
                            },
                            {
                                infinitive: 'humbas',
                                english: 'to lose',
                                type: 'irregular',
                                conjugations: {
                                    'unë': { form: 'humbas', english: 'I lose' },
                                    'ti': { form: 'humbet', english: 'you lose' },
                                    'ai/ajo': { form: 'humbet', english: 'he/she loses' },
                                    'ne': { form: 'humbim', english: 'we lose' },
                                    'ju': { form: 'humbni', english: 'you (plural) lose' },
                                    'ata/ato': { form: 'humbin', english: 'they lose' }
                                },
                                examples: [
                                    { albanian: 'Humbas me dinjitet', english: 'I lose with dignity' },
                                    { albanian: 'Ajo humbet rrallë', english: 'She loses rarely' },
                                    { albanian: 'Humbim si familje', english: 'We lose as a family' }
                                ]
                            },
                            {
                                infinitive: 'provoj',
                                english: 'to try',
                                type: 'regular (-oj)',
                                conjugations: {
                                    'unë': { form: 'provoj', english: 'I try' },
                                    'ti': { form: 'provon', english: 'you try' },
                                    'ai/ajo': { form: 'provon', english: 'he/she tries' },
                                    'ne': { form: 'provojmë', english: 'we try' },
                                    'ju': { form: 'provoni', english: 'you (plural) try' },
                                    'ata/ato': { form: 'provojnë', english: 'they try' }
                                },
                                examples: [
                                    { albanian: 'Provoj përsëri', english: 'I try again' },
                                    { albanian: 'Ti provon fort', english: 'You try hard' },
                                    { albanian: 'Provojmë së bashku', english: 'We try together' }
                                ]
                            }
                        ],
                        commonPhrases: [
                            { pattern: 'win + frequency', example: 'Fitoj ndonjëherë (I win sometimes)', usage: 'Modest success acknowledgment' },
                            { pattern: 'lose + attitude', example: 'Humbas me buzëqeshje (I lose with a smile)', usage: 'Graceful losing in family games' },
                            { pattern: 'try + again', example: 'Provoj përsëri (I try again)', usage: 'Encouraging persistence' }
                        ]
                    },
                    'Expressing Opinions': {
                        primaryVerbs: [
                            {
                                infinitive: 'mendoj',
                                english: 'to think',
                                type: 'regular (-oj)',
                                conjugations: {
                                    'unë': { form: 'mendoj', english: 'I think' },
                                    'ti': { form: 'mendon', english: 'you think' },
                                    'ai/ajo': { form: 'mendon', english: 'he/she thinks' },
                                    'ne': { form: 'mendojmë', english: 'we think' },
                                    'ju': { form: 'mendoni', english: 'you (plural) think' },
                                    'ata/ato': { form: 'mendojnë', english: 'they think' }
                                },
                                examples: [
                                    { albanian: 'Mendoj se është mirë', english: 'I think it\\'s good' },
                                    { albanian: 'Ti mendon ndryshe', english: 'You think differently' },
                                    { albanian: 'Ne mendojmë njësoj', english: 'We think the same' }
                                ]
                            },
                            {
                                infinitive: 'besoj',
                                english: 'to believe',
                                type: 'regular (-oj)',
                                conjugations: {
                                    'unë': { form: 'besoj', english: 'I believe' },
                                    'ti': { form: 'beson', english: 'you believe' },
                                    'ai/ajo': { form: 'beson', english: 'he/she believes' },
                                    'ne': { form: 'besojmë', english: 'we believe' },
                                    'ju': { form: 'besoni', english: 'you (plural) believe' },
                                    'ata/ato': { form: 'besojnë', english: 'they believe' }
                                },
                                examples: [
                                    { albanian: 'Besoj në ty', english: 'I believe in you' },
                                    { albanian: 'Ajo beson fort', english: 'She believes strongly' },
                                    { albanian: 'Besojmë në familje', english: 'We believe in family' }
                                ]
                            },
                            {
                                infinitive: 'pëlqej',
                                english: 'to like',
                                type: 'irregular',
                                conjugations: {
                                    'unë': { form: 'pëlqej', english: 'I like' },
                                    'ti': { form: 'pëlqen', english: 'you like' },
                                    'ai/ajo': { form: 'pëlqen', english: 'he/she likes' },
                                    'ne': { form: 'pëlqejmë', english: 'we like' },
                                    'ju': { form: 'pëlqeni', english: 'you (plural) like' },
                                    'ata/ato': { form: 'pëlqejnë', english: 'they like' }
                                },
                                examples: [
                                    { albanian: 'Më pëlqen ky film', english: 'I like this movie' },
                                    { albanian: 'Ti pëlqen muzikën', english: 'You like music' },
                                    { albanian: 'Na pëlqen kjo ide', english: 'We like this idea' }
                                ]
                            }
                        ],
                        commonPhrases: [
                            { pattern: 'think + that clause', example: 'Mendoj se është e drejtë (I think it\\'s right)', usage: 'Expressing thoughtful opinions' },
                            { pattern: 'believe + in', example: 'Besoj në drejtësi (I believe in justice)', usage: 'Stating core values' },
                            { pattern: 'like + object', example: 'Më pëlqen ideja (I like the idea)', usage: 'Showing preference' }
                        ]
                    }
                };
                
                return verbData[topicName] || { primaryVerbs: [], commonPhrases: [] };
            };
            
            const verbData = getVerbData(topic.name);
            
            return (
                <div className="verb-section">
                    <div style={{maxWidth: '900px', margin: '0 auto'}}>
                        <div style={{textAlign: 'center', marginBottom: '40px'}}>
                            <h3 style={{fontSize: '2em', marginBottom: '15px', color: '#333'}}>
                                Essential Verbs & Conjugations
                            </h3>
                            <p style={{fontSize: '1.2em', color: '#666'}}>
                                Master the verb patterns you'll use in {topic.name.toLowerCase()}
                            </p>
                        </div>
                        
                        {verbData.primaryVerbs.map((verb, verbIndex) => (
                            <div key={verbIndex} style={{
                                background: '#ffffff',
                                border: '2px solid #e2e8f0',
                                borderRadius: '20px',
                                padding: '30px',
                                marginBottom: '30px',
                                boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
                            }}>
                                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '25px'}}>
                                    <div>
                                        <h4 style={{fontSize: '2em', color: '#667eea', fontWeight: 'bold', marginBottom: '5px'}}>
                                            {verb.infinitive}
                                        </h4>
                                        <p style={{fontSize: '1.3em', color: '#333', fontStyle: 'italic'}}>
                                            {verb.english}
                                        </p>
                                    </div>
                                    <div style={{
                                        background: verb.type.includes('irregular') ? '#fef2f2' : '#f0fdf4',
                                        border: \`2px solid \${verb.type.includes('irregular') ? '#ef4444' : '#10b981'}\`,
                                        color: verb.type.includes('irregular') ? '#dc2626' : '#166534',
                                        padding: '8px 16px',
                                        borderRadius: '20px',
                                        fontSize: '0.9em',
                                        fontWeight: '600'
                                    }}>
                                        {verb.type}
                                    </div>
                                </div>
                                
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                                    gap: '15px',
                                    marginBottom: '25px'
                                }}>
                                    {Object.entries(verb.conjugations).map(([pronoun, conjugation]) => (
                                        <div key={pronoun} style={{
                                            background: '#f8faff',
                                            border: '2px solid #e2e8f0',
                                            borderRadius: '10px',
                                            padding: '15px',
                                            textAlign: 'center'
                                        }}>
                                            <div style={{fontWeight: '600', color: '#666', marginBottom: '5px'}}>
                                                {pronoun}
                                            </div>
                                            <div style={{fontSize: '1.3em', fontWeight: 'bold', color: '#667eea', marginBottom: '3px'}}>
                                                {conjugation.form}
                                            </div>
                                            <div style={{fontSize: '0.9em', color: '#888'}}>
                                                {conjugation.english}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                
                                <div style={{
                                    background: '#f0f4ff',
                                    borderLeft: '5px solid #667eea',
                                    padding: '20px',
                                    borderRadius: '10px'
                                }}>
                                    <h5 style={{color: '#4c51bf', fontWeight: '600', marginBottom: '15px', fontSize: '1.1em'}}>
                                        🗣️ Example Sentences
                                    </h5>
                                    <div style={{display: 'grid', gap: '12px'}}>
                                        {verb.examples.map((example, exIndex) => (
                                            <div key={exIndex} style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '10px 0',
                                                borderBottom: exIndex < verb.examples.length - 1 ? '1px solid #e2e8f0' : 'none'
                                            }}>
                                                <span style={{fontWeight: '600', color: '#333'}}>
                                                    {example.albanian}
                                                </span>
                                                <span style={{color: '#666', fontStyle: 'italic'}}>
                                                    {example.english}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                        
                        {verbData.commonPhrases.length > 0 && (
                            <div style={{
                                background: '#fef9e7',
                                border: '2px solid #f59e0b',
                                borderRadius: '15px',
                                padding: '25px',
                                marginBottom: '30px'
                            }}>
                                <h4 style={{color: '#92400e', marginBottom: '20px', fontSize: '1.3em'}}>
                                    📚 Common Sentence Patterns
                                </h4>
                                <div style={{display: 'grid', gap: '15px'}}>
                                    {verbData.commonPhrases.map((phrase, index) => (
                                        <div key={index} style={{
                                            background: 'white',
                                            padding: '15px',
                                            borderRadius: '10px',
                                            borderLeft: '4px solid #f59e0b'
                                        }}>
                                            <div style={{fontWeight: '600', color: '#333', marginBottom: '8px'}}>
                                                Pattern: {phrase.pattern}
                                            </div>
                                            <div style={{fontSize: '1.1em', color: '#667eea', fontWeight: '600', marginBottom: '5px'}}>
                                                {phrase.example}
                                            </div>
                                            <div style={{color: '#666', fontSize: '0.95em'}}>
                                                Usage: {phrase.usage}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        <div style={{
                            background: '#f0fdf4',
                            borderLeft: '5px solid #10b981',
                            padding: '20px',
                            borderRadius: '10px',
                            marginBottom: '30px'
                        }}>
                            <p style={{color: '#166534', fontWeight: '600', marginBottom: '10px'}}>
                                💡 Conjugation Tips
                            </p>
                            <ul style={{color: '#14532d', paddingLeft: '20px', lineHeight: '1.6'}}>
                                <li>Regular -oj verbs follow predictable patterns (fitoj → fitoj, fiton, fitojnë)</li>
                                <li>Irregular verbs like 'luaj' must be memorized individually</li>
                                <li>Pay attention to vowel changes in different persons (luaj → luan)</li>
                                <li>Practice with family members - they'll help correct your pronunciation!</li>
                            </ul>
                        </div>
                        
                        <div style={{display: 'flex', justifyContent: 'center', gap: '20px'}}>
                            <button className="btn btn-outline" onClick={onPrev}>
                                ← Back to Vocabulary
                            </button>
                            <button className="btn btn-primary" onClick={onNext}>
                                Start Practice Exercises →
                            </button>
                        </div>
                    </div>
                </div>
            );
        };
        
        // PracticeSection Component
        const PracticeSection = ({ topic, onNext, onPrev, saveProgress, totalPhrases }) => {
            const [currentExercise, setCurrentExercise] = useState(0);
            const [exerciseData, setExerciseData] = useState(null);
            const [loading, setLoading] = useState(false);
            const [userAnswers, setUserAnswers] = useState({});
            const [exerciseScore, setExerciseScore] = useState({ correct: 0, total: 0 });
            
            // Generate 12-15 exercises using learned content
            const generateExercises = (topicName) => {
                const exercisesByTopic = {
                    'Game Conversation': [
                        // Vocabulary flashcards (4 exercises)
                        { type: 'flashcard', english: 'cards', albanian: 'letërkë', context: 'Used for playing card games with family' },
                        { type: 'flashcard', english: 'turn', albanian: 'radhë', context: 'Essential for game flow and politeness' },
                        { type: 'flashcard', english: 'good game', albanian: 'lojë e mirë', context: 'Shows sportsmanship after playing' },
                        { type: 'flashcard', english: 'player', albanian: 'lojtar', context: 'Refers to anyone participating in the game' },
                        
                        // Verb conjugation exercises (3 exercises)
                        { type: 'conjugation', verb: 'luaj', person: 'ti', correct: 'luan', options: ['luaj', 'luan', 'luajmë', 'luani'], prompt: 'Ti ___ mirë (You play well)' },
                        { type: 'conjugation', verb: 'fitoj', person: 'ajo', correct: 'fiton', options: ['fitoj', 'fiton', 'fitojmë', 'fitoni'], prompt: 'Ajo ___ gjithmonë (She always wins)' },
                        { type: 'conjugation', verb: 'ndaj', person: 'unë', correct: 'ndaj', options: ['ndaj', 'ndan', 'ndajmë', 'ndani'], prompt: 'Unë ___ letërkët (I deal the cards)' },
                        
                        // Conversation scenarios (3 exercises)
                        { 
                            type: 'conversation', 
                            scenario: "You're playing cards with your Albanian family. It's your cousin's turn but they're taking a long time.",
                            prompt: "What do you say politely?",
                            options: [
                                { text: "Është radha jote", correct: true, explanation: "It's your turn - polite reminder" },
                                { text: "Nxitoj!", correct: false, explanation: "Hurry up! - too direct and rude" },
                                { text: "A do të luash?", correct: true, explanation: "Will you play? - gentle encouragement" }
                            ]
                        },
                        {
                            type: 'conversation',
                            scenario: "Your partner's grandmother just won a difficult hand and is celebrating.",
                            prompt: "How do you congratulate her respectfully?",
                            options: [
                                { text: "Mirë luajt!", correct: true, explanation: "Well played! - acknowledges skill" },
                                { text: "Fat!", correct: false, explanation: "Luck! - dismisses her skill" },
                                { text: "Urime për fitoren!", correct: true, explanation: "Congratulations on the win!" }
                            ]
                        },
                        {
                            type: 'conversation',
                            scenario: "The card game is ending and everyone had fun.",
                            prompt: "What's the best way to wrap up the evening?",
                            options: [
                                { text: "Lojë e mirë!", correct: true, explanation: "Good game! - appreciates everyone's participation" },
                                { text: "Mbaroi", correct: false, explanation: "It's over - too abrupt" },
                                { text: "Ishte argëtuese", correct: true, explanation: "It was fun - positive social bonding" }
                            ]
                        },
                        
                        // Fill-in-the-blank exercises (3 exercises)
                        {
                            type: 'fillblank',
                            sentence: "Të gjithë ____?",
                            correct: "gati",
                            english: "Everyone ready?",
                            options: ["gati", "mirë", "këtu", "luan"],
                            explanation: "This is how you ask if everyone is prepared to start the game"
                        },
                        {
                            type: 'fillblank', 
                            sentence: "Unë do të ____ të parët",
                            correct: "ndaj",
                            english: "I'll deal first",
                            options: ["ndaj", "luaj", "fitoj", "kaloj"],
                            explanation: "Taking initiative to distribute cards at the start"
                        },
                        {
                            type: 'fillblank',
                            sentence: "____ e mirë!",
                            correct: "Dorë", 
                            english: "Nice hand!",
                            options: ["Dorë", "Lojë", "Radhë", "Pikë"],
                            explanation: "Complimenting someone's good cards"
                        },
                        
                        // Translation exercises (2 exercises)
                        {
                            type: 'translation',
                            english: "I pass",
                            correct: "Unë kaloj",
                            explanation: "Used when you can't or don't want to play a card"
                        },
                        {
                            type: 'translation',
                            english: "Want to play again?",
                            correct: "Duhet të luajmë përsëri?",
                            explanation: "Inviting others for another round"
                        }
                    ],
                    'Hello and Goodbye': [
                        // Vocabulary flashcards (4 exercises)
                        { type: 'flashcard', english: 'good morning', albanian: 'mirëmëngjes', context: 'Essential greeting until 11 AM in Albanian culture' },
                        { type: 'flashcard', english: 'see you tomorrow', albanian: 'shihemi nesër', context: 'Common farewell from database phrases' },
                        { type: 'flashcard', english: 'today is beautiful', albanian: 'sot është bukur', context: 'Weather comment showing cultural appreciation' },
                        { type: 'flashcard', english: 'yesterday was nice', albanian: 'dje ishte mirë', context: 'Reflecting on past experiences positively' },
                        
                        // Verb conjugation exercises (3 exercises)
                        { type: 'conjugation', verb: 'jam', person: 'unë', correct: 'jam', options: ['jam', 'je', 'është', 'jemi'], prompt: 'Unë ___ mirë (I am well)' },
                        { type: 'conjugation', verb: 'shoh', person: 'ne', correct: 'shohemi', options: ['shoh', 'sheh', 'shohemi', 'shohin'], prompt: 'Ne ___ nesër (We see each other tomorrow)' },
                        { type: 'conjugation', verb: 'qëndroj', person: 'ti', correct: 'qëndron', options: ['qëndroj', 'qëndron', 'qëndrojmë', 'qëndrojnë'], prompt: 'Sa kohë ti ___? (How long do you stay?)' },
                        
                        // Conversation scenarios (3 exercises)
                        { 
                            type: 'conversation', 
                            scenario: "You arrive at your Albanian partner's family home in the morning and want to greet everyone appropriately.",
                            prompt: "What's the best morning greeting?",
                            options: [
                                { text: "Mirëmëngjes, si jeni?", correct: true, explanation: "Good morning, how are you? - proper formal greeting" },
                                { text: "Ç'kemi?", correct: false, explanation: "What's up? - too casual for first meeting" },
                                { text: "Mirëdita", correct: false, explanation: "Good day - wrong time of day" }
                            ]
                        },
                        {
                            type: 'conversation',
                            scenario: "You're leaving your partner's family after a nice visit and want to say goodbye warmly.",
                            prompt: "How do you express a proper farewell?",
                            options: [
                                { text: "Shihemi nesër", correct: true, explanation: "See you tomorrow - warm and specific" },
                                { text: "Mirupafshim", correct: true, explanation: "Goodbye (formal) - shows respect" },
                                { text: "Ikam", correct: false, explanation: "I'm leaving - too abrupt" }
                            ]
                        },
                        {
                            type: 'conversation',
                            scenario: "Someone asks about your impression of today's weather during small talk.",
                            prompt: "How do you compliment the day?",
                            options: [
                                { text: "Sot është bukur", correct: true, explanation: "Today is beautiful - positive weather comment" },
                                { text: "Kohë e mirë", correct: true, explanation: "Nice weather - appropriate response" },
                                { text: "Nuk më pëlqen", correct: false, explanation: "I don't like it - negative response" }
                            ]
                        },
                        
                        // Fill-in-the-blank exercises (3 exercises)
                        {
                            type: 'fillblank',
                            sentence: "Mirëmëngjes, si ____?",
                            correct: "jeni",
                            english: "Good morning, how are you?",
                            options: ["jeni", "është", "jam", "janë"],
                            explanation: "Formal 'you' shows respect when greeting family elders"
                        },
                        {
                            type: 'fillblank', 
                            sentence: "____ nesër",
                            correct: "Shihemi",
                            english: "See you tomorrow",
                            options: ["Shihemi", "Takohemi", "Vemi", "Shkojmë"],
                            explanation: "Common way to say goodbye with specific timeframe"
                        },
                        {
                            type: 'fillblank',
                            sentence: "Sa kohë mund të ____?",
                            correct: "qëndrosh", 
                            english: "How long can you stay?",
                            options: ["qëndrosh", "shkosh", "vish", "flasësh"],
                            explanation: "Asking about visit duration shows hospitality"
                        },
                        
                        // Translation exercises (2 exercises)
                        {
                            type: 'translation',
                            english: "Not long ago",
                            correct: "Jo shumë kohë më parë",
                            explanation: "Time reference from database showing recent past"
                        },
                        {
                            type: 'translation',
                            english: "In a moment",
                            correct: "Në një moment",
                            explanation: "Near future time expression from database"
                        }
                    ],
                    'Food Names': [
                        // Vocabulary flashcards (4 exercises)
                        { type: 'flashcard', english: 'bread', albanian: 'bukë', context: 'Albanian bread is served with every meal and considered sacred' },
                        { type: 'flashcard', english: 'byrek', albanian: 'byrek', context: 'Traditional Albanian pastry that connects families across generations' },
                        { type: 'flashcard', english: 'let\\'s eat together', albanian: 'hajde të hamë së bashku', context: 'Core phrase embodying Albanian hospitality spirit' },
                        { type: 'flashcard', english: 'meat', albanian: 'mish', context: 'Usually lamb or beef, central to Albanian family celebrations' },
                        
                        // Verb conjugation exercises (3 exercises)
                        { type: 'conjugation', verb: 'ha', person: 'ne', correct: 'hamë', options: ['ha', 'han', 'hamë', 'hani'], prompt: 'Ne ___ së bashku (We eat together)' },
                        { type: 'conjugation', verb: 'gatuaj', person: 'ajo', correct: 'gatuan', options: ['gatuaj', 'gatuan', 'gatuajmë', 'gatuani'], prompt: 'Ajo ___ mirë (She cooks well)' },
                        { type: 'conjugation', verb: 'shërben', person: 'unë', correct: 'shërbej', options: ['shërbej', 'shërben', 'shërbejmë', 'shërbeni'], prompt: 'Unë ___ darkën (I serve dinner)' },
                        
                        // Conversation scenarios (3 exercises)
                        { 
                            type: 'conversation', 
                            scenario: "You're at a family dinner and the host is offering you more food.",
                            prompt: "How do you politely accept more meat?",
                            options: [
                                { text: "Po, pak mish", correct: true, explanation: "Yes, some meat - polite acceptance" },
                                { text: "Shumë mish", correct: false, explanation: "Lots of meat - sounds greedy" },
                                { text: "Do pak", correct: true, explanation: "I want some - simple acceptance" }
                            ]
                        },
                        {
                            type: 'conversation',
                            scenario: "Your partner's mother just served her famous byrek and asks how you like it.",
                            prompt: "How do you compliment the cook?",
                            options: [
                                { text: "Është e shijshme", correct: true, explanation: "It's tasty - perfect compliment" },
                                { text: "Mirë është", correct: true, explanation: "It's good - appropriate praise" },
                                { text: "Nuk di", correct: false, explanation: "I don't know - sounds uncertain" }
                            ]
                        },
                        {
                            type: 'conversation',
                            scenario: "Everyone is sitting around the table and you want to invite them to start eating.",
                            prompt: "What's the best invitation to begin the meal?",
                            options: [
                                { text: "Hajde të hamë së bashku", correct: true, explanation: "Let's eat together - embodies Albanian family values" },
                                { text: "Fillojmë", correct: false, explanation: "Let's start - too direct" },
                                { text: "Hani", correct: false, explanation: "Eat - sounds like a command" }
                            ]
                        },
                        
                        // Fill-in-the-blank exercises (3 exercises)
                        {
                            type: 'fillblank',
                            sentence: "Buka është e ____",
                            correct: "freskët",
                            english: "The bread is fresh",
                            options: ["freskët", "vjetër", "e madhe", "e vogël"],
                            explanation: "Fresh bread is a source of pride in Albanian households"
                        },
                        {
                            type: 'fillblank', 
                            sentence: "A do pak ____?",
                            correct: "mish",
                            english: "Do you want some meat?",
                            options: ["mish", "bukë", "ujë", "kafe"],
                            explanation: "Polite way to offer protein at family meals"
                        },
                        {
                            type: 'fillblank',
                            sentence: "Perime të ____ janë të shëndetshme",
                            correct: "freskëta", 
                            english: "Fresh vegetables are healthy",
                            options: ["freskëta", "gatuara", "të ftohta", "të ngrohta"],
                            explanation: "Emphasizing quality and health benefits of fresh produce"
                        },
                        
                        // Translation exercises (2 exercises)
                        {
                            type: 'translation',
                            english: "The chicken is tasty",
                            correct: "Pula është e shijshme",
                            explanation: "Complimenting the cook shows appreciation for their effort"
                        },
                        {
                            type: 'translation',
                            english: "Cold water, please",
                            correct: "Ujë i ftohtë, ju lutem",
                            explanation: "Polite request using formal 'please' for respectful communication"
                        }
                    ],
                    'Home & Rooms': [
                        // Vocabulary flashcards (4 exercises)
                        { type: 'flashcard', english: 'kitchen', albanian: 'kuzhinë', context: 'Heart of Albanian family activity where meals bring everyone together' },
                        { type: 'flashcard', english: 'my room', albanian: 'dhoma ime', context: 'Personal space that shows integration into family home structure' },
                        { type: 'flashcard', english: 'dining room', albanian: 'sufrageri', context: 'Where family meals are shared and important discussions happen' },
                        { type: 'flashcard', english: 'living room', albanian: 'dhomë ndenje', context: 'Where guests are welcomed with coffee and conversation' },
                        
                        // Verb conjugation exercises (3 exercises)
                        { type: 'conjugation', verb: 'jetoj', person: 'ne', correct: 'jetojmë', options: ['jetoj', 'jeton', 'jetojmë', 'jetoni'], prompt: 'Ne ___ së bashku (We live together)' },
                        { type: 'conjugation', verb: 'shkoj', person: 'ti', correct: 'shkon', options: ['shkoj', 'shkon', 'shkojmë', 'shkoni'], prompt: 'Ti ___ në kuzhinë (You go to the kitchen)' },
                        { type: 'conjugation', verb: 'qëndroj', person: 'ajo', correct: 'qëndron', options: ['qëndroj', 'qëndron', 'qëndrojmë', 'qëndroni'], prompt: 'Ajo ___ këtu (She stays here)' },
                        
                        // Conversation scenarios (3 exercises)
                        { 
                            type: 'conversation', 
                            scenario: "You're visiting your partner's family home and they're showing you around.",
                            prompt: "How do you compliment their house?",
                            options: [
                                { text: "Kjo shtëpi është e bukur", correct: true, explanation: "This house is beautiful - genuine appreciation" },
                                { text: "Shtëpi e madhe", correct: true, explanation: "Big house - positive observation" },
                                { text: "Ku është banjo?", correct: false, explanation: "Where's the bathroom? - too direct for house tour" }
                            ]
                        },
                        {
                            type: 'conversation',
                            scenario: "Your partner's mother asks if you'd like to see your room upstairs.",
                            prompt: "How do you respond to this hospitality?",
                            options: [
                                { text: "Po, faleminderit", correct: true, explanation: "Yes, thank you - gracious acceptance" },
                                { text: "Dhoma ime është lart?", correct: true, explanation: "My room is upstairs? - shows integration" },
                                { text: "Jo, nuk dua", correct: false, explanation: "No, I don't want to - sounds ungrateful" }
                            ]
                        },
                        {
                            type: 'conversation',
                            scenario: "Everyone is gathering for dinner and you want to know where to go.",
                            prompt: "How do you ask about the dining location?",
                            options: [
                                { text: "Ku hamë?", correct: true, explanation: "Where do we eat? - practical question" },
                                { text: "Në sufrageri?", correct: true, explanation: "In the dining room? - shows knowledge of house layout" },
                                { text: "Kush ha?", correct: false, explanation: "Who eats? - wrong question word" }
                            ]
                        },
                        
                        // Fill-in-the-blank exercises (3 exercises)
                        {
                            type: 'fillblank',
                            sentence: "Kuzhina është e ____",
                            correct: "madhe",
                            english: "The kitchen is big",
                            options: ["madhe", "vogël", "e mirë", "e re"],
                            explanation: "Commenting on kitchen size shows appreciation for family space"
                        },
                        {
                            type: 'fillblank', 
                            sentence: "____ ime është lart",
                            correct: "Dhoma",
                            english: "My room is upstairs",
                            options: ["Dhoma", "Kuzhina", "Banjo", "Dera"],
                            explanation: "Shows personal integration into family home structure"
                        },
                        {
                            type: 'fillblank',
                            sentence: "Banjo është ____ dhomës",
                            correct: "pranë", 
                            english: "The bathroom is next to the room",
                            options: ["pranë", "mbi", "nën", "para"],
                            explanation: "Understanding spatial relationships helps navigate the home"
                        },
                        
                        // Translation exercises (2 exercises)
                        {
                            type: 'translation',
                            english: "We live together",
                            correct: "Ne jetojmë së bashku",
                            explanation: "Expressing family unity and shared living arrangements"
                        },
                        {
                            type: 'translation',
                            english: "The door is open",
                            correct: "Dera është e hapur",
                            explanation: "Albanian homes often have open doors symbolizing hospitality"
                        }
                    ],
                    'Daily Activities': [
                        // Vocabulary flashcards (4 exercises)
                        { type: 'flashcard', english: 'what are you doing now', albanian: 'çfarë po bën tani', context: 'Common family check-in question showing care and connection' },
                        { type: 'flashcard', english: 'one, two, three', albanian: 'një, dy, tre', context: 'Basic counting essential for daily scheduling and activities' },
                        { type: 'flashcard', english: 'count to ten', albanian: 'numëro deri në dhjetë', context: 'Counting exercise from database showing learning progression' },
                        { type: 'flashcard', english: 'we gather every sunday', albanian: 'ne mbledhim çdo të dielë', context: 'Weekly family tradition from database showing cultural patterns' },
                        
                        // Verb conjugation exercises (3 exercises)
                        { type: 'conjugation', verb: 'punoj', person: 'unë', correct: 'punoj', options: ['punoj', 'punon', 'punojmë', 'punoni'], prompt: 'Unë ___ në mëngjes (I work in the morning)' },
                        { type: 'conjugation', verb: 'lexoj', person: 'ajo', correct: 'lexon', options: ['lexoj', 'lexon', 'lexojmë', 'lexoni'], prompt: 'Ajo ___ çdo ditë (She reads every day)' },
                        { type: 'conjugation', verb: 'fle', person: 'ne', correct: 'flemë', options: ['fle', 'flen', 'flemë', 'flini'], prompt: 'Ne ___ herët (We sleep early)' },
                        
                        // Conversation scenarios (3 exercises)
                        { 
                            type: 'conversation', 
                            scenario: "Your partner's father asks about your daily routine to understand your schedule.",
                            prompt: "How do you explain when you work?",
                            options: [
                                { text: "Punoj në mëngjes", correct: true, explanation: "I work in the morning - clear schedule information" },
                                { text: "Gjithmonë punoj", correct: false, explanation: "I always work - sounds like you never have family time" },
                                { text: "Nuk punoj", correct: false, explanation: "I don't work - might create misunderstanding" }
                            ]
                        },
                        {
                            type: 'conversation',
                            scenario: "Someone notices you reading Albanian books and asks about your learning routine.",
                            prompt: "How do you describe your reading habit?",
                            options: [
                                { text: "Lexoj çdo ditë", correct: true, explanation: "I read every day - shows commitment to learning" },
                                { text: "Lexoj ndonjëherë", correct: true, explanation: "I read sometimes - honest about frequency" },
                                { text: "Nuk lexoj", correct: false, explanation: "I don't read - contradicts what they observed" }
                            ]
                        },
                        {
                            type: 'conversation',
                            scenario: "The family is discussing the Sunday gathering tradition and asks if you understand.",
                            prompt: "How do you show you know about their family tradition?",
                            options: [
                                { text: "Ne mbledhim çdo të dielë", correct: true, explanation: "We gather every Sunday - shows family integration" },
                                { text: "E di traditën", correct: true, explanation: "I know the tradition - acknowledges family custom" },
                                { text: "Çfarë është kjo?", correct: false, explanation: "What is this? - shows lack of understanding" }
                            ]
                        },
                        
                        // Fill-in-the-blank exercises (3 exercises)
                        {
                            type: 'fillblank',
                            sentence: "Çfarë po ____ tani?",
                            correct: "bën",
                            english: "What are you doing now?",
                            options: ["bën", "thua", "han", "lexon"],
                            explanation: "Family check-in question showing interest in each other's activities"
                        },
                        {
                            type: 'fillblank', 
                            sentence: "Një herë në ____",
                            correct: "javë",
                            english: "Once a week",
                            options: ["javë", "ditë", "muaj", "vit"],
                            explanation: "Weekly frequency from database showing routine patterns"
                        },
                        {
                            type: 'fillblank',
                            sentence: "Numëro deri në ____",
                            correct: "dhjetë", 
                            english: "Count to ten",
                            options: ["dhjetë", "pesë", "tre", "njëzet"],
                            explanation: "Basic counting exercise from database for learning progression"
                        },
                        
                        // Translation exercises (2 exercises)
                        {
                            type: 'translation',
                            english: "Twice a month",
                            correct: "Dy herë në muaj",
                            explanation: "Monthly frequency pattern from database showing regular scheduling"
                        },
                        {
                            type: 'translation',
                            english: "I sleep eight hours",
                            correct: "Fle tetë orë",
                            explanation: "Daily routine description combining number and activity"
                        }
                    ],
                    'Expressing Opinions': [
                        // Vocabulary flashcards (4 exercises)
                        { type: 'flashcard', english: 'I think this is good', albanian: 'mendoj se kjo është e mirë', context: 'Respectful way to express positive opinions in Albanian families' },
                        { type: 'flashcard', english: 'I agree with you', albanian: 'jam dakord me ty', context: 'Shows family unity and respectful discussion culture' },
                        { type: 'flashcard', english: 'maybe', albanian: 'ndoshta', context: 'Expressing uncertainty while maintaining respectful dialogue' },
                        { type: 'flashcard', english: 'in my opinion', albanian: 'sipas meje', context: 'Introducing personal viewpoints respectfully in family discussions' },
                        
                        // Verb conjugation exercises (3 exercises)
                        { type: 'conjugation', verb: 'mendoj', person: 'ti', correct: 'mendon', options: ['mendoj', 'mendon', 'mendojmë', 'mendoni'], prompt: 'Si ti ___? (What do you think?)' },
                        { type: 'conjugation', verb: 'besoj', person: 'ne', correct: 'besojmë', options: ['besoj', 'beson', 'besojmë', 'besoni'], prompt: 'Ne ___ në ty (We believe in you)' },
                        { type: 'conjugation', verb: 'preferoj', person: 'ajo', correct: 'preferon', options: ['preferoj', 'preferon', 'preferojmë', 'preferoni'], prompt: 'Ajo ___ çaj (She prefers tea)' },
                        
                        // Conversation scenarios (3 exercises)
                        { 
                            type: 'conversation', 
                            scenario: "The family is discussing plans for next weekend and asks for your input.",
                            prompt: "How do you share your positive opinion respectfully?",
                            options: [
                                { text: "Mendoj se është mirë", correct: true, explanation: "I think it's good - respectful opinion sharing" },
                                { text: "Sipas meje, po", correct: true, explanation: "In my opinion, yes - thoughtful response" },
                                { text: "Jo, nuk më pëlqen", correct: false, explanation: "No, I don't like it - too direct for family harmony" }
                            ]
                        },
                        {
                            type: 'conversation',
                            scenario: "Your partner's mother suggests a family activity and everyone looks to you for agreement.",
                            prompt: "How do you show support for the family decision?",
                            options: [
                                { text: "Jam dakord me ju", correct: true, explanation: "I agree with you - shows family unity" },
                                { text: "Sigurisht", correct: true, explanation: "Definitely - enthusiastic agreement" },
                                { text: "Nuk jam i sigurt", correct: false, explanation: "I'm not sure - creates hesitation" }
                            ]
                        },
                        {
                            type: 'conversation',
                            scenario: "There's a discussion about which movie to watch and you have a preference.",
                            prompt: "How do you express your movie preference politely?",
                            options: [
                                { text: "Më pëlqen ky film", correct: true, explanation: "I like this movie - clear preference" },
                                { text: "Preferoj këtë", correct: true, explanation: "I prefer this - direct but polite" },
                                { text: "Tjetrin jo", correct: false, explanation: "Not the other one - negative focus" }
                            ]
                        },
                        
                        // Fill-in-the-blank exercises (3 exercises)
                        {
                            type: 'fillblank',
                            sentence: "Mendoj se ____ është e mirë",
                            correct: "kjo",
                            english: "I think this is good",
                            options: ["kjo", "ajo", "këto", "ato"],
                            explanation: "Demonstrative pronoun agreement for expressing opinions about nearby things"
                        },
                        {
                            type: 'fillblank', 
                            sentence: "Jam dakord ____ ty",
                            correct: "me",
                            english: "I agree with you",
                            options: ["me", "për", "nga", "te"],
                            explanation: "Preposition showing agreement relationship in Albanian"
                        },
                        {
                            type: 'fillblank',
                            sentence: "____ meje është e drejtë",
                            correct: "Sipas", 
                            english: "In my opinion it's right",
                            options: ["Sipas", "Për", "Me", "Pa"],
                            explanation: "Formal way to introduce personal opinions in family discussions"
                        },
                        
                        // Translation exercises (2 exercises)
                        {
                            type: 'translation',
                            english: "I don't think so",
                            correct: "Nuk mendoj",
                            explanation: "Polite way to disagree without creating family tension"
                        },
                        {
                            type: 'translation',
                            english: "What do you think about this idea?",
                            correct: "Si mendon për këtë ide?",
                            explanation: "Asking for opinions respectfully to include everyone in discussions"
                        }
                    ],
                    'Emotions & Feelings': [
                        // Vocabulary flashcards (4 exercises)
                        { type: 'flashcard', english: 'how do you feel today', albanian: 'si ndihesh sot', context: 'Caring family inquiry showing genuine interest in emotional wellbeing' },
                        { type: 'flashcard', english: 'I am very happy', albanian: 'jam shumë i lumtur', context: 'Expressing joy openly to strengthen family emotional bonds' },
                        { type: 'flashcard', english: 'we are happy for you', albanian: 'jemi të gëzuar për ty', context: 'Family support expression showing collective celebration' },
                        { type: 'flashcard', english: 'worried', albanian: 'i shqetësuar', context: 'Acknowledging difficult emotions with family support available' },
                        
                        // Verb conjugation exercises (3 exercises)
                        { type: 'conjugation', verb: 'ndihem', person: 'ti', correct: 'ndihesh', options: ['ndihem', 'ndihesh', 'ndihet', 'ndihemi'], prompt: 'Si ___ sot? (How do you feel today?)' },
                        { type: 'conjugation', verb: 'jam', person: 'ne', correct: 'jemi', options: ['jam', 'je', 'është', 'jemi'], prompt: 'Ne ___ krenarë (We are proud)' },
                        { type: 'conjugation', verb: 'dukem', person: 'ajo', correct: 'duket', options: ['dukem', 'dukesh', 'duket', 'dukemi'], prompt: 'Ajo ___ e trishtuar (She looks sad)' },
                        
                        // Conversation scenarios (3 exercises)
                        { 
                            type: 'conversation', 
                            scenario: "Your partner's mother notices you seem quiet and asks about your wellbeing.",
                            prompt: "How do you respond to her caring inquiry?",
                            options: [
                                { text: "Ndihem mirë", correct: true, explanation: "I feel good - positive response" },
                                { text: "Pak i lodhur", correct: true, explanation: "A bit tired - honest but not alarming" },
                                { text: "Gjithçka në rregull", correct: true, explanation: "Everything is fine - reassuring response" }
                            ]
                        },
                        {
                            type: 'conversation',
                            scenario: "Your partner just got good news and the family is celebrating together.",
                            prompt: "How do you express happiness for them?",
                            options: [
                                { text: "Jemi të gëzuar për ty", correct: true, explanation: "We are happy for you - family celebration" },
                                { text: "Jam krenar për ty", correct: true, explanation: "I'm proud of you - personal support" },
                                { text: "Mirë për ty", correct: false, explanation: "Good for you - sounds less enthusiastic" }
                            ]
                        },
                        {
                            type: 'conversation',
                            scenario: "You notice your partner's sister looks upset after a phone call.",
                            prompt: "How do you show concern appropriately?",
                            options: [
                                { text: "Si ndihesh?", correct: true, explanation: "How do you feel? - caring inquiry" },
                                { text: "Çfarë ndodhi?", correct: true, explanation: "What happened? - offering to listen" },
                                { text: "Mos u shqetëso", correct: false, explanation: "Don't worry - dismisses their feelings" }
                            ]
                        },
                        
                        // Fill-in-the-blank exercises (3 exercises)
                        {
                            type: 'fillblank',
                            sentence: "Si ____ sot?",
                            correct: "ndihesh",
                            english: "How do you feel today?",
                            options: ["ndihesh", "dukesh", "je", "qëndron"],
                            explanation: "Caring question about emotional state from family member"
                        },
                        {
                            type: 'fillblank', 
                            sentence: "Jam shumë i ____",
                            correct: "lumtur",
                            english: "I am very happy",
                            options: ["lumtur", "trishtuar", "lodhur", "shqetësuar"],
                            explanation: "Expressing strong positive emotion to share joy with family"
                        },
                        {
                            type: 'fillblank',
                            sentence: "Ajo duket e ____",
                            correct: "trishtuar", 
                            english: "She looks sad",
                            options: ["trishtuar", "lumtur", "zemëruar", "qetë"],
                            explanation: "Observing family member's emotional state with empathy"
                        },
                        
                        // Translation exercises (2 exercises)
                        {
                            type: 'translation',
                            english: "I feel calm",
                            correct: "Ndihem i qetë",
                            explanation: "Expressing peaceful emotional state showing family harmony"
                        },
                        {
                            type: 'translation',
                            english: "You look tired",
                            correct: "Dukesh i lodhur",
                            explanation: "Caring observation that might lead to family support being offered"
                        }
                    ],
                    'Card Game Terms': [
                        // Vocabulary flashcards (4 exercises) - using database phrases
                        { type: 'flashcard', english: 'one more game', albanian: 'një lojë tjetër', context: 'Suggesting another round from database - keeps family fun going' },
                        { type: 'flashcard', english: 'let\\'s start a game', albanian: 'le të fillojmë një lojë', context: 'Game initiation from database - brings family together' },
                        { type: 'flashcard', english: 'nice hand', albanian: 'dorë e mirë', context: 'Complimenting card hand from database - positive family interaction' },
                        { type: 'flashcard', english: 'everyone ready', albanian: 'të gjithë gati', context: 'Checking readiness from database - inclusive family approach' },
                        
                        // Verb conjugation exercises (3 exercises)
                        { type: 'conjugation', verb: 'luaj', person: 'ne', correct: 'luajmë', options: ['luaj', 'luan', 'luajmë', 'luani'], prompt: 'Ne ___ letrat (We play cards)' },
                        { type: 'conjugation', verb: 'filloj', person: 'ti', correct: 'fillon', options: ['filloj', 'fillon', 'fillojmë', 'filloni'], prompt: 'Ti ___ lojën (You start the game)' },
                        { type: 'conjugation', verb: 'thërres', person: 'njëri', correct: 'thërret', options: ['thërres', 'thërret', 'thërresim', 'thërresin'], prompt: 'Njëri më ___ (Someone calls me)' },
                        
                        // Conversation scenarios (3 exercises)
                        { 
                            type: 'conversation', 
                            scenario: "The current card game just finished and everyone had fun. You want to suggest continuing.",
                            prompt: "How do you suggest playing another round?",
                            options: [
                                { text: "Një lojë tjetër?", correct: true, explanation: "One more game? - perfect invitation from database" },
                                { text: "Le të fillojmë një lojë", correct: true, explanation: "Let's start a game - enthusiastic suggestion" },
                                { text: "A doni të vazhdoni?", correct: false, explanation: "Do you want to continue? - less specific" }
                            ]
                        },
                        {
                            type: 'conversation',
                            scenario: "Your partner just got dealt excellent cards and you want to compliment them.",
                            prompt: "How do you acknowledge their good cards?",
                            options: [
                                { text: "Dorë e mirë!", correct: true, explanation: "Nice hand! - perfect compliment from database" },
                                { text: "Karta të mira", correct: true, explanation: "Good cards - appropriate praise" },
                                { text: "Ke fat", correct: false, explanation: "You're lucky - diminishes their skill" }
                            ]
                        },
                        {
                            type: 'conversation',
                            scenario: "You're about to start a new card game and want to make sure everyone is prepared.",
                            prompt: "How do you check if everyone is ready?",
                            options: [
                                { text: "Të gjithë gati?", correct: true, explanation: "Everyone ready? - inclusive check from database" },
                                { text: "A jeni gati?", correct: true, explanation: "Are you ready? - formal version" },
                                { text: "Fillojmë tani", correct: false, explanation: "Let's start now - doesn't check readiness" }
                            ]
                        },
                        
                        // Fill-in-the-blank exercises (3 exercises)
                        {
                            type: 'fillblank',
                            sentence: "Le të fillojmë një ____",
                            correct: "lojë",
                            english: "Let's start a game",
                            options: ["lojë", "kartë", "dorë", "radhë"],
                            explanation: "Database phrase for initiating card games with family"
                        },
                        {
                            type: 'fillblank', 
                            sentence: "Të gjithë ____?",
                            correct: "gati",
                            english: "Everyone ready?",
                            options: ["gati", "këtu", "mirë", "lumtur"],
                            explanation: "Inclusive check from database before starting games"
                        },
                        {
                            type: 'fillblank',
                            sentence: "Njëri më ____",
                            correct: "thërret", 
                            english: "Someone's calling me",
                            options: ["thërret", "sheh", "pret", "dëgjon"],
                            explanation: "Interruption excuse from database during card games"
                        },
                        
                        // Translation exercises (2 exercises)
                        {
                            type: 'translation',
                            english: "The deck is shuffled",
                            correct: "Deka është e përzier",
                            explanation: "Card preparation phrase showing game organization"
                        },
                        {
                            type: 'translation',
                            english: "This is interesting",
                            correct: "Kjo është interesante",
                            explanation: "Commentary on game developments from database"
                        }
                    ],
                    'Winning & Losing': [
                        // Vocabulary flashcards (4 exercises) - using database phrases
                        { type: 'flashcard', english: 'unlucky', albanian: 'i pa fat', context: 'Having bad luck from database - removes personal blame in family games' },
                        { type: 'flashcard', english: 'game', albanian: 'lojë', context: 'Any match from database - central concept in family entertainment' },
                        { type: 'flashcard', english: 'who\\'s next', albanian: 'kush është radha', context: 'Turn order question from database - maintains game flow' },
                        { type: 'flashcard', english: 'lucky', albanian: 'me fat', context: 'Having good fortune from database - positive attribution' },
                        
                        // Verb conjugation exercises (3 exercises)
                        { type: 'conjugation', verb: 'fitoj', person: 'unë', correct: 'fitoj', options: ['fitoj', 'fiton', 'fitojmë', 'fitoni'], prompt: 'Unë ___ rrallë (I win rarely)' },
                        { type: 'conjugation', verb: 'humbas', person: 'ajo', correct: 'humbet', options: ['humbas', 'humbet', 'humbim', 'humbni'], prompt: 'Ajo ___ ndonjëherë (She loses sometimes)' },
                        { type: 'conjugation', verb: 'është', person: 'radha', correct: 'është', options: ['jam', 'je', 'është', 'jemi'], prompt: 'Kush ___ radha? (Whose turn is it?)' },
                        
                        // Conversation scenarios (3 exercises)
                        { 
                            type: 'conversation', 
                            scenario: "You just lost a card game but want to maintain good family atmosphere.",
                            prompt: "How do you gracefully accept the loss?",
                            options: [
                                { text: "Jam i pa fat sot", correct: true, explanation: "I'm unlucky today - removes blame from database" },
                                { text: "Lojë e mirë", correct: true, explanation: "Good game - focuses on fun, not outcome" },
                                { text: "Nuk luaj mirë", correct: false, explanation: "I don't play well - too self-critical" }
                            ]
                        },
                        {
                            type: 'conversation',
                            scenario: "The game is progressing and you need to know whose turn comes next.",
                            prompt: "How do you ask about turn order?",
                            options: [
                                { text: "Kush është radha tani?", correct: true, explanation: "Who's next now? - clear question from database" },
                                { text: "Kush luan?", correct: true, explanation: "Who plays? - simple version" },
                                { text: "Çfarë ndodh?", correct: false, explanation: "What's happening? - too vague" }
                            ]
                        },
                        {
                            type: 'conversation',
                            scenario: "You're having a particularly fortunate evening and winning multiple games.",
                            prompt: "How do you acknowledge your good fortune modestly?",
                            options: [
                                { text: "Jam me fat sonte", correct: true, explanation: "I'm lucky tonight - modest attribution from database" },
                                { text: "Kjo është e mirë", correct: true, explanation: "This is good - general positive comment" },
                                { text: "Jam shumë i mirë", correct: false, explanation: "I'm very good - sounds boastful" }
                            ]
                        },
                        
                        // Fill-in-the-blank exercises (3 exercises)
                        {
                            type: 'fillblank',
                            sentence: "Kjo lojë është e ____",
                            correct: "mirë",
                            english: "This game is good",
                            options: ["mirë", "keqe", "vështirë", "lehtë"],
                            explanation: "Positive game assessment from database maintaining family harmony"
                        },
                        {
                            type: 'fillblank', 
                            sentence: "Jam i pa ____ sot",
                            correct: "fat",
                            english: "I'm unlucky today",
                            options: ["fat", "mirë", "lumtur", "qetë"],
                            explanation: "Database phrase removing personal blame for poor game performance"
                        },
                        {
                            type: 'fillblank',
                            sentence: "Kush do të luajë me ____?",
                            correct: "letra", 
                            english: "Who wants to play with cards?",
                            options: ["letra", "dorë", "pikë", "radhë"],
                            explanation: "Card game invitation from database including everyone"
                        },
                        
                        // Translation exercises (2 exercises)
                        {
                            type: 'translation',
                            english: "Jack wins over ten",
                            correct: "Xhaku fiton mbi dhjetën",
                            explanation: "Card hierarchy knowledge from database showing game understanding"
                        },
                        {
                            type: 'translation',
                            english: "Let's take a break",
                            correct: "Le të marrim një pushim",
                            explanation: "Pause suggestion from database for family bonding time"
                        }
                    ]
                };
                
                return exercisesByTopic[topicName] || [];
            };
            
            const exercises = generateExercises(topic.name);
            const currentExerciseData = exercises[currentExercise];
            
            const handleExerciseComplete = (isCorrect) => {
                setExerciseScore(prev => ({
                    correct: prev.correct + (isCorrect ? 1 : 0),
                    total: prev.total + 1
                }));
                
                setTimeout(() => {
                    if (currentExercise < exercises.length - 1) {
                        setCurrentExercise(currentExercise + 1);
                    } else {
                        // Complete topic
                        const accuracy = Math.round((exerciseScore.correct + (isCorrect ? 1 : 0)) / (exerciseScore.total + 1) * 100);
                        const newLearnedCount = parseInt(localStorage.getItem('learnedCount') || '0') + Math.floor(exercises.length / 3);
                        saveProgress({ 
                            learnedCount: newLearnedCount,
                            [\`topics.\${topic.id}\`]: accuracy 
                        });
                        
                        alert(\`Topic completed! You got \${exerciseScore.correct + (isCorrect ? 1 : 0)} out of \${exerciseScore.total + 1} correct (\${accuracy}%)\`);
                        onNext();
                    }
                }, 400);
            };
            
            if (!currentExerciseData) {
                return (
                    <div style={{textAlign: 'center', padding: '100px 20px'}}>
                        <h3>Practice exercises not available for this topic yet.</h3>
                        <button className="btn btn-primary" onClick={onNext}>
                            Complete Topic →
                        </button>
                    </div>
                );
            }
            
            return (
                <div className="practice-section">
                    <div style={{textAlign: 'center', marginBottom: '30px'}}>
                        <h3 style={{fontSize: '1.8em', color: '#333', marginBottom: '10px'}}>
                            Practice Exercise
                        </h3>
                        <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginBottom: '10px'}}>
                            <span style={{color: '#666'}}>
                                Exercise {currentExercise + 1} of {exercises.length}
                            </span>
                            <div style={{
                                background: '#f0fdf4',
                                padding: '5px 12px',
                                borderRadius: '20px',
                                fontSize: '0.9em',
                                color: '#166534',
                                fontWeight: '600'
                            }}>
                                Score: {exerciseScore.correct}/{exerciseScore.total}
                            </div>
                        </div>
                        <div style={{background: '#e2e8f0', height: '8px', borderRadius: '4px', overflow: 'hidden', maxWidth: '400px', margin: '0 auto'}}>
                            <div style={{
                                background: '#667eea',
                                height: '100%',
                                width: \`\${(currentExercise / exercises.length) * 100}%\`,
                                transition: 'width 0.3s ease'
                            }}></div>
                        </div>
                    </div>
                    
                    {currentExerciseData.type === 'flashcard' && (
                        <FlashcardExercise 
                            data={currentExerciseData}
                            onComplete={handleExerciseComplete}
                        />
                    )}
                    
                    {currentExerciseData.type === 'conjugation' && (
                        <ConjugationExercise 
                            data={currentExerciseData}
                            onComplete={handleExerciseComplete}
                        />
                    )}
                    
                    {currentExerciseData.type === 'conversation' && (
                        <ConversationExercise 
                            data={currentExerciseData}
                            topic={topic}
                            onComplete={handleExerciseComplete}
                        />
                    )}
                    
                    {currentExerciseData.type === 'fillblank' && (
                        <FillBlankExercise 
                            data={currentExerciseData}
                            onComplete={handleExerciseComplete}
                        />
                    )}
                    
                    {currentExerciseData.type === 'translation' && (
                        <TranslationExercise 
                            data={currentExerciseData}
                            onComplete={handleExerciseComplete}
                        />
                    )}
                    
                    <div style={{textAlign: 'center', marginTop: '30px'}}>
                        <button className="btn btn-outline" onClick={onPrev}>
                            ← Back to Verbs
                        </button>
                    </div>
                </div>
            );
        };
        
        // ConjugationExercise Component
        const ConjugationExercise = ({ data, onComplete }) => {
            const [selectedAnswer, setSelectedAnswer] = useState(null);
            const [showResult, setShowResult] = useState(false);
            
            const handleSubmit = () => {
                const isCorrect = selectedAnswer === data.correct;
                setShowResult(true);
                
                setTimeout(() => {
                    onComplete(isCorrect);
                    setSelectedAnswer(null);
                    setShowResult(false);
                }, 2000);
            };
            
            return (
                <div className="exercise-container">
                    <div className="exercise-type">Verb Conjugation</div>
                    
                    <div style={{textAlign: 'center', padding: '40px 20px'}}>
                        <div style={{fontSize: '1.3em', color: '#666', marginBottom: '20px'}}>
                            Choose the correct conjugation:
                        </div>
                        
                        <div style={{fontSize: '2.2em', color: '#333', marginBottom: '30px', lineHeight: '1.4'}}>
                            {data.prompt.replace('___', '_____')}
                        </div>
                        
                        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', maxWidth: '600px', margin: '0 auto'}}>
                            {data.options.map((option, index) => (
                                <button
                                    key={index}
                                    className={\`option-button \${selectedAnswer === option ? 'selected' : ''}\`}
                                    onClick={() => setSelectedAnswer(option)}
                                    disabled={showResult}
                                    style={{
                                        padding: '15px 20px',
                                        fontSize: '1.3em',
                                        borderRadius: '10px',
                                        border: '2px solid #e2e8f0',
                                        background: selectedAnswer === option ? '#667eea' : 'white',
                                        color: selectedAnswer === option ? 'white' : '#333',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                        
                        {showResult && (
                            <div style={{
                                background: selectedAnswer === data.correct ? '#f0fdf4' : '#fef2f2',
                                border: \`2px solid \${selectedAnswer === data.correct ? '#10b981' : '#ef4444'}\`,
                                borderRadius: '12px',
                                padding: '20px',
                                margin: '30px auto',
                                maxWidth: '500px'
                            }}>
                                <div style={{
                                    fontSize: '1.2em',
                                    fontWeight: '600',
                                    color: selectedAnswer === data.correct ? '#166534' : '#dc2626',
                                    marginBottom: '10px'
                                }}>
                                    {selectedAnswer === data.correct ? '✅ Correct!' : '❌ Incorrect'}
                                </div>
                                <div style={{color: '#666', fontSize: '1.1em'}}>
                                    Correct answer: <strong>{data.correct}</strong>
                                </div>
                            </div>
                        )}
                        
                        <button 
                            className="btn btn-primary" 
                            onClick={handleSubmit}
                            disabled={!selectedAnswer || showResult}
                            style={{marginTop: '30px'}}
                        >
                            Check Answer
                        </button>
                    </div>
                </div>
            );
        };
        
        // FillBlankExercise Component
        const FillBlankExercise = ({ data, onComplete }) => {
            const [selectedAnswer, setSelectedAnswer] = useState(null);
            const [showResult, setShowResult] = useState(false);
            
            const handleSubmit = () => {
                const isCorrect = selectedAnswer === data.correct;
                setShowResult(true);
                
                setTimeout(() => {
                    onComplete(isCorrect);
                    setSelectedAnswer(null);
                    setShowResult(false);
                }, 2000);
            };
            
            return (
                <div className="exercise-container">
                    <div className="exercise-type">Fill in the Blank</div>
                    
                    <div style={{textAlign: 'center', padding: '40px 20px'}}>
                        <div style={{fontSize: '1.3em', color: '#666', marginBottom: '10px'}}>
                            Complete the sentence:
                        </div>
                        
                        <div style={{fontSize: '1.1em', color: '#888', marginBottom: '30px', fontStyle: 'italic'}}>
                            {data.english}
                        </div>
                        
                        <div style={{fontSize: '2.5em', color: '#333', marginBottom: '40px', lineHeight: '1.4'}}>
                            {data.sentence.split('____').map((part, index) => (
                                <span key={index}>
                                    {part}
                                    {index < data.sentence.split('____').length - 1 && (
                                        <span style={{
                                            background: selectedAnswer ? '#667eea' : '#f0f4ff',
                                            color: selectedAnswer ? 'white' : '#667eea',
                                            padding: '5px 15px',
                                            borderRadius: '8px',
                                            border: '2px dashed #667eea',
                                            fontWeight: 'bold'
                                        }}>
                                            {selectedAnswer || '____'}
                                        </span>
                                    )}
                                </span>
                            ))}
                        </div>
                        
                        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', maxWidth: '500px', margin: '0 auto'}}>
                            {data.options.map((option, index) => (
                                <button
                                    key={index}
                                    className={\`option-button \${selectedAnswer === option ? 'selected' : ''}\`}
                                    onClick={() => setSelectedAnswer(option)}
                                    disabled={showResult}
                                    style={{
                                        padding: '12px 16px',
                                        fontSize: '1.2em',
                                        borderRadius: '10px',
                                        border: '2px solid #e2e8f0',
                                        background: selectedAnswer === option ? '#667eea' : 'white',
                                        color: selectedAnswer === option ? 'white' : '#333',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                        
                        {showResult && (
                            <div style={{
                                background: selectedAnswer === data.correct ? '#f0fdf4' : '#fef2f2',
                                border: \`2px solid \${selectedAnswer === data.correct ? '#10b981' : '#ef4444'}\`,
                                borderRadius: '12px',
                                padding: '20px',
                                margin: '30px auto',
                                maxWidth: '500px'
                            }}>
                                <div style={{
                                    fontSize: '1.2em',
                                    fontWeight: '600',
                                    color: selectedAnswer === data.correct ? '#166534' : '#dc2626',
                                    marginBottom: '10px'
                                }}>
                                    {selectedAnswer === data.correct ? '✅ Perfect!' : '❌ Try again next time'}
                                </div>
                                <div style={{color: '#666', marginBottom: '10px'}}>
                                    <strong>Explanation:</strong> {data.explanation}
                                </div>
                            </div>
                        )}
                        
                        <button 
                            className="btn btn-primary" 
                            onClick={handleSubmit}
                            disabled={!selectedAnswer || showResult}
                            style={{marginTop: '30px'}}
                        >
                            Submit Answer
                        </button>
                    </div>
                </div>
            );
        };
        
        // TranslationExercise Component
        const TranslationExercise = ({ data, onComplete }) => {
            const [userTranslation, setUserTranslation] = useState('');
            const [showResult, setShowResult] = useState(false);
            
            const handleSubmit = () => {
                const isCorrect = userTranslation.toLowerCase().trim() === data.correct.toLowerCase().trim();
                setShowResult(true);
                
                setTimeout(() => {
                    onComplete(isCorrect);
                    setUserTranslation('');
                    setShowResult(false);
                }, 3000);
            };
            
            return (
                <div className="exercise-container">
                    <div className="exercise-type">Translation</div>
                    
                    <div style={{textAlign: 'center', padding: '40px 20px'}}>
                        <div style={{fontSize: '1.3em', color: '#666', marginBottom: '30px'}}>
                            Translate this to Albanian:
                        </div>
                        
                        <div style={{fontSize: '2.2em', color: '#333', marginBottom: '40px', fontWeight: '500'}}>
                            "{data.english}"
                        </div>
                        
                        <div style={{maxWidth: '500px', margin: '0 auto'}}>
                            <input
                                type="text"
                                value={userTranslation}
                                onChange={(e) => setUserTranslation(e.target.value)}
                                placeholder="Type your Albanian translation..."
                                disabled={showResult}
                                style={{
                                    width: '100%',
                                    padding: '15px 20px',
                                    fontSize: '1.3em',
                                    border: '2px solid #e2e8f0',
                                    borderRadius: '10px',
                                    textAlign: 'center',
                                    marginBottom: '30px',
                                    outline: 'none',
                                    transition: 'border-color 0.3s ease'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                            />
                        </div>
                        
                        {showResult && (
                            <div style={{
                                background: userTranslation.toLowerCase().trim() === data.correct.toLowerCase().trim() ? '#f0fdf4' : '#fef9e7',
                                border: \`2px solid \${userTranslation.toLowerCase().trim() === data.correct.toLowerCase().trim() ? '#10b981' : '#f59e0b'}\`,
                                borderRadius: '12px',
                                padding: '25px',
                                margin: '30px auto',
                                maxWidth: '500px',
                                textAlign: 'left'
                            }}>
                                <div style={{
                                    fontSize: '1.2em',
                                    fontWeight: '600',
                                    color: userTranslation.toLowerCase().trim() === data.correct.toLowerCase().trim() ? '#166534' : '#92400e',
                                    marginBottom: '15px'
                                }}>
                                    {userTranslation.toLowerCase().trim() === data.correct.toLowerCase().trim() ? '✅ Excellent!' : '📝 Good effort!'}
                                </div>
                                <div style={{marginBottom: '10px'}}>
                                    <strong style={{color: '#333'}}>Your answer:</strong> <span style={{fontStyle: 'italic'}}>{userTranslation}</span>
                                </div>
                                <div style={{marginBottom: '15px'}}>
                                    <strong style={{color: '#333'}}>Correct answer:</strong> <span style={{fontWeight: 'bold', color: '#667eea'}}>{data.correct}</span>
                                </div>
                                <div style={{color: '#666'}}>
                                    <strong>Context:</strong> {data.explanation}
                                </div>
                            </div>
                        )}
                        
                        <button 
                            className="btn btn-primary" 
                            onClick={handleSubmit}
                            disabled={!userTranslation.trim() || showResult}
                            style={{marginTop: '20px'}}
                        >
                            Check Translation
                        </button>
                    </div>
                </div>
            );
        };
        
        // FlashcardExercise Component (Enhanced)
        const FlashcardExercise = ({ data, onComplete }) => {
            const [showAnswer, setShowAnswer] = useState(false);
            const [difficulty, setDifficulty] = useState(3);
            
            const handleReveal = () => {
                setShowAnswer(true);
            };
            
            const handleAnswer = (level) => {
                const isCorrect = level === 'good' || level === 'easy';
                setShowAnswer(false);
                onComplete(isCorrect);
            };
            
            return (
                <div className="exercise-container">
                    <div className="exercise-type">Flashcard</div>
                    
                    <div className="difficulty-stars">
                        {[1,2,3,4,5].map(n => (
                            <span key={n} className={\`star \${n <= difficulty ? '' : 'empty'}\`}>
                                ★
                            </span>
                        ))}
                    </div>
                    
                    {!showAnswer ? (
                        <div className="flashcard-front">
                            <div className="english-prompt">
                                {data.english}
                            </div>
                            <button className="btn btn-primary" onClick={handleReveal}>
                                Tap to Reveal
                            </button>
                        </div>
                    ) : (
                        <div className="flashcard-back">
                            <div className="albanian-answer">
                                {data.albanian}
                            </div>
                            <div className="pronunciation">
                                /Albanian pronunciation/
                            </div>
                            {data.context && (
                                <div className="cultural-note">
                                    {data.context}
                                </div>
                            )}
                            <div style={{marginTop: '30px'}}>
                                <button className="btn btn-danger" onClick={() => handleAnswer('again')}>
                                    Again
                                </button>
                                <button className="btn btn-warning" onClick={() => handleAnswer('hard')}>
                                    Hard
                                </button>
                                <button className="btn btn-success" onClick={() => handleAnswer('good')}>
                                    Good
                                </button>
                                <button className="btn btn-primary" onClick={() => handleAnswer('easy')}>
                                    Easy
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            );
        };
        
        // ConversationExercise Component
        const ConversationExercise = ({ data, topic, onComplete }) => {
            const [selectedOption, setSelectedOption] = useState(null);
            const [showResult, setShowResult] = useState(false);
            
            const handleOptionSelect = (optionIndex) => {
                setSelectedOption(optionIndex);
            };
            
            const handleSubmit = () => {
                const selectedOptionData = data.options[selectedOption];
                const isCorrect = selectedOptionData.correct;
                setShowResult(true);
                
                setTimeout(() => {
                    onComplete(isCorrect);
                    setSelectedOption(null);
                    setShowResult(false);
                }, 3000);
            };
            
            return (
                <div className="exercise-container">
                    <div className="exercise-type">Conversation</div>
                    
                    <div className="conversation-scenario">
                        <p style={{fontSize: '1.1em', marginBottom: '20px', lineHeight: '1.6'}}>
                            {data.scenario}
                        </p>
                        
                        <p style={{marginTop: '20px', fontWeight: '600', color: '#333', fontSize: '1.2em'}}>
                            {data.prompt}
                        </p>
                    </div>
                    
                    <div className="conversation-options">
                        {data.options.map((option, index) => (
                            <button
                                key={index}
                                className={\`option-button \${selectedOption === index ? 'selected' : ''}\`}
                                onClick={() => handleOptionSelect(index)}
                                disabled={showResult}
                                style={{
                                    background: selectedOption === index ? '#667eea' : 'white',
                                    color: selectedOption === index ? 'white' : '#333',
                                    border: '2px solid #e2e8f0',
                                    borderRadius: '10px',
                                    padding: '15px 20px',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    marginBottom: '10px',
                                    width: '100%'
                                }}
                            >
                                {option.text}
                            </button>
                        ))}
                    </div>
                    
                    {showResult && selectedOption !== null && (
                        <div style={{
                            background: data.options[selectedOption].correct ? '#f0fdf4' : '#fef2f2',
                            border: \`2px solid \${data.options[selectedOption].correct ? '#10b981' : '#ef4444'}\`,
                            borderRadius: '12px',
                            padding: '20px',
                            margin: '20px 0'
                        }}>
                            <p style={{
                                fontSize: '1.1em',
                                fontWeight: '600',
                                color: data.options[selectedOption].correct ? '#166534' : '#dc2626',
                                marginBottom: '10px'
                            }}>
                                {data.options[selectedOption].correct ? '✅ Excellent choice!' : '❌ Not the best option'}
                            </p>
                            <p style={{color: '#666'}}>
                                {data.options[selectedOption].explanation}
                            </p>
                        </div>
                    )}
                    
                    {!showResult && (
                        <button 
                            className="btn btn-primary" 
                            onClick={handleSubmit}
                            disabled={selectedOption === null}
                            style={{marginTop: '20px'}}
                        >
                            Submit Answer
                        </button>
                    )}
                </div>
            );
        };
        
        // VisualExercise Component
        const VisualExercise = ({ data, onComplete }) => {
            const [selectedOption, setSelectedOption] = useState(null);
            const [showResult, setShowResult] = useState(false);
            
            const visualOptions = [
                { emoji: '🃏', text: 'Playing Cards' },
                { emoji: '🍽️', text: 'Dinner Table' },
                { emoji: '☕', text: 'Coffee Cup' },
                { emoji: '👨‍👩‍👧‍👦', text: 'Family' }
            ];
            
            const correctAnswer = 0; // Playing cards for this example
            
            const handleOptionSelect = (optionIndex) => {
                setSelectedOption(optionIndex);
                setShowResult(true);
                setTimeout(() => {
                    onComplete();
                }, 2000);
            };
            
            return (
                <div className="exercise-container">
                    <div className="exercise-type">Visual</div>
                    
                    <div style={{fontSize: '2em', marginBottom: '30px', color: '#333'}}>
                        "{data.target_phrase}"
                    </div>
                    
                    <p style={{fontSize: '1.2em', color: '#666', marginBottom: '30px'}}>
                        Select the image that best represents this phrase:
                    </p>
                    
                    <div className="visual-exercise">
                        {visualOptions.map((option, index) => (
                            <div
                                key={index}
                                className={\`visual-option \${selectedOption === index ? 'selected' : ''}\`}
                                onClick={() => handleOptionSelect(index)}
                            >
                                {option.emoji}
                                <div style={{fontSize: '0.4em', marginTop: '10px', color: '#666'}}>
                                    {option.text}
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    {showResult && (
                        <div style={{
                            background: selectedOption === correctAnswer ? '#f0fdf4' : '#fef2f2',
                            border: \`2px solid \${selectedOption === correctAnswer ? '#10b981' : '#ef4444'}\`,
                            borderRadius: '12px',
                            padding: '20px',
                            margin: '20px 0'
                        }}>
                            <p style={{
                                fontSize: '1.2em',
                                fontWeight: '600',
                                color: selectedOption === correctAnswer ? '#166534' : '#dc2626'
                            }}>
                                {selectedOption === correctAnswer ? '✅ Correct!' : '❌ Try again next time'}
                            </p>
                        </div>
                    )}
                </div>
            );
        };
        
        // SoloPractice Component (simplified for now)
        const SoloPractice = ({ topics, appData, saveProgress }) => {
            const [currentPhrase, setCurrentPhrase] = useState(null);
            const [showAnswer, setShowAnswer] = useState(false);
            const [loading, setLoading] = useState(true);
            
            useEffect(() => {
                loadRandomPhrase();
            }, []);
            
            const loadRandomPhrase = async () => {
                setLoading(true);
                try {
                    const response = await fetch('/api/lesson');
                    const data = await response.json();
                    setCurrentPhrase(data);
                    setShowAnswer(false);
                } catch (error) {
                    console.error('Failed to load phrase:', error);
                } finally {
                    setLoading(false);
                }
            };
            
            const handleKnew = () => {
                const newCount = appData.learnedCount + 1;
                saveProgress({ learnedCount: newCount });
                loadRandomPhrase();
            };
            
            if (loading || !currentPhrase) {
                return (
                    <div style={{textAlign: 'center', padding: '100px 20px'}}>
                        <div className="spinner"></div>
                        <p>Loading phrase...</p>
                    </div>
                );
            }
            
            return (
                <div className="topic-selection fade-in">
                    <div className="topic-header">
                        <h2 className="topic-title">Solo Practice</h2>
                        <p className="topic-subtitle">Practice at your own pace</p>
                    </div>
                    
                    <div className="exercise-container" style={{maxWidth: '600px', margin: '0 auto'}}>
                        <div className="exercise-type">{currentPhrase.lesson_name}</div>
                        
                        <div className="english-prompt">
                            {currentPhrase.english_phrase}
                        </div>
                        
                        {showAnswer && (
                            <>
                                <div className="albanian-answer">
                                    {currentPhrase.target_phrase}
                                </div>
                                {currentPhrase.cultural_context && (
                                    <div className="cultural-note">
                                        {currentPhrase.cultural_context}
                                    </div>
                                )}
                            </>
                        )}
                        
                        <div style={{marginTop: '30px'}}>
                            {!showAnswer ? (
                                <button className="btn btn-primary" onClick={() => setShowAnswer(true)}>
                                    Show Albanian
                                </button>
                            ) : (
                                <div>
                                    <button className="btn btn-success" onClick={handleKnew}>
                                        ✅ I knew it!
                                    </button>
                                    <button className="btn btn-secondary" onClick={loadRandomPhrase}>
                                        → Next phrase
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            );
        };
        
        // Render the App
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<App />);
        
    </script>
</body>
</html>
  `);
});

// Existing API endpoints
app.get('/api/count', async (req, res) => {
  try {
    const result = await query('SELECT COUNT(*) as count FROM lesson_content WHERE target_phrase IS NOT NULL');
    res.json({ count: result.rows[0].count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/categories', async (req, res) => {
  try {
    const result = await query(`
      SELECT l.name, COUNT(lc.id) as count
      FROM lesson_content lc 
      JOIN lessons l ON lc.lesson_id = l.id 
      WHERE lc.target_phrase IS NOT NULL 
      GROUP BY l.name 
      ORDER BY count DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/lesson', async (req, res) => {
  try {
    const result = await query(`
      SELECT lc.english_phrase, lc.target_phrase, lc.cultural_context, l.name as lesson_name
      FROM lesson_content lc
      JOIN lessons l ON lc.lesson_id = l.id 
      WHERE lc.target_phrase IS NOT NULL 
      ORDER BY RANDOM() 
      LIMIT 1
    `);
    
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'No lessons found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/lesson/:category', async (req, res) => {
  try {
    const category = decodeURIComponent(req.params.category);
    const result = await query(`
      SELECT lc.english_phrase, lc.target_phrase, lc.cultural_context, l.name as lesson_name
      FROM lesson_content lc
      JOIN lessons l ON lc.lesson_id = l.id 
      WHERE lc.target_phrase IS NOT NULL 
        AND l.name = $1
      ORDER BY RANDOM() 
      LIMIT 1
    `, [category]);
    
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: `No lessons found for category: ${category}` });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// New endpoint to get ALL vocabulary for a specific category
app.get('/api/vocabulary/:category', async (req, res) => {
  try {
    const category = decodeURIComponent(req.params.category);
    const result = await query(`
      SELECT lc.english_phrase, lc.target_phrase, lc.cultural_context, l.name as lesson_name
      FROM lesson_content lc
      JOIN lessons l ON lc.lesson_id = l.id 
      WHERE lc.target_phrase IS NOT NULL 
        AND l.name = $1
      ORDER BY lc.english_phrase
    `, [category]);
    
    if (result.rows.length > 0) {
      res.json(result.rows);
    } else {
      res.status(404).json({ error: `No vocabulary found for category: ${category}` });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, '127.0.0.1', () => {
  console.log(`🚀 Albanian Learning App (React): http://127.0.0.1:${port}`);
  console.log(`🎯 Full UI/UX system with topic-based learning`);
  console.log(`🇦🇱 Ready with 1,017+ phrases and cultural context!`);
});