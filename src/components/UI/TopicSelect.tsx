import { useState } from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown, Plus } from 'lucide-react'
import { DEMO_TOPICS } from '@/mock/demoResponses'

interface TopicSelectProps {
  value: string
  onChange: (value: string) => void
  className?: string
  disabled?: boolean
}

export const TopicSelect: React.FC<TopicSelectProps> = ({
  value,
  onChange,
  className,
  disabled = false,
}) => {
  const [isCustom, setIsCustom] = useState(false)
  const [customTopic, setCustomTopic] = useState('')

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value
    if (newValue === '__custom__') {
      setIsCustom(true)
      setCustomTopic('')
    } else {
      setIsCustom(false)
      onChange(newValue)
    }
  }

  const handleCustomSubmit = () => {
    if (customTopic.trim()) {
      onChange(customTopic.trim())
      setIsCustom(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCustomSubmit()
    } else if (e.key === 'Escape') {
      setIsCustom(false)
      setCustomTopic('')
    }
  }

  return (
    <div className={cn('relative', className)}>
      <label
        htmlFor={isCustom ? 'custom-topic-input' : 'topic-select'}
        className="block text-sm font-medium mb-2"
      >
        Choose your learning topic
      </label>

      {!isCustom ? (
        <div className="relative">
          <select
            id="topic-select"
            value={value || ''}
            onChange={handleSelectChange}
            disabled={disabled}
            className={cn(
              'w-full appearance-none rounded-xl border-2 border-border',
              'bg-background px-4 py-3 pr-10',
              'text-base font-medium',
              'focus-ring',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-smooth'
            )}
            aria-label="Select learning topic"
          >
            <option value="" disabled>
              Select a topic...
            </option>
            {DEMO_TOPICS.map((topic) => (
              <option key={topic} value={topic}>
                {topic}
              </option>
            ))}
            <option value="__custom__">Custom topic...</option>
          </select>
          <ChevronDown
            className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none"
            aria-hidden="true"
          />
        </div>
      ) : (
        <div className="flex gap-2">
          <label htmlFor="custom-topic-input" className="sr-only">
            Custom topic
          </label>
          <input
            id="custom-topic-input"
            name="customTopic"
            type="text"
            value={customTopic}
            onChange={(e) => setCustomTopic(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter custom topic..."
            autoFocus
            className={cn(
              'flex-1 rounded-xl border-2 border-border',
              'bg-background px-4 py-3',
              'text-base font-medium',
              'focus-ring',
              'transition-smooth'
            )}
            aria-label="Custom topic input"
          />
          <button
            onClick={handleCustomSubmit}
            disabled={!customTopic.trim()}
            className={cn(
              'rounded-xl bg-primary text-primary-foreground px-4',
              'hover:opacity-90 active:scale-95',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-smooth',
              'focus-ring'
            )}
            aria-label="Add custom topic"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      )}

      {value && !isCustom && (
        <p className="mt-2 text-sm text-muted-foreground">
          Selected: <span className="font-medium text-foreground">{value}</span>
        </p>
      )}
    </div>
  )
}
