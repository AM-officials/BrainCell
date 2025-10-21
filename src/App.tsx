import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { Session } from '@supabase/supabase-js'
import { Cockpit } from './components/Layout/Cockpit'
import { TeacherDashboard } from './components/Teacher/TeacherDashboard'
import { PreAuthRoleSelection } from './components/Auth/PreAuthRoleSelection'
import { SupabaseAuth } from './components/Auth/SupabaseAuth'
import { Toasts } from './components/UI/Toasts'
import { useThemeStore } from './lib/state'
import axios from 'axios'

type Route = 'student' | 'teacher'
type UserRole = 'student' | 'teacher'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8002'

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [runtimeError, setRuntimeError] = useState<string | null>(null)
  const [route, setRoute] = useState<Route>('student')
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [preAuthRole, setPreAuthRole] = useState<UserRole | null>(null)
  const [userName, setUserName] = useState<string>('')
  const theme = useThemeStore((state) => state.theme)
  const setTheme = useThemeStore((state) => state.setTheme)

  // Initialize Supabase auth listener
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
      
      if (session?.user) {
        loadUserData(session.user.id, session.user.email || '')
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      
      if (session?.user) {
        loadUserData(session.user.id, session.user.email || '')
      } else {
        setUserRole(null)
        setUserName('')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadUserData = async (userId: string, email: string) => {
    try {
      // Get user metadata from Supabase
      const { data: userData } = await supabase.auth.getUser()
      
      if (userData.user) {
        const metadata = userData.user.user_metadata
        const fullName = metadata.full_name || metadata.first_name || email.split('@')[0]
        const role = (metadata.role || localStorage.getItem('braincell_pre_auth_role') || 'student') as UserRole
        
        setUserName(fullName)
        setUserRole(role)
        
        // Sync to backend database
        await syncUserToDatabase(userId, email, fullName, role)
        
        // Set route based on role
        if (role === 'teacher') {
          window.location.hash = 'teacher'
        }
        
        // Save role to localStorage
        localStorage.setItem(`braincell_role_${userId}`, role)
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }

  const syncUserToDatabase = async (userId: string, email: string, fullName: string, role: UserRole) => {
    try {
      await axios.post(`${API_URL}/api/v1/users/sync`, {
        clerk_user_id: userId, // Keep same field name for backend compatibility
        email: email,
        full_name: fullName,
        role: role
      })
      console.log('User synced to database:', { email, role })
    } catch (error) {
      console.error('Failed to sync user to database:', error)
    }
  }

  // Load pre-auth role on mount
  useEffect(() => {
    const storedPreAuthRole = localStorage.getItem('braincell_pre_auth_role')
    if (storedPreAuthRole) {
      setPreAuthRole(storedPreAuthRole as UserRole)
    }
  }, [])

  useEffect(() => {
    // Initialize theme from system preference
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    setTheme(isDark ? 'dark' : 'light')

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      setTheme(e.matches ? 'dark' : 'light')
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [setTheme])

  // Simple hash-based routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) // Remove #
      if (hash === 'teacher') {
        setRoute('teacher')
      } else {
        setRoute('student')
      }
    }

    handleHashChange() // Set initial route
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  useEffect(() => {
    if (runtimeError) {
      return
    }
    // Apply theme to document
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(theme)
  }, [runtimeError, setTheme, theme])

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Runtime error:', event.error || event.message)
      setRuntimeError(event.message)
    }
    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled rejection:', event.reason)
      setRuntimeError(event.reason?.message || String(event.reason))
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleRejection)
    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleRejection)
    }
  }, [])

  const handlePreAuthRoleSelected = (role: UserRole) => {
    localStorage.setItem('braincell_pre_auth_role', role)
    setPreAuthRole(role)
  }

  const handleAuthSuccess = async (userId: string, email: string) => {
    // User data will be loaded by the auth listener
    console.log('Authentication successful:', { userId, email })
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      
      if (session?.user) {
        localStorage.removeItem(`braincell_role_${session.user.id}`)
      }
      localStorage.removeItem('braincell_pre_auth_role')
      
      setUserRole(null)
      setPreAuthRole(null)
      setUserName('')
      window.location.hash = ''
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {runtimeError ? (
        <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 text-red-700 p-8">
          <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
          <pre className="bg-white border border-red-200 rounded-lg p-4 shadow-sm max-w-2xl whitespace-pre-wrap text-sm">
            {runtimeError}
          </pre>
          <p className="mt-4 text-sm text-red-500">
            Check the browser console for more details.
          </p>
        </div>
      ) : !session ? (
        // Not signed in - show auth flow
        !preAuthRole ? (
          // Step 1: Choose role BEFORE login
          <PreAuthRoleSelection onRoleSelected={handlePreAuthRoleSelected} />
        ) : (
          // Step 2: Supabase authentication
          <SupabaseAuth
            onBack={() => {
              setPreAuthRole(null)
              localStorage.removeItem('braincell_pre_auth_role')
            }}
            roleEmoji={preAuthRole === 'student' ? '👨‍🎓' : '👨‍🏫'}
            roleName={preAuthRole === 'student' ? 'Student' : 'Teacher'}
            preAuthRole={preAuthRole}
            onSuccess={handleAuthSuccess}
          />
        )
      ) : (
        // Signed in - show dashboard
        !userRole ? (
          <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Setting up your account...</p>
            </div>
          </div>
        ) : (
          <>
            {route === 'teacher' ? (
              <TeacherDashboard 
                teacherId={session.user.id} 
                teacherName={userName || 'Teacher'}
                onLogout={handleLogout}
              />
            ) : (
              <Cockpit 
                studentId={session.user.id}
                studentName={userName || 'Student'}
                onLogout={handleLogout}
              />
            )}
            <Toasts />
          </>
        )
      )}
    </>
  )
}

export default App
