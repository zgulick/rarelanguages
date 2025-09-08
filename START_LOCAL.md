# 🇦🇱 Albanian Learning App - Local Setup

## Quick Start Commands

```bash
# Navigate to project directory
cd /Users/zgulick/Downloads/rarelanguages

# Start the Albanian learning app
node learning-app.js

# Or run in background
nohup node learning-app.js > app.log 2>&1 &

# Check if it's running
curl http://127.0.0.1:3000
```

## Open the App
🚀 **http://127.0.0.1:3000**

## Stop the App
```bash
# Find and kill the process
pkill -f "node learning-app.js"

# Or if you know the process ID
ps aux | grep "node learning-app.js"
kill [PID]
```

## What You'll See
- 📊 **192 Albanian phrases** from your database
- 🎯 **Interactive learning** with progress tracking  
- ✅ **Modern interface** with stats and streaks
- 🇦🇱 **Real Albanian translations** like "Më pëlqen pikant" (I like it spicy)

## Files
- `learning-app.js` - Main enhanced learning app
- `simple-server.js` - Basic version (backup)
- `lib/database.js` - Database connection
- `.env` - Database credentials

## Database
- PostgreSQL with 192+ Albanian phrases
- Connects automatically via .env file
- Phrases from lessons organized by topics