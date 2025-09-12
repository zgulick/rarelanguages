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
console.log("test");
