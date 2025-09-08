const express = require('express');
const { query } = require('./lib/database');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3001; // Different port for development

app.use(express.json());
app.use(express.static('public')); // For CSS/JS files

// Development: Watch for file changes and auto-reload
app.use((req, res, next) => {
  res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
  next();
});

// Enhanced homepage with advanced learning features
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>🇦🇱 Learn Albanian - Enhanced</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #333;
          }
          
          .app-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
          }
          
          .header {
            text-align: center;
            color: white;
            margin-bottom: 30px;
          }
          
          .header h1 {
            font-size: 3em;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
          }
          
          .header p {
            font-size: 1.2em;
            opacity: 0.9;
          }
          
          .main-content {
            display: grid;
            grid-template-columns: 300px 1fr;
            gap: 30px;
            align-items: start;
          }
          
          .sidebar {
            background: white;
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            height: fit-content;
          }
          
          .stats-section {
            margin-bottom: 25px;
          }
          
          .stats-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin: 15px 0;
          }
          
          .stat-card {
            text-align: center;
            padding: 15px;
            background: #f8faff;
            border-radius: 10px;
            border-left: 4px solid #667eea;
          }
          
          .stat-number {
            font-size: 1.5em;
            font-weight: bold;
            color: #667eea;
          }
          
          .stat-label {
            font-size: 0.9em;
            color: #666;
            margin-top: 5px;
          }
          
          .progress-section {
            margin: 20px 0;
          }
          
          .progress-bar {
            width: 100%;
            height: 12px;
            background: #e2e8f0;
            border-radius: 6px;
            overflow: hidden;
            margin: 10px 0;
          }
          
          .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #667eea, #764ba2);
            width: 0%;
            transition: width 0.5s ease;
          }
          
          .category-section {
            margin-top: 25px;
          }
          
          .section-title {
            font-size: 1.1em;
            font-weight: 600;
            margin-bottom: 15px;
            color: #333;
            border-bottom: 2px solid #f0f0f0;
            padding-bottom: 5px;
          }
          
          .category-list {
            max-height: 300px;
            overflow-y: auto;
          }
          
          .category-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
            margin: 5px 0;
            background: #f8faff;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
          }
          
          .category-item:hover {
            background: #e7f1ff;
            transform: translateX(5px);
          }
          
          .category-item.active {
            background: #667eea;
            color: white;
          }
          
          .category-name {
            font-weight: 500;
          }
          
          .category-count {
            background: rgba(102, 126, 234, 0.1);
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 0.8em;
            font-weight: 600;
          }
          
          .category-item.active .category-count {
            background: rgba(255,255,255,0.2);
          }
          
          .lesson-area {
            background: white;
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          }
          
          .lesson-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
          }
          
          .lesson-title {
            font-size: 1.5em;
            color: #333;
          }
          
          .lesson-controls {
            display: flex;
            gap: 10px;
          }
          
          .lesson-card {
            background: linear-gradient(135deg, #f8faff 0%, #ffffff 100%);
            border: 2px solid #e2e8f0;
            border-radius: 15px;
            padding: 40px;
            text-align: center;
            min-height: 350px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            position: relative;
          }
          
          .lesson-category {
            position: absolute;
            top: 15px;
            right: 20px;
            background: #667eea;
            color: white;
            padding: 5px 12px;
            border-radius: 15px;
            font-size: 0.8em;
            font-weight: 600;
          }
          
          .english-phrase {
            font-size: 2em;
            color: #333;
            margin-bottom: 30px;
            font-weight: 500;
            line-height: 1.3;
          }
          
          .albanian-phrase {
            font-size: 2.5em;
            color: #667eea;
            font-weight: bold;
            margin: 20px 0;
            padding: 20px;
            background: linear-gradient(135deg, #f0f4ff 0%, #e7f1ff 100%);
            border-radius: 12px;
            border-left: 5px solid #667eea;
            line-height: 1.2;
          }
          
          .cultural-context {
            background: #fef9e7;
            border-left: 4px solid #f59e0b;
            padding: 15px 20px;
            margin: 20px 0;
            border-radius: 8px;
            font-style: italic;
            color: #78350f;
            text-align: left;
          }
          
          .cultural-context::before {
            content: "💡 ";
            font-style: normal;
          }
          
          .hidden { display: none !important; }
          
          .buttons {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
            justify-content: center;
            margin-top: 30px;
          }
          
          .btn {
            padding: 12px 24px;
            border: none;
            border-radius: 25px;
            font-size: 1em;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            min-width: 140px;
          }
          
          .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
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
          
          .btn-secondary { 
            background: linear-gradient(135deg, #64748b 0%, #475569 100%); 
            color: white; 
          }
          
          .btn-small {
            padding: 8px 16px;
            font-size: 0.9em;
            min-width: auto;
          }
          
          .difficulty-indicator {
            display: inline-flex;
            gap: 3px;
            margin-left: 10px;
          }
          
          .difficulty-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #e2e8f0;
          }
          
          .difficulty-dot.active {
            background: #f59e0b;
          }
          
          @media (max-width: 768px) {
            .main-content {
              grid-template-columns: 1fr;
            }
            
            .sidebar {
              order: 2;
            }
            
            .lesson-area {
              order: 1;
            }
          }
          
          .loading {
            opacity: 0.6;
          }
          
          .fade-in {
            animation: fadeIn 0.5s ease-in;
          }
          
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          .pulse {
            animation: pulse 2s infinite;
          }
          
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
        </style>
      </head>
      <body>
        <div class="app-container">
          <div class="header">
            <h1>🇦🇱 Learn Albanian</h1>
            <p>Master Kosovo Albanian with cultural context</p>
          </div>
          
          <div class="main-content">
            <div class="sidebar">
              <div class="stats-section">
                <h3 class="section-title">Your Progress</h3>
                <div class="stats-grid">
                  <div class="stat-card">
                    <div class="stat-number" id="totalPhrases">-</div>
                    <div class="stat-label">Total</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-number" id="learnedCount">0</div>
                    <div class="stat-label">Learned</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-number" id="streakCount">1</div>
                    <div class="stat-label">Streak</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-number" id="accuracyRate">-</div>
                    <div class="stat-label">Accuracy</div>
                  </div>
                </div>
                <div class="progress-section">
                  <div class="progress-bar">
                    <div class="progress-fill" id="progressFill"></div>
                  </div>
                  <div id="progressText">0% Complete</div>
                </div>
              </div>
              
              <div class="category-section">
                <h3 class="section-title">Lesson Categories</h3>
                <div class="category-list" id="categoryList">
                  <div class="category-item active" data-category="all">
                    <span class="category-name">All Lessons</span>
                    <span class="category-count" id="allCount">-</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="lesson-area">
              <div class="lesson-header">
                <h2 class="lesson-title" id="lessonTitle">All Lessons</h2>
                <div class="lesson-controls">
                  <button class="btn btn-secondary btn-small" onclick="toggleCulturalContext()">
                    💡 Context
                  </button>
                  <button class="btn btn-secondary btn-small" onclick="resetProgress()">
                    🔄 Reset
                  </button>
                </div>
              </div>
              
              <div class="lesson-card fade-in" id="lessonCard">
                <div class="lesson-category" id="lessonCategory">Loading...</div>
                <div class="english-phrase" id="englishPhrase">Loading your Albanian lesson...</div>
                <div class="albanian-phrase hidden" id="albanianPhrase"></div>
                <div class="cultural-context hidden" id="culturalContext"></div>
                
                <div class="buttons">
                  <button class="btn btn-primary" id="showAnswerBtn" onclick="showAnswer()">
                    👁️ Show Albanian Translation
                  </button>
                  <div class="hidden" id="answerButtons">
                    <button class="btn btn-success" onclick="markCorrect()">
                      ✅ I knew it!
                    </button>
                    <button class="btn btn-warning" onclick="markDifficult()">
                      ⚠️ Need practice
                    </button>
                    <button class="btn btn-secondary" onclick="nextLesson()">
                      ➡️ Next lesson
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <script>
          // Application state
          let currentLesson = null;
          let currentCategory = 'all';
          let learnedCount = parseInt(localStorage.getItem('learnedCount') || '0');
          let correctAnswers = parseInt(localStorage.getItem('correctAnswers') || '0');
          let totalAnswers = parseInt(localStorage.getItem('totalAnswers') || '0');
          let totalCount = 0;
          let categories = [];
          let showContext = localStorage.getItem('showContext') === 'true';
          
          // Initialize app
          document.addEventListener('DOMContentLoaded', () => {
            loadStats();
            loadCategories();
            loadLesson();
            updateUI();
          });
          
          async function loadStats() {
            try {
              const response = await fetch('/api/count');
              const data = await response.json();
              totalCount = data.count;
              document.getElementById('totalPhrases').textContent = totalCount;
              updateProgress();
            } catch (error) {
              console.error('Failed to load stats:', error);
            }
          }
          
          async function loadCategories() {
            try {
              const response = await fetch('/api/categories');
              categories = await response.json();
              
              const categoryList = document.getElementById('categoryList');
              const allItem = categoryList.querySelector('[data-category="all"]');
              document.getElementById('allCount').textContent = totalCount;
              
              categories.forEach(category => {
                const item = document.createElement('div');
                item.className = 'category-item';
                item.setAttribute('data-category', category.name);
                item.innerHTML = \`
                  <span class="category-name">\${category.name}</span>
                  <span class="category-count">\${category.count}</span>
                \`;
                item.onclick = () => selectCategory(category.name);
                categoryList.appendChild(item);
              });
            } catch (error) {
              console.error('Failed to load categories:', error);
            }
          }
          
          async function loadLesson() {
            try {
              document.getElementById('englishPhrase').textContent = 'Loading...';
              document.getElementById('lessonCard').classList.add('loading');
              
              const url = currentCategory === 'all' 
                ? '/api/lesson' 
                : \`/api/lesson/\${encodeURIComponent(currentCategory)}\`;
              
              const response = await fetch(url);
              const lesson = await response.json();
              
              if (lesson.error) {
                throw new Error(lesson.error);
              }
              
              currentLesson = lesson;
              displayLesson();
              
            } catch (error) {
              document.getElementById('englishPhrase').textContent = 'Error loading lesson: ' + error.message;
            } finally {
              document.getElementById('lessonCard').classList.remove('loading');
            }
          }
          
          function displayLesson() {
            if (!currentLesson) return;
            
            document.getElementById('englishPhrase').textContent = currentLesson.english_phrase;
            document.getElementById('albanianPhrase').textContent = currentLesson.target_phrase;
            document.getElementById('lessonCategory').textContent = currentLesson.lesson_name || 'General';
            
            // Handle cultural context
            const contextEl = document.getElementById('culturalContext');
            if (currentLesson.cultural_context) {
              contextEl.textContent = currentLesson.cultural_context;
              contextEl.classList.toggle('hidden', !showContext);
            } else {
              contextEl.classList.add('hidden');
            }
            
            // Reset UI state
            document.getElementById('albanianPhrase').classList.add('hidden');
            document.getElementById('showAnswerBtn').classList.remove('hidden');
            document.getElementById('answerButtons').classList.add('hidden');
            
            // Add animation
            document.getElementById('lessonCard').classList.add('fade-in');
            setTimeout(() => {
              document.getElementById('lessonCard').classList.remove('fade-in');
            }, 500);
          }
          
          function selectCategory(categoryName) {
            currentCategory = categoryName;
            
            // Update UI
            document.querySelectorAll('.category-item').forEach(item => {
              item.classList.toggle('active', item.dataset.category === categoryName);
            });
            
            document.getElementById('lessonTitle').textContent = 
              categoryName === 'all' ? 'All Lessons' : categoryName;
            
            loadLesson();
          }
          
          function showAnswer() {
            document.getElementById('albanianPhrase').classList.remove('hidden');
            document.getElementById('showAnswerBtn').classList.add('hidden');
            document.getElementById('answerButtons').classList.remove('hidden');
            
            if (showContext && currentLesson.cultural_context) {
              document.getElementById('culturalContext').classList.remove('hidden');
            }
          }
          
          function markCorrect() {
            learnedCount++;
            correctAnswers++;
            totalAnswers++;
            saveProgress();
            updateUI();
            nextLesson();
            
            // Celebration animation
            const card = document.getElementById('lessonCard');
            card.classList.add('pulse');
            setTimeout(() => card.classList.remove('pulse'), 1000);
          }
          
          function markDifficult() {
            totalAnswers++;
            saveProgress();
            updateUI();
            nextLesson();
          }
          
          function nextLesson() {
            loadLesson();
          }
          
          function toggleCulturalContext() {
            showContext = !showContext;
            localStorage.setItem('showContext', showContext);
            
            if (currentLesson && currentLesson.cultural_context) {
              const contextEl = document.getElementById('culturalContext');
              const isAnswerShown = !document.getElementById('albanianPhrase').classList.contains('hidden');
              contextEl.classList.toggle('hidden', !showContext || !isAnswerShown);
            }
          }
          
          function resetProgress() {
            if (confirm('Are you sure you want to reset your progress?')) {
              learnedCount = 0;
              correctAnswers = 0;
              totalAnswers = 0;
              saveProgress();
              updateUI();
            }
          }
          
          function saveProgress() {
            localStorage.setItem('learnedCount', learnedCount);
            localStorage.setItem('correctAnswers', correctAnswers);
            localStorage.setItem('totalAnswers', totalAnswers);
          }
          
          function updateUI() {
            document.getElementById('learnedCount').textContent = learnedCount;
            
            const accuracy = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;
            document.getElementById('accuracyRate').textContent = accuracy + '%';
            
            updateProgress();
          }
          
          function updateProgress() {
            const percentage = totalCount > 0 ? Math.min((learnedCount / totalCount) * 100, 100) : 0;
            document.getElementById('progressFill').style.width = percentage + '%';
            document.getElementById('progressText').textContent = Math.round(percentage) + '% Complete';
          }
        </script>
      </body>
    </html>
  `);
});

// API endpoints
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

app.listen(port, '127.0.0.1', () => {
  console.log(`🚀 Enhanced Albanian Learning App (DEV): http://127.0.0.1:${port}`);
  console.log(`🔄 Hot reload enabled for instant UI changes`);
  console.log(`🇦🇱 Ready to learn with 1,017+ phrases!`);
});