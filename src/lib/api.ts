import axios, { AxiosInstance, AxiosError } from 'axios'
import { AnalyzeRequest, AnalyzeResponse } from '@/types'
import { getDemoResponse } from '@/mock/demoResponses'
import { useToastStore } from '@/lib/state'

// Environment configuration
const API_URL = import.meta.env.VITE_API_URL || ''
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'
const ALLOW_FALLBACK = import.meta.env.VITE_ALLOW_FALLBACK === 'true'

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add timestamp to all requests
    if (config.data) {
      config.data.meta = {
        ...config.data.meta,
        timestamp: new Date().toISOString(),
      }
    }
    return config
  },
  (error: AxiosError) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  (error: AxiosError) => {
    const message = error.response?.data
      ? (error.response.data as { message?: string }).message || 'Network error occurred'
      : 'Unable to reach server'

    useToastStore.getState().addToast({
      type: 'error',
      message,
      duration: 5000,
    })

    console.error('Response error:', error)
    return Promise.reject(error)
  }
)

// Mock delay for realistic feel
const mockDelay = (ms: number = 800) =>
  new Promise((resolve) => setTimeout(resolve, ms))

// Demo state tracking for deterministic responses
let demoStepIndex = 0

export const resetDemoState = () => {
  demoStepIndex = 0
}

export const incrementDemoStep = () => {
  demoStepIndex++
}

// Main API function
export const analyzeSession = async (
  request: AnalyzeRequest
): Promise<AnalyzeResponse> => {
  // Use mock mode only if explicitly enabled
  if (USE_MOCK) {
    await mockDelay(600 + Math.random() * 400) // 600-1000ms realistic delay
    
    if (DEMO_MODE) {
      const response = getDemoResponse(demoStepIndex, request)
      demoStepIndex++
      return response
    }
    
    // Default mock response
    return getMockResponse(request)
  }

  // Real API call
  try {
    const response = await apiClient.post<AnalyzeResponse>(
      '/api/v1/session/analyze',
      request
    )
    return response.data
  } catch (error) {
    console.error('API call failed:', error)
    if (ALLOW_FALLBACK) {
      // Optional fallback if explicitly allowed
      await mockDelay(400)
      return getMockResponse(request)
    }
    // Surface the error to the UI so user knows real API failed
    throw error
  }
}

// Default mock response generator
const getMockResponse = (request: AnalyzeRequest): AnalyzeResponse => {
  const { text_friction, queryText } = request
  const query = queryText.toLowerCase()

  // Determine cognitive state based on inputs
  let cognitiveState: 'FOCUSED' | 'CONFUSED' | 'FRUSTRATED' = 'FOCUSED'
  let responseType: 'text' | 'diagram' | 'code' = 'text'
  
  // Generate contextual content based on the question
  let content = generateContextualResponse(query)

  // High friction or negative emotions indicate confusion
  if (
    text_friction.rephraseCount > 2 ||
    text_friction.backspaceCount > 5
  ) {
    cognitiveState = 'CONFUSED'
    responseType = 'diagram'
    content = generateDiagram(query)
  }

  // Very high friction indicates frustration
  if (
    text_friction.rephraseCount > 4 ||
    text_friction.backspaceCount > 10
  ) {
    cognitiveState = 'FRUSTRATED'
    responseType = 'code'
    content = generateCodeExample(query)
  }

  // Extract concept from query text
  const words = queryText.split(' ').filter(w => w.length > 3)
  const conceptLabel = words.slice(0, 2).join(' ') || 'Concept'

  return {
    responseType,
    content,
    cognitiveState,
    knowledgeGraphDelta: {
      nodes: [
        {
          id: `node_${Date.now()}`,
          type: 'concept',
          label: conceptLabel,
          mastered: cognitiveState === 'FOCUSED',
          data: {
            description: `Learning about: ${conceptLabel}`,
            timestamp: new Date().toISOString(),
          },
        },
      ],
      edges: [],
    },
  }
}

// Generate contextual text responses
function generateContextualResponse(query: string): string {
  const responses: Record<string, string> = {
    'ram': `**RAM (Random Access Memory)** is your computer's short-term memory. Here's what you need to know:

**What it does:**
- Stores data that your CPU needs RIGHT NOW
- Provides ultra-fast access to running programs
- Gets cleared when you turn off your computer

**Key characteristics:**
- **Volatile**: Loses data without power
- **Fast**: Nanosecond access times
- **Temporary**: Only for active processes

**Types of RAM:**
- **DDR4**: Common in modern computers (2400-3200 MHz)
- **DDR5**: Newest generation (faster, more efficient)
- **Size**: Typically 8GB, 16GB, or 32GB

**Why it matters:**
More RAM = More programs running smoothly at once!

**Next steps:** Would you like to know about how RAM differs from storage, or how much RAM you need?`,

    'neural network': `**Neural Networks** are computing systems inspired by the human brain! 

**Core concept:**
- Network of artificial "neurons" that learn from data
- Each connection has a "weight" that gets adjusted during training
- Can recognize patterns humans might miss

**How they work:**
1. **Input Layer**: Receives raw data
2. **Hidden Layers**: Process and transform data
3. **Output Layer**: Makes predictions

**Training process:**
- Feed it examples (like cat images)
- Network adjusts weights to improve
- Eventually learns to recognize new cats!

**Popular uses:**
- Image recognition (face unlock)
- Voice assistants (Siri, Alexa)
- Recommendation systems (Netflix)
- Self-driving cars

**Key insight:** The "learning" happens by adjusting millions of weights through backpropagation!`,

    'machine learning': `**Machine Learning** is teaching computers to learn from experience without explicit programming.

**Three main types:**

**1. Supervised Learning**
- Train on labeled examples
- Learn to predict outcomes
- Example: Email spam detection

**2. Unsupervised Learning**
- Find patterns in unlabeled data
- Group similar items
- Example: Customer segmentation

**3. Reinforcement Learning**
- Learn through trial and error
- Get rewards for good actions
- Example: Game-playing AI

**The workflow:**
1. Collect training data
2. Choose an algorithm
3. Train the model
4. Test accuracy
5. Deploy and improve

**Real-world impact:**
- Medical diagnosis
- Financial fraud detection
- Personalized recommendations
- Autonomous vehicles`,

    'python': `**Python** is a powerful, beginner-friendly programming language loved by developers worldwide!

**Why Python is popular:**
- **Readable**: Looks almost like English
- **Versatile**: Web, data science, AI, automation
- **Huge ecosystem**: 300,000+ packages available
- **Great for beginners**: Gentle learning curve

**Key features:**
- Interpreted (no compilation needed)
- Dynamically typed (flexible variables)
- Object-oriented and functional
- Extensive standard library

**Common uses:**
- Web development (Django, Flask)
- Data analysis (Pandas, NumPy)
- Machine learning (TensorFlow, PyTorch)
- Automation scripts
- Scientific computing

**Your first Python program:**
\`\`\`python
print("Hello, World!")
\`\`\`

**Career opportunities:**
- Data Scientist
- ML Engineer
- Backend Developer
- DevOps Engineer`,
  }

  // Find matching response
  for (const [keyword, response] of Object.entries(responses)) {
    if (query.includes(keyword)) {
      return response
    }
  }

  // Default response for unknown queries
  return `Great question! Let me help you understand this concept better.

**Key points to consider:**
1. Break down the concept into smaller parts
2. Look for real-world examples
3. Practice with hands-on exercises

**Understanding "${query}":**
This is an important topic that builds on fundamental concepts. The key is to start with the basics and gradually work your way up to more complex aspects.

**Suggested approach:**
- Start with definitions and core concepts
- Look for visual representations
- Try practical examples
- Connect it to what you already know

Would you like me to explain a specific aspect in more detail, or would you prefer to see a diagram or code example?`
}

// Generate Mermaid diagrams for confused state
function generateDiagram(query: string): string {
  if (query.includes('ram') || query.includes('memory')) {
    return `graph TB
    A[RAM - Random Access Memory] --> B[Volatile Storage]
    A --> C[Fast Access]
    A --> D[Temporary Data]
    B --> E[Loses data when power off]
    C --> F[Nanosecond speed]
    D --> G[Running programs]
    D --> H[Active files]
    
    style A fill:#4f46e5,color:#fff
    style B fill:#ef4444,color:#fff
    style C fill:#10b981,color:#fff`
  }

  if (query.includes('neural') || query.includes('network')) {
    return `graph LR
    A[Input Layer] --> B[Hidden Layer 1]
    B --> C[Hidden Layer 2]
    C --> D[Output Layer]
    
    B --> E[Neurons]
    B --> F[Weights]
    B --> G[Activation]
    
    style A fill:#3b82f6,color:#fff
    style D fill:#10b981,color:#fff
    style E fill:#8b5cf6,color:#fff`
  }

  return `graph TD
    A[Main Concept] --> B[Sub-concept 1]
    A --> C[Sub-concept 2]
    B --> D[Detail A]
    B --> E[Detail B]
    C --> F[Detail C]
    
    style A fill:#4f46e5,color:#fff`
}

// Generate code examples for frustrated state
function generateCodeExample(query: string): string {
  if (query.includes('python')) {
    return `# Let's start with a simple Python example!

# Variables and data types
name = "BrainCell Learner"
age = 25
is_learning = True

# Print information
print(f"Hello, {name}!")
print(f"Age: {age}")
print(f"Currently learning: {is_learning}")

# Simple function
def greet(person):
    return f"Welcome, {person}!"

# Call the function
message = greet(name)
print(message)

# Try modifying the variables and run again!`
  }

  if (query.includes('loop') || query.includes('iteration')) {
    return `# Understanding loops with practical examples

# For loop - iterate through a list
fruits = ['apple', 'banana', 'cherry']
for fruit in fruits:
    print(f"I like {fruit}")

# While loop - repeat until condition
count = 0
while count < 5:
    print(f"Count: {count}")
    count += 1

# List comprehension - elegant Python way
squares = [x**2 for x in range(10)]
print(squares)

# Try changing the range or condition!`
  }

  return `// Let's practice with a hands-on example!

function demonstrate() {
    console.log('Starting demonstration...')
    
    // Your code here
    const result = 'Learning by doing!'
    
    console.log(result)
    return result
}

// Run the function
demonstrate()

// Try modifying the code above and see what happens!`
}

// Health check endpoint
export const healthCheck = async (): Promise<boolean> => {
  if (USE_MOCK || !API_URL) {
    return true
  }

  try {
    await apiClient.get('/health')
    return true
  } catch {
    return false
  }
}
