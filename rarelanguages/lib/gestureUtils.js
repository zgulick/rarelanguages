/**
 * Gesture Utilities for Mobile Touch Interactions
 * Swipe detection and touch handling for exercise components
 */

export class GestureUtils {
  constructor() {
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchEndX = 0;
    this.touchEndY = 0;
    this.minSwipeDistance = 50;
    this.maxSwipeTime = 300;
    this.touchStartTime = 0;
  }
  
  /**
   * Set up swipe detection for an element
   */
  setupSwipeDetection(element, callbacks = {}) {
    if (!element) return;
    
    const handleTouchStart = (e) => {
      this.touchStartX = e.changedTouches[0].screenX;
      this.touchStartY = e.changedTouches[0].screenY;
      this.touchStartTime = Date.now();
      
      if (callbacks.onTouchStart) {
        callbacks.onTouchStart(e);
      }
    };
    
    const handleTouchEnd = (e) => {
      this.touchEndX = e.changedTouches[0].screenX;
      this.touchEndY = e.changedTouches[0].screenY;
      
      const touchDuration = Date.now() - this.touchStartTime;
      const swipeDirection = this.getSwipeDirection();
      
      // Only trigger swipe if it's within time limit and meets distance threshold
      if (touchDuration <= this.maxSwipeTime && swipeDirection) {
        if (callbacks.onSwipe) {
          callbacks.onSwipe(swipeDirection, e);
        }
        
        // Specific direction callbacks
        switch (swipeDirection) {
          case 'left':
            if (callbacks.onSwipeLeft) callbacks.onSwipeLeft(e);
            break;
          case 'right':
            if (callbacks.onSwipeRight) callbacks.onSwipeRight(e);
            break;
          case 'up':
            if (callbacks.onSwipeUp) callbacks.onSwipeUp(e);
            break;
          case 'down':
            if (callbacks.onSwipeDown) callbacks.onSwipeDown(e);
            break;
        }
      }
      
      if (callbacks.onTouchEnd) {
        callbacks.onTouchEnd(e);
      }
    };
    
    const handleTouchMove = (e) => {
      if (callbacks.onTouchMove) {
        callbacks.onTouchMove(e);
      }
    };
    
    // Add event listeners
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    
    // Return cleanup function
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchmove', handleTouchMove);
    };
  }
  
  /**
   * Determine swipe direction based on touch points
   */
  getSwipeDirection() {
    const deltaX = this.touchEndX - this.touchStartX;
    const deltaY = this.touchEndY - this.touchStartY;
    
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    
    // Check if swipe distance is sufficient
    if (Math.max(absDeltaX, absDeltaY) < this.minSwipeDistance) {
      return null;
    }
    
    // Determine primary direction
    if (absDeltaX > absDeltaY) {
      // Horizontal swipe
      return deltaX > 0 ? 'right' : 'left';
    } else {
      // Vertical swipe
      return deltaY > 0 ? 'down' : 'up';
    }
  }
  
  /**
   * Set up tap detection with configurable timing
   */
  setupTapDetection(element, callback, options = {}) {
    if (!element || !callback) return;
    
    const maxTapDuration = options.maxTapDuration || 200;
    const maxTapDistance = options.maxTapDistance || 10;
    
    let tapStartX = 0;
    let tapStartY = 0;
    let tapStartTime = 0;
    
    const handleTouchStart = (e) => {
      tapStartX = e.changedTouches[0].screenX;
      tapStartY = e.changedTouches[0].screenY;
      tapStartTime = Date.now();
    };
    
    const handleTouchEnd = (e) => {
      const tapEndX = e.changedTouches[0].screenX;
      const tapEndY = e.changedTouches[0].screenY;
      const tapDuration = Date.now() - tapStartTime;
      
      const distance = Math.sqrt(
        Math.pow(tapEndX - tapStartX, 2) + Math.pow(tapEndY - tapStartY, 2)
      );
      
      // Check if it's a valid tap
      if (tapDuration <= maxTapDuration && distance <= maxTapDistance) {
        callback(e);
      }
    };
    
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }
  
  /**
   * Set up long press detection
   */
  setupLongPressDetection(element, callback, options = {}) {
    if (!element || !callback) return;
    
    const longPressDuration = options.duration || 800;
    let longPressTimer = null;
    let isLongPress = false;
    
    const handleTouchStart = (e) => {
      isLongPress = false;
      longPressTimer = setTimeout(() => {
        isLongPress = true;
        callback(e);
      }, longPressDuration);
    };
    
    const handleTouchEnd = () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
    };
    
    const handleTouchMove = () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
    };
    
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    
    return () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchmove', handleTouchMove);
    };
  }
  
  /**
   * Check if device supports touch
   */
  isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }
  
  /**
   * Get viewport dimensions
   */
  getViewportDimensions() {
    return {
      width: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0),
      height: Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
    };
  }
  
  /**
   * Check if device is in landscape orientation
   */
  isLandscape() {
    const { width, height } = this.getViewportDimensions();
    return width > height;
  }
  
  /**
   * Prevent default touch behaviors (like scrolling)
   */
  preventDefault(element, events = ['touchstart', 'touchmove', 'touchend']) {
    if (!element) return;
    
    const preventHandler = (e) => {
      e.preventDefault();
    };
    
    events.forEach(event => {
      element.addEventListener(event, preventHandler, { passive: false });
    });
    
    return () => {
      events.forEach(event => {
        element.removeEventListener(event, preventHandler);
      });
    };
  }
}

/**
 * Card flip animation utilities
 */
export class CardAnimationUtils {
  /**
   * Flip card with CSS transform
   */
  static flipCard(element, options = {}) {
    if (!element) return;
    
    const duration = options.duration || 600;
    const easing = options.easing || 'cubic-bezier(0.4, 0, 0.2, 1)';
    
    element.style.transition = `transform ${duration}ms ${easing}`;
    element.style.transformStyle = 'preserve-3d';
    
    if (element.style.transform.includes('rotateY(180deg)')) {
      element.style.transform = 'rotateY(0deg)';
    } else {
      element.style.transform = 'rotateY(180deg)';
    }
    
    return new Promise(resolve => {
      setTimeout(() => {
        resolve();
      }, duration);
    });
  }
  
  /**
   * Slide card left/right
   */
  static slideCard(element, direction = 'left', options = {}) {
    if (!element) return;
    
    const distance = options.distance || '100%';
    const duration = options.duration || 300;
    const easing = options.easing || 'ease-out';
    
    const translateX = direction === 'left' ? `-${distance}` : distance;
    
    element.style.transition = `transform ${duration}ms ${easing}, opacity ${duration}ms ${easing}`;
    element.style.transform = `translateX(${translateX})`;
    element.style.opacity = '0';
    
    return new Promise(resolve => {
      setTimeout(() => {
        resolve();
      }, duration);
    });
  }
  
  /**
   * Reset card position
   */
  static resetCard(element) {
    if (!element) return;
    
    element.style.transform = '';
    element.style.opacity = '';
    element.style.transition = '';
  }
}

// Export singleton instance
export const gestureUtils = new GestureUtils();