import { useState } from 'react'
import { useSignIn, useSignUp } from '@clerk/clerk-react'
import { Mail, Lock, User, Loader2 } from 'lucide-react'

type AuthMode = 'signin' | 'signup'

interface CustomAuthFormProps {
  mode: AuthMode
  roleEmoji: string
  roleName: string
  onBack: () => void
}

export function CustomAuthForm({ mode, roleEmoji, roleName, onBack }: CustomAuthFormProps) {
  const { signIn, setActive: setActiveSignIn, isLoaded: signInLoaded } = useSignIn()
  const { signUp, setActive: setActiveSignUp, isLoaded: signUpLoaded } = useSignUp()
  
  const [authMode, setAuthMode] = useState<AuthMode>(mode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [pendingVerification, setPendingVerification] = useState(false)

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signIn) return

    setLoading(true)
    setError('')

    try {
      console.log('Attempting sign in with email:', email)
      
      const result = await signIn.create({
        identifier: email,
        password,
      })

      if (result.status === 'complete') {
        await setActiveSignIn({ session: result.createdSessionId })
        // Force a small delay to ensure session is fully activated
        setTimeout(() => {
          window.location.reload()
        }, 100)
      }
    } catch (err: any) {
      // Log full error object for debugging
      console.error('Clerk sign-in error:', err)
      console.error('Sign-in attempt with:', { email, passwordLength: password.length })
      
      if (err.errors) {
        const errorMsg = err.errors[0]?.message || err.errors[0]?.longMessage
        
        // Special handling for "account not found" error
        if (errorMsg && errorMsg.includes("Couldn't find your account")) {
          setError(
            "Account not found. Please check:\n" +
            "• Email is correct (check for typos)\n" +
            "• You completed email verification\n" +
            "• Try clearing storage: localStorage.clear()\n" +
            "Or create a new account if verification failed"
          )
        } else {
          setError(errorMsg || 'Failed to sign in')
        }
      } else if (err.message) {
        setError(err.message)
      } else {
        setError('Failed to sign in (unknown error)')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signUp) return

    setLoading(true)
    setError('')

    // Validate inputs before sending to Clerk
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address')
      setLoading(false)
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      setLoading(false)
      return
    }

    if (authMode === 'signup' && !firstName.trim()) {
      setError('First name is required')
      setLoading(false)
      return
    }

    try {
      console.log('Attempting sign up with:', { 
        emailAddress: email,
        firstName: firstName || 'N/A',
        lastName: lastName || 'N/A',
        passwordLength: password.length
      })

      await signUp.create({
        emailAddress: email,
        password,
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
      })

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      setPendingVerification(true)
    } catch (err: any) {
      // Log full error object for debugging
      console.error('Clerk sign-up error:', err)
      console.error('Error details:', {
        errors: err.errors,
        message: err.message,
        status: err.status
      })
      
      if (err.errors && err.errors.length > 0) {
        const errorMsg = err.errors[0].message || err.errors[0].longMessage
        
        // Special handling for CAPTCHA errors
        if (errorMsg && errorMsg.includes('CAPTCHA')) {
          setError(
            'Bot protection is blocking sign-up. Please:\n' +
            '1. Try a different browser (Chrome/Firefox)\n' +
            '2. Disable browser extensions\n' +
            '3. Or contact admin to disable CAPTCHA in Clerk dashboard'
          )
        } else {
          setError(errorMsg || 'Failed to sign up')
        }
      } else if (err.message) {
        // Check if it's a CAPTCHA error
        if (err.message.includes('CAPTCHA')) {
          setError(
            'Bot protection is blocking sign-up. Try:\n' +
            '• Different browser (Chrome without extensions)\n' +
            '• Incognito/Private mode\n' +
            '• Contact admin to disable bot protection'
          )
        } else {
          setError(err.message)
        }
      } else {
        setError('Failed to sign up. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signUp) return

    setLoading(true)
    setError('')

    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      })

      if (result.status === 'complete') {
        await setActiveSignUp({ session: result.createdSessionId })
        // Force a small delay to ensure session is fully activated
        setTimeout(() => {
          window.location.reload()
        }, 100)
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'Invalid verification code')
    } finally {
      setLoading(false)
    }
  }

  // Show loading state while Clerk hooks are initializing
  if (!signInLoaded || !signUpLoaded) {
    return (
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (pendingVerification) {
    return (
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Mail className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Email</h2>
          <p className="text-gray-600">
            We sent a code to <span className="font-medium">{email}</span>
          </p>
        </div>

        <form onSubmit={handleVerification} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Verification Code
            </label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="Enter 6-digit code"
              maxLength={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{ fontFamily: 'monospace', letterSpacing: '0.2em' }}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !verificationCode}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-5 w-5 animate-spin" />}
            Verify Email
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-4">
          <span className="text-3xl">{roleEmoji}</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {authMode === 'signin' ? `${roleName} Sign In` : `${roleName} Sign Up`}
        </h2>
        <p className="text-gray-600">Welcome to BrainCell 🧠</p>
      </div>

      <form onSubmit={authMode === 'signin' ? handleSignIn : handleSignUp} className="space-y-4">
        {authMode === 'signup' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              minLength={8}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {authMode === 'signup' && (
            <p className="mt-1 text-xs text-gray-500">Must be at least 8 characters</p>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* CAPTCHA container for Clerk */}
        <div id="clerk-captcha"></div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="h-5 w-5 animate-spin" />}
          {authMode === 'signin' ? 'Sign In' : 'Create Account'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <button
          onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
          className="text-sm text-gray-600"
        >
          {authMode === 'signin' ? (
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

      <div className="mt-4 text-center">
        <button
          onClick={onBack}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Change role
        </button>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200 text-center">
        <p className="text-xs text-gray-500">
          Secured by{' '}
          <span className="font-medium">Clerk</span>
        </p>
      </div>
    </div>
  )
}
