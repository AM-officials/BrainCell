import { useState, useRef, useEffect } from 'react'
import { Camera, CameraOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WebcamThumbProps {
  onSnapshot?: (imageDataUrl: string) => void
  onPermissionChange?: (state: 'granted' | 'denied' | 'prompt') => void
  className?: string
}

export const WebcamThumb: React.FC<WebcamThumbProps> = ({ onSnapshot, onPermissionChange, className }) => {
  const [enabled, setEnabled] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const toggleWebcam = async () => {
    if (enabled && stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
      setEnabled(false)
    } else {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        })
        setStream(mediaStream)
        setEnabled(true)
        // Permission granted
        onPermissionChange?.('granted')
      } catch (error) {
        console.error('Webcam access denied:', error)
        onPermissionChange?.('denied')
      }
    }
  }

  const captureSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
      onSnapshot?.(dataUrl)
    }
  }

  useEffect(() => {
    if (enabled && videoRef.current) {
      // Auto-capture snapshot every 3 seconds
      const interval = setInterval(captureSnapshot, 3000)
      return () => clearInterval(interval)
    }
  }, [enabled])

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [stream])

  // Attach stream to video element after it exists in the DOM
  useEffect(() => {
    const video = videoRef.current
    if (!video || !stream) return

    video.srcObject = stream
    video.muted = true
    video.playsInline = true

    const tryPlay = () => {
      video.play().catch((e) => {
        // Autoplay can be blocked; will resume on next user gesture
        console.warn('Video autoplay prevented; will retry on user gesture', e)
      })
    }

    if (video.readyState >= 2) {
      // Have enough data to play
      tryPlay()
    } else {
      const handler = () => {
        tryPlay()
      }
      video.addEventListener('loadedmetadata', handler, { once: true })
      return () => video.removeEventListener('loadedmetadata', handler)
    }
  }, [stream])

  return (
    <div className={cn("space-y-2", className)}>
      <button
        onClick={toggleWebcam}
        className={cn(
          'w-full rounded-xl p-3 flex items-center justify-center gap-2',
          enabled ? 'bg-primary text-primary-foreground' : 'bg-muted',
          'hover:opacity-90 transition-smooth focus-ring'
        )}
      >
        {enabled ? <Camera className="h-5 w-5" /> : <CameraOff className="h-5 w-5" />}
        <span className="text-sm font-medium">
          {enabled ? 'Webcam Active' : 'Enable Webcam'}
        </span>
      </button>

      {enabled && (
        <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            controls={false}
            className="w-full h-full object-cover bg-black [visibility:visible]"
          />
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}
    </div>
  )
}
