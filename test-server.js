const http = require('http');
const { query } = require('./lib/database');

const server = http.createServer(async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === '/') {
    res.setHeader('Content-Type', 'text/html');
    res.writeHead(200);
    res.end(`
<!DOCTYPE html>
<html>
<head>
    <title>🇦🇱 Albanian Learning Test</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .lesson { background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 20px; margin: 20px 0; }
        button { background: #0ea5e9; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin: 5px; }
        button:hover { background: #0284c7; }
        .albanian { color: #047857; font-size: 1.2em; font-weight: bold; }
    </style>
</head>
<body>
    <h1>🇦🇱 Albanian Learning App Test</h1>
    <p>Testing database connection and Albanian content...</p>
    
    <div id="status">Loading...</div>
    <div id="lesson-content"></div>
    
    <script>
        async function loadLesson() {
            try {
                const response = await fetch('/api/lesson');
                const data = await response.json();
                
                if (data.error) {
                    document.getElementById('status').innerHTML = '❌ Error: ' + data.error;
                    return;
                }
                
                document.getElementById('status').innerHTML = '✅ Connected to database!';
                document.getElementById('lesson-content').innerHTML = \`
                    <div class="lesson">
                        <h3>English: \${data.english_phrase}</h3>
                        <p class="albanian">Albanian: \${data.target_phrase}</p>
                        \${data.cultural_context ? '<p><strong>Context:</strong> ' + data.cultural_context + '</p>' : ''}
                    </div>
                    <button onclick="loadLesson()">Next Lesson</button>
                \`;
            } catch (error) {
                document.getElementById('status').innerHTML = '❌ Connection failed: ' + error.message;
            }
        }
        
        loadLesson();
    </script>
</body>
</html>
    `);
  } else if (req.url === '/api/lesson') {
    try {
      const result = await query(`
        SELECT english_phrase, target_phrase, cultural_context 
        FROM lesson_content 
        WHERE target_phrase IS NOT NULL 
        ORDER BY RANDOM() 
        LIMIT 1
      `);
      
      if (result.rows.length > 0) {
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(200);
        res.end(JSON.stringify(result.rows[0]));
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(200);
        res.end(JSON.stringify({error: 'No Albanian lessons found in database'}));
      }
    } catch (error) {
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(500);
      res.end(JSON.stringify({error: error.message}));
    }
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

const port = 8080;
server.listen(port, () => {
  console.log(`🚀 Albanian Learning Test Server running at http://localhost:${port}`);
  console.log(`🇦🇱 Open your browser and go to: http://localhost:${port}`);
});