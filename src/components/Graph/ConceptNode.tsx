import { memo, useState } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { ChevronDown, ChevronRight, StickyNote, CheckCircle2, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ConceptNodeData {
  label: string
  description?: string
  mastered: boolean
  isNew?: boolean
  hasNotes?: boolean
  notes?: string
  timestamp?: string
  onToggleExpand?: () => void
  onEditNotes?: (notes: string) => void
}

export const ConceptNode = memo(({ id, data, selected }: NodeProps<ConceptNodeData>) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showNotesModal, setShowNotesModal] = useState(false)
  const [noteText, setNoteText] = useState(data.notes || '')
  const noteTextareaId = `node-notes-${id}`

  const handleSaveNotes = () => {
    data.onEditNotes?.(noteText)
    setShowNotesModal(false)
  }

  return (
    <>
      <div
        className={cn(
          'px-4 py-3 rounded-xl border-2 bg-background/95 backdrop-blur-sm',
          'shadow-lg transition-all duration-200 min-w-[180px] max-w-[280px]',
          selected && 'ring-2 ring-primary ring-offset-2',
          data.isNew && 'animate-pulse-subtle border-primary',
          data.mastered ? 'border-green-500/50 bg-green-50/50 dark:bg-green-950/20' : 'border-border'
        )}
      >
        <Handle type="target" position={Position.Top} className="w-3 h-3" />
        
        {/* Header */}
        <div className="flex items-start gap-2 mb-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-1 p-0.5 hover:bg-muted rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm truncate">{data.label}</span>
              {data.mastered ? (
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
            </div>
            {data.timestamp && (
              <span className="text-xs text-muted-foreground">
                {new Date(data.timestamp).toLocaleDateString()}
              </span>
            )}
          </div>

          <button
            onClick={() => setShowNotesModal(true)}
            className={cn(
              'p-1 rounded hover:bg-muted transition-colors',
              data.hasNotes && 'text-primary'
            )}
            title={data.hasNotes ? 'View notes' : 'Add notes'}
          >
            <StickyNote className="h-4 w-4" />
          </button>
        </div>

        {/* Expanded Description */}
        {isExpanded && data.description && (
          <div className="mt-2 pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground leading-relaxed">
              {data.description}
            </p>
          </div>
        )}

        <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
      </div>

      {/* Notes Modal */}
      {showNotesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-background rounded-2xl shadow-2xl max-w-md w-full p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Notes: {data.label}</h3>
              <button
                onClick={() => setShowNotesModal(false)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            <label htmlFor={noteTextareaId} className="sr-only">
              Personal notes for {data.label}
            </label>
            <textarea
              id={noteTextareaId}
              name="notes"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add your personal notes here..."
              className={cn(
                'w-full h-40 p-3 rounded-lg border border-border',
                'bg-muted/30 focus:bg-background',
                'resize-none focus:outline-none focus:ring-2 focus:ring-primary',
                'transition-all'
              )}
              aria-label={`Notes for ${data.label}`}
            />

            <div className="flex gap-2 mt-4">
              <button
                onClick={handleSaveNotes}
                className={cn(
                  'flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground',
                  'hover:bg-primary/90 transition-colors font-medium'
                )}
              >
                Save Notes
              </button>
              <button
                onClick={() => setShowNotesModal(false)}
                className={cn(
                  'px-4 py-2 rounded-lg border border-border',
                  'hover:bg-muted transition-colors'
                )}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
})

ConceptNode.displayName = 'ConceptNode'
