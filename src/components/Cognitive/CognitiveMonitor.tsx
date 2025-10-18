import { StateBadgeDetailed } from '../UI/StateBadge'
import { useCognitiveStore } from '@/lib/state'
import { WebcamThumb } from '../Media/WebcamThumb'
import { Activity } from 'lucide-react'

export const CognitiveMonitor: React.FC = () => {
  const { currentState, events } = useCognitiveStore()

  const recentEvents = events.slice(-5).reverse()

  return (
    <div className="glass-strong rounded-3xl elevated p-6 h-full flex flex-col gap-4">
      <h2 className="font-semibold text-lg mb-2">Cognitive Monitor</h2>

      <StateBadgeDetailed state={currentState} />

      <WebcamThumb />

      <div className="flex-1">
        <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Recent Activity
        </h3>
        <div className="space-y-2">
          {recentEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity yet</p>
          ) : (
            recentEvents.map((event) => (
              <div
                key={event.id}
                className="text-xs p-2 rounded-lg bg-muted"
              >
                <span className="font-medium">{event.type}</span>
                <span className="text-muted-foreground ml-2">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
