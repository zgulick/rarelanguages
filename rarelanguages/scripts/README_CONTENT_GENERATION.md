# 🇦🇱 Gheg Albanian Content Generation System

Transform your RareLanguages app from mock data to real Albanian translations overnight!

## 🚀 Quick Start

### 1. Setup Environment Variables
```bash
# Add to your .env file
OPENAI_API_KEY=your-openai-api-key-here
DATABASE_URL=your-render-postgresql-url
MAX_DAILY_COST=20.00
BATCH_SIZE=25
```

### 2. Test Your Setup
```bash
# Verify everything is configured correctly
node scripts/testContentGeneration.js
```

### 3. Run Content Generation
```bash
# Start the full generation process (30-45 minutes)
node scripts/runContentGeneration.js
```

**That's it!** The script will:
- ✅ Translate ~400 English phrases to Gheg Albanian
- ✅ Populate your database with real content
- ✅ Generate pronunciation guides and cultural context
- ✅ Create exercise variations
- ✅ Show real-time progress every 10 seconds
- ✅ Auto-save progress (resumable if interrupted)
- ✅ Stay within cost limits (~$8-15 total)

---

## 📊 What Gets Generated

### Content Overview
- **400+ Albanian Phrases** organized in 8 priority batches
- **Cultural Context** for family-appropriate expressions  
- **Pronunciation Guides** for proper Albanian pronunciation
- **Exercise Variations** for different learning methods
- **Database Integration** with your existing curriculum

### Priority Batches
1. **Family Vocabulary** (30 phrases) - "This is my father", "How is your family?"
2. **Greetings & Basics** (30 phrases) - "Good morning", "Thank you very much"
3. **Coffee & Hospitality** (30 phrases) - "Would you like coffee?", "Make yourself at home"
4. **Food & Meals** (30 phrases) - "Are you hungry?", "This is delicious"
5. **Time & Daily Life** (30 phrases) - "What time is it?", "See you tomorrow"
6. **Numbers & Ages** (30 phrases) - "I am twenty years old", "Count to ten"
7. **Feelings & Emotions** (30 phrases) - "I am happy", "Don't worry"
8. **Weather & Nature** (30 phrases) - "It's sunny today", "Beautiful weather"

---

## 🔄 Progress Tracking

The system shows real-time progress every 10 seconds:

```
🇦🇱 GHEG ALBANIAN CONTENT GENERATION
══════════════════════════════════════════════════
⏱️  Running for: 23 minutes
💰 Cost so far: $8.45
📊 Current phase: lesson_content

✅ Vocabulary Translation (~15min)
✅ Lesson Content (~20min) 
🔄 Exercise Generation (~15min)
⏳ Pronunciation Guides (~5min)
⏳ Database Population (~2min)

📝 Translation batches completed: 5
📝 Total translations: 342
💤 Safe to leave running overnight
🔄 Progress auto-saved - resumable if interrupted
```

---

## 🛡️ Safety Features

### Automatic Cost Protection
- **Daily Cost Limit:** Stops at $20 (configurable)
- **Real-time Monitoring:** See costs as they accumulate  
- **Smart Estimation:** Projects remaining costs
- **Batch Optimization:** Reduces API calls if errors occur

### Resume Capability
- **Auto-save Progress:** Every 10 translations saved automatically
- **Graceful Recovery:** Handles interruptions and API failures
- **Resume Command:** Just run the same script again
- **State Persistence:** Saves to `resumeState.json`

### Error Handling
- **Retry Logic:** 3 attempts with exponential backoff
- **API Rate Limiting:** Respects OpenAI rate limits
- **Validation:** Ensures translation quality and format
- **Fallback Options:** Continues even if some batches fail

---

## 📁 File Structure

```
scripts/
├── runContentGeneration.js     ← Main script - run this one
├── progressTracker.js          ← Real-time progress display
├── translationBatches.js       ← Albanian phrase organization
├── databasePopulator.js        ← Database integration
├── testContentGeneration.js    ← Setup validation
├── resumeState.json           ← Auto-created resume data
└── README_CONTENT_GENERATION.md ← This file
```

---

## 🔧 Advanced Configuration

### Environment Variables
```bash
# Required
OPENAI_API_KEY=sk-...                    # Your OpenAI API key
DATABASE_URL=postgresql://...            # Your database connection

# Optional (with defaults)
MAX_DAILY_COST=20.00                     # Stop if costs exceed this
BATCH_SIZE=25                            # Phrases per API call
OPENAI_MODEL=gpt-3.5-turbo              # AI model to use
OPENAI_TEMPERATURE=0.3                   # Translation consistency (0-1)
OPENAI_MAX_TOKENS=2000                   # Max response length
MAX_CONCURRENT_CALLS=3                   # Parallel API requests
RETRY_ATTEMPTS=3                         # Failed request retries
RATE_LIMIT_DELAY=1000                    # ms between API calls
```

### Batch Customization
Modify `translationBatches.js` to:
- Add new phrase categories
- Adjust priority orders
- Change cultural context
- Customize batch sizes

---

## 🚨 Troubleshooting

### Common Issues

**"Database connection failed"**
```bash
# Check your DATABASE_URL in .env file
node scripts/testContentGeneration.js
```

**"OpenAI API error"**
```bash
# Verify your API key and credits
# Check https://platform.openai.com/account/usage
```

**"Cost limit exceeded"**
```bash
# Increase limit in .env file
MAX_DAILY_COST=30.00
```

**"Process interrupted"**
```bash
# Just run the same command again - it will resume
node scripts/runContentGeneration.js
```

### Force Fresh Start
```bash
# Delete resume state to start completely over
rm scripts/resumeState.json
node scripts/runContentGeneration.js
```

---

## 📈 Expected Results

### After Successful Completion
- **Database populated** with 400+ real Albanian translations
- **UI shows real content** instead of mock data
- **"Continue Your Lesson"** loads actual Albanian phrases
- **Spaced repetition** works with real translations
- **Cultural context** available for family conversations

### Cost Breakdown
- **Translation API calls:** ~$6-10
- **Pronunciation generation:** ~$1-2  
- **Exercise variations:** ~$1-3
- **Total:** $8-15 (well under $20 limit)

### Time Breakdown
- **Phase 1 - Vocabulary:** 15 minutes
- **Phase 2 - Lessons:** 20 minutes
- **Phase 3 - Exercises:** 15 minutes
- **Phase 4 - Pronunciation:** 5 minutes
- **Phase 5 - Database:** 2 minutes
- **Total:** 30-45 minutes

---

## 🎯 Success Validation

After generation completes:

1. **Start your app:** `npm run dev`
2. **Visit:** `http://localhost:3000`
3. **Create account** and select Albanian
4. **Click "Continue Your Lesson"**
5. **Verify real Albanian content** loads (not mock data)

You should see actual phrases like:
- "Ky është babai im" (This is my father)
- "Mirëmëngjes" (Good morning)  
- "Si jeni?" (How are you?)

---

## 🏆 Next Steps After Content Generation

1. **Test the learning experience** with real Albanian content
2. **Share with Albanian family** for feedback on translations
3. **Iterate on UI/UX** now that you have real data flowing
4. **Add more content batches** for advanced vocabulary
5. **Deploy to production** for public Albanian learners

**Ready to wake up tomorrow with a fully functional Albanian learning app! 🇦🇱**