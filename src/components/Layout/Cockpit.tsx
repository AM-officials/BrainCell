import { useState } from 'react'
import { Brain } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSessionStore, useChatStore, useCognitiveStore, useToastStore, useGraphStore } from '@/lib/state'
import { analyzeSession } from '@/lib/api'
import type { FacialExpression, TextFriction, VocalState } from '@/types'
import { TopicSelect } from '../UI/TopicSelect'
import { ThemeToggle } from '../UI/ThemeToggle'
import { StateBadge } from '../UI/StateBadge'
import { ChatPanel } from '../Chat/ChatPanel'
import { CognitiveMonitor } from '../Cognitive/CognitiveMonitor'
import { KnowledgeGraph } from '../Graph/KnowledgeGraph'

export const Cockpit: React.FC = () => {
  const [topic, setTopic] = useState('')

  const { session, createSession, endSession } = useSessionStore()
  const { addMessage } = useChatStore()
  const { currentState, setState } = useCognitiveStore()
  const { addToast } = useToastStore()
  const { addNodes, addEdges } = useGraphStore()

  const isSessionActive = session?.isActive || false

  const handleStartSession = () => {
    if (!topic.trim()) {
      addToast({
        type: 'warning',
        message: 'Please select a topic first',
      })
      return
    }

    createSession(topic)
    addMessage({
      role: 'assistant',
      content: `Welcome to BrainCell! I'm excited to help you learn about ${topic}. Let's start with the fundamentals. What would you like to know first?`,
      responseType: 'text',
      cognitiveState: 'FOCUSED',
    })

    addToast({
      type: 'success',
      message: 'Session started! Let\'s begin learning.',
    })
  }

  const handleEndSession = () => {
    if (session) {
      endSession()
      addToast({
        type: 'info',
        message: 'Session ended. Great job learning today!',
      })
    }
  }

  const handleSendMessage = async (
    queryText: string,
    textFriction: TextFriction,
    facialExpression: FacialExpression | null,
    vocalState: VocalState | null,
    audioBlob: string | null
  ) => {
    if (!session) return

    // Add user message
    addMessage({
      role: 'user',
      content: queryText,
    })

    try {
      // Call API
      const response = await analyzeSession({
        sessionId: session.sessionId,
        queryText,
        text_friction: textFriction,
        audioBlob,
  facial_expression: facialExpression,
  vocal_state: vocalState,
        meta: {
          timestamp: new Date().toISOString(),
        },
      })

      // Update cognitive state
      setState(response.cognitiveState)

      // Update knowledge graph
      if (response.knowledgeGraphDelta) {
        if (response.knowledgeGraphDelta.nodes.length > 0) {
          addNodes(response.knowledgeGraphDelta.nodes)
        }
        if (response.knowledgeGraphDelta.edges.length > 0) {
          addEdges(response.knowledgeGraphDelta.edges)
        }
      }

      // Add assistant response
      addMessage({
        role: 'assistant',
        content: response.content,
        responseType: response.responseType,
        cognitiveState: response.cognitiveState,
      })
    } catch (error) {
      console.error('Error analyzing session:', error)
      addToast({
        type: 'error',
        message: 'Failed to get response. Please try again.',
      })
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">BrainCell</h1>
                <p className="text-sm text-muted-foreground">
                  Personalized learning in real-time
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {isSessionActive && <StateBadge state={currentState} />}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        {!isSessionActive ? (
          // Session Setup
          <div className="max-w-2xl mx-auto mt-20">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold mb-4 gradient-text">
                Start Your Learning Journey
              </h2>
              <p className="text-lg text-muted-foreground">
                BrainCell adapts to how you learn — in real-time.
              </p>
            </div>

            <div className="glass-strong rounded-3xl p-8 elevated">
              <TopicSelect
                value={topic}
                onChange={setTopic}
                className="mb-6"
              />

              <button
                onClick={handleStartSession}
                disabled={!topic.trim()}
                className={cn(
                  'w-full py-4 px-6 rounded-2xl',
                  'bg-primary text-primary-foreground',
                  'font-semibold text-lg',
                  'hover:opacity-90 active:scale-[0.98]',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'transition-smooth',
                  'focus-ring'
                )}
              >
                Start Learning Session
              </button>
            </div>
          </div>
        ) : (
          // Learning Cockpit
          <div className="grid lg:grid-cols-[1fr_2fr_1fr] gap-6 h-[calc(100vh-200px)]">
            {/* Left: Cognitive Monitor */}
            <div className="order-1 lg:order-1">
              <CognitiveMonitor />
            </div>

            {/* Center: Chat */}
            <div className="order-3 lg:order-2">
              <ChatPanel
                onSendMessage={handleSendMessage}
                onEndSession={handleEndSession}
              />
            </div>

            {/* Right: Knowledge Graph */}
            <div className="order-2 lg:order-3">
              <KnowledgeGraph />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 text-center text-sm text-muted-foreground">
        <p>BrainCell v1.3 | Built with ❤️ for adaptive learning</p>
      </footer>
    </div>
  )
}
