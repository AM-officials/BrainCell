import { FacialExpression } from '@/types'

const ENABLE_TFJS = import.meta.env.VITE_ENABLE_TFJS === 'true'

// Lazy-loaded TFJS dependencies
let tf: typeof import('@tensorflow/tfjs') | null = null
let faceModel: unknown | null = null
let isModelLoading = false
let isModelLoaded = false

// Load TensorFlow.js and facial emotion model
export const loadFacialEmotionModel = async (): Promise<boolean> => {
  if (isModelLoaded) return true
  if (isModelLoading) {
    // Wait for ongoing load
    while (isModelLoading) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    return isModelLoaded
  }

  if (!ENABLE_TFJS) {
    console.log('TFJS disabled, using mock facial recognition')
    return false
  }

  try {
    isModelLoading = true
    console.log('Loading TensorFlow.js...')

    // Dynamically import TensorFlow.js
    tf = await import('@tensorflow/tfjs')

    console.log('Loading facial emotion recognition model...')

    // Load the prajnasb/facial-emotion-recognition-js model
    // Note: This model needs to be hosted or loaded from a CDN
    // For production, host the model files in public/models/
    try {
      // Attempt to load the model from public directory
      faceModel = await tf.loadLayersModel('/models/facial-emotion/model.json')
      console.log('Facial emotion model loaded successfully')
      isModelLoaded = true
      return true
    } catch (modelError) {
      console.warn('Could not load facial model, using mock:', modelError)
      isModelLoaded = false
      return false
    }
  } catch (error) {
    console.error('Failed to load TFJS:', error)
    return false
  } finally {
    isModelLoading = false
  }
}

// Preprocess image for model
const preprocessImage = async (
  imageElement: HTMLVideoElement | HTMLImageElement
): Promise<unknown> => {
  if (!tf) throw new Error('TensorFlow.js not loaded')

  // Convert image to tensor and preprocess
  // Model expects 48x48 grayscale image
  let tensor = tf.browser.fromPixels(imageElement)

  // Resize to 48x48
  tensor = tf.image.resizeBilinear(tensor, [48, 48])

  // Convert to grayscale (average RGB channels)
  tensor = tensor.mean(2, true)

  // Normalize to [0, 1]
  tensor = tensor.div(255.0)

  // Add batch dimension
  tensor = tensor.expandDims(0)

  return tensor
}

// Detect facial emotion from video element
export const detectFacialEmotion = async (
  videoElement: HTMLVideoElement
): Promise<FacialExpression> => {
  // Return mock if model not available
  if (!isModelLoaded || !faceModel || !tf) {
    return getMockFacialExpression()
  }

  try {
    // Preprocess video frame
    const inputTensor = await preprocessImage(videoElement)

    // Run inference
    const predictions = (faceModel as { predict: (input: unknown) => unknown }).predict(
      inputTensor
    ) as { data: () => Promise<Float32Array> }
    const predictionData = await predictions.data()

    // Model outputs probabilities for: angry, disgust, fear, happy, sad, surprise, neutral
    const emotions: FacialExpression[] = [
      'angry',
      'neutral', // disgust maps to neutral
      'fear',
      'happy',
      'sad',
      'surprise',
      'neutral',
    ]

    // Find emotion with highest probability
    let maxIdx = 0
    let maxProb = predictionData[0]

    for (let i = 1; i < predictionData.length; i++) {
      if (predictionData[i] > maxProb) {
        maxProb = predictionData[i]
        maxIdx = i
      }
    }

    // Cleanup tensor
    if ((inputTensor as { dispose?: () => void }).dispose) {
      ;(inputTensor as { dispose: () => void }).dispose()
    }

    return emotions[maxIdx]
  } catch (error) {
    console.error('Error detecting facial emotion:', error)
    return getMockFacialExpression()
  }
}

// Mock facial expression for demo/fallback
let mockExpressionIndex = 0
const mockExpressions: FacialExpression[] = [
  'neutral',
  'neutral',
  'happy',
  'neutral',
  'surprise',
  'confused' as FacialExpression, // will map to sad
  'sad',
  'neutral',
]

const getMockFacialExpression = (): FacialExpression => {
  const expression = mockExpressions[mockExpressionIndex % mockExpressions.length]
  mockExpressionIndex++

  // Map unsupported expressions
  if (expression === ('confused' as FacialExpression)) {
    return 'sad'
  }

  return expression
}

// Reset mock state (useful for demo)
export const resetMockFacialExpression = () => {
  mockExpressionIndex = 0
}

// Check if webcam is available
export const checkWebcamAvailability = async (): Promise<boolean> => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    return devices.some((device) => device.kind === 'videoinput')
  } catch {
    return false
  }
}

// Request webcam permission and get stream
export const requestWebcamAccess = async (): Promise<MediaStream | null> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: 'user',
      },
    })
    return stream
  } catch (error) {
    console.error('Webcam access denied:', error)
    return null
  }
}

// Stop webcam stream
export const stopWebcamStream = (stream: MediaStream | null) => {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop())
  }
}
