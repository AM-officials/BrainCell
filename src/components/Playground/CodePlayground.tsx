import { useState } from 'react'
import { Play } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CodePlaygroundProps {
  code: string
}

export const CodePlayground: React.FC<CodePlaygroundProps> = ({ code }) => {
  const [output, setOutput] = useState<string[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const runCode = () => {
    setIsRunning(true)
    setOutput([])
    
    const consoleLog: string[] = []
    const customConsole = {
      log: (...args: unknown[]) => {
        consoleLog.push(args.map(arg => String(arg)).join(' '))
      }
    }

    try {
      // Create sandboxed function
      const func = new Function('console', code)
      func(customConsole)
      setOutput(consoleLog.length > 0 ? consoleLog : ['✓ Code executed successfully'])
    } catch (error) {
      setOutput([`Error: ${error instanceof Error ? error.message : 'Unknown error'}`])
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="my-4 space-y-3">
      <div className="bg-muted/50 rounded-xl p-4 font-mono text-sm overflow-x-auto">
        <pre className="whitespace-pre-wrap">{code}</pre>
      </div>

      <button
        onClick={runCode}
        disabled={isRunning}
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-xl',
          'bg-primary text-primary-foreground',
          'hover:opacity-90 active:scale-95',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'transition-smooth focus-ring'
        )}
      >
        <Play className="h-4 w-4" />
        Run Code
      </button>

      {output.length > 0 && (
        <div className="bg-black text-green-400 rounded-xl p-4 font-mono text-sm">
          <div className="text-xs text-green-600 mb-2">Console Output:</div>
          {output.map((line, i) => (
            <div key={i}>&gt; {line}</div>
          ))}
        </div>
      )}
    </div>
  )
}
