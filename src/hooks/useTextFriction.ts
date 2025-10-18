import { useState, useCallback, useRef, useEffect } from 'react'
import { TextFriction } from '@/types'

interface UseTextFrictionReturn {
  friction: TextFriction
  handleInputChange: (value: string) => void
  handleKeyDown: (e: React.KeyboardEvent) => void
  resetFriction: () => void
  currentText: string
}

export const useTextFriction = (): UseTextFrictionReturn => {
  const [currentText, setCurrentText] = useState('')
  const [friction, setFriction] = useState<TextFriction>({
    rephraseCount: 0,
    backspaceCount: 0,
  })

  const previousTextRef = useRef('')
  const lastChangeTimeRef = useRef(Date.now())
  const consecutiveBackspacesRef = useRef(0)

  // Handle text input changes
  const handleInputChange = useCallback((value: string) => {
    const now = Date.now()
    const timeDelta = now - lastChangeTimeRef.current

    // Detect backspace (text got shorter)
    if (value.length < previousTextRef.current.length) {
      consecutiveBackspacesRef.current++
      setFriction((prev) => ({
        ...prev,
        backspaceCount: prev.backspaceCount + 1,
      }))
    } else {
      consecutiveBackspacesRef.current = 0
    }

    // Detect rephrase: significant edit within short time window
    // Rephrase = text changed significantly but length similar (editing, not just typing)
    if (
      timeDelta < 500 && // Quick change
      Math.abs(value.length - previousTextRef.current.length) < 5 && // Similar length
      value !== previousTextRef.current && // Actually different
      value.length > 10 // Not just starting
    ) {
      // Check if content changed substantially (not just single char)
      const changedChars = countDifferentChars(previousTextRef.current, value)
      if (changedChars >= 3) {
        setFriction((prev) => ({
          ...prev,
          rephraseCount: prev.rephraseCount + 1,
        }))
      }
    }

    previousTextRef.current = value
    lastChangeTimeRef.current = now
    setCurrentText(value)
  }, [])

  // Handle key events (for backspace detection)
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' || e.key === 'Delete') {
      // Backspace count is handled in handleInputChange
    }
  }, [])

  // Reset friction counters
  const resetFriction = useCallback(() => {
    setFriction({
      rephraseCount: 0,
      backspaceCount: 0,
    })
    consecutiveBackspacesRef.current = 0
  }, [])

  // Reset on unmount
  useEffect(() => {
    return () => {
      previousTextRef.current = ''
      lastChangeTimeRef.current = Date.now()
      consecutiveBackspacesRef.current = 0
    }
  }, [])

  return {
    friction,
    handleInputChange,
    handleKeyDown,
    resetFriction,
    currentText,
  }
}

// Helper: Count number of different characters between two strings
function countDifferentChars(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length)
  let diffCount = 0

  for (let i = 0; i < maxLen; i++) {
    if (str1[i] !== str2[i]) {
      diffCount++
    }
  }

  return diffCount
}
