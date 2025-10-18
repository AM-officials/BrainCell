import { useEffect, useState } from 'react'
import { Cockpit } from './components/Layout/Cockpit'
import { Toasts } from './components/UI/Toasts'
import { useThemeStore } from './lib/state'

function App() {
  const [runtimeError, setRuntimeError] = useState<string | null>(null)
  const theme = useThemeStore((state) => state.theme)
  const setTheme = useThemeStore((state) => state.setTheme)

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

  useEffect(() => {
    if (runtimeError) {
      // Keep showing error, skip theme updates
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
      ) : (
        <>
          <Cockpit />
          <Toasts />
        </>
      )}
    </>
  )
}

export default App
