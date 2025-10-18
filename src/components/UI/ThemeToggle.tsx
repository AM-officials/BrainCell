import { Moon, Sun } from 'lucide-react'
import { useThemeStore } from '@/lib/state'
import { cn } from '@/lib/utils'

interface ThemeToggleProps {
  className?: string
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className }) => {
  const { theme, setTheme } = useThemeStore()

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
  }

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'rounded-xl p-2.5',
        'bg-muted hover:bg-muted/80',
        'transition-smooth',
        'focus-ring',
        className
      )}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        <Sun className="h-5 w-5 text-foreground" aria-hidden="true" />
      ) : (
        <Moon className="h-5 w-5 text-foreground" aria-hidden="true" />
      )}
    </button>
  )
}
