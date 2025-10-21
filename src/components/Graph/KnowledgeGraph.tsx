import { useEffect, useMemo, useCallback } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { useGraphStore } from '@/lib/state'
import { Download, Lock, Unlock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ConceptNode } from './ConceptNode'

const nodeTypes = {
  concept: ConceptNode,
}

export const KnowledgeGraph: React.FC = () => {
  const { nodes: storeNodes, edges: storeEdges, isLocked, updateNode, lockGraph, unlockGraph } = useGraphStore()

  // Convert store nodes to ReactFlow nodes
  const initialNodes = useMemo(
    () =>
      storeNodes.map((n, idx) => ({
        id: n.id,
        type: 'concept',
        position: n.position || {
          x: 100 + (idx % 3) * 250,
          y: 100 + Math.floor(idx / 3) * 150,
        },
        data: {
          label: n.label,
          description: n.data?.description,
          mastered: n.mastered,
          isNew: n.data?.isNew,
          hasNotes: n.data?.hasNotes,
          notes: n.data?.notes,
          timestamp: n.data?.timestamp,
          onEditNotes: (notes: string) => {
            updateNode(n.id, {
              data: { ...n.data, notes, hasNotes: !!notes },
            })
          },
        },
      })),
    [storeNodes, updateNode]
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes as Node[])
  const [edges, , onEdgesChange] = useEdgesState(
    storeEdges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label,
      animated: true,
    })) as Edge[]
  )

  // Update nodes when store changes
  useEffect(() => {
    setNodes(initialNodes)
  }, [initialNodes, setNodes])

  // Clear "isNew" flag after 3 seconds
  useEffect(() => {
    const newNodes = storeNodes.filter((n) => n.data?.isNew)
    if (newNodes.length > 0) {
      const timer = setTimeout(() => {
        newNodes.forEach((n) => {
          updateNode(n.id, {
            data: { ...n.data, isNew: false },
          })
        })
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [storeNodes, updateNode])

  const handleExport = useCallback(() => {
    const graphData = {
      nodes: storeNodes,
      edges: storeEdges,
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(graphData, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `braincell-knowledge-graph-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [storeNodes, storeEdges])

  return (
    <div className="glass-strong rounded-3xl elevated h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h2 className="font-semibold text-lg">Knowledge Map</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => (isLocked ? unlockGraph() : lockGraph())}
            className={cn(
              'p-2 rounded-lg bg-muted hover:bg-muted/80',
              'transition-smooth focus-ring',
              isLocked && 'bg-primary/10 text-primary'
            )}
            aria-label={isLocked ? 'Unlock graph' : 'Lock graph'}
            title={isLocked ? 'Unlock to edit' : 'Lock positions'}
          >
            {isLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
          </button>
          <button
            onClick={handleExport}
            className={cn(
              'p-2 rounded-lg bg-muted hover:bg-muted/80',
              'transition-smooth focus-ring'
            )}
            aria-label="Export graph"
            title="Export as JSON"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 relative min-h-[400px]" style={{ width: '100%', height: '100%' }}>
        {nodes.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <p>Knowledge graph will appear as you learn...</p>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={isLocked ? undefined : onNodesChange}
            onEdgesChange={isLocked ? undefined : onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.5}
            maxZoom={2}
          >
            <Background gap={16} size={1} />
            <Controls />
            <MiniMap
              nodeColor={(node) => {
                const data = node.data as { mastered?: boolean; isNew?: boolean }
                if (data.isNew) return '#3b82f6' // primary blue for new
                if (data.mastered) return '#22c55e' // green for mastered
                return '#94a3b8' // gray for learning
              }}
              maskColor="rgba(0, 0, 0, 0.1)"
            />
          </ReactFlow>
        )}
      </div>
    </div>
  )
}
