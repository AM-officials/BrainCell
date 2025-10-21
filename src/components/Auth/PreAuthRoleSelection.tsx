import { GraduationCap, BookOpen } from 'lucide-react'

type UserRole = 'student' | 'teacher'

interface PreAuthRoleSelectionProps {
  onRoleSelected: (role: UserRole) => void
}

export function PreAuthRoleSelection({ onRoleSelected }: PreAuthRoleSelectionProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-3">
            Welcome to BrainCell 🧠
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Choose your role to get started
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Student Card */}
          <button
            onClick={() => onRoleSelected('student')}
            className="group relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-300 p-10 border-2 border-transparent hover:border-blue-500 dark:hover:border-blue-400 transform hover:scale-105"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <GraduationCap className="h-12 w-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                I'm a Student
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg">
                Join classrooms, learn new concepts, and track your progress
              </p>
              <ul className="text-sm text-gray-500 dark:text-gray-500 space-y-3 text-left w-full">
                <li className="flex items-center gap-3">
                  <span className="text-blue-500 text-lg">✓</span>
                  <span>Interactive learning sessions</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-blue-500 text-lg">✓</span>
                  <span>Real-time progress tracking</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-blue-500 text-lg">✓</span>
                  <span>Join multiple classrooms</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-blue-500 text-lg">✓</span>
                  <span>Personalized learning reports</span>
                </li>
              </ul>
            </div>
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500/5 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>

          {/* Teacher Card */}
          <button
            onClick={() => onRoleSelected('teacher')}
            className="group relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-300 p-10 border-2 border-transparent hover:border-purple-500 dark:hover:border-purple-400 transform hover:scale-105"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <BookOpen className="h-12 w-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                I'm a Teacher
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg">
                Create classrooms, manage students, and monitor learning outcomes
              </p>
              <ul className="text-sm text-gray-500 dark:text-gray-500 space-y-3 text-left w-full">
                <li className="flex items-center gap-3">
                  <span className="text-purple-500 text-lg">✓</span>
                  <span>Create & manage classrooms</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-purple-500 text-lg">✓</span>
                  <span>Track student analytics</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-purple-500 text-lg">✓</span>
                  <span>Monitor class performance</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-purple-500 text-lg">✓</span>
                  <span>Generate detailed reports</span>
                </li>
              </ul>
            </div>
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/5 to-pink-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>
        </div>
      </div>
    </div>
  )
}
