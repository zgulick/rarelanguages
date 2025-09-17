import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TextbookLearningCards from '../../components/TextbookLearningCards'

describe('Lesson Flow Integration Tests - Bug Detection', () => {
  const mockLessonContent = {
    success: true,
    content: {
      topic: 'Family Vocabulary',
      vocabulary: [
        { id: '1', albanian: 'babai', english: 'father', pronunciation: 'BAH-bye' },
        { id: '2', albanian: 'nëna', english: 'mother', pronunciation: 'NUH-nah' },
        { id: '3', albanian: 'djali', english: 'son', pronunciation: 'JAH-lee' }
      ]
    }
  }

  const mockLesson = {
    id: 'lesson-1',
    name: 'Family Vocabulary'
  }

  const mockOnComplete = jest.fn()
  const mockOnExit = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockLessonContent)
    })
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
    fetch.mockClear()
  })

  describe('🐛 BUG: Auto-Answer in Practice Phase', () => {
    it('should NOT auto-fill answers when moving to next question', async () => {
      const user = userEvent.setup()
      
      render(
        <TextbookLearningCards 
          lesson={mockLesson}
          onComplete={mockOnComplete}
          onExit={mockOnExit}
        />
      )

      // Navigate to practice phase
      for (let i = 0; i < 4; i++) {
        await waitFor(() => {
          fireEvent.click(screen.getByText('Continue →'))
        })
      }

      // Answer first practice question
      await waitFor(() => {
        const firstAnswer = screen.getByText('babai')
        fireEvent.click(firstAnswer)
      })

      // Wait for auto-advance
      act(() => {
        jest.advanceTimersByTime(2000)
      })

      // Check that second question doesn't have pre-selected answer
      await waitFor(() => {
        const buttons = screen.getAllByRole('button')
        const optionButtons = buttons.filter(btn => 
          btn.textContent.includes('nëna') || 
          btn.textContent.includes('babai') || 
          btn.textContent.includes('djali')
        )
        
        // No button should have selected styling
        optionButtons.forEach(btn => {
          expect(btn).not.toHaveClass('border-green-500')
          expect(btn).not.toHaveClass('bg-green-50')
        })
      })
    })

    it('should reset answer state between questions', async () => {
      render(
        <TextbookLearningCards 
          lesson={mockLesson}
          onComplete={mockOnComplete}
          onExit={mockOnExit}
        />
      )

      // Navigate to practice phase and answer first question
      for (let i = 0; i < 4; i++) {
        await waitFor(() => fireEvent.click(screen.getByText('Continue →')))
      }

      await waitFor(() => fireEvent.click(screen.getByText('babai')))
      
      // Advance to next question
      act(() => jest.advanceTimersByTime(2000))

      // Verify new question has clean state
      await waitFor(() => {
        expect(screen.queryByText('✅ Correct!')).not.toBeInTheDocument()
        expect(screen.queryByText('💡 Keep Learning!')).not.toBeInTheDocument()
      })
    })

    it('should not show result feedback immediately on new question', async () => {
      render(
        <TextbookLearningCards 
          lesson={mockLesson}
          onComplete={mockOnComplete}
          onExit={mockOnExit}
        />
      )

      // Navigate through first practice question
      for (let i = 0; i < 4; i++) {
        await waitFor(() => fireEvent.click(screen.getByText('Continue →')))
      }

      await waitFor(() => fireEvent.click(screen.getByText('babai')))
      act(() => jest.advanceTimersByTime(2000))

      // On second question, should not immediately show feedback
      await waitFor(() => {
        const feedbackElements = screen.queryAllByText(/Correct|Wrong|Keep Learning/)
        expect(feedbackElements).toHaveLength(0)
      })
    })
  })

  describe('🐛 BUG: Immediate Wrong Answer in Testing Phase', () => {
    it('should wait for user input before showing wrong answer', async () => {
      const user = userEvent.setup()
      
      render(
        <TextbookLearningCards 
          lesson={mockLesson}
          onComplete={mockOnComplete}
          onExit={mockOnExit}
        />
      )

      // Navigate to testing phase
      for (let i = 0; i < 8; i++) {
        await waitFor(() => fireEvent.click(screen.getByText('Continue →')))
      }

      // Should see input field, not immediate wrong answer
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Type your answer...')).toBeInTheDocument()
        expect(screen.queryByText('📚 Good try!')).not.toBeInTheDocument()
        expect(screen.queryByText('🎉 Excellent!')).not.toBeInTheDocument()
      })
    })

    it('should only show result after user submits answer', async () => {
      const user = userEvent.setup()
      
      render(
        <TextbookLearningCards 
          lesson={mockLesson}
          onComplete={mockOnComplete}
          onExit={mockOnExit}
        />
      )

      // Navigate to testing phase
      for (let i = 0; i < 8; i++) {
        await waitFor(() => fireEvent.click(screen.getByText('Continue →')))
      }

      const input = await screen.findByPlaceholderText('Type your answer...')
      
      // Type wrong answer but don't submit yet
      await user.type(input, 'wrong')
      
      // Should not show result yet
      expect(screen.queryByText('📚 Good try!')).not.toBeInTheDocument()
      
      // Now submit
      await user.click(screen.getByText('Check Answer'))
      
      // NOW should show result
      await waitFor(() => {
        expect(screen.getByText('📚 Good try!')).toBeInTheDocument()
      })
    })

    it('should not auto-advance to next question without user action', async () => {
      const user = userEvent.setup()
      
      render(
        <TextbookLearningCards 
          lesson={mockLesson}
          onComplete={mockOnComplete}
          onExit={mockOnExit}
        />
      )

      // Navigate to testing phase
      for (let i = 0; i < 8; i++) {
        await waitFor(() => fireEvent.click(screen.getByText('Continue →')))
      }

      // Answer first question
      const input = await screen.findByPlaceholderText('Type your answer...')
      await user.type(input, 'babai')
      await user.click(screen.getByText('Check Answer'))

      // Wait and verify we're still on the same question
      act(() => jest.advanceTimersByTime(1000))
      
      await waitFor(() => {
        expect(screen.getByText('🎉 Excellent!')).toBeInTheDocument()
      })

      // Should advance after the delay
      act(() => jest.advanceTimersByTime(3000))
    })
  })

  describe('🐛 BUG: State Management Between Questions', () => {
    it('should clear input field when moving to next testing question', async () => {
      const user = userEvent.setup()
      
      render(
        <TextbookLearningCards 
          lesson={mockLesson}
          onComplete={mockOnComplete}
          onExit={mockOnExit}
        />
      )

      // Navigate to testing phase and answer first question
      for (let i = 0; i < 8; i++) {
        await waitFor(() => fireEvent.click(screen.getByText('Continue →')))
      }

      const input = await screen.findByPlaceholderText('Type your answer...')
      await user.type(input, 'babai')
      await user.click(screen.getByText('Check Answer'))

      // Wait for auto-advance
      act(() => jest.advanceTimersByTime(4000))

      // Input should be cleared for next question
      await waitFor(() => {
        const newInput = screen.getByPlaceholderText('Type your answer...')
        expect(newInput.value).toBe('')
      })
    })

    it('should not carry over disabled state between questions', async () => {
      const user = userEvent.setup()
      
      render(
        <TextbookLearningCards 
          lesson={mockLesson}
          onComplete={mockOnComplete}
          onExit={mockOnExit}
        />
      )

      // Navigate to testing and answer question
      for (let i = 0; i < 8; i++) {
        await waitFor(() => fireEvent.click(screen.getByText('Continue →')))
      }

      const input = await screen.findByPlaceholderText('Type your answer...')
      await user.type(input, 'babai')
      await user.click(screen.getByText('Check Answer'))

      // Input becomes disabled after submission
      expect(input).toBeDisabled()

      // Move to next question
      act(() => jest.advanceTimersByTime(4000))

      // New input should not be disabled
      await waitFor(() => {
        const newInput = screen.getByPlaceholderText('Type your answer...')
        expect(newInput).not.toBeDisabled()
      })
    })

    it('should reset button states between practice questions', async () => {
      render(
        <TextbookLearningCards 
          lesson={mockLesson}
          onComplete={mockOnComplete}
          onExit={mockOnExit}
        />
      )

      // Navigate to practice phase
      for (let i = 0; i < 4; i++) {
        await waitFor(() => fireEvent.click(screen.getByText('Continue →')))
      }

      // Click answer (button becomes disabled)
      await waitFor(() => {
        const answer = screen.getByText('babai')
        fireEvent.click(answer)
        expect(answer).toBeDisabled()
      })

      // Move to next question
      act(() => jest.advanceTimersByTime(2000))

      // All new buttons should be enabled
      await waitFor(() => {
        const buttons = screen.getAllByRole('button')
        const optionButtons = buttons.filter(btn => 
          btn.textContent.includes('nëna') || 
          btn.textContent.includes('babai') || 
          btn.textContent.includes('djali')
        )
        
        optionButtons.forEach(btn => {
          expect(btn).not.toBeDisabled()
        })
      })
    })
  })

  describe('🐛 BUG: Timer and Event Race Conditions', () => {
    it('should handle rapid clicking without breaking state', async () => {
      render(
        <TextbookLearningCards 
          lesson={mockLesson}
          onComplete={mockOnComplete}
          onExit={mockOnExit}
        />
      )

      // Navigate to practice
      for (let i = 0; i < 4; i++) {
        await waitFor(() => fireEvent.click(screen.getByText('Continue →')))
      }

      // Rapidly click the same answer multiple times
      await waitFor(() => {
        const answer = screen.getByText('babai')
        for (let i = 0; i < 5; i++) {
          fireEvent.click(answer)
        }
      })

      // Should only register one click
      await waitFor(() => {
        expect(screen.getByText('✅ Correct!')).toBeInTheDocument()
      })

      // Should not have multiple timer callbacks
      act(() => jest.advanceTimersByTime(2000))
      
      // Should advance normally to next question
      await waitFor(() => {
        expect(screen.getByText('Which word means "mother"?')).toBeInTheDocument()
      })
    })

    it('should cancel timers when component unmounts', async () => {
      const { unmount } = render(
        <TextbookLearningCards 
          lesson={mockLesson}
          onComplete={mockOnComplete}
          onExit={mockOnExit}
        />
      )

      // Start a timer by answering a question
      for (let i = 0; i < 4; i++) {
        await waitFor(() => fireEvent.click(screen.getByText('Continue →')))
      }

      await waitFor(() => fireEvent.click(screen.getByText('babai')))

      // Unmount before timer completes
      unmount()

      // Advance timers - should not cause errors
      act(() => jest.advanceTimersByTime(5000))
      
      // No callbacks should be called
      expect(mockOnComplete).not.toHaveBeenCalled()
    })
  })

  describe('🐛 BUG: Memory Leaks and Cleanup', () => {
    it('should clean up event listeners on unmount', async () => {
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener')
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener')

      const { unmount } = render(
        <TextbookLearningCards 
          lesson={mockLesson}
          onComplete={mockOnComplete}
          onExit={mockOnExit}
        />
      )

      unmount()

      // Should clean up listeners
      expect(removeEventListenerSpy).toHaveBeenCalled()
      
      addEventListenerSpy.mockRestore()
      removeEventListenerSpy.mockRestore()
    })

    it('should not update state after unmount', async () => {
      let setStateCalled = false
      const originalError = console.error
      console.error = jest.fn()

      const { unmount } = render(
        <TextbookLearningCards 
          lesson={mockLesson}
          onComplete={mockOnComplete}
          onExit={mockOnExit}
        />
      )

      // Start async operation
      await waitFor(() => fireEvent.click(screen.getByText('Continue →')))

      unmount()

      // Try to trigger state updates
      act(() => jest.advanceTimersByTime(5000))

      // Should not log React warnings about setting state on unmounted component
      expect(console.error).not.toHaveBeenCalledWith(
        expect.stringContaining('Warning: Can\'t perform a React state update')
      )

      console.error = originalError
    })
  })

  describe('API Integration Error Scenarios', () => {
    it('should handle API timeout gracefully', async () => {
      fetch.mockImplementationOnce(() => 
        new Promise(resolve => setTimeout(resolve, 30000))
      )

      render(
        <TextbookLearningCards 
          lesson={mockLesson}
          onComplete={mockOnComplete}
          onExit={mockOnExit}
        />
      )

      // Should show loading initially
      expect(screen.getByText('Loading your lesson...')).toBeInTheDocument()

      // After timeout, should fall back to basic content
      act(() => jest.advanceTimersByTime(10000))

      await waitFor(() => {
        expect(screen.getByText('Family Vocabulary')).toBeInTheDocument()
      })
    })

    it('should handle network errors during lesson', async () => {
      // Start with successful API call
      render(
        <TextbookLearningCards 
          lesson={mockLesson}
          onComplete={mockOnComplete}
          onExit={mockOnExit}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Family Vocabulary')).toBeInTheDocument()
      })

      // Even if network fails later, lesson should continue
      fetch.mockRejectedValueOnce(new Error('Network error'))

      // Continue through lesson normally
      fireEvent.click(screen.getByText('Continue →'))

      await waitFor(() => {
        expect(screen.getByText('babai')).toBeInTheDocument()
      })
    })
  })
})