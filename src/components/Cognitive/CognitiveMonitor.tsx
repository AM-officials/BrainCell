import { StateBadgeDetailed } from '../UI/StateBadge'
import { useCognitiveStore, useMetricsStore } from '@/lib/state'
import { WebcamThumb } from '../Media/WebcamThumb'
import { submitFacialSnapshot, getMetricsHealth } from '@/lib/api'
import { Activity, Brain, Mic2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

export const CognitiveMonitor: React.FC = () => {
  const { currentState, events, setState } = useCognitiveStore()
  const { facialExpression, vocalState, textFriction, frictionIntensity, setFrictionIntensity, facialCandidates, setFacialCandidates, vocalCandidates } = useMetricsStore()

  const [modelHealth, setModelHealth] = useState<{ facial_model: string; voice_model: string } | null>(null)

  const recentEvents = events.slice(-5).reverse()

  // Fetch model health status on mount and every 15s
  useEffect(() => {
    const fetchHealth = async () => {
      const health = await getMetricsHealth()
      setModelHealth(health)
    }
    fetchHealth()
    const interval = setInterval(fetchHealth, 15000)
    return () => clearInterval(interval)
  }, [])

  // Decay friction intensity over time for smoother equalizer animation
  const rafRef = useRef<number | null>(null)
  useEffect(() => {
    const step = () => {
      setFrictionIntensity(frictionIntensity * 0.92) // decay
      rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [frictionIntensity, setFrictionIntensity])

  // Client-side fusion to make the state badge reactive without waiting for LLM
  useEffect(() => {
    let score = 0
    // text friction
    if (textFriction.rephraseCount > 1) score += 3
    if (textFriction.backspaceCount > 10) score += 2
    if (textFriction.backspaceCount > 20) score += 3
    // vocal
    if (vocalState === 'frustrated') { setState('FRUSTRATED'); return }
    if (vocalState === 'stressed') score += 4
    if (vocalState === 'hesitant') score += 3
    // facial - sad immediately triggers confused state
    if (facialExpression === 'sad') { setState('CONFUSED'); return }
    if (['fear','angry','frustrated'].includes(String(facialExpression))) score += 3
    else if (facialExpression === 'surprise') score += 1

    if (score >= 8) setState('FRUSTRATED')
    else if (score >= 4) setState('CONFUSED')
    else setState('FOCUSED')
  }, [facialExpression, vocalState, textFriction.rephraseCount, textFriction.backspaceCount, setState])

  return (
    <div className="glass-strong rounded-3xl elevated p-6 h-full flex flex-col gap-4 overflow-hidden">
      <div className="flex items-start justify-between gap-2">
        <h2 className="font-semibold text-lg">Cognitive Monitor</h2>
        {modelHealth && (
          <div className="flex gap-1.5 text-[10px]">
            <div
              className={`px-2 py-0.5 rounded-full flex items-center gap-1 ${
                modelHealth.facial_model === 'keras'
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
              }`}
              title={`Facial: ${modelHealth.facial_model}`}
            >
              <Brain className="h-3 w-3" />
              <span className="font-medium">{modelHealth.facial_model === 'keras' ? 'Keras' : 'Fallback'}</span>
            </div>
            <div
              className={`px-2 py-0.5 rounded-full flex items-center gap-1 ${
                modelHealth.voice_model === 'available'
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
              }`}
              title={`Voice: ${modelHealth.voice_model}`}
            >
              <Mic2 className="h-3 w-3" />
              <span className="font-medium">{modelHealth.voice_model === 'available' ? 'HF' : 'Fallback'}</span>
            </div>
          </div>
        )}
      </div>

  <StateBadgeDetailed state={currentState} className="scale-[0.95]" />

      {/* Live Metrics */}
      <div className="rounded-xl p-4 bg-muted">
        <h3 className="text-sm font-medium mb-3">Live Metrics</h3>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div>
            <div className="text-muted-foreground">Facial</div>
            <div className="font-medium capitalize">{facialExpression ?? 'n/a'}</div>
            {facialCandidates && facialCandidates.length > 0 && (
              <div className="mt-1 space-y-1">
                {facialCandidates.map((c) => (
                  <div key={c.label} className="flex items-center gap-2 text-[10px] capitalize">
                    <span className="w-14 text-muted-foreground">{c.label}</span>
                    <div className="flex-1 h-1.5 bg-background/60 rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${Math.round(c.score * 100)}%` }} />
                    </div>
                    <span className="w-8 text-right">{Math.round(c.score * 100)}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <div className="text-muted-foreground">Vocal</div>
            <div className="font-medium capitalize">{vocalState ?? 'n/a'}</div>
            {vocalCandidates && vocalCandidates.length > 0 && (
              <div className="mt-1 space-y-1">
                {vocalCandidates.map((c) => (
                  <div key={c.label} className="flex items-center gap-2 text-[10px] capitalize">
                    <span className="w-14 text-muted-foreground">{c.label}</span>
                    <div className="flex-1 h-1.5 bg-background/60 rounded-full overflow-hidden">
                      <div className="h-full bg-primary/70" style={{ width: `${Math.round(c.score * 100)}%` }} />
                    </div>
                    <span className="w-8 text-right">{Math.round(c.score * 100)}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <div className="text-muted-foreground">Text friction</div>
            <div className="font-medium">R:{textFriction.rephraseCount} B:{textFriction.backspaceCount}</div>
          </div>
        </div>
        {/* Equalizer-style bar for friction */}
        <div className="mt-3 h-2 w-full rounded-full bg-background/60 overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-150"
            style={{ width: `${Math.round(frictionIntensity * 100)}%` }}
          />
        </div>
      </div>

      <WebcamThumb
        className="shrink-0 sticky top-4"
        onSnapshot={async (image) => {
          try {
            const res = await submitFacialSnapshot(image)
            // Update metrics store with lowercased label for consistency
            if (res?.label) {
              // Normalize a few common labels
              const label = String(res.label).toLowerCase()
              useMetricsStore.getState().setFacialExpression(label)
              if (Array.isArray(res.candidates)) {
                setFacialCandidates(
                  res.candidates.map((c: [string, number]) => ({ label: String(c[0]).toLowerCase(), score: Number(c[1]) }))
                )
              } else {
                setFacialCandidates(undefined)
              }
            }
          } catch (e) {
            // ignore transient errors
          }
        }}
      />

  <div className="flex-1 min-h-0 overflow-auto">
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
