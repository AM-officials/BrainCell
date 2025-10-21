import { useState } from 'react'
import { Brain, LogIn, UserPlus } from 'lucide-react'
import { cn } from '@/lib/utils'

export type UserRole = 'student' | 'teacher'

interface AuthScreenProps {
  onAuth: (role: UserRole, userId: string, userName: string) => void
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuth }) => {
  const [mode, setMode] = useState<'select' | 'student' | 'teacher'>('select')
  const [name, setName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleStudentAuth = async () => {
    if (!name.trim()) {
      setError('Please enter your name')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Generate student ID
      const studentId = `student_${Date.now()}_${Math.random().toString(36).substring(7)}`
      
      // Store auth info in localStorage
      localStorage.setItem('braincell_auth', JSON.stringify({
        role: 'student',
        userId: studentId,
        userName: name.trim(),
        joinCode: joinCode.trim() || null
      }))

      onAuth('student', studentId, name.trim())
    } catch (err) {
      setError('Failed to sign in. Please try again.')
      console.error('Student auth error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleTeacherAuth = () => {
    if (!name.trim()) {
      setError('Please enter your name')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Generate teacher ID
      const teacherId = `teacher_${Date.now()}_${Math.random().toString(36).substring(7)}`
      
      // Store auth info in localStorage
      localStorage.setItem('braincell_auth', JSON.stringify({
        role: 'teacher',
        userId: teacherId,
        userName: name.trim()
      }))

      onAuth('teacher', teacherId, name.trim())
      
      // Redirect to teacher dashboard
      window.location.hash = 'teacher'
    } catch (err) {
      setError('Failed to sign in. Please try again.')
      console.error('Teacher auth error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (mode === 'select') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8">
          {/* Logo */}
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Brain className="h-16 w-16 text-primary" />
            </div>
            <h1 className="text-4xl font-bold gradient-text mb-2">BrainCell</h1>
            <p className="text-muted-foreground">Adaptive Learning Platform</p>
          </div>

          {/* Role Selection */}
          <div className="space-y-4">
            <button
              onClick={() => setMode('student')}
              className={cn(
                'w-full p-6 rounded-2xl border-2 border-border',
                'hover:border-primary hover:bg-primary/5',
                'transition-all duration-200',
                'flex items-center gap-4',
                'group'
              )}
            >
              <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <UserPlus className="h-8 w-8 text-primary" />
              </div>
              <div className="text-left">
                <h3 className="text-xl font-semibold mb-1">I'm a Student</h3>
                <p className="text-sm text-muted-foreground">
                  Start learning with adaptive AI assistance
                </p>
              </div>
            </button>

            <button
              onClick={() => setMode('teacher')}
              className={cn(
                'w-full p-6 rounded-2xl border-2 border-border',
                'hover:border-primary hover:bg-primary/5',
                'transition-all duration-200',
                'flex items-center gap-4',
                'group'
              )}
            >
              <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <LogIn className="h-8 w-8 text-primary" />
              </div>
              <div className="text-left">
                <h3 className="text-xl font-semibold mb-1">I'm a Teacher</h3>
                <p className="text-sm text-muted-foreground">
                  Manage classrooms and track student progress
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (mode === 'student') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Brain className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-3xl font-bold mb-2">Student Sign In</h2>
            <p className="text-muted-foreground">Enter your details to get started</p>
          </div>

          {/* Form */}
          <div className="glass-strong rounded-2xl p-6 space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="student-name" className="block text-sm font-medium mb-2">
                Your Name *
              </label>
              <input
                id="student-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background focus-ring"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="join-code" className="block text-sm font-medium mb-2">
                Classroom Code (Optional)
              </label>
              <input
                id="join-code"
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Enter 8-digit code"
                maxLength={8}
                className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background focus-ring uppercase"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground mt-2">
                You can join a classroom later from your dashboard
              </p>
            </div>

            <button
              onClick={handleStudentAuth}
              disabled={loading || !name.trim()}
              className={cn(
                'w-full py-3 px-6 rounded-xl',
                'bg-primary text-primary-foreground font-semibold',
                'hover:opacity-90 active:scale-[0.98]',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-all'
              )}
            >
              {loading ? 'Signing in...' : 'Continue'}
            </button>

            <button
              onClick={() => setMode('select')}
              disabled={loading}
              className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back to role selection
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (mode === 'teacher') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Brain className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-3xl font-bold mb-2">Teacher Sign In</h2>
            <p className="text-muted-foreground">Access your dashboard</p>
          </div>

          {/* Form */}
          <div className="glass-strong rounded-2xl p-6 space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="teacher-name" className="block text-sm font-medium mb-2">
                Your Name *
              </label>
              <input
                id="teacher-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background focus-ring"
                disabled={loading}
              />
            </div>

            <button
              onClick={handleTeacherAuth}
              disabled={loading || !name.trim()}
              className={cn(
                'w-full py-3 px-6 rounded-xl',
                'bg-primary text-primary-foreground font-semibold',
                'hover:opacity-90 active:scale-[0.98]',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-all'
              )}
            >
              {loading ? 'Signing in...' : 'Continue to Dashboard'}
            </button>

            <button
              onClick={() => setMode('select')}
              disabled={loading}
              className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back to role selection
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
