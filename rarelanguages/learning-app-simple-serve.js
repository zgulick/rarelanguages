const express = require('express');
const { query } = require('./lib/database');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3002; // New port for React version

app.use(express.json());
app.use(express.static('public'));

// Development: No cache for instant updates
app.use((req, res, next) => {
  res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
  next();
});

// Main React application - serve HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'react-app.html'));
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
      SELECT category_name as name, COUNT(*) as count 
      FROM lesson_content 
      WHERE target_phrase IS NOT NULL 
      GROUP BY category_name 
      ORDER BY count DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Grammar Engine API endpoints  
app.get('/api/grammar/verbs', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '50');
    
    const result = await query(`
      SELECT v.*, vp.pattern_name, vp.conjugation_rules
      FROM verbs v
      LEFT JOIN verb_patterns vp ON v.verb_pattern_id = vp.id
      ORDER BY v.frequency_rank ASC
      LIMIT $1
    `, [limit]);
    
    res.json({
      success: true,
      verbs: result.rows
    });
  } catch (error) {
    console.error('Grammar verbs API error:', error);
    res.status(500).json({ error: 'Failed to fetch verbs' });
  }
});

// All other API endpoints from the original file would go here...
// (I'll add them if this approach works)

app.listen(port, '127.0.0.1', () => {
  console.log(`🚀 Albanian Learning App (React): http://127.0.0.1:${port}`);
  console.log(`🎯 Full UI/UX system with topic-based learning`);
  console.log(`🇦🇱 Ready with 1,017+ phrases and cultural context!`);
});