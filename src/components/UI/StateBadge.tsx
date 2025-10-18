import { CognitiveState } from '@/types'
import { cn } from '@/lib/utils'
import { Brain, AlertCircle, Zap } from 'lucide-react'

interface StateBadgeProps {
  state: CognitiveState
  className?: string
  showIcon?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const stateConfig = {
  FOCUSED: {
    label: 'Focused',
    description: 'You\'re engaged and learning effectively',
    color: 'focused',
    bgClass: 'bg-focused/10 dark:bg-focused/20',
    textClass: 'text-focused',
    ringClass: 'ring-focused/50',
    pulseClass: 'pulse-focused',
    icon: Zap,
  },
  CONFUSED: {
    label: 'Confused',
    description: 'Let me help clarify with a different approach',
    color: 'confused',
    bgClass: 'bg-confused/10 dark:bg-confused/20',
    textClass: 'text-confused',
    ringClass: 'ring-confused/50',
    pulseClass: 'pulse-confused',
    icon: AlertCircle,
  },
  FRUSTRATED: {
    label: 'Frustrated',
    description: 'Let\'s try a hands-on interactive example',
    color: 'frustrated',
    bgClass: 'bg-frustrated/10 dark:bg-frustrated/20',
    textClass: 'text-frustrated',
    ringClass: 'ring-frustrated/50',
    pulseClass: 'pulse-frustrated',
    icon: Brain,
  },
}

const sizeClasses = {
  sm: 'px-3 py-1 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

export const StateBadge: React.FC<StateBadgeProps> = ({
  state,
  className,
  showIcon = true,
  size = 'md',
}) => {
  const config = stateConfig[state]
  const Icon = config.icon

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-2xl font-medium transition-all duration-300',
        config.bgClass,
        config.textClass,
        sizeClasses[size],
        'ring-2',
        config.ringClass,
        config.pulseClass,
        className
      )}
      role="status"
      aria-label={`Cognitive state: ${config.label}`}
    >
      {showIcon && <Icon className={size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} aria-hidden="true" />}
      <span className="font-semibold">{config.label}</span>
    </div>
  )
}

export const StateBadgeDetailed: React.FC<StateBadgeProps> = ({
  state,
  className,
}) => {
  const config = stateConfig[state]
  const Icon = config.icon

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-2xl p-4 transition-all duration-300',
        config.bgClass,
        'ring-1',
        config.ringClass,
        className
      )}
      role="status"
      aria-label={`Cognitive state: ${config.label} - ${config.description}`}
    >
      <div className={cn('rounded-full p-2', config.bgClass, config.pulseClass)}>
        <Icon className={cn('h-6 w-6', config.textClass)} aria-hidden="true" />
      </div>
      <div className="flex-1">
        <h3 className={cn('font-semibold', config.textClass)}>{config.label}</h3>
        <p className="text-sm text-muted-foreground mt-1">{config.description}</p>
      </div>
    </div>
  )
}
