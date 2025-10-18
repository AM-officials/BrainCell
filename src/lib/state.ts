import { create } from 'zustand'
import { CognitiveState, SessionStore, ChatStore, CognitiveStore, GraphStore } from '@/types'

// Session Store
export const useSessionStore = create<SessionStore>((set) => ({
  session: null,
  createSession: (topic: string) => {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    set({
      session: {
        sessionId,
        topic,
        startTime: new Date().toISOString(),
        isActive: true,
      },
    })
  },
  endSession: () =>
    set((state) => ({
      session: state.session
        ? { ...state.session, endTime: new Date().toISOString(), isActive: false }
        : null,
    })),
  updateSession: (updates) =>
    set((state) => ({
      session: state.session ? { ...state.session, ...updates } : null,
    })),
}))

// Chat Store
export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  addMessage: (message) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          ...message,
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
        },
      ],
    })),
  clearMessages: () => set({ messages: [] }),
}))

// Cognitive Store
export const useCognitiveStore = create<CognitiveStore>((set) => ({
  currentState: 'FOCUSED',
  events: [],
  setState: (state: CognitiveState) => set({ currentState: state }),
  addEvent: (event) =>
    set((state) => ({
      events: [
        ...state.events,
        {
          ...event,
          id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
        },
      ],
    })),
  clearEvents: () => set({ events: [] }),
}))

// Knowledge Graph Store with localStorage persistence for notes
export const useGraphStore = create<GraphStore>((set) => ({
  nodes: [],
  edges: [],
  isLocked: false,
  addNodes: (nodes) =>
    set((state) => {
      // Prevent duplicates, mark new nodes
      const existingIds = new Set(state.nodes.map((n) => n.id))
      const newNodes = nodes.filter((n) => !existingIds.has(n.id)).map(n => ({
        ...n,
        data: { ...n.data, isNew: true, timestamp: n.data?.timestamp || new Date().toISOString() }
      }))
      
      // Load persisted notes from localStorage
      const savedNotes = JSON.parse(localStorage.getItem('braincell_node_notes') || '{}')
      const nodesWithNotes = newNodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          notes: savedNotes[node.id] || '',
          hasNotes: !!savedNotes[node.id]
        }
      }))
      
      return { nodes: [...state.nodes, ...nodesWithNotes] }
    }),
  addEdges: (edges) =>
    set((state) => {
      const existingIds = new Set(state.edges.map((e) => e.id))
      const newEdges = edges.filter((e) => !existingIds.has(e.id))
      return { edges: [...state.edges, ...newEdges] }
    }),
  updateNode: (id, updates) =>
    set((state) => {
      // If updating notes, persist to localStorage
      if (updates.data && 'notes' in updates.data) {
        const savedNotes = JSON.parse(localStorage.getItem('braincell_node_notes') || '{}')
        savedNotes[id] = updates.data.notes
        localStorage.setItem('braincell_node_notes', JSON.stringify(savedNotes))
      }
      
      return {
        nodes: state.nodes.map((node) => 
          node.id === id 
            ? { 
                ...node, 
                ...updates,
                data: { 
                  ...node.data, 
                  ...updates.data,
                  hasNotes: updates.data?.notes ? !!updates.data.notes : node.data?.hasNotes
                }
              } 
            : node
        ),
      }
    }),
  lockGraph: () => set({ isLocked: true }),
  unlockGraph: () => set({ isLocked: false }),
  clearGraph: () => set({ nodes: [], edges: [], isLocked: false }),
}))

// Theme Store
interface ThemeStore {
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void
}

export const useThemeStore = create<ThemeStore>((set) => ({
  theme: 'system',
  setTheme: (theme) => set({ theme }),
}))

// Toast Store
interface ToastStore {
  toasts: Array<{
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    message: string
    duration?: number
  }>
  addToast: (toast: {
    type: 'success' | 'error' | 'warning' | 'info'
    message: string
    duration?: number
  }) => void
  removeToast: (id: string) => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }))
    
    // Auto-remove after duration
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }))
    }, toast.duration || 5000)
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}))
