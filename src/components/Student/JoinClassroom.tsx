import { useState } from 'react'
import { Users, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import axios from 'axios'

interface JoinClassroomProps {
  studentId: string
  studentName: string
  onJoinSuccess: (classroomId: string, classroomName: string, joinCode: string) => void
}

export const JoinClassroom: React.FC<JoinClassroomProps> = ({
  studentId,
  studentName,
  onJoinSuccess
}) => {
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleJoin = async () => {
    if (!joinCode.trim() || joinCode.length !== 8) {
      setError('Please enter a valid 8-character code')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await axios.post(
        'http://127.0.0.1:8002/api/v1/classroom/join',
        {
          join_code: joinCode.toUpperCase(),
          student_id: studentId,
          student_name: studentName,
          student_email: null
        },
        { timeout: 10000 }
      )

      if (response.data.success) {
        // Check if already joined
        if (response.data.already_joined) {
          // Show info message instead of error
          setError('')
          setSuccess(true)
        } else {
          setSuccess(true)
        }
        
        setTimeout(() => {
          onJoinSuccess(
            response.data.classroom_id,
            response.data.classroom_name,
            response.data.join_code
          )
        }, 1500)
      }
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 404) {
          setError('Invalid classroom code. Please check and try again.')
        } else if (err.response?.status === 400) {
          setError(err.response.data.message || 'Failed to join classroom')
        } else {
          setError('Failed to join classroom. Please try again.')
        }
      } else {
        setError('Failed to join classroom. Please try again.')
      }
      console.error('Join classroom error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleJoin()
    }
  }

  if (success) {
    return (
      <div className="text-center space-y-4 py-8">
        <div className="flex justify-center">
          <div className="p-4 rounded-full bg-green-500/20">
            <Check className="h-12 w-12 text-green-500" />
          </div>
        </div>
        <h3 className="text-xl font-semibold text-green-500">
          Successfully Joined!
        </h3>
        <p className="text-muted-foreground">
          Redirecting to your learning dashboard...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 rounded-xl bg-primary/10">
            <Users className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h3 className="text-2xl font-bold mb-2">Join a Classroom</h3>
        <p className="text-muted-foreground">
          Enter the 8-character code provided by your teacher
        </p>
      </div>

      {/* Form */}
      <div className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-2">
            <X className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div>
          <label htmlFor="classroom-code" className="block text-sm font-medium mb-2">
            Classroom Code
          </label>
          <input
            id="classroom-code"
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            onKeyPress={handleKeyPress}
            placeholder="ABCD1234"
            maxLength={8}
            className={cn(
              'w-full px-4 py-3 rounded-xl border-2 bg-background',
              'text-center text-2xl font-mono tracking-wider uppercase',
              'focus-ring',
              error ? 'border-destructive' : 'border-border'
            )}
            disabled={loading}
            autoFocus
          />
          <p className="text-xs text-muted-foreground mt-2">
            Example: A1B2C3D4
          </p>
        </div>

        <button
          onClick={handleJoin}
          disabled={loading || !joinCode.trim() || joinCode.length !== 8}
          className={cn(
            'w-full py-3 px-6 rounded-xl',
            'bg-primary text-primary-foreground font-semibold',
            'hover:opacity-90 active:scale-[0.98]',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-all',
            'min-h-[44px]'
          )}
        >
          {loading ? 'Joining...' : 'Join Classroom'}
        </button>
      </div>
    </div>
  )
}
