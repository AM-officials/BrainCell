import { useState } from 'react'
import { Brain, MessageSquare, Network, FileText, Users } from 'lucide-react'
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
import { OfflineIndicator } from '../Offline/OfflineIndicator'
import { LearningReport } from '../Report/LearningReport'
import { BottomNav } from './BottomNav'
import { JoinClassroom } from '../Student/JoinClassroom'

type ViewMode = 'chat' | 'graph' | 'report' | 'monitor'

interface CockpitProps {
  studentId: string
  studentName: string
  onLogout: () => void
}

export const Cockpit: React.FC<CockpitProps> = ({ 
  studentId, 
  studentName, 
  onLogout 
}) => {
  // Load classroom from localStorage on mount
  const getStoredClassroom = () => {
    try {
      const stored = localStorage.getItem(`braincell_classroom_${studentId}`)
      if (stored) {
        const { classroomId, classroomName, joinCode: storedJoinCode, timestamp } = JSON.parse(stored)
        // Check if stored data is less than 7 days old
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
        if (timestamp > sevenDaysAgo) {
          return { classroomId, classroomName, joinCode: storedJoinCode }
        }
      }
    } catch (error) {
      console.error('Error loading stored classroom:', error)
    }
    return { classroomId: undefined, classroomName: '', joinCode: undefined }
  }

  const storedClassroom = getStoredClassroom()
  const [topic, setTopic] = useState('')
  const [activeView, setActiveView] = useState<ViewMode>('chat')
  const [showJoinClassroom, setShowJoinClassroom] = useState(false)
  const [currentClassroomId, setCurrentClassroomId] = useState<string | undefined>(storedClassroom.classroomId)
  const [currentClassroomName, setCurrentClassroomName] = useState<string>(storedClassroom.classroomName)
  const [currentJoinCode, setCurrentJoinCode] = useState<string | undefined>(storedClassroom.joinCode)

  const { session, createSession, endSession } = useSessionStore()
  const { addMessage } = useChatStore()
  const { currentState, setState } = useCognitiveStore()
  const { addToast } = useToastStore()
  const { addNodes, addEdges } = useGraphStore()

  const isSessionActive = session?.isActive || false

  const handleJoinSuccess = (classroomId: string, classroomName: string, joinCode: string) => {
    setCurrentClassroomId(classroomId)
    setCurrentClassroomName(classroomName)
    setCurrentJoinCode(joinCode)
    setShowJoinClassroom(false)
    
    // Persist classroom info to localStorage
    try {
      localStorage.setItem(`braincell_classroom_${studentId}`, JSON.stringify({
        classroomId,
        classroomName,
        joinCode,
        timestamp: Date.now()
      }))
    } catch (error) {
      console.error('Error saving classroom to localStorage:', error)
    }
    
    addToast({
      type: 'success',
      message: `Joined ${classroomName} successfully!`,
    })
  }

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
      {/* Header - Mobile Optimized */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-3 md:px-4 py-3 md:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-shrink">
              <Brain className="h-6 w-6 md:h-8 md:w-8 text-primary flex-shrink-0" />
              <div className="min-w-0">
                <h1 className="text-lg md:text-2xl font-bold truncate">BrainCell</h1>
                <p className="text-xs md:text-sm text-muted-foreground hidden sm:block truncate">
                  Personalized learning in real-time
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 md:gap-4 flex-shrink-0">
              <OfflineIndicator />
              {isSessionActive && <StateBadge state={currentState} />}
              
              {/* Classroom Info or Join Button */}
              {currentClassroomId ? (
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-lg">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium text-primary">
                    {currentClassroomName || 'Classroom'}
                  </span>
                </div>
              ) : (
                <button
                  onClick={() => setShowJoinClassroom(true)}
                  className="hidden md:flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground hover:opacity-90 rounded-lg transition-opacity"
                >
                  <Users className="h-4 w-4" />
                  Join Classroom
                </button>
              )}
              
              <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                <span>👤 {studentName}</span>
              </div>
              
              <ThemeToggle />
              
              <button
                onClick={onLogout}
                className="px-2 md:px-3 py-1.5 text-xs md:text-sm text-muted-foreground hover:text-foreground rounded-lg transition-colors whitespace-nowrap"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Mobile Edge-to-Edge */}
      <main className="flex-1 w-full px-0 py-0 overflow-hidden">
        {!isSessionActive ? (
          // Session Setup - Mobile Optimized
          <div className="max-w-2xl mx-auto mt-8 md:mt-20 px-4 md:px-0">
            <div className="text-center mb-6 md:mb-8">
              <h2 className="text-2xl md:text-4xl font-bold mb-3 md:mb-4 gradient-text">
                Start Your Learning Journey
              </h2>
              <p className="text-base md:text-lg text-muted-foreground">
                BrainCell adapts to how you learn — in real-time.
              </p>
            </div>

            <div className="glass-strong rounded-2xl md:rounded-3xl p-6 md:p-8 elevated space-y-4">
              {/* Classroom Status or Join Button */}
              {currentClassroomId ? (
                <div className="flex items-center justify-between gap-3 p-4 bg-primary/10 rounded-xl border border-primary/20">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-primary flex-shrink-0" />
                    <div className="text-left min-w-0">
                      <p className="text-xs text-muted-foreground">Connected to</p>
                      <p className="text-sm font-semibold text-primary truncate">
                        {currentClassroomName || 'Classroom'}
                      </p>
                      {currentJoinCode && (
                        <p className="text-[11px] text-muted-foreground">Code: {currentJoinCode}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('Leave this classroom? You can rejoin anytime with the code.')) {
                        setCurrentClassroomId(undefined)
                        setCurrentClassroomName('')
                        setCurrentJoinCode(undefined)
                        localStorage.removeItem(`braincell_classroom_${studentId}`)
                        addToast({
                          type: 'info',
                          message: 'Left classroom successfully',
                        })
                      }
                    }}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors flex-shrink-0"
                  >
                    Leave
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowJoinClassroom(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5 text-muted-foreground hover:text-primary transition-all"
                >
                  <Users className="h-5 w-5" />
                  <span className="font-medium text-sm md:text-base">Join a Classroom (Optional)</span>
                </button>
              )}

              <TopicSelect
                value={topic}
                onChange={setTopic}
                className="mb-4 md:mb-6"
              />

              <button
                onClick={handleStartSession}
                disabled={!topic.trim()}
                className={cn(
                  'w-full py-3 md:py-4 px-4 md:px-6 rounded-xl md:rounded-2xl',
                  'bg-primary text-primary-foreground',
                  'font-semibold text-base md:text-lg',
                  'hover:opacity-90 active:scale-[0.98]',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'transition-smooth',
                  'focus-ring',
                  'min-h-[44px]' // iOS minimum touch target
                )}
              >
                Start Learning Session
              </button>
            </div>
          </div>
        ) : (
          // Learning Cockpit
          <div className="space-y-4">
            {/* View Tabs - Desktop Only */}
            <div className="hidden md:flex items-center gap-2 bg-muted/30 p-1 rounded-xl w-fit">
              <button
                onClick={() => setActiveView('chat')}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  'flex items-center gap-2',
                  activeView === 'chat'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <MessageSquare className="h-4 w-4" />
                Chat
              </button>
              <button
                onClick={() => setActiveView('graph')}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  'flex items-center gap-2',
                  activeView === 'graph'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Network className="h-4 w-4" />
                Knowledge Graph
              </button>
              <button
                onClick={() => setActiveView('report')}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  'flex items-center gap-2',
                  activeView === 'report'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <FileText className="h-4 w-4" />
                Learning Report
              </button>
            </div>

            {/* Content Area - Responsive Layout */}
            {/* Mobile: Single column, full-screen view based on activeView */}
            {/* Desktop (lg): 3-column grid with Monitor | Content | Context */}
            <div className="lg:grid lg:grid-cols-[1fr_2fr_1fr] lg:gap-6 h-[calc(100vh-120px)] lg:h-[calc(100vh-180px)] lg:px-4">
              
              {/* Mobile View: Show only active panel - Full height with bottom nav space */}
              <div className="lg:hidden h-full pb-16">
                {activeView === 'chat' && (
                  <div className="h-full w-full">
                    <ChatPanel
                      onSendMessage={handleSendMessage}
                      onEndSession={handleEndSession}
                    />
                  </div>
                )}
                {activeView === 'graph' && (
                  <div className="h-full w-full">
                    <KnowledgeGraph />
                  </div>
                )}
                {activeView === 'report' && (
                  <div className="h-full w-full overflow-y-auto p-4 bg-card rounded-xl border border-border">
                    <LearningReport 
                      studentId={session?.sessionId || ''} 
                      topic={session?.topic}
                    />
                  </div>
                )}
                {activeView === 'monitor' && (
                  <div className="h-full w-full">
                    <CognitiveMonitor />
                  </div>
                )}
              </div>

              {/* Desktop View: 3-column layout */}
              {/* Left: Cognitive Monitor */}
              <div className="hidden lg:block h-full overflow-auto">
                <CognitiveMonitor />
              </div>

              {/* Center: Dynamic Content */}
              <div className="hidden lg:block h-full overflow-hidden">
                {activeView === 'chat' && (
                  <ChatPanel
                    onSendMessage={handleSendMessage}
                    onEndSession={handleEndSession}
                  />
                )}
                {activeView === 'graph' && (
                  <div className="h-full">
                    <KnowledgeGraph />
                  </div>
                )}
                {activeView === 'report' && (
                  <div className="h-full overflow-y-auto p-4 bg-card rounded-xl border border-border">
                    <LearningReport 
                      studentId={session?.sessionId || ''} 
                      topic={session?.topic}
                    />
                  </div>
                )}
              </div>

              {/* Right: Context Panel */}
              <div className="hidden lg:block h-full overflow-auto">
                {activeView === 'chat' && <KnowledgeGraph />}
                {activeView === 'graph' && (
                  <div className="p-4 bg-card rounded-xl border border-border h-full">
                    <h3 className="text-sm font-semibold mb-2">Graph Legend</h3>
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <span>Mastered Concepts</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <span>In Progress</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gray-500" />
                        <span>Not Started</span>
                      </div>
                    </div>
                  </div>
                )}
                {activeView === 'report' && (
                  <div className="p-4 bg-card rounded-xl border border-border h-full">
                    <h3 className="text-sm font-semibold mb-4">Quick Actions</h3>
                    <button
                      onClick={() => setActiveView('chat')}
                      className="w-full px-3 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                    >
                      Practice Weak Areas
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Bottom Navigation */}
            <BottomNav 
              activeView={activeView} 
              onViewChange={setActiveView}
            />
          </div>
        )}
      </main>

      {/* Footer - Hidden on mobile when session is active (bottom nav takes its place) */}
      <footer className={cn(
        "border-t border-border py-3 md:py-4 text-center text-xs md:text-sm text-muted-foreground",
        isSessionActive && "hidden md:block"
      )}>
        <p>BrainCell v1.3 | Built with ❤️ for adaptive learning</p>
      </footer>

      {/* Join Classroom Modal */}
      {showJoinClassroom && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowJoinClassroom(false)}
        >
          <div 
            className="bg-card rounded-2xl border border-border shadow-2xl max-w-md w-full p-6 md:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Join Classroom</h2>
              <button
                onClick={() => setShowJoinClassroom(false)}
                className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg hover:bg-muted"
              >
                ✕
              </button>
            </div>
            
            <JoinClassroom
              studentId={studentId}
              studentName={studentName}
              onJoinSuccess={handleJoinSuccess}
            />
          </div>
        </div>
      )}
    </div>
  )
}
