import { useState } from 'react'
import { GraduationCap, BookOpen } from 'lucide-react'

type UserRole = 'student' | 'teacher'

interface RoleSelectionProps {
  onRoleSelected: (role: UserRole, joinCode?: string) => void
  userName: string
}

export function RoleSelection({ onRoleSelected, userName }: RoleSelectionProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [joinCode, setJoinCode] = useState('')
  const [showJoinCodeInput, setShowJoinCodeInput] = useState(false)

  const handleRoleClick = (role: UserRole) => {
    setSelectedRole(role)
    if (role === 'student') {
      setShowJoinCodeInput(true)
    } else {
      onRoleSelected(role)
    }
  }

  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onRoleSelected('student', joinCode || undefined)
  }

  if (showJoinCodeInput && selectedRole === 'student') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-100 dark:border-gray-700">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full mb-4">
                <GraduationCap className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Welcome, {userName}! 👋
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Join a classroom to start learning
              </p>
            </div>

            <form onSubmit={handleStudentSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Classroom Code (Optional)
                </label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Enter 8-character code"
                  maxLength={8}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  style={{ fontFamily: 'monospace', letterSpacing: '0.1em' }}
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  You can join a classroom later from your dashboard
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowJoinCodeInput(false)
                    setSelectedRole(null)
                    setJoinCode('')
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-lg shadow-blue-500/30"
                >
                  Continue
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
            Welcome to BrainCell 🧠
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Hi {userName}! Choose your role to get started
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Student Card */}
          <button
            onClick={() => handleRoleClick('student')}
            className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 p-8 border-2 border-transparent hover:border-blue-500 dark:hover:border-blue-400"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <GraduationCap className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                I'm a Student
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Join classrooms, learn new concepts, and track your progress
              </p>
              <ul className="text-sm text-gray-500 dark:text-gray-500 space-y-2 text-left w-full">
                <li className="flex items-center gap-2">
                  <span className="text-blue-500">✓</span> Interactive learning sessions
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-500">✓</span> Progress tracking
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-500">✓</span> Join multiple classrooms
                </li>
              </ul>
            </div>
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/5 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>

          {/* Teacher Card */}
          <button
            onClick={() => handleRoleClick('teacher')}
            className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 p-8 border-2 border-transparent hover:border-purple-500 dark:hover:border-purple-400"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <BookOpen className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                I'm a Teacher
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Create classrooms, manage students, and monitor learning outcomes
              </p>
              <ul className="text-sm text-gray-500 dark:text-gray-500 space-y-2 text-left w-full">
                <li className="flex items-center gap-2">
                  <span className="text-purple-500">✓</span> Create & manage classrooms
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-purple-500">✓</span> Track student analytics
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-purple-500">✓</span> Monitor class performance
                </li>
              </ul>
            </div>
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/5 to-pink-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>
        </div>
      </div>
    </div>
  )
}
