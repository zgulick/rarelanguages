const express = require('express');
const { query } = require('./lib/database');

const app = express();
const port = 3000;

app.use(express.json());

// Serve static homepage
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head><title>🇦🇱 Albanian Learning</title></head>
      <body style="font-family: Arial; max-width: 600px; margin: 50px auto; padding: 20px;">
        <h1>🇦🇱 Albanian Learning App</h1>
        <p>✅ Server is running!</p>
        <p>📊 Your Albanian translations: <span id="count">Loading...</span></p>
        <div id="lesson" style="background: #f0f9ff; padding: 20px; margin: 20px 0; border-radius: 8px;"></div>
        <button onclick="loadLesson()">Get Albanian Lesson</button>
        
        <script>
          async function loadLesson() {
            try {
              const response = await fetch('/api/lesson');
              const lesson = await response.json();
              document.getElementById('lesson').innerHTML = 
                '<strong>English:</strong> ' + lesson.english_phrase + '<br>' +
                '<strong style="color: #059669; font-size: 1.2em;">Albanian:</strong> ' + lesson.target_phrase;
            } catch (error) {
              document.getElementById('lesson').innerHTML = '❌ Error: ' + error.message;
            }
          }
          
          async function getCount() {
            try {
              const response = await fetch('/api/count');
              const data = await response.json();
              document.getElementById('count').innerHTML = data.count + ' phrases';
            } catch (error) {
              document.getElementById('count').innerHTML = 'Error loading count';
            }
          }
          
          loadLesson();
          getCount();
        </script>
      </body>
    </html>
  `);
});

// API endpoint for lesson count
app.get('/api/count', async (req, res) => {
  try {
    const result = await query('SELECT COUNT(*) as count FROM lesson_content WHERE target_phrase IS NOT NULL');
    res.json({ count: result.rows[0].count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API endpoint for random lesson
app.get('/api/lesson', async (req, res) => {
  try {
    const result = await query(`
      SELECT english_phrase, target_phrase 
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

app.listen(port, '127.0.0.1', () => {
  console.log(`🚀 Albanian Learning App: http://127.0.0.1:${port}`);
});