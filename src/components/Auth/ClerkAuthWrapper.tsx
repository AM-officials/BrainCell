import { SignIn, SignUp } from '@clerk/clerk-react'
import { useState } from 'react'

type UserRole = 'student' | 'teacher'

interface ClerkAuthWrapperProps {
  onBack: () => void
  roleEmoji: string
  roleName: string
  preAuthRole: UserRole
}

export function ClerkAuthWrapper({ onBack, roleEmoji, roleName, preAuthRole }: ClerkAuthWrapperProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-4">
            <span className="text-3xl">{roleEmoji}</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {mode === 'signin' ? `${roleName} Sign In` : `${roleName} Sign Up`}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">Welcome to BrainCell 🧠</p>
        </div>

        {/* Clerk Component */}
        <div className="clerk-auth-container">
          {mode === 'signin' ? (
            <SignIn
              appearance={{
                elements: {
                  rootBox: 'mx-auto',
                  card: 'shadow-2xl rounded-2xl',
                  headerTitle: 'hidden',
                  headerSubtitle: 'hidden',
                  socialButtonsBlockButton: 'hidden',
                  socialButtonsBlockButtonText: 'hidden',
                  dividerRow: 'hidden',
                  formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white',
                  formFieldInput: 'rounded-lg border-gray-300',
                  footerActionLink: 'text-blue-600 hover:text-blue-700',
                }
              }}
              routing="virtual"
              afterSignInUrl={`/?role=${preAuthRole}`}
            />
          ) : (
            <SignUp
              appearance={{
                elements: {
                  rootBox: 'mx-auto',
                  card: 'shadow-2xl rounded-2xl',
                  headerTitle: 'hidden',
                  headerSubtitle: 'hidden',
                  socialButtonsBlockButton: 'hidden',
                  socialButtonsBlockButtonText: 'hidden',
                  dividerRow: 'hidden',
                  formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white',
                  formFieldInput: 'rounded-lg border-gray-300',
                  footerActionLink: 'text-blue-600 hover:text-blue-700',
                }
              }}
              routing="virtual"
              afterSignUpUrl={`/?role=${preAuthRole}`}
            />
          )}
        </div>

        {/* Toggle Sign In / Sign Up */}
        <div className="mt-6 text-center">
          <button
            onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            className="text-sm text-gray-600 dark:text-gray-400"
          >
            {mode === 'signin' ? (
              <>
                Don't have an account?{' '}
                <span className="text-blue-600 hover:underline font-medium">Sign up</span>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <span className="text-blue-600 hover:underline font-medium">Sign in</span>
              </>
            )}
          </button>
        </div>

        {/* Back Button */}
        <div className="mt-4 text-center">
          <button
            onClick={onBack}
            className="text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            ← Change role
          </button>
        </div>
      </div>
    </div>
  )
}
