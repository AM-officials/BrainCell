// Core API Types
export type CognitiveState = 'FOCUSED' | 'CONFUSED' | 'FRUSTRATED'
export type ResponseType = 'text' | 'diagram' | 'code'
export type FacialExpression = 'fear' | 'sad' | 'angry' | 'surprise' | 'neutral' | 'happy'
export type VocalState = 'calm' | 'hesitant' | 'stressed' | 'frustrated'

// Session Types
export interface Session {
  sessionId: string
  topic: string
  startTime: string
  endTime?: string
  isActive: boolean
}

// Message Types
export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  responseType?: ResponseType
  timestamp: string
  cognitiveState?: CognitiveState
}

// API Request/Response Types
export interface AnalyzeRequest {
  sessionId: string
  queryText: string
  text_friction: {
    rephraseCount: number
    backspaceCount: number
  }
  audioBlob: string | null
  facial_expression: FacialExpression | null
  vocal_state?: VocalState | null
  meta: {
    timestamp: string
  }
}

export interface AnalyzeResponse {
  responseType: ResponseType
  content: string
  cognitiveState: CognitiveState
  knowledgeGraphDelta: {
    nodes: GraphNode[]
    edges: GraphEdge[]
  }
}

// Knowledge Graph Types
export interface GraphNode {
  id: string
  type: 'concept' | 'mastered' | 'note'
  label: string
  mastered: boolean
  position?: { x: number; y: number }
  data?: {
    description?: string
    timestamp?: string
    isNew?: boolean
    notes?: string
    hasNotes?: boolean
  }
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  label?: string
  type?: string
}

// Text Friction Tracking
export interface TextFriction {
  rephraseCount: number
  backspaceCount: number
}

// Cognitive Monitor Types
export interface CognitiveEvent {
  id: string
  type: 'text_friction' | 'vocal_trigger' | 'facial_change' | 'state_change'
  timestamp: string
  data: Record<string, unknown>
  severity?: 'low' | 'medium' | 'high'
}

// Store State Types
export interface SessionStore {
  session: Session | null
  createSession: (topic: string) => void
  endSession: () => void
  updateSession: (updates: Partial<Session>) => void
}

export interface ChatStore {
  messages: Message[]
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void
  clearMessages: () => void
}

export interface CognitiveStore {
  currentState: CognitiveState
  events: CognitiveEvent[]
  setState: (state: CognitiveState) => void
  addEvent: (event: Omit<CognitiveEvent, 'id' | 'timestamp'>) => void
  clearEvents: () => void
}

export interface GraphStore {
  nodes: GraphNode[]
  edges: GraphEdge[]
  isLocked: boolean
  addNodes: (nodes: GraphNode[]) => void
  addEdges: (edges: GraphEdge[]) => void
  updateNode: (id: string, updates: Partial<GraphNode>) => void
  lockGraph: () => void
  unlockGraph: () => void
  clearGraph: () => void
}

// Demo Mode Types
export interface DemoStep {
  id: string
  delay: number
  action: () => void | Promise<void>
  description: string
}

// Media Types
export interface WebcamState {
  isEnabled: boolean
  stream: MediaStream | null
  permission: 'granted' | 'denied' | 'prompt'
}

export interface MicState {
  isEnabled: boolean
  isRecording: boolean
  permission: 'granted' | 'denied' | 'prompt'
}

// Theme Types
export type Theme = 'light' | 'dark' | 'system'

// Utility Types
export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number
}
