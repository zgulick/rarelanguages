// Test utilities for lesson flow testing

export const mockLessonData = {
  basic: {
    id: 'lesson-1',
    name: 'Family Vocabulary',
    description: 'Learn basic family terms',
    content: [
      {
        id: '1',
        target_phrase: 'babai',
        english_phrase: 'father',
        pronunciation_guide: 'BAH-bye',
        cultural_context: 'Albanian fathers are respected family heads'
      },
      {
        id: '2', 
        target_phrase: 'nëna',
        english_phrase: 'mother',
        pronunciation_guide: 'NUH-nah',
        cultural_context: 'Mothers are central to Albanian family life'
      },
      {
        id: '3',
        target_phrase: 'djali',
        english_phrase: 'son',
        pronunciation_guide: 'JAH-lee',
        cultural_context: 'Sons carry family name'
      }
    ]
  },
  
  textbookContent: {
    success: true,
    content: {
      topic: 'Family Vocabulary',
      description: 'Learn family members in Albanian',
      estimatedMinutes: 15,
      vocabulary: [
        {
          id: '1',
          albanian: 'babai',
          english: 'father',
          pronunciation: 'BAH-bye',
          cultural_context: 'Albanian fathers are respected family heads'
        },
        {
          id: '2', 
          albanian: 'nëna',
          english: 'mother',
          pronunciation: 'NUH-nah',
          cultural_context: 'Mothers are central to Albanian family life'
        },
        {
          id: '3',
          albanian: 'djali',
          english: 'son',
          pronunciation: 'JAH-lee',
          cultural_context: 'Sons carry family name'
        }
      ]
    }
  }
}

export const BugDetectors = {
  // Detect auto-answer bug in practice phase
  detectAutoAnswer: async (page) => {
    const results = []
    
    // Navigate to practice phase
    for (let i = 0; i < 4; i++) {
      await page.click('text=Continue →')
      await page.waitForTimeout(300)
    }
    
    // Answer first question
    const firstAnswer = page.locator('button').filter({ hasText: /^(babai|nëna|djali)$/ }).first()
    await firstAnswer.click()
    
    // Wait for auto-advance
    await page.waitForTimeout(2500)
    
    // Check if second question has pre-selected answer
    const selectedButtons = page.locator('button.border-green-500, button.bg-green-50')
    const selectedCount = await selectedButtons.count()
    
    if (selectedCount > 0) {
      results.push({
        bug: 'auto-answer',
        severity: 'high',
        description: 'Answer automatically selected on new question'
      })
    }
    
    return results
  },
  
  // Detect immediate wrong answer bug in testing phase
  detectImmediateWrongAnswer: async (page) => {
    const results = []
    
    // Navigate to testing phase
    for (let i = 0; i < 8; i++) {
      await page.click('text=Continue →')
      await page.waitForTimeout(300)
    }
    
    // Check if feedback appears without user input
    const feedback = page.locator('text=📚 Good try!, text=🎉 Excellent!')
    const feedbackVisible = await feedback.isVisible()
    
    if (feedbackVisible) {
      results.push({
        bug: 'immediate-wrong-answer',
        severity: 'high',
        description: 'Feedback shown before user provides answer'
      })
    }
    
    return results
  },
  
  // Detect state management issues
  detectStateIssues: async (page) => {
    const results = []
    
    // Test rapid clicking
    await page.click('text=Continue →')
    const button = page.locator('button').first()
    
    // Rapid multiple clicks
    for (let i = 0; i < 5; i++) {
      await button.click()
    }
    
    // Check for duplicate state updates
    const errorMessages = page.locator('text=Error, text=Failed')
    const errorCount = await errorMessages.count()
    
    if (errorCount > 0) {
      results.push({
        bug: 'state-management',
        severity: 'medium',
        description: 'State corruption from rapid interactions'
      })
    }
    
    return results
  }
}

export const TestHelpers = {
  // Navigate through lesson phases
  navigateToPhase: async (page, phase) => {
    const phaseMap = {
      'teaching': 0,
      'practice': 4,
      'testing': 8
    }
    
    const clickCount = phaseMap[phase] || 0
    
    for (let i = 0; i < clickCount; i++) {
      await page.click('text=Continue →')
      await page.waitForTimeout(300)
    }
  },
  
  // Answer practice question correctly
  answerPracticeCorrectly: async (page) => {
    const correctAnswer = page.locator('button').filter({ hasText: 'babai' }).first()
    await correctAnswer.click()
    await page.waitForTimeout(2500) // Wait for auto-advance
  },
  
  // Answer recall test correctly
  answerRecallCorrectly: async (page) => {
    const input = page.locator('input[placeholder="Type your answer..."]')
    await input.fill('babai')
    await page.click('text=Check Answer')
    await page.waitForTimeout(3500) // Wait for auto-advance
  },
  
  // Check for memory leaks
  checkMemoryLeaks: async (page) => {
    const initialHeap = await page.evaluate(() => performance.memory?.usedJSHeapSize || 0)
    
    // Perform memory-intensive operations
    for (let i = 0; i < 10; i++) {
      await page.click('text=Continue →')
      await page.waitForTimeout(100)
    }
    
    // Force garbage collection if available
    await page.evaluate(() => {
      if (window.gc) window.gc()
    })
    
    const finalHeap = await page.evaluate(() => performance.memory?.usedJSHeapSize || 0)
    const heapGrowth = finalHeap - initialHeap
    
    return {
      initialHeap,
      finalHeap,
      heapGrowth,
      suspiciousGrowth: heapGrowth > 10 * 1024 * 1024 // 10MB threshold
    }
  },
  
  // Verify accessibility
  checkAccessibility: async (page) => {
    const issues = []
    
    // Check for missing alt text
    const images = page.locator('img:not([alt])')
    const imageCount = await images.count()
    if (imageCount > 0) {
      issues.push({ type: 'missing-alt', count: imageCount })
    }
    
    // Check for missing form labels
    const unlabeledInputs = page.locator('input:not([aria-label]):not([aria-labelledby])')
    const unlabeledCount = await unlabeledInputs.count()
    if (unlabeledCount > 0) {
      issues.push({ type: 'missing-label', count: unlabeledCount })
    }
    
    // Check color contrast (basic check)
    const lowContrastElements = page.locator('[style*="color: #ccc"], [style*="color: #ddd"]')
    const contrastCount = await lowContrastElements.count()
    if (contrastCount > 0) {
      issues.push({ type: 'low-contrast', count: contrastCount })
    }
    
    return issues
  }
}

export const ApiMocks = {
  // Mock successful lesson content
  mockSuccessfulLesson: () => ({
    ok: true,
    json: () => Promise.resolve(mockLessonData.textbookContent)
  }),
  
  // Mock API failure
  mockApiFailure: () => ({
    ok: false,
    json: () => Promise.resolve({ error: 'Server error' })
  }),
  
  // Mock slow API response
  mockSlowResponse: () => new Promise(resolve => {
    setTimeout(() => {
      resolve({
        ok: true,
        json: () => Promise.resolve(mockLessonData.textbookContent)
      })
    }, 5000)
  }),
  
  // Mock malformed response
  mockMalformedResponse: () => ({
    ok: true,
    json: () => Promise.reject(new Error('Invalid JSON'))
  })
}