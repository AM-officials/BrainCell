import { Message } from '@/types'
import { cn } from '@/lib/utils'
import { MermaidBlock } from '../Diagrams/MermaidBlock'
import { CodePlayground } from '../Playground/CodePlayground'
import { User, Bot } from 'lucide-react'

interface MessageBubbleProps {
  message: Message
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user'

  return (
    <div
      className={cn(
        'flex gap-3 animate-slide-in',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Bot className="h-5 w-5 text-primary" />
        </div>
      )}

      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-3',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-foreground'
        )}
      >
        {isUser ? (
          <p className="text-sm">{message.content}</p>
        ) : (
          <>
            {message.responseType === 'diagram' ? (
              <MermaidBlock content={message.content} />
            ) : message.responseType === 'code' ? (
              <CodePlayground code={message.content} />
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            )}
          </>
        )}
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <User className="h-5 w-5" />
        </div>
      )}
    </div>
  )
}
