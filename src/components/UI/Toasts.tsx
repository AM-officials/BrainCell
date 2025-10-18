import { useEffect } from 'react'
import { useToastStore } from '@/lib/state'
import { cn } from '@/lib/utils'
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react'

export const Toasts: React.FC = () => {
  const { toasts, removeToast } = useToastStore()

  return (
    <div
      className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  )
}

interface ToastProps {
  toast: {
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    message: string
    duration?: number
  }
  onClose: () => void
}

const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, toast.duration || 5000)

    return () => clearTimeout(timer)
  }, [toast.duration, onClose])

  const icons = {
    success: CheckCircle2,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  }

  const Icon = icons[toast.type]

  const styles = {
    success: 'bg-focused/10 text-focused border-focused/20',
    error: 'bg-frustrated/10 text-frustrated border-frustrated/20',
    warning: 'bg-confused/10 text-confused border-confused/20',
    info: 'bg-primary/10 text-primary border-primary/20',
  }

  return (
    <div
      className={cn(
        'pointer-events-auto',
        'flex items-start gap-3 p-4 pr-12',
        'rounded-2xl border-2',
        'glass-strong elevated',
        'animate-slide-in',
        'min-w-[320px] max-w-md',
        styles[toast.type]
      )}
      role="alert"
    >
      <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
      <p className="text-sm font-medium flex-1">{toast.message}</p>
      <button
        onClick={onClose}
        className={cn(
          'absolute top-2 right-2',
          'rounded-lg p-1',
          'hover:bg-black/5 dark:hover:bg-white/5',
          'transition-smooth',
          'focus-ring'
        )}
        aria-label="Close notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
