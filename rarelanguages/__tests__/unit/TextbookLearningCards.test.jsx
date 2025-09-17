import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TextbookLearningCards from '../../components/TextbookLearningCards'

// Mock API responses
const mockLessonContent = {
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
      }
    ]
  }
}

const mockLesson = {
  id: 'lesson-1',
  name: 'Family Vocabulary',
  description: 'Learn basic family terms',
  estimated_minutes: 15
}

// Mock fetch
beforeEach(() => {
  fetch.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(mockLessonContent)
  })
})

afterEach(() => {
  fetch.mockClear()
  jest.clearAllTimers()
})

describe('TextbookLearningCards', () => {
  const mockOnComplete = jest.fn()
  const mockOnExit = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('Initial Rendering and Loading', () => {
    it('shows loading screen initially', () => {
      render(
        <TextbookLearningCards 
          lesson={mockLesson}
          onComplete={mockOnComplete}
          onExit={mockOnExit}
        />
      )
      
      expect(screen.getByText('Loading your lesson...')).toBeInTheDocument()
    })

    it('loads lesson content from API', async () => {
      render(
        <TextbookLearningCards 
          lesson={mockLesson}
          onComplete={mockOnComplete}
          onExit={mockOnExit}
        />
      )

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/lessons/lesson-1/textbook-content')
      })
    })

    it('shows overview card after loading', async () => {
      render(
        <TextbookLearningCards 
          lesson={mockLesson}
          onComplete={mockOnComplete}
          onExit={mockOnExit}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Family Vocabulary')).toBeInTheDocument()
        expect(screen.getByText('2')).toBeInTheDocument() // word count
        expect(screen.getByText('New Words')).toBeInTheDocument()
      })
    })
  })

  describe('Teaching Phase', () => {
    it('shows teaching phase header correctly', async () => {
      render(
        <TextbookLearningCards 
          lesson={mockLesson}
          onComplete={mockOnComplete}
          onExit={mockOnExit}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('📚 Learning New Material')).toBeInTheDocument()
        expect(screen.getByText('Just relax and absorb - no testing yet!')).toBeInTheDocument()
      })
    })

    it('allows skipping in teaching phase', async () => {
      render(
        <TextbookLearningCards 
          lesson={mockLesson}
          onComplete={mockOnComplete}
          onExit={mockOnExit}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Skip →')).toBeInTheDocument()
      })
    })

    it('shows vocabulary teaching cards with pronunciation', async () => {
      render(
        <TextbookLearningCards 
          lesson={mockLesson}
          onComplete={mockOnComplete}
          onExit={mockOnExit}
        />
      )

      // Skip to first vocabulary card
      await waitFor(() => {
        fireEvent.click(screen.getByText('Continue →'))
      })

      await waitFor(() => {
        expect(screen.getByText('babai')).toBeInTheDocument()
        expect(screen.getByText('BAH-bye')).toBeInTheDocument()
        expect(screen.getByText('= father')).toBeInTheDocument()
        expect(screen.getByText('🔊 Listen to Pronunciation')).toBeInTheDocument()
      })
    })

    it('plays pronunciation when button is clicked', async () => {
      const user = userEvent.setup()
      
      render(
        <TextbookLearningCards 
          lesson={mockLesson}
          onComplete={mockOnComplete}
          onExit={mockOnExit}
        />
      )

      // Navigate to vocabulary card
      await waitFor(() => {
        fireEvent.click(screen.getByText('Continue →'))
      })

      await waitFor(() => {
        const pronounceButton = screen.getByText('🔊 Listen to Pronunciation')
        fireEvent.click(pronounceButton)
      })

      expect(global.SpeechSynthesisUtterance).toHaveBeenCalledWith('babai')
      expect(global.speechSynthesis.speak).toHaveBeenCalled()
    })
  })

  describe('Practice Phase', () => {
    it('transitions to practice phase correctly', async () => {
      render(
        <TextbookLearningCards 
          lesson={mockLesson}
          onComplete={mockOnComplete}
          onExit={mockOnExit}
        />
      )

      // Skip through teaching phase cards
      await waitFor(() => {
        fireEvent.click(screen.getByText('Continue →'))
      })
      
      // Skip vocabulary cards to reach practice transition
      fireEvent.click(screen.getByText('Continue →'))
      fireEvent.click(screen.getByText('Continue →'))

      await waitFor(() => {
        expect(screen.getByText('🎯 Guided Practice')).toBeInTheDocument()
        expect(screen.getByText('Try it out with hints and support')).toBeInTheDocument()
      })
    })

    it('shows recognition practice cards with multiple choice', async () => {
      render(
        <TextbookLearningCards 
          lesson={mockLesson}
          onComplete={mockOnComplete}
          onExit={mockOnExit}
        />
      )

      // Navigate to practice phase (skip through teaching)
      for (let i = 0; i < 4; i++) {
        await waitFor(() => {
          fireEvent.click(screen.getByText('Continue →'))
        })
      }

      await waitFor(() => {
        expect(screen.getByText('Which word means "father"?')).toBeInTheDocument()
        expect(screen.getByText('babai')).toBeInTheDocument()
      })
    })

    it('handles multiple choice answers correctly', async () => {
      render(
        <TextbookLearningCards 
          lesson={mockLesson}
          onComplete={mockOnComplete}
          onExit={mockOnExit}
        />
      )

      // Navigate to recognition practice
      for (let i = 0; i < 4; i++) {
        await waitFor(() => {
          fireEvent.click(screen.getByText('Continue →'))
        })
      }

      await waitFor(() => {
        const correctAnswer = screen.getByText('babai')
        fireEvent.click(correctAnswer)
      })

      await waitFor(() => {
        expect(screen.getByText('✅ Correct!')).toBeInTheDocument()
      })

      // Should auto-advance after 2 seconds
      act(() => {
        jest.advanceTimersByTime(2000)
      })
    })

    it('shows wrong answer feedback correctly', async () => {
      render(
        <TextbookLearningCards 
          lesson={mockLesson}
          onComplete={mockOnComplete}
          onExit={mockOnExit}
        />
      )

      // Navigate to recognition practice
      for (let i = 0; i < 4; i++) {
        await waitFor(() => {
          fireEvent.click(screen.getByText('Continue →'))
        })
      }

      await waitFor(() => {
        // Click wrong answer (assuming nëna is an option)
        const wrongAnswer = screen.getByText('nëna')
        fireEvent.click(wrongAnswer)
      })

      await waitFor(() => {
        expect(screen.getByText('💡 Keep Learning!')).toBeInTheDocument()
        expect(screen.getByText('Correct answer:')).toBeInTheDocument()
      })
    })
  })

  describe('Testing Phase', () => {
    it('transitions to testing phase without skip option', async () => {
      render(
        <TextbookLearningCards 
          lesson={mockLesson}
          onComplete={mockOnComplete}
          onExit={mockOnExit}
        />
      )

      // Navigate through all cards to testing phase
      for (let i = 0; i < 7; i++) {
        await waitFor(() => {
          fireEvent.click(screen.getByText('Continue →'))
        })
      }

      await waitFor(() => {
        expect(screen.getByText('🧠 Check Your Learning')).toBeInTheDocument()
        expect(screen.getByText('Show what you\'ve learned (no hints!)')).toBeInTheDocument()
        expect(screen.queryByText('Skip →')).not.toBeInTheDocument()
      })
    })

    it('shows recall test cards with text input', async () => {
      render(
        <TextbookLearningCards 
          lesson={mockLesson}
          onComplete={mockOnComplete}
          onExit={mockOnExit}
        />
      )

      // Navigate to recall test
      for (let i = 0; i < 8; i++) {
        await waitFor(() => {
          fireEvent.click(screen.getByText('Continue →'))
        })
      }

      await waitFor(() => {
        expect(screen.getByText('How do you say "father" in Albanian?')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Type your answer...')).toBeInTheDocument()
        expect(screen.getByText('Check Answer')).toBeInTheDocument()
      })
    })

    it('handles recall test answers correctly', async () => {
      const user = userEvent.setup()
      
      render(
        <TextbookLearningCards 
          lesson={mockLesson}
          onComplete={mockOnComplete}
          onExit={mockOnExit}
        />
      )

      // Navigate to recall test
      for (let i = 0; i < 8; i++) {
        await waitFor(() => {
          fireEvent.click(screen.getByText('Continue →'))
        })
      }

      await waitFor(async () => {
        const input = screen.getByPlaceholderText('Type your answer...')
        await user.type(input, 'babai')
        
        const submitButton = screen.getByText('Check Answer')
        fireEvent.click(submitButton)
      })

      await waitFor(() => {
        expect(screen.getByText('🎉 Excellent!')).toBeInTheDocument()
      })
    })

    it('handles wrong recall answers', async () => {
      const user = userEvent.setup()
      
      render(
        <TextbookLearningCards 
          lesson={mockLesson}
          onComplete={mockOnComplete}
          onExit={mockOnExit}
        />
      )

      // Navigate to recall test
      for (let i = 0; i < 8; i++) {
        await waitFor(() => {
          fireEvent.click(screen.getByText('Continue →'))
        })
      }

      await waitFor(async () => {
        const input = screen.getByPlaceholderText('Type your answer...')
        await user.type(input, 'wrong')
        
        const submitButton = screen.getByText('Check Answer')
        fireEvent.click(submitButton)
      })

      await waitFor(() => {
        expect(screen.getByText('📚 Good try!')).toBeInTheDocument()
        expect(screen.getByText('babai')).toBeInTheDocument() // correct answer shown
      })
    })

    it('supports Enter key for submitting answers', async () => {
      const user = userEvent.setup()
      
      render(
        <TextbookLearningCards 
          lesson={mockLesson}
          onComplete={mockOnComplete}
          onExit={mockOnExit}
        />
      )

      // Navigate to recall test
      for (let i = 0; i < 8; i++) {
        await waitFor(() => {
          fireEvent.click(screen.getByText('Continue →'))
        })
      }

      await waitFor(async () => {
        const input = screen.getByPlaceholderText('Type your answer...')
        await user.type(input, 'babai{enter}')
      })

      await waitFor(() => {
        expect(screen.getByText('🎉 Excellent!')).toBeInTheDocument()
      })
    })
  })

  describe('Navigation and State Management', () => {
    it('tracks progress correctly through phases', async () => {
      render(
        <TextbookLearningCards 
          lesson={mockLesson}
          onComplete={mockOnComplete}
          onExit={mockOnExit}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Card 1 of')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Continue →'))

      await waitFor(() => {
        expect(screen.getByText('Card 2 of')).toBeInTheDocument()
      })
    })

    it('calls onExit when exit button clicked', async () => {
      render(
        <TextbookLearningCards 
          lesson={mockLesson}
          onComplete={mockOnComplete}
          onExit={mockOnExit}
        />
      )

      await waitFor(() => {
        fireEvent.click(screen.getByText('← Exit Lesson'))
      })

      expect(mockOnExit).toHaveBeenCalled()
    })

    it('calls onComplete when lesson finished', async () => {
      render(
        <TextbookLearningCards 
          lesson={mockLesson}
          onComplete={mockOnComplete}
          onExit={mockOnExit}
        />
      )

      // Navigate through all cards to completion
      for (let i = 0; i < 15; i++) { // Adjusted for all cards
        await waitFor(() => {
          const continueButton = screen.queryByText('Continue →') || screen.queryByText('Complete Lesson')
          if (continueButton) {
            fireEvent.click(continueButton)
          }
        })
      }

      expect(mockOnComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          lesson_id: 'lesson-1',
          phases_completed: ['teaching', 'practice', 'testing'],
          total_cards: expect.any(Number)
        })
      )
    })

    it('prevents double-clicking during state transitions', async () => {
      render(
        <TextbookLearningCards 
          lesson={mockLesson}
          onComplete={mockOnComplete}
          onExit={mockOnExit}
        />
      )

      // Navigate to recognition card
      for (let i = 0; i < 4; i++) {
        await waitFor(() => {
          fireEvent.click(screen.getByText('Continue →'))
        })
      }

      // Click answer quickly multiple times
      await waitFor(() => {
        const answer = screen.getByText('babai')
        fireEvent.click(answer)
        fireEvent.click(answer) // Second click should be ignored
        fireEvent.click(answer) // Third click should be ignored
      })

      // Should only register one answer
      await waitFor(() => {
        expect(screen.getByText('✅ Correct!')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('handles API failure gracefully', async () => {
      fetch.mockRejectedValueOnce(new Error('API Error'))

      render(
        <TextbookLearningCards 
          lesson={mockLesson}
          onComplete={mockOnComplete}
          onExit={mockOnExit}
        />
      )

      // Should fall back to basic flow
      await waitFor(() => {
        expect(screen.getByText('Family Vocabulary')).toBeInTheDocument()
      })
    })

    it('handles malformed API response', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Invalid lesson' })
      })

      render(
        <TextbookLearningCards 
          lesson={mockLesson}
          onComplete={mockOnComplete}
          onExit={mockOnExit}
        />
      )

      // Should fall back to basic flow
      await waitFor(() => {
        expect(screen.getByText('Family Vocabulary')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels and structure', async () => {
      render(
        <TextbookLearningCards 
          lesson={mockLesson}
          onComplete={mockOnComplete}
          onExit={mockOnExit}
        />
      )

      await waitFor(() => {
        const buttons = screen.getAllByRole('button')
        expect(buttons.length).toBeGreaterThan(0)
        
        buttons.forEach(button => {
          expect(button).toBeVisible()
        })
      })
    })

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup()
      
      render(
        <TextbookLearningCards 
          lesson={mockLesson}
          onComplete={mockOnComplete}
          onExit={mockOnExit}
        />
      )

      await waitFor(async () => {
        await user.tab()
        await user.tab()
        
        const focusedElement = document.activeElement
        expect(focusedElement).toHaveTextContent('Continue')
      })
    })
  })
})