import { MessageSquare, Network, FileText, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'

type NavItem = 'chat' | 'graph' | 'report' | 'monitor'

interface BottomNavProps {
  activeView: NavItem
  onViewChange: (view: NavItem) => void
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeView, onViewChange }) => {
  const navItems = [
    { id: 'chat' as NavItem, icon: MessageSquare, label: 'Chat' },
    { id: 'graph' as NavItem, icon: Network, label: 'Graph' },
    { id: 'report' as NavItem, icon: FileText, label: 'Report' },
    { id: 'monitor' as NavItem, icon: Activity, label: 'Monitor' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background border-t border-border">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => onViewChange(id)}
            className={cn(
              'flex flex-col items-center justify-center gap-1 w-full h-full',
              'min-w-[44px] min-h-[44px]', // iOS minimum touch target
              'transition-colors duration-200',
              activeView === id
                ? 'text-primary'
                : 'text-muted-foreground active:text-foreground'
            )}
            aria-label={label}
          >
            <Icon 
              className={cn(
                'h-5 w-5 transition-transform',
                activeView === id && 'scale-110'
              )} 
            />
            <span className={cn(
              'text-xs font-medium',
              activeView === id && 'font-semibold'
            )}>
              {label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  )
}
