/**
 * BrainCell v1.2 - Offline Storage
 * IndexedDB wrapper for storing lesson content, analytics, and offline sessions
 */

const DB_NAME = 'braincell-offline'
const DB_VERSION = 1

interface LessonBundle {
  topic: string
  content: any
  timestamp: number
  size: number
}

interface OfflineSession {
  sessionId: string
  topic: string
  transcripts: any[]
  metrics: any
  timestamp: number
  synced: boolean
}

class OfflineStorage {
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Store for downloaded lesson content
        if (!db.objectStoreNames.contains('lessons')) {
          const lessonStore = db.createObjectStore('lessons', { keyPath: 'topic' })
          lessonStore.createIndex('timestamp', 'timestamp', { unique: false })
        }

        // Store for offline sessions (to sync later)
        if (!db.objectStoreNames.contains('sessions')) {
          const sessionStore = db.createObjectStore('sessions', { keyPath: 'sessionId' })
          sessionStore.createIndex('synced', 'synced', { unique: false })
          sessionStore.createIndex('timestamp', 'timestamp', { unique: false })
        }

        // Store for user preferences
        if (!db.objectStoreNames.contains('preferences')) {
          db.createObjectStore('preferences', { keyPath: 'key' })
        }
      }
    })
  }

  async saveLesson(topic: string, content: any): Promise<void> {
    if (!this.db) await this.init()

    const bundle: LessonBundle = {
      topic,
      content,
      timestamp: Date.now(),
      size: JSON.stringify(content).length,
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['lessons'], 'readwrite')
      const store = transaction.objectStore('lessons')
      const request = store.put(bundle)

      request.onsuccess = () => {
        console.log(`✓ Saved lesson for topic: ${topic} (${(bundle.size / 1024).toFixed(2)} KB)`)
        resolve()
      }
      request.onerror = () => reject(request.error)
    })
  }

  async getLesson(topic: string): Promise<any | null> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['lessons'], 'readonly')
      const store = transaction.objectStore('lessons')
      const request = store.get(topic)

      request.onsuccess = () => {
        const result = request.result as LessonBundle | undefined
        if (result) {
          console.log(`✓ Retrieved lesson from cache: ${topic}`)
          resolve(result.content)
        } else {
          resolve(null)
        }
      }
      request.onerror = () => reject(request.error)
    })
  }

  async getAllLessons(): Promise<LessonBundle[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['lessons'], 'readonly')
      const store = transaction.objectStore('lessons')
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async saveOfflineSession(session: OfflineSession): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sessions'], 'readwrite')
      const store = transaction.objectStore('sessions')
      const request = store.put(session)

      request.onsuccess = () => {
        console.log(`✓ Saved offline session: ${session.sessionId}`)
        resolve()
      }
      request.onerror = () => reject(request.error)
    })
  }

  async getUnsyncedSessions(): Promise<OfflineSession[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sessions'], 'readonly')
      const store = transaction.objectStore('sessions')
      const index = store.index('synced')
      const request = index.openCursor(IDBKeyRange.only(false))
      const results: OfflineSession[] = []

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result
        if (cursor) {
          results.push(cursor.value)
          cursor.continue()
        } else {
          resolve(results)
        }
      }
      request.onerror = () => reject(request.error)
    })
  }

  async markSessionSynced(sessionId: string): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sessions'], 'readwrite')
      const store = transaction.objectStore('sessions')
      const getRequest = store.get(sessionId)

      getRequest.onsuccess = () => {
        const session = getRequest.result
        if (session) {
          session.synced = true
          store.put(session)
          console.log(`✓ Marked session as synced: ${sessionId}`)
          resolve()
        } else {
          reject(new Error('Session not found'))
        }
      }
      getRequest.onerror = () => reject(getRequest.error)
    })
  }

  async getStorageSize(): Promise<number> {
    if (!this.db) await this.init()

    const lessons = await this.getAllLessons()
    const totalSize = lessons.reduce((sum, lesson) => sum + lesson.size, 0)
    return totalSize
  }

  async clearOldLessons(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    if (!this.db) await this.init()

    const cutoff = Date.now() - maxAge

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['lessons'], 'readwrite')
      const store = transaction.objectStore('lessons')
      const index = store.index('timestamp')
      const request = index.openCursor()

      let deletedCount = 0

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          if (cursor.value.timestamp < cutoff) {
            cursor.delete()
            deletedCount++
          }
          cursor.continue()
        } else {
          console.log(`✓ Cleared ${deletedCount} old lessons`)
          resolve()
        }
      }
      request.onerror = () => reject(request.error)
    })
  }
}

export const offlineStorage = new OfflineStorage()
