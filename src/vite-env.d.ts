/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_DEMO_MODE: string
  readonly VITE_USE_MOCK: string
  readonly VITE_ENABLE_TFJS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
