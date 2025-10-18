import { useState } from 'react'
import { Mic, MicOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AudioRecorderProps {
  onTranscript?: (text: string, audioBlob: string) => void
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message: string
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ onTranscript }) => {
  const [isRecording, setIsRecording] = useState(false)
  const [recognition, setRecognition] = useState<any>(null)

  const startRecording = () => {
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (!SpeechRecognition) {
        console.warn('Speech recognition not supported')
        return
      }

      const recognitionInstance = new SpeechRecognition()
      recognitionInstance.continuous = true
      recognitionInstance.interimResults = true
      recognitionInstance.lang = 'en-US'

      recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join(' ')

        if (event.results[event.results.length - 1].isFinal) {
          onTranscript?.(transcript, '')
        }
      }

      recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error)
        setIsRecording(false)
      }

      recognitionInstance.start()
      setRecognition(recognitionInstance)
      setIsRecording(true)
    } catch (error) {
      console.error('Failed to start recording:', error)
    }
  }

  const stopRecording = () => {
    if (recognition) {
      recognition.stop()
      setRecognition(null)
    }
    setIsRecording(false)
  }

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  return (
    <button
      onClick={toggleRecording}
      className={cn(
        'rounded-xl p-3 flex items-center justify-center gap-2',
        isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-muted',
        'hover:opacity-90 transition-smooth focus-ring'
      )}
    >
      {isRecording ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
      <span className="text-sm font-medium">
        {isRecording ? 'Recording...' : 'Start Audio'}
      </span>
    </button>
  )
}
