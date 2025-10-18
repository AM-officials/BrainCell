import { useState } from 'react'
import { Send, Mic, MicOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTextFriction } from '@/hooks/useTextFriction'
import type { FacialExpression, TextFriction, VocalState } from '@/types'

interface InputBarProps {
  onSend: (
    text: string,
    friction: TextFriction,
    facial: FacialExpression | null,
    vocal: VocalState | null,
    audio: string | null
  ) => void | Promise<void>
}

export const InputBar: React.FC<InputBarProps> = ({ onSend }) => {
  const [micEnabled, setMicEnabled] = useState(false)
  const { friction, handleInputChange, handleKeyDown, resetFriction, currentText } = useTextFriction()

  const handleSubmit = () => {
    if (!currentText.trim()) return

  void onSend(currentText, friction, null, null, null)
    handleInputChange('')
    resetFriction()
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  handleKeyDown(e)
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => setMicEnabled(!micEnabled)}
        className={cn(
          'rounded-xl p-3',
          micEnabled ? 'bg-primary text-primary-foreground' : 'bg-muted',
          'hover:opacity-90 transition-smooth focus-ring'
        )}
        aria-label={micEnabled ? 'Disable microphone' : 'Enable microphone'}
        title={micEnabled ? 'Disable microphone' : 'Enable microphone'}
      >
        {micEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
      </button>

      <label htmlFor="chat-input" className="sr-only">
        Ask a question
      </label>
      <textarea
        id="chat-input"
        name="message"
        value={currentText}
        onChange={(e) => handleInputChange(e.target.value)}
        onKeyDown={handleKeyPress}
        placeholder="Ask a question..."
        rows={1}
        className={cn(
          'flex-1 resize-none rounded-xl border-2 border-border',
          'bg-background px-4 py-3',
          'focus-ring',
          'transition-smooth'
        )}
        aria-label="Message input"
      />

      <button
        onClick={handleSubmit}
        disabled={!currentText.trim()}
        className={cn(
          'rounded-xl px-6 py-3',
          'bg-primary text-primary-foreground',
          'hover:opacity-90 active:scale-95',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'transition-smooth focus-ring'
        )}
        aria-label="Send message"
        title="Send message"
      >
        <Send className="h-5 w-5" />
      </button>
    </div>
  )
}
