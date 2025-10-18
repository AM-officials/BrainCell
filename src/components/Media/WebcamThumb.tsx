import { useState, useRef, useEffect } from 'react'
import { Camera, CameraOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WebcamThumbProps {
  onSnapshot?: (imageDataUrl: string) => void
}

export const WebcamThumb: React.FC<WebcamThumbProps> = ({ onSnapshot }) => {
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
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true })
        setStream(mediaStream)
        setEnabled(true)
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
        }
      } catch (error) {
        console.error('Webcam access denied:', error)
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

  return (
    <div className="space-y-2">
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
            className="w-full h-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}
    </div>
  )
}
