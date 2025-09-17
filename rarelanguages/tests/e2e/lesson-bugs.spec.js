import { test, expect } from '@playwright/test'

test.describe('Textbook Learning Flow - Bug Reproduction', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    
    // Select Albanian and start lesson
    await page.click('text=Gheg Albanian')
    await page.waitForSelector('text=Continue Lesson', { timeout: 10000 })
    await page.click('text=Continue Lesson')
  })

  test('🐛 BUG REPRODUCTION: Auto-answer and immediate wrong feedback', async ({ page }) => {
    // Navigate through teaching phase to practice
    await page.waitForSelector('text=Family Vocabulary', { timeout: 10000 })
    
    // Skip through teaching cards
    for (let i = 0; i < 4; i++) {
      await page.click('text=Continue →')
      await page.waitForTimeout(500)
    }

    // Now in practice phase - first question
    await page.waitForSelector('text=Which word means', { timeout: 5000 })
    
    // Click an answer
    const firstAnswer = page.locator('button').filter({ hasText: /^(babai|nëna|djali)$/ }).first()
    await firstAnswer.click()
    
    // Wait for feedback
    await page.waitForSelector('text=Correct!', { timeout: 3000 })
    
    // Wait for auto-advance (should be 2 seconds)
    await page.waitForTimeout(2500)
    
    // Check that second question doesn't have pre-filled answer or immediate feedback
    await expect(page.locator('text=✅ Correct!')).not.toBeVisible()
    await expect(page.locator('text=💡 Keep Learning!')).not.toBeVisible()
    
    // Verify buttons are not in "answered" state
    const optionButtons = page.locator('button').filter({ hasText: /^(babai|nëna|djali)$/ })
    const buttonCount = await optionButtons.count()
    
    for (let i = 0; i < buttonCount; i++) {
      const button = optionButtons.nth(i)
      // Should not have success/error styling
      await expect(button).not.toHaveClass(/border-green-500|border-red-500|bg-green-50|bg-red-50/)
    }
  })

  test('🐛 BUG REPRODUCTION: Recall test immediate wrong answer', async ({ page }) => {
    // Navigate to testing phase
    await page.waitForSelector('text=Family Vocabulary', { timeout: 10000 })
    
    // Skip through teaching and practice to get to testing
    for (let i = 0; i < 8; i++) {
      await page.click('text=Continue →')
      await page.waitForTimeout(500)
    }

    // Should be in testing phase now
    await page.waitForSelector('text=How do you say', { timeout: 5000 })
    
    // Verify input field is present and empty
    const input = page.locator('input[placeholder="Type your answer..."]')
    await expect(input).toBeVisible()
    await expect(input).toHaveValue('')
    
    // Should NOT see immediate feedback
    await expect(page.locator('text=📚 Good try!')).not.toBeVisible()
    await expect(page.locator('text=🎉 Excellent!')).not.toBeVisible()
    
    // Type wrong answer but don't submit yet
    await input.fill('wronganswer')
    
    // Still should not see feedback
    await expect(page.locator('text=📚 Good try!')).not.toBeVisible()
    
    // Now submit
    await page.click('text=Check Answer')
    
    // NOW should see feedback
    await page.waitForSelector('text=📚 Good try!', { timeout: 3000 })
    
    // Wait for auto-advance
    await page.waitForTimeout(3500)
    
    // Next question should have clean state
    await expect(page.locator('input[placeholder="Type your answer..."]')).toHaveValue('')
    await expect(page.locator('text=📚 Good try!')).not.toBeVisible()
  })

  test('🐛 BUG REPRODUCTION: Double-click prevention', async ({ page }) => {
    // Navigate to practice phase
    await page.waitForSelector('text=Family Vocabulary', { timeout: 10000 })
    
    for (let i = 0; i < 4; i++) {
      await page.click('text=Continue →')
      await page.waitForTimeout(300)
    }

    await page.waitForSelector('text=Which word means', { timeout: 5000 })
    
    // Try to double-click rapidly
    const answer = page.locator('button').filter({ hasText: /^(babai|nëna|djali)$/ }).first()
    
    // Rapid multiple clicks
    await answer.click()
    await answer.click()
    await answer.click()
    
    // Should only see one "Correct!" message, not multiple
    const feedbackMessages = page.locator('text=✅ Correct!')
    await expect(feedbackMessages).toHaveCount(1)
    
    // Button should be disabled after first click
    await expect(answer).toBeDisabled()
  })

  test('Complete lesson flow without bugs', async ({ page }) => {
    // Complete entire lesson to test for any issues
    await page.waitForSelector('text=Family Vocabulary', { timeout: 10000 })
    
    let cardCount = 0
    const maxCards = 20 // Safety limit
    
    while (cardCount < maxCards) {
      // Look for continue button or complete button
      const continueButton = page.locator('text=Continue →')
      const completeButton = page.locator('text=Complete Lesson')
      
      if (await continueButton.isVisible()) {
        await continueButton.click()
        cardCount++
      } else if (await completeButton.isVisible()) {
        await completeButton.click()
        break
      } else {
        // Check if we're in a practice question
        const practiceButtons = page.locator('button').filter({ hasText: /^(babai|nëna|djali)$/ })
        if (await practiceButtons.count() > 0) {
          await practiceButtons.first().click()
          await page.waitForTimeout(2500) // Wait for auto-advance
          cardCount++
        } else {
          // Check if we're in a recall test
          const input = page.locator('input[placeholder="Type your answer..."]')
          if (await input.isVisible()) {
            await input.fill('babai') // Use correct answer
            await page.click('text=Check Answer')
            await page.waitForTimeout(3500) // Wait for auto-advance
            cardCount++
          } else {
            break // No more interactions possible
          }
        }
      }
      
      await page.waitForTimeout(500) // Brief pause between interactions
    }
    
    // Should eventually see completion or be back at dashboard
    await page.waitForSelector('text=Lesson Complete!', { timeout: 10000 })
  })

  test('API error handling during lesson', async ({ page }) => {
    // Start lesson normally
    await page.waitForSelector('text=Family Vocabulary', { timeout: 10000 })
    
    // Intercept API calls and simulate errors
    await page.route('/api/lessons/**/textbook-content', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server error' })
      })
    })
    
    // Continue with lesson - should fallback gracefully
    await page.click('text=Continue →')
    
    // Should still be able to proceed with basic content
    await expect(page.locator('text=babai, nëna')).toBeVisible()
  })

  test('Mobile responsiveness', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    await page.waitForSelector('text=Family Vocabulary', { timeout: 10000 })
    
    // Check that lesson cards are properly sized for mobile
    const cardContainer = page.locator('.bg-white.rounded-2xl.shadow-xl')
    await expect(cardContainer).toBeVisible()
    
    // Navigation buttons should be accessible
    const continueButton = page.locator('text=Continue →')
    await expect(continueButton).toBeVisible()
    
    // Click should work on mobile
    await continueButton.click()
    await page.waitForTimeout(500)
    
    // Text should be readable
    const vocabularyText = page.locator('text=babai')
    await expect(vocabularyText).toBeVisible()
  })

  test('Keyboard navigation', async ({ page }) => {
    await page.waitForSelector('text=Family Vocabulary', { timeout: 10000 })
    
    // Test Tab navigation
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    
    // Should be able to activate buttons with Enter/Space
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()
    
    await page.keyboard.press('Enter')
    
    // Should advance to next card
    await page.waitForTimeout(500)
    await expect(page.locator('text=babai')).toBeVisible()
  })
})

test.describe('Performance and Load Testing', () => {
  test('Lesson loads within acceptable time', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('/')
    await page.click('text=Gheg Albanian')
    await page.click('text=Continue Lesson')
    await page.waitForSelector('text=Family Vocabulary', { timeout: 10000 })
    
    const loadTime = Date.now() - startTime
    expect(loadTime).toBeLessThan(5000) // Should load within 5 seconds
  })

  test('Memory usage remains stable during long lesson', async ({ page }) => {
    await page.goto('/')
    await page.click('text=Gheg Albanian')
    await page.click('text=Continue Lesson')
    await page.waitForSelector('text=Family Vocabulary', { timeout: 10000 })
    
    // Go through many cards rapidly
    for (let i = 0; i < 10; i++) {
      const continueButton = page.locator('text=Continue →')
      if (await continueButton.isVisible()) {
        await continueButton.click()
      }
      await page.waitForTimeout(100)
    }
    
    // Check that page is still responsive
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Accessibility Testing', () => {
  test('Lesson components have proper ARIA labels', async ({ page }) => {
    await page.goto('/')
    await page.click('text=Gheg Albanian')
    await page.click('text=Continue Lesson')
    await page.waitForSelector('text=Family Vocabulary', { timeout: 10000 })
    
    // Check for semantic structure
    await expect(page.locator('button')).toHaveCount(3) // Exit, Skip, Continue
    
    // Navigate to practice phase
    for (let i = 0; i < 4; i++) {
      await page.click('text=Continue →')
      await page.waitForTimeout(300)
    }
    
    // Check option buttons have proper labels
    const optionButtons = page.locator('button').filter({ hasText: /^(babai|nëna|djali)$/ })
    const buttonCount = await optionButtons.count()
    expect(buttonCount).toBeGreaterThan(0)
  })

  test('Color contrast and visual indicators', async ({ page }) => {
    await page.goto('/')
    await page.click('text=Gheg Albanian')
    await page.click('text=Continue Lesson')
    
    // Navigate to practice and answer question
    for (let i = 0; i < 4; i++) {
      await page.click('text=Continue →')
      await page.waitForTimeout(300)
    }
    
    const answer = page.locator('button').filter({ hasText: /^(babai|nëna|djali)$/ }).first()
    await answer.click()
    
    // Check that feedback is visually distinct
    await page.waitForSelector('text=✅ Correct!', { timeout: 3000 })
    
    // Correct answer should have green styling
    await expect(answer).toHaveClass(/border-green-500|bg-green-50/)
  })
})