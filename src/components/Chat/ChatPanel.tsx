import { useRef, useEffect } from 'react'
import { useChatStore } from '@/lib/state'
import { MessageBubble } from './MessageBubble'
import { InputBar } from './InputBar'
import { cn } from '@/lib/utils'
import type { FacialExpression, TextFriction, VocalState } from '@/types'

interface ChatPanelProps {
  onSendMessage: (
    text: string,
    friction: TextFriction,
    facial: FacialExpression | null,
    vocal: VocalState | null,
    audio: string | null
  ) => void | Promise<void>
  onEndSession: () => void
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ onSendMessage, onEndSession }) => {
  const messages = useChatStore((state) => state.messages)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  return (
    <div className="flex flex-col h-full glass-strong rounded-3xl elevated overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h2 className="font-semibold text-lg">Learning Chat</h2>
        <div className="flex gap-2">
          <button
            onClick={onEndSession}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium',
              'bg-muted hover:bg-muted/80',
              'transition-smooth focus-ring'
            )}
          >
            End Session
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>Start asking questions to begin learning...</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border p-4">
        <InputBar onSend={onSendMessage} />
      </div>
    </div>
  )
}
