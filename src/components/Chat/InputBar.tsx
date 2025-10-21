import { useEffect, useRef, useState } from 'react'
import { Send, Mic, MicOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTextFriction } from '@/hooks/useTextFriction'
import { useMetricsStore } from '@/lib/state'
import { submitVoiceClip } from '@/lib/api'
import type { FacialExpression, TextFriction, VocalState } from '@/types'

interface InputBarProps {
  onSend: (
    text: string,
    friction: TextFriction,
    facial: FacialExpression | null,
    vocal: VocalState | null,
    audio: string | null
  ) => void | Promise<void>
}

export const InputBar: React.FC<InputBarProps> = ({ onSend }) => {
  const [micEnabled, setMicEnabled] = useState(false)
  const { friction, handleInputChange, handleKeyDown, resetFriction, currentText } = useTextFriction()
  const { setTextFriction, setFrictionIntensity } = useMetricsStore()
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const latestAudioBlobRef = useRef<Blob | null>(null)
  const metricsIntervalRef = useRef<number | null>(null)
  const recognitionRef = useRef<any>(null)
  const isRecognitionActiveRef = useRef(false)
  const pendingTranscriptRef = useRef('')

  // Start/stop speech recognition when mic toggles
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      return // Speech recognition not supported
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    
    if (micEnabled && !recognitionRef.current) {
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onresult = (event: any) => {
        let finalTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' '
          }
        }

        if (finalTranscript) {
          // Store transcript and trigger update
          pendingTranscriptRef.current += finalTranscript
        }
      }

      recognition.onerror = (event: any) => {
        // Ignore abort errors (they happen during normal stop/restart)
        if (event.error !== 'aborted' && event.error !== 'no-speech') {
          console.error('Speech recognition error:', event.error)
        }
      }

      recognition.onend = () => {
        isRecognitionActiveRef.current = false
        // Auto-restart if mic is still enabled
        if (micEnabled && recognitionRef.current) {
          try {
            recognition.start()
            isRecognitionActiveRef.current = true
          } catch (e) {
            // Ignore if already started
          }
        }
      }

      recognition.onstart = () => {
        isRecognitionActiveRef.current = true
      }

      try {
        recognition.start()
        recognitionRef.current = recognition
        isRecognitionActiveRef.current = true
      } catch (e) {
        console.error('Failed to start speech recognition:', e)
      }
    } else if (!micEnabled && recognitionRef.current) {
      try {
        if (isRecognitionActiveRef.current) {
          recognitionRef.current.stop()
        }
      } catch (e) {
        // Ignore stop errors
      }
      recognitionRef.current = null
      isRecognitionActiveRef.current = false
    }

    return () => {
      if (recognitionRef.current) {
        try {
          if (isRecognitionActiveRef.current) {
            recognitionRef.current.stop()
          }
        } catch (e) {
          // Ignore cleanup errors
        }
        recognitionRef.current = null
      }
    }
  }, [micEnabled])

  // Flush pending speech transcript to input periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (pendingTranscriptRef.current) {
        handleInputChange(currentText + pendingTranscriptRef.current)
        pendingTranscriptRef.current = ''
      }
    }, 500) // Check every 500ms
    return () => clearInterval(interval)
  }, [currentText, handleInputChange])

  // Start/stop audio capture when mic toggles
  useEffect(() => {
    const start = async () => {
      try {
        console.log('🎤 Starting audio capture...')
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        mediaStreamRef.current = stream
        console.log('✓ Got media stream')
        
        const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
        mediaRecorderRef.current = recorder
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            latestAudioBlobRef.current = e.data
            console.log(`📊 Audio chunk captured: ${(e.data.size / 1024).toFixed(2)} KB`)
          }
        }
        recorder.start(2000) // collect chunks every 2s
        console.log('✓ MediaRecorder started')

        // kick off periodic metrics push
        const tick = async () => {
          if (latestAudioBlobRef.current) {
            try {
              console.log('🔊 Submitting voice clip for analysis...')
              const b64 = await blobToBase64(latestAudioBlobRef.current)
              const res = await submitVoiceClip(b64)
              console.log('✓ Voice analysis result:', res)
              if (res?.label) {
                useMetricsStore.getState().setVocalState(String(res.label).toLowerCase())
              }
              if (Array.isArray(res.candidates)) {
                useMetricsStore.getState().setVocalCandidates(
                  res.candidates.map((c: [string, number]) => ({ label: String(c[0]).toLowerCase(), score: Number(c[1]) }))
                )
              } else {
                useMetricsStore.getState().setVocalCandidates(undefined)
              }
            } catch (err) {
              console.error('❌ Voice clip submission failed:', err)
            }
          } else {
            console.log('⚠️ No audio blob available for analysis')
          }
        }
        // every 3 seconds
        console.log('✓ Starting 3s metrics interval')
        metricsIntervalRef.current = window.setInterval(tick, 3000)
      } catch (err) {
        console.error('❌ Mic access denied:', err)
        setMicEnabled(false)
      }
    }
    const stop = () => {
      mediaRecorderRef.current?.stop()
      mediaRecorderRef.current = null
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop())
      mediaStreamRef.current = null
      if (metricsIntervalRef.current) {
        clearInterval(metricsIntervalRef.current)
        metricsIntervalRef.current = null
      }
    }
    if (micEnabled) start()
    else stop()
    return () => stop()
  }, [micEnabled])

  const blobToBase64 = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(String(reader.result))
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })

  const handleSubmit = async () => {
    if (!currentText.trim()) return

    // Prepare audio if available
    let audioBase64: string | null = null
    if (latestAudioBlobRef.current) {
      try {
        audioBase64 = await blobToBase64(latestAudioBlobRef.current)
        // Optionally update vocal metrics immediately
        submitVoiceClip(audioBase64)
          .then((res) => {
            if (res?.label) {
              useMetricsStore.getState().setVocalState(String(res.label).toLowerCase())
            }
          })
          .catch(() => {})
      } catch {}
    }

    void onSend(currentText, friction, null, null, audioBase64)
    handleInputChange('')
    resetFriction()
    setTextFriction(0, 0)
    setFrictionIntensity(0)
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  handleKeyDown(e)
  // Update metrics store
  setTextFriction(friction.rephraseCount, friction.backspaceCount)
  // Spike intensity on edits; stronger on backspace
  const spike = e.key === 'Backspace' || e.key === 'Delete' ? 0.3 : 0.1
  setFrictionIntensity(Math.min(1, spike + 0.85 * Math.max(0, 1)))
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => setMicEnabled((v) => !v)}
        className={cn(
          'rounded-lg md:rounded-xl p-2 md:p-3',
          'min-h-[44px] min-w-[44px]', // iOS touch target
          micEnabled ? 'bg-primary text-primary-foreground' : 'bg-muted',
          'hover:opacity-90 transition-smooth focus-ring'
        )}
        aria-label={micEnabled ? 'Disable microphone' : 'Enable microphone'}
        title={micEnabled ? 'Disable microphone' : 'Enable microphone'}
      >
        {micEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
      </button>

      <label htmlFor="chat-input" className="sr-only">
        Ask a question
      </label>
      <textarea
        id="chat-input"
        name="message"
        value={currentText}
        onChange={(e) => {
          handleInputChange(e.target.value)
          setTextFriction(friction.rephraseCount, friction.backspaceCount)
          setFrictionIntensity(Math.min(1, 0.08 + 0.92 * Math.max(0, 1)))
        }}
        onKeyDown={handleKeyPress}
        placeholder="Ask a question..."
        rows={1}
        className={cn(
          'flex-1 resize-none rounded-lg md:rounded-xl border-2 border-border',
          'bg-background px-3 md:px-4 py-2 md:py-3',
          'text-sm md:text-base',
          'focus-ring',
          'transition-smooth',
          'min-h-[44px]' // iOS touch target
        )}
        aria-label="Message input"
      />

      <button
        onClick={handleSubmit}
        disabled={!currentText.trim()}
        className={cn(
          'rounded-lg md:rounded-xl px-4 md:px-6 py-2 md:py-3',
          'bg-primary text-primary-foreground',
          'hover:opacity-90 active:scale-95',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'transition-smooth focus-ring',
          'min-h-[44px] min-w-[44px]' // iOS touch target
        )}
        aria-label="Send message"
        title="Send message"
      >
        <Send className="h-5 w-5" />
      </button>
    </div>
  )
}
