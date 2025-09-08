const express = require('express');
const { query } = require('./lib/database');

const app = express();
const port = 3000;

app.use(express.json());

// Enhanced homepage with proper learning interface
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>🇦🇱 Learn Albanian</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px; 
            background: #f8fafc;
            color: #1e293b;
          }
          .container { 
            background: white; 
            border-radius: 12px; 
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            padding: 30px; 
          }
          h1 { 
            text-align: center; 
            color: #059669; 
            margin-bottom: 30px;
            font-size: 2.5em;
          }
          .stats { 
            display: flex; 
            justify-content: space-around; 
            background: #f0f9ff; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 20px 0;
          }
          .stat { text-align: center; }
          .stat-number { font-size: 2em; font-weight: bold; color: #0369a1; }
          .lesson-card { 
            background: #fefefe; 
            border: 2px solid #e2e8f0;
            border-radius: 12px; 
            padding: 30px; 
            margin: 20px 0; 
            text-align: center;
            min-height: 200px;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }
          .english { 
            font-size: 1.8em; 
            color: #475569; 
            margin-bottom: 20px;
            font-weight: 500;
          }
          .albanian { 
            font-size: 2.2em; 
            color: #059669; 
            font-weight: bold; 
            margin: 20px 0;
            padding: 15px;
            background: #f0fdf4;
            border-radius: 8px;
            border-left: 4px solid #059669;
          }
          .hidden { display: none; }
          .buttons { 
            display: flex; 
            gap: 15px; 
            justify-content: center; 
            margin-top: 20px;
          }
          button { 
            padding: 12px 24px; 
            border: none; 
            border-radius: 8px; 
            font-size: 1.1em; 
            font-weight: 600;
            cursor: pointer; 
            transition: all 0.2s;
          }
          .btn-primary { background: #0ea5e9; color: white; }
          .btn-primary:hover { background: #0284c7; }
          .btn-success { background: #059669; color: white; }
          .btn-success:hover { background: #047857; }
          .btn-warning { background: #d97706; color: white; }
          .btn-warning:hover { background: #b45309; }
          .btn-secondary { background: #64748b; color: white; }
          .btn-secondary:hover { background: #475569; }
          .progress-bar {
            width: 100%;
            height: 8px;
            background: #e2e8f0;
            border-radius: 4px;
            margin: 20px 0;
            overflow: hidden;
          }
          .progress-fill {
            height: 100%;
            background: #059669;
            width: 0%;
            transition: width 0.3s ease;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🇦🇱 Learn Albanian</h1>
          
          <div class="stats">
            <div class="stat">
              <div class="stat-number" id="totalPhrases">-</div>
              <div>Total Phrases</div>
            </div>
            <div class="stat">
              <div class="stat-number" id="learned">0</div>
              <div>Learned</div>
            </div>
            <div class="stat">
              <div class="stat-number" id="streak">1</div>
              <div>Day Streak</div>
            </div>
          </div>

          <div class="progress-bar">
            <div class="progress-fill" id="progressFill"></div>
          </div>
          
          <div class="lesson-card" id="lessonCard">
            <div class="english" id="englishPhrase">Loading your Albanian lesson...</div>
            <div class="albanian hidden" id="albanianPhrase"></div>
            <div class="buttons">
              <button class="btn-primary" id="showAnswerBtn" onclick="showAnswer()">
                Show Albanian Translation
              </button>
              <div class="hidden" id="answerButtons">
                <button class="btn-success" onclick="markCorrect()">
                  ✓ I knew it!
                </button>
                <button class="btn-warning" onclick="markDifficult()">
                  ⚠ Need practice
                </button>
                <button class="btn-secondary" onclick="nextLesson()">
                  → Next lesson
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <script>
          let currentLesson = null;
          let learnedCount = 0;
          let totalCount = 0;
          
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
          
          async function loadLesson() {
            try {
              document.getElementById('englishPhrase').textContent = 'Loading...';
              
              const response = await fetch('/api/lesson');
              const lesson = await response.json();
              
              currentLesson = lesson;
              document.getElementById('englishPhrase').textContent = lesson.english_phrase;
              document.getElementById('albanianPhrase').textContent = lesson.target_phrase;
              
              // Reset UI
              document.getElementById('albanianPhrase').classList.add('hidden');
              document.getElementById('showAnswerBtn').classList.remove('hidden');
              document.getElementById('answerButtons').classList.add('hidden');
              
            } catch (error) {
              document.getElementById('englishPhrase').textContent = 'Error loading lesson: ' + error.message;
            }
          }
          
          function showAnswer() {
            document.getElementById('albanianPhrase').classList.remove('hidden');
            document.getElementById('showAnswerBtn').classList.add('hidden');
            document.getElementById('answerButtons').classList.remove('hidden');
          }
          
          function markCorrect() {
            learnedCount++;
            document.getElementById('learned').textContent = learnedCount;
            updateProgress();
            nextLesson();
          }
          
          function markDifficult() {
            // Just move to next lesson for now
            nextLesson();
          }
          
          function nextLesson() {
            loadLesson();
          }
          
          function updateProgress() {
            const percentage = totalCount > 0 ? Math.min((learnedCount / totalCount) * 100, 100) : 0;
            document.getElementById('progressFill').style.width = percentage + '%';
          }
          
          // Initialize
          loadStats();
          loadLesson();
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

app.get('/api/lesson', async (req, res) => {
  try {
    const result = await query(`
      SELECT english_phrase, target_phrase, cultural_context
      FROM lesson_content 
      WHERE target_phrase IS NOT NULL 
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

// Get lessons by category/difficulty
app.get('/api/lessons/family', async (req, res) => {
  try {
    const result = await query(`
      SELECT english_phrase, target_phrase, cultural_context
      FROM lesson_content 
      WHERE target_phrase IS NOT NULL 
        AND (english_phrase ILIKE '%family%' 
             OR english_phrase ILIKE '%father%' 
             OR english_phrase ILIKE '%mother%'
             OR english_phrase ILIKE '%brother%'
             OR english_phrase ILIKE '%sister%')
      ORDER BY RANDOM() 
      LIMIT 1
    `);
    
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'No family lessons found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, '127.0.0.1', () => {
  console.log(`🚀 Enhanced Albanian Learning App: http://127.0.0.1:${port}`);
  console.log(`🇦🇱 Ready to learn Albanian with ${192} phrases!`);
});