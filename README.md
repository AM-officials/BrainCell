# BrainCell Learning Platform

![BrainCell Banner](https://img.shields.io/badge/BrainCell-v1.3-blue)
![React](https://img.shields.io/badge/React-18.3-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)
![License](https://img.shields.io/badge/license-MIT-green)

**BrainCell personalizes how you learn — in real-time.**

An AI-powered adaptive learning platform that detects your cognitive state in real-time using multimodal inputs (text friction, facial expressions, vocal patterns) and adapts content delivery for optimal learning.

## ✨ Features

- **Real-time Cognitive Detection** - Monitors your learning state (Focused/Confused/Frustrated)
- **Adaptive Content Delivery** - Switches between text, diagrams, and interactive code based on your state
- **Text Friction Tracking** - Detects confusion through backspaces and rephrases
- **Facial Emotion Recognition** - Optional webcam-based emotion detection (TensorFlow.js)
- **Voice Analysis** - Microphone integration for vocal state detection
- **Interactive Code Playground** - Run JavaScript code snippets safely in-browser
- **Knowledge Graph Visualization** - See your learning path with react-flow
- **Mermaid Diagrams** - Dynamic diagram rendering for complex concepts
- **Demo Mode** - Fully automated 2-minute golden path demonstration
- **Light/Dark Theme** - System-aware theme with manual toggle
- **Responsive Design** - Mobile-first, works on all screen sizes

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone or extract the repository**

```bash
cd "BrainCell Syndicate"
```

2. **Install frontend dependencies**

```bash
npm install
```

3. **Install backend dependencies**

```bash
cd braincell_backend
python -m venv .venv
.venv\Scripts\activate  # On macOS/Linux: source .venv/bin/activate
python -m pip install -r requirements.txt
cd ..
```

4. **Set up environment variables**

```bash
cp .env.example .env
cp braincell_backend/.env.example braincell_backend/.env
```

5. **Start frontend development server**

```bash
npm run dev
```

6. **Start backend development server**

```bash
cd braincell_backend
python -m app  # or: uvicorn app.main:app --reload
```

7. **Open your browser**

Navigate to `http://localhost:5173`

## 📖 Usage

### Development Mode

```bash
npm run dev          # Start frontend dev server with hot reload
npm run build        # Build frontend for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run test         # Run frontend tests with Vitest
```

### Backend Mode

```bash
cd braincell_backend
python -m app             # Start FastAPI with auto-reload (dev)
uvicorn app.main:app      # Run server without reload
make install              # Install backend dependencies
make dev                  # Equivalent to uvicorn --reload
make test                 # Run pytest suite
make lint                 # Run Ruff lint checks
```

### Demo Mode

By default, the app runs in **demo mode** with mocked API responses. This allows you to experience the full golden path without a backend.

To toggle demo mode, edit `.env`:

```env
VITE_DEMO_MODE=true    # Enable demo mode
VITE_USE_MOCK=true     # Use mock API responses
```

### Connecting to Real API

1. Start the FastAPI server (see **Backend Mode**) and note the base URL (default `http://localhost:8000`).

2. Set your backend API URL in `.env`:

```env
VITE_API_URL=https://your-api.com
VITE_USE_MOCK=false
VITE_DEMO_MODE=false
```

3. The FastAPI backend in `braincell_backend/` implements the `/api/v1/session/analyze` endpoint with the following contract:

**Request:**
```json
{
  "sessionId": "string",
  "queryText": "string",
  "text_friction": {
    "rephraseCount": 0,
    "backspaceCount": 0
  },
  "audioBlob": "string|null",
  "facial_expression": "neutral|happy|sad|angry|fear|surprise",
  "meta": {
    "timestamp": "2025-10-15T10:30:00Z"
  }
}
```

**Response:**
```json
{
  "responseType": "text|diagram|code",
  "content": "string",
  "cognitiveState": "FOCUSED|CONFUSED|FRUSTRATED",
  "knowledgeGraphDelta": {
    "nodes": [...],
    "edges": [...]
  }
}
```

## 🧪 Running Tests

```bash
npm run test        # Run tests once
npm run test:ui     # Run tests with UI
```

## 🎯 Golden Path Demo

The demo mode simulates a complete 2-minute learning session:

1. **Session Start** - Select "Recurrent Neural Networks" topic
2. **Focused State** - Ask a simple question, receive clear text answer
3. **Confusion Detection** - Simulate confusion with backspaces/rephrases → Get Mermaid diagram
4. **Frustration Detection** - Higher friction detected → Get interactive code playground
5. **Session Summary** - End session to see summary with mastered concepts

## 🛠️ Technology Stack

### Core
- **React 18.3** - UI framework
- **TypeScript 5.5** - Type safety
- **Vite** - Build tool & dev server

### State & Data
- **Zustand** - Global state management
- **Axios** - HTTP client with interceptors

### UI & Styling
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Icon library
- **Custom CSS** - Design tokens & animations

### AI & Learning
- **TensorFlow.js** - Facial emotion recognition
- **RecordRTC** - Audio recording
- **Mermaid** - Diagram rendering
- **React Flow** - Knowledge graph visualization

### Code Features
- **Monaco Editor** (lazy-loaded) - Code editing
- **Custom Sandbox** - Safe JavaScript execution

## 📁 Project Structure

```
braincell-learning-platform/
├── src/
│   ├── components/
│   │   ├── Layout/          # Main layout components
│   │   │   └── Cockpit.tsx  # 3-panel learning interface
│   │   ├── Chat/            # Chat interface
│   │   │   ├── ChatPanel.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   └── InputBar.tsx
│   │   ├── Cognitive/       # Cognitive monitoring
│   │   │   └── CognitiveMonitor.tsx
│   │   ├── Graph/           # Knowledge graph
│   │   │   └── KnowledgeGraph.tsx
│   │   ├── UI/              # Reusable UI components
│   │   │   ├── StateBadge.tsx
│   │   │   ├── TopicSelect.tsx
│   │   │   ├── ThemeToggle.tsx
│   │   │   └── Toasts.tsx
│   │   ├── Media/           # Webcam & mic
│   │   │   └── WebcamThumb.tsx
│   │   ├── Diagrams/        # Mermaid diagrams
│   │   │   └── MermaidBlock.tsx
│   │   └── Playground/      # Code execution
│   │       └── CodePlayground.tsx
│   ├── lib/
│   │   ├── api.ts           # API client with mock support
│   │   ├── state.ts         # Zustand stores
│   │   ├── utils.ts         # Utility functions
│   │   └── tfjs/
│   │       └── facial.ts    # TensorFlow.js integration
│   ├── hooks/
│   │   └── useTextFriction.ts  # Text friction tracking
│   ├── mock/
│   │   └── demoResponses.ts    # Golden path responses
│   ├── types/
│   │   └── index.ts         # TypeScript definitions
│   ├── styles/
│   │   └── global.css       # Global styles & tokens
│   ├── App.tsx              # Root component
│   └── main.tsx             # Entry point
├── braincell_backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   └── session.py   # /api/v1/session/analyze endpoint
│   │   │   └── schemas.py       # Shared Pydantic models
│   │   ├── cognitive_modules/
│   │   │   └── voice_analyzer.py
│   │   ├── utils/
│   │   │   ├── prompt_crafter.py
│   │   │   └── typing.py
│   │   ├── config.py            # Settings loader
│   │   ├── main.py              # FastAPI application factory
│   │   └── orchestrator.py      # Cognitive fusion logic (WIP)
│   ├── requirements.txt         # Backend dependencies
│   ├── Makefile                 # Backend dev commands
│   ├── pyproject.toml           # Tooling configuration
│   └── tests/                   # Backend tests
├── public/                      # Static assets
├── .env.example                 # Frontend environment template
├── package.json                 # Frontend dependencies
├── vite.config.ts               # Vite configuration
├── tailwind.config.js           # Tailwind configuration
├── tsconfig.json                # TypeScript configuration
└── README.md                    # This file
```

## 🎨 Customization

### Design Tokens

Edit `src/styles/global.css` to customize colors, spacing, and animations. See `DESIGN_TOKEN.md` for the complete token reference.

### Mock Responses

Edit `src/mock/demoResponses.ts` to customize the demo flow and responses.

### Topics

Add or modify learning topics in `src/mock/demoResponses.ts`:

```typescript
export const DEMO_TOPICS = [
  'Your Custom Topic',
  // ... more topics
]
```

## 🚢 Deployment

See `VERCEL.md` for detailed Vercel deployment instructions.

### Quick Deploy to Vercel

1. Push your code to GitHub
2. Import project in Vercel dashboard
3. Set environment variables
4. Deploy!

## 🐛 Troubleshooting

### TypeScript Errors

All TypeScript errors shown are normal during development without `node_modules`. Run `npm install` to resolve.

### Webcam Not Working

- Check browser permissions
- Ensure HTTPS in production (required for webcam access)
- Set `VITE_ENABLE_TFJS=false` to disable facial recognition

### Build Errors

```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 📊 Performance

- Lazy loading for heavy libraries (TFJS, Monaco, Mermaid)
- Code splitting by vendor chunks
- Optimized bundle size < 500KB (gzipped)
- Tree shaking enabled
- Lighthouse score: 90+ (Performance)

## ♿ Accessibility

- ARIA labels on all interactive elements
- Keyboard navigation support
- Focus states on all inputs
- WCAG 2.1 AA compliant color contrast
- Screen reader tested

## 📜 License

MIT License - feel free to use this project for learning or commercial purposes.

## 🤝 Contributing

Contributions welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 💬 Support

For questions or issues:
- Open a GitHub issue
- Check the `DEMO_TICKLIST.md` for feature walkthrough
- Review `DESIGN_TOKEN.md` for styling reference

## 🎓 Credits

Built with ❤️ for adaptive learning.

Powered by:
- React & TypeScript
- TensorFlow.js
- Vite
- Tailwind CSS
- And many amazing open-source libraries

---

**BrainCell v1.3** | Built for hackathon excellence 🏆
