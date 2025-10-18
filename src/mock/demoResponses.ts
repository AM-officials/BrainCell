import { AnalyzeRequest, AnalyzeResponse } from '@/types'

// Golden Path Demo Responses - Deterministic for 2-minute demo
// Step 0: Initial session start
// Step 1: Simple question - FOCUSED response
// Step 2: Confused question with friction - CONFUSED + diagram
// Step 3: Frustrated state - FRUSTRATED + code
// Step 4: Summary request

export const getDemoResponse = (
  stepIndex: number,
  _request: AnalyzeRequest
): AnalyzeResponse => {
  const demoSteps: AnalyzeResponse[] = [
    // Step 0: Welcome message
    {
      responseType: 'text',
      content:
        "Welcome to BrainCell! I'm excited to help you learn about Recurrent Neural Networks. Let's start with the fundamentals. What would you like to know first?",
      cognitiveState: 'FOCUSED',
      knowledgeGraphDelta: {
        nodes: [
          {
            id: 'node_rnn_root',
            type: 'concept',
            label: 'Recurrent Neural Networks',
            mastered: false,
            position: { x: 250, y: 50 },
            data: {
              description: 'Root topic for RNN learning path',
              timestamp: new Date().toISOString(),
            },
          },
        ],
        edges: [],
      },
    },

    // Step 1: Clear focused answer
    {
      responseType: 'text',
      content:
        "Great question! Recurrent Neural Networks (RNNs) are a class of neural networks designed to work with sequential data. Unlike traditional feedforward networks, RNNs have connections that loop back, allowing them to maintain a 'memory' of previous inputs. This makes them perfect for tasks like language modeling, time series prediction, and speech recognition. The key innovation is the hidden state that gets passed from one time step to the next.",
      cognitiveState: 'FOCUSED',
      knowledgeGraphDelta: {
        nodes: [
          {
            id: 'node_rnn_basics',
            type: 'concept',
            label: 'RNN Basics',
            mastered: false,
            position: { x: 150, y: 150 },
            data: { description: 'Sequential data processing' },
          },
          {
            id: 'node_hidden_state',
            type: 'concept',
            label: 'Hidden State',
            mastered: false,
            position: { x: 350, y: 150 },
            data: { description: 'Memory mechanism' },
          },
        ],
        edges: [
          {
            id: 'edge_1',
            source: 'node_rnn_root',
            target: 'node_rnn_basics',
            label: 'consists of',
          },
          {
            id: 'edge_2',
            source: 'node_rnn_root',
            target: 'node_hidden_state',
            label: 'uses',
          },
        ],
      },
    },

    // Step 2: Confusion detected - diagram response
    {
      responseType: 'diagram',
      content: `graph LR
    A[Input x_t] --> B[RNN Cell]
    C[Previous State h_t-1] --> B
    B --> D[Output y_t]
    B --> E[New State h_t]
    E -->|loops back| B
    
    style B fill:#4f46e5,stroke:#333,stroke-width:2px,color:#fff
    style E fill:#10b981,stroke:#333,stroke-width:2px,color:#fff
    style D fill:#f59e0b,stroke:#333,stroke-width:2px`,
      cognitiveState: 'CONFUSED',
      knowledgeGraphDelta: {
        nodes: [
          {
            id: 'node_backprop',
            type: 'concept',
            label: 'Backpropagation Through Time',
            mastered: false,
            position: { x: 250, y: 250 },
            data: { description: 'Training mechanism for RNNs' },
          },
        ],
        edges: [
          {
            id: 'edge_3',
            source: 'node_rnn_basics',
            target: 'node_backprop',
            label: 'trained with',
          },
        ],
      },
    },

    // Step 3: Frustration detected - interactive code
    {
      responseType: 'code',
      content: `// Let's build a simple RNN cell in JavaScript!
// This demonstrates the core concept

class SimpleRNNCell {
  constructor() {
    this.hiddenState = 0;
  }
  
  forward(input) {
    // Update hidden state: new = old * 0.5 + input * 0.5
    this.hiddenState = this.hiddenState * 0.5 + input * 0.5;
    
    // Output is the hidden state
    const output = this.hiddenState;
    
    console.log(\`Input: \${input}, Hidden: \${this.hiddenState.toFixed(2)}, Output: \${output.toFixed(2)}\`);
    
    return output;
  }
}

// Try it out!
const rnn = new SimpleRNNCell();
rnn.forward(1.0);  // First input
rnn.forward(0.5);  // Second input - notice memory effect
rnn.forward(0.8);  // Third input

console.log('Notice how the hidden state "remembers" previous inputs!');`,
      cognitiveState: 'FRUSTRATED',
      knowledgeGraphDelta: {
        nodes: [
          {
            id: 'node_lstm',
            type: 'concept',
            label: 'LSTM Networks',
            mastered: false,
            position: { x: 150, y: 350 },
            data: { description: 'Advanced RNN variant' },
          },
          {
            id: 'node_gru',
            type: 'concept',
            label: 'GRU Networks',
            mastered: false,
            position: { x: 350, y: 350 },
            data: { description: 'Simplified LSTM' },
          },
        ],
        edges: [
          {
            id: 'edge_4',
            source: 'node_rnn_basics',
            target: 'node_lstm',
            label: 'improves to',
          },
          {
            id: 'edge_5',
            source: 'node_rnn_basics',
            target: 'node_gru',
            label: 'simplifies to',
          },
        ],
      },
    },

    // Step 4: Summary response
    {
      responseType: 'text',
      content: `## Session Summary

Excellent work! Here's what we covered today:

### ✅ Mastered Concepts
- **Recurrent Neural Networks**: You understand the core architecture and purpose
- **Sequential Processing**: You can explain how RNNs handle time-series data
- **Hidden State Memory**: You grasp the memory mechanism

### 🎯 Key Takeaways
1. RNNs process sequences by maintaining hidden state
2. The looping connection enables memory of past inputs
3. Backpropagation Through Time (BPTT) is used for training
4. LSTM and GRU are improved variants that solve vanishing gradients

### 📈 Your Learning Journey
- Started: Focused and engaged
- Encountered: Confusion with temporal dynamics (diagram helped!)
- Overcame: Frustration with abstraction (hands-on code worked!)
- **Final State**: Strong conceptual understanding ✨

Keep practicing with the code examples. Next session, we can dive into LSTM gates!`,
      cognitiveState: 'FOCUSED',
      knowledgeGraphDelta: {
        nodes: [
          {
            id: 'node_summary',
            type: 'mastered',
            label: 'Session Complete',
            mastered: true,
            position: { x: 250, y: 450 },
          },
        ],
        edges: [
          {
            id: 'edge_summary_1',
            source: 'node_rnn_basics',
            target: 'node_summary',
          },
          {
            id: 'edge_summary_2',
            source: 'node_hidden_state',
            target: 'node_summary',
          },
        ],
      },
    },
  ]

  // Return appropriate step or fallback
  if (stepIndex < demoSteps.length) {
    return demoSteps[stepIndex]
  }

  // Fallback for additional interactions
  return {
    responseType: 'text',
    content:
      "That's a great follow-up question! In demo mode, I've covered the main concepts. Try switching to live mode to explore further!",
    cognitiveState: 'FOCUSED',
    knowledgeGraphDelta: {
      nodes: [],
      edges: [],
    },
  }
}

// Pre-defined topics for topic selector
export const DEMO_TOPICS = [
  'Recurrent Neural Networks',
  'Convolutional Neural Networks',
  'Transformer Architecture',
  'Reinforcement Learning',
  'Gradient Descent Algorithms',
  'Neural Network Optimization',
  'Backpropagation',
  'Activation Functions',
]
