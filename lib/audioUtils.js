/**
 * Audio Utilities for Web Speech API
 * Text-to-speech and speech recognition functionality
 */

export class AudioUtils {
  constructor() {
    this.synthesis = window.speechSynthesis;
    this.recognition = null;
    this.isSupported = this.checkSupport();
  }
  
  checkSupport() {
    return {
      synthesis: 'speechSynthesis' in window,
      recognition: 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
    };
  }
  
  /**
   * Play text-to-speech for Albanian phrases
   */
  async speak(text, options = {}) {
    return new Promise((resolve, reject) => {
      if (!this.isSupported.synthesis) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }
      
      if (!text) {
        reject(new Error('No text provided'));
        return;
      }
      
      // Cancel any ongoing speech
      this.synthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Configure utterance
      utterance.lang = options.language || 'sq-AL'; // Albanian
      utterance.rate = options.rate || 0.8; // Slower for learning
      utterance.pitch = options.pitch || 1;
      utterance.volume = options.volume || 0.8;
      
      // Event handlers
      utterance.onend = () => resolve();
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        reject(new Error(`Speech synthesis failed: ${event.error}`));
      };
      
      // Start speaking
      this.synthesis.speak(utterance);
    });
  }
  
  /**
   * Stop any ongoing speech
   */
  stopSpeaking() {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
  }
  
  /**
   * Start speech recognition
   */
  startListening(options = {}) {
    return new Promise((resolve, reject) => {
      if (!this.isSupported.recognition) {
        reject(new Error('Speech recognition not supported'));
        return;
      }
      
      try {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        // Configure recognition
        this.recognition.continuous = options.continuous || false;
        this.recognition.interimResults = options.interimResults || false;
        this.recognition.lang = options.language || 'en-US';
        this.recognition.maxAlternatives = options.maxAlternatives || 1;
        
        // Event handlers
        this.recognition.onresult = (event) => {
          const results = [];
          for (let i = 0; i < event.results.length; i++) {
            const result = event.results[i];
            results.push({
              transcript: result[0].transcript,
              confidence: result[0].confidence,
              isFinal: result.isFinal
            });
          }
          resolve(results);
        };
        
        this.recognition.onerror = (event) => {
          console.error('Speech recognition error:', event);
          reject(new Error(`Speech recognition failed: ${event.error}`));
        };
        
        this.recognition.onend = () => {
          // Recognition ended
        };
        
        // Start recognition
        this.recognition.start();
        
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Stop speech recognition
   */
  stopListening() {
    if (this.recognition) {
      this.recognition.stop();
      this.recognition = null;
    }
  }
  
  /**
   * Get available voices for Albanian
   */
  getAlbanianVoices() {
    if (!this.isSupported.synthesis) return [];
    
    const voices = this.synthesis.getVoices();
    return voices.filter(voice => 
      voice.lang.startsWith('sq') || 
      voice.lang.includes('Albanian')
    );
  }
  
  /**
   * Compare two phrases for similarity (basic implementation)
   */
  comparePhrases(phrase1, phrase2) {
    if (!phrase1 || !phrase2) return 0;
    
    const normalize = (str) => str.toLowerCase().trim().replace(/[^\w\s]/g, '');
    const normalized1 = normalize(phrase1);
    const normalized2 = normalize(phrase2);
    
    if (normalized1 === normalized2) return 1;
    
    // Simple Levenshtein distance implementation
    const matrix = [];
    const len1 = normalized1.length;
    const len2 = normalized2.length;
    
    for (let i = 0; i <= len2; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= len1; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= len2; i++) {
      for (let j = 1; j <= len1; j++) {
        if (normalized2.charAt(i - 1) === normalized1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }
    
    const maxLen = Math.max(len1, len2);
    return maxLen === 0 ? 1 : (maxLen - matrix[len2][len1]) / maxLen;
  }
}

/**
 * Pimsleur-style interval management
 */
export class PimsleurIntervals {
  constructor() {
    this.intervals = {
      immediate: 5 * 1000,      // 5 seconds
      short: 25 * 1000,         // 25 seconds
      medium: 2 * 60 * 1000,    // 2 minutes
      long: 10 * 60 * 1000      // 10 minutes
    };
    
    this.scheduledItems = new Map();
  }
  
  /**
   * Schedule an item for review
   */
  scheduleReview(itemId, interval = 'immediate', callback) {
    // Clear any existing timeout for this item
    if (this.scheduledItems.has(itemId)) {
      clearTimeout(this.scheduledItems.get(itemId));
    }
    
    const delay = this.intervals[interval] || this.intervals.immediate;
    
    const timeoutId = setTimeout(() => {
      callback(itemId);
      this.scheduledItems.delete(itemId);
    }, delay);
    
    this.scheduledItems.set(itemId, timeoutId);
    
    return timeoutId;
  }
  
  /**
   * Cancel a scheduled review
   */
  cancelReview(itemId) {
    if (this.scheduledItems.has(itemId)) {
      clearTimeout(this.scheduledItems.get(itemId));
      this.scheduledItems.delete(itemId);
    }
  }
  
  /**
   * Clear all scheduled reviews
   */
  clearAll() {
    for (const timeoutId of this.scheduledItems.values()) {
      clearTimeout(timeoutId);
    }
    this.scheduledItems.clear();
  }
  
  /**
   * Get next interval based on performance
   */
  getNextInterval(currentInterval, performance) {
    const intervals = ['immediate', 'short', 'medium', 'long'];
    const currentIndex = intervals.indexOf(currentInterval);
    
    if (performance >= 0.8) {
      // Good performance - advance to next interval
      return intervals[Math.min(currentIndex + 1, intervals.length - 1)];
    } else if (performance >= 0.6) {
      // Okay performance - stay at current interval
      return currentInterval;
    } else {
      // Poor performance - go back to earlier interval
      return intervals[Math.max(currentIndex - 1, 0)];
    }
  }
}

// Export singleton instance
export const audioUtils = new AudioUtils();
export const pimsleurIntervals = new PimsleurIntervals();