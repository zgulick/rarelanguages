/**
 * Progress Tracker for Content Generation
 * Provides real-time progress display, cost monitoring, and resume capability
 */

const fs = require('fs').promises;
const path = require('path');

class ProgressTracker {
  constructor(resumeState = {}) {
    this.state = {
      startTime: resumeState.startTime || Date.now(),
      phases: resumeState.phases || {},
      completedBatches: resumeState.completedBatches || new Set(),
      translations: resumeState.translations || [],
      costs: resumeState.costs || [],
      errors: resumeState.errors || [],
      currentPhase: resumeState.currentPhase || 'starting',
      batchResults: resumeState.batchResults || {}
    };
    
    // Convert Set back from array if resuming
    if (Array.isArray(this.state.completedBatches)) {
      this.state.completedBatches = new Set(this.state.completedBatches);
    }
    
    this.resumeFile = path.join(__dirname, 'resumeState.json');
    this.displayInterval = null;
    this.saveCounter = 0;
    
    // Start progress display
    this.startProgressDisplay();
    
    console.log('📊 Progress tracker initialized');
    if (resumeState.startTime) {
      console.log('🔄 Resuming from previous session');
    }
  }
  
  /**
   * Start real-time progress display
   */
  startProgressDisplay() {
    this.displayProgress();
    this.displayInterval = setInterval(() => {
      this.displayProgress();
    }, 10000); // Update every 10 seconds
  }
  
  /**
   * Display current progress
   */
  displayProgress() {
    console.clear();
    console.log('🇦🇱 GHEG ALBANIAN CONTENT GENERATION');
    console.log('═'.repeat(50));
    
    const elapsed = Math.floor((Date.now() - this.state.startTime) / 1000 / 60);
    console.log(`⏱️  Running for: ${elapsed} minutes`);
    console.log(`💰 Cost so far: $${this.getTotalCost().toFixed(2)}`);
    console.log(`📊 Current phase: ${this.state.currentPhase}`);
    console.log('');
    
    // Phase progress
    const phases = [
      { name: 'Vocabulary Translation', key: 'vocabulary_translation', estimate: 15 },
      { name: 'Lesson Content', key: 'lesson_content', estimate: 20 },
      { name: 'Exercise Generation', key: 'exercise_generation', estimate: 15 },
      { name: 'Pronunciation Guides', key: 'pronunciation_guides', estimate: 5 },
      { name: 'Database Population', key: 'database_population', estimate: 2 }
    ];
    
    phases.forEach(phase => {
      const status = this.isCompleted(phase.key) ? '✅' : 
                    this.state.currentPhase === phase.key ? '🔄' : '⏳';
      console.log(`${status} ${phase.name} (~${phase.estimate}min)`);
    });
    
    console.log('');
    console.log(`📝 Translation batches completed: ${this.state.completedBatches.size}`);
    console.log(`📝 Total translations: ${this.state.translations.length}`);
    
    if (this.state.errors.length > 0) {
      console.log(`⚠️  Errors (will retry): ${this.state.errors.length}`);
    }
    
    // Show recent activity
    if (this.state.translations.length > 0) {
      const recent = this.state.translations.slice(-3);
      console.log('');
      console.log('📋 Recent translations:');
      recent.forEach(t => {
        const preview = t.albanian.length > 30 ? t.albanian.substring(0, 30) + '...' : t.albanian;
        console.log(`   "${t.english}" → "${preview}"`);
      });
    }
    
    console.log('');
    console.log('💤 Safe to leave running overnight');
    console.log('🔄 Progress auto-saved - resumable if interrupted');
    
    // Cost projection
    const remainingEstimate = this.getRemainingCostEstimate();
    if (remainingEstimate > 0) {
      console.log(`💡 Estimated remaining cost: $${remainingEstimate.toFixed(2)}`);
    }
  }
  
  /**
   * Set current phase
   */
  setCurrentPhase(phase) {
    this.state.currentPhase = phase;
    this.saveState();
  }
  
  /**
   * Mark a phase as completed
   */
  markCompleted(phaseKey) {
    this.state.phases[phaseKey] = {
      completed: true,
      timestamp: Date.now()
    };
    this.saveState();
  }
  
  /**
   * Check if phase is completed
   */
  isCompleted(phaseKey) {
    return this.state.phases[phaseKey]?.completed || false;
  }
  
  /**
   * Check if batch is completed
   */
  isBatchCompleted(batchName) {
    return this.state.completedBatches.has(batchName);
  }
  
  /**
   * Log completed batch
   */
  logBatchComplete(batchName, translations) {
    this.state.completedBatches.add(batchName);
    this.state.batchResults[batchName] = {
      translationCount: translations.length,
      timestamp: Date.now()
    };
    
    // Add translations to overall list
    translations.forEach(t => {
      this.logTranslation(t.english, t.albanian || t.gheg, 0.02); // ~$0.02 per phrase estimate
    });
    
    this.saveState();
  }
  
  /**
   * Log individual translation
   */
  logTranslation(english, albanian, cost = 0.02) {
    this.state.translations.push({
      english,
      albanian,
      timestamp: Date.now()
    });
    
    this.state.costs.push(cost);
    
    // Save state periodically (every 10 translations)
    this.saveCounter++;
    if (this.saveCounter % 10 === 0) {
      this.saveState();
    }
  }
  
  /**
   * Log an error
   */
  logError(error, context = '') {
    this.state.errors.push({
      message: error.message,
      context,
      timestamp: Date.now()
    });
    this.saveState();
  }
  
  /**
   * Get total cost
   */
  getTotalCost() {
    return this.state.costs.reduce((sum, cost) => sum + cost, 0);
  }
  
  /**
   * Get translation count
   */
  getTranslationCount() {
    return this.state.translations.length;
  }
  
  /**
   * Get start time
   */
  getStartTime() {
    return this.state.startTime;
  }
  
  /**
   * Get all translations
   */
  getTranslations() {
    return this.state.translations;
  }
  
  /**
   * Estimate remaining cost based on progress
   */
  getRemainingCostEstimate() {
    const completedPhases = Object.keys(this.state.phases).filter(key => this.isCompleted(key)).length;
    const totalPhases = 5;
    const avgCostPerPhase = this.getTotalCost() / Math.max(completedPhases, 1);
    const remainingPhases = totalPhases - completedPhases;
    
    return Math.max(0, remainingPhases * avgCostPerPhase);
  }
  
  /**
   * Save current state to file
   */
  async saveState() {
    try {
      const stateToSave = {
        ...this.state,
        completedBatches: Array.from(this.state.completedBatches) // Convert Set to Array for JSON
      };
      
      await fs.writeFile(this.resumeFile, JSON.stringify(stateToSave, null, 2));
    } catch (error) {
      console.error('⚠️  Failed to save progress state:', error.message);
    }
  }
  
  /**
   * Clean up resources
   */
  cleanup() {
    if (this.displayInterval) {
      clearInterval(this.displayInterval);
    }
  }
  
  /**
   * Get summary statistics
   */
  getSummary() {
    const elapsed = Date.now() - this.state.startTime;
    const completedPhases = Object.keys(this.state.phases).filter(key => this.isCompleted(key)).length;
    
    return {
      totalTime: elapsed,
      totalCost: this.getTotalCost(),
      translationCount: this.state.translations.length,
      batchesCompleted: this.state.completedBatches.size,
      phasesCompleted: completedPhases,
      errorCount: this.state.errors.length,
      avgCostPerTranslation: this.getTotalCost() / Math.max(this.state.translations.length, 1)
    };
  }
}

/**
 * Load resume state from file
 */
async function loadResumeState() {
  try {
    const stateFile = path.join(__dirname, 'resumeState.json');
    const stateData = await fs.readFile(stateFile, 'utf8');
    return JSON.parse(stateData);
  } catch (error) {
    return {};
  }
}

module.exports = {
  ProgressTracker,
  loadResumeState
};