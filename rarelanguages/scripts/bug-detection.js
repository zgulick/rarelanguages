#!/usr/bin/env node

/**
 * Bug Detection Script
 * 
 * This script specifically tests for the bugs reported:
 * 1. Auto-answer in practice phase after clicking next
 * 2. Immediate wrong answer in testing phase
 * 3. Auto-advance without user interaction
 */

const { chromium } = require('playwright')

class BugDetector {
  constructor() {
    this.bugs = []
    this.browser = null
    this.page = null
  }

  async setup() {
    this.browser = await chromium.launch({ headless: false }) // Use headless: true in CI
    this.page = await this.browser.newPage()
    
    // Set up console logging to catch errors
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('🚨 Console Error:', msg.text())
      }
    })
    
    await this.page.goto('http://localhost:3001') // Use your live site URL for real testing
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close()
    }
  }

  async startLesson() {
    try {
      // Select Albanian and start lesson
      await this.page.click('text=Gheg Albanian', { timeout: 10000 })
      await this.page.waitForSelector('text=Continue Lesson', { timeout: 10000 })
      await this.page.click('text=Continue Lesson')
      await this.page.waitForSelector('text=Family Vocabulary', { timeout: 10000 })
      console.log('✅ Lesson started successfully')
      return true
    } catch (error) {
      console.log('❌ Failed to start lesson:', error.message)
      return false
    }
  }

  async testAutoAnswerBug() {
    console.log('\n🐛 Testing: Auto-answer bug in practice phase')
    
    try {
      // Navigate through teaching phase to practice
      for (let i = 0; i < 4; i++) {
        await this.page.click('text=Continue →')
        await this.page.waitForTimeout(500)
      }

      // Verify we're in practice phase
      await this.page.waitForSelector('text=Which word means', { timeout: 5000 })
      console.log('📍 Reached practice phase')

      // Answer first question
      const firstAnswer = this.page.locator('button').filter({ hasText: /^(babai|nëna|djali)$/ }).first()
      await firstAnswer.click()
      console.log('📝 Answered first question')

      // Wait for feedback and auto-advance
      await this.page.waitForSelector('text=Correct!', { timeout: 3000 })
      await this.page.waitForTimeout(2500) // Wait for auto-advance

      // BUG CHECK: Is an answer pre-selected on the second question?
      const selectedButtons = this.page.locator('button.border-green-500, button.bg-green-50')
      const selectedCount = await selectedButtons.count()

      if (selectedCount > 0) {
        this.bugs.push({
          type: 'AUTO_ANSWER',
          severity: 'HIGH',
          description: 'Answer automatically selected on new practice question',
          reproduction: 'Answer first practice question, wait for auto-advance, check if second question has pre-selected answer'
        })
        console.log('🚨 BUG DETECTED: Auto-answer in practice phase')
        return false
      } else {
        console.log('✅ No auto-answer bug detected')
        return true
      }
    } catch (error) {
      console.log('❌ Error testing auto-answer bug:', error.message)
      return false
    }
  }

  async testImmediateWrongAnswerBug() {
    console.log('\n🐛 Testing: Immediate wrong answer bug in testing phase')
    
    try {
      // Navigate to testing phase (skip through remaining practice cards)
      for (let i = 0; i < 4; i++) {
        try {
          await this.page.click('text=Continue →', { timeout: 2000 })
          await this.page.waitForTimeout(300)
        } catch {
          // If button not found, try clicking an answer instead
          const practiceButton = this.page.locator('button').filter({ hasText: /^(babai|nëna|djali)$/ }).first()
          if (await practiceButton.isVisible()) {
            await practiceButton.click()
            await this.page.waitForTimeout(2500)
          }
        }
      }

      // Should be in testing phase now
      await this.page.waitForSelector('text=How do you say', { timeout: 10000 })
      console.log('📍 Reached testing phase')

      // BUG CHECK: Is there immediate feedback without user input?
      const feedback = this.page.locator('text=📚 Good try!, text=🎉 Excellent!')
      const feedbackVisible = await feedback.isVisible()

      if (feedbackVisible) {
        this.bugs.push({
          type: 'IMMEDIATE_WRONG_ANSWER',
          severity: 'HIGH',
          description: 'Feedback shown immediately without user providing answer',
          reproduction: 'Navigate to testing phase and check if feedback appears before user input'
        })
        console.log('🚨 BUG DETECTED: Immediate wrong answer in testing phase')
        return false
      }

      // Verify input field is present and empty
      const input = this.page.locator('input[placeholder="Type your answer..."]')
      const inputValue = await input.inputValue()

      if (inputValue !== '') {
        this.bugs.push({
          type: 'PRE_FILLED_INPUT',
          severity: 'MEDIUM',
          description: 'Input field pre-filled with value',
          reproduction: 'Navigate to testing phase and check input field value'
        })
        console.log('🚨 BUG DETECTED: Input field pre-filled')
        return false
      }

      console.log('✅ No immediate wrong answer bug detected')
      return true
    } catch (error) {
      console.log('❌ Error testing immediate wrong answer bug:', error.message)
      return false
    }
  }

  async testStateManagementBugs() {
    console.log('\n🐛 Testing: State management and race conditions')
    
    try {
      // Test rapid clicking
      const continueButton = this.page.locator('text=Continue →')
      
      if (await continueButton.isVisible()) {
        // Rapid multiple clicks
        for (let i = 0; i < 5; i++) {
          await continueButton.click()
          await this.page.waitForTimeout(50)
        }
        
        // Check for error states
        const errorMessages = this.page.locator('text=Error, text=Failed, text=undefined')
        const errorCount = await errorMessages.count()
        
        if (errorCount > 0) {
          this.bugs.push({
            type: 'STATE_CORRUPTION',
            severity: 'MEDIUM',
            description: 'State corruption from rapid interactions',
            reproduction: 'Rapidly click continue button multiple times'
          })
          console.log('🚨 BUG DETECTED: State management issues')
          return false
        }
      }

      console.log('✅ No state management bugs detected')
      return true
    } catch (error) {
      console.log('❌ Error testing state management:', error.message)
      return false
    }
  }

  async testTimingBugs() {
    console.log('\n🐛 Testing: Timer and auto-advance bugs')
    
    try {
      // Navigate back to a practice question if possible
      await this.page.goto('http://localhost:3001')
      await this.startLesson()
      
      // Get to practice phase
      for (let i = 0; i < 4; i++) {
        await this.page.click('text=Continue →')
        await this.page.waitForTimeout(300)
      }

      // Answer question and measure timing
      const startTime = Date.now()
      const answer = this.page.locator('button').filter({ hasText: /^(babai|nëna|djali)$/ }).first()
      await answer.click()

      // Wait for auto-advance
      await this.page.waitForTimeout(3000)
      const endTime = Date.now()
      const timingDiff = endTime - startTime

      // Check if timing is within expected range (should be ~2 seconds)
      if (timingDiff < 1500 || timingDiff > 5000) {
        this.bugs.push({
          type: 'INCORRECT_TIMING',
          severity: 'LOW',
          description: `Auto-advance timing incorrect: ${timingDiff}ms (expected ~2000ms)`,
          reproduction: 'Answer practice question and measure auto-advance timing'
        })
        console.log(`🚨 BUG DETECTED: Incorrect timing - ${timingDiff}ms`)
        return false
      }

      console.log(`✅ Timing correct: ${timingDiff}ms`)
      return true
    } catch (error) {
      console.log('❌ Error testing timing:', error.message)
      return false
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(60))
    console.log('🔍 BUG DETECTION REPORT')
    console.log('='.repeat(60))

    if (this.bugs.length === 0) {
      console.log('🎉 NO BUGS DETECTED! The lesson flow is working correctly.')
      return 0
    }

    console.log(`❌ ${this.bugs.length} BUG(S) DETECTED:\n`)

    this.bugs.forEach((bug, index) => {
      console.log(`${index + 1}. ${bug.type} (${bug.severity} severity)`)
      console.log(`   Description: ${bug.description}`)
      console.log(`   Reproduction: ${bug.reproduction}`)
      console.log('')
    })

    console.log('🔧 RECOMMENDED FIXES:')
    
    if (this.bugs.some(b => b.type === 'AUTO_ANSWER')) {
      console.log('- Reset button states between practice questions')
      console.log('- Clear selection state in component cleanup')
    }
    
    if (this.bugs.some(b => b.type === 'IMMEDIATE_WRONG_ANSWER')) {
      console.log('- Ensure feedback only shows after user input')
      console.log('- Reset showResult state between questions')
    }
    
    if (this.bugs.some(b => b.type === 'STATE_CORRUPTION')) {
      console.log('- Add debouncing to prevent rapid clicks')
      console.log('- Use refs to track component mount state')
    }

    console.log('\n' + '='.repeat(60))
    return 1
  }

  async runAllTests() {
    console.log('🚀 Starting Bug Detection Suite')
    console.log('Testing for specific issues reported by user:\n')

    try {
      await this.setup()
      
      const lessonStarted = await this.startLesson()
      if (!lessonStarted) {
        console.log('❌ Cannot run tests - lesson failed to start')
        return 1
      }

      await this.testAutoAnswerBug()
      await this.testImmediateWrongAnswerBug()
      await this.testStateManagementBugs()
      await this.testTimingBugs()

      return this.generateReport()
    } catch (error) {
      console.log('❌ Test suite error:', error.message)
      return 1
    } finally {
      await this.cleanup()
    }
  }
}

// Run if called directly
if (require.main === module) {
  const detector = new BugDetector()
  detector.runAllTests().then(exitCode => {
    process.exit(exitCode)
  })
}

module.exports = BugDetector