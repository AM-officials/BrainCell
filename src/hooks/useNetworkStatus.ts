/**
 * BrainCell v1.2 - Network Status Hook
 * Detects online/offline state and network quality
 */

import { useEffect, useState } from 'react'

export interface NetworkStatus {
  isOnline: boolean
  effectiveType: string | null // '4g', '3g', '2g', 'slow-2g'
  downlink: number | null // Mbps
  rtt: number | null // Round trip time in ms
  saveData: boolean
}

export const useNetworkStatus = () => {
  const [status, setStatus] = useState<NetworkStatus>(() => ({
    isOnline: navigator.onLine,
    effectiveType: null,
    downlink: null,
    rtt: null,
    saveData: false,
  }))

  useEffect(() => {
    const updateNetworkStatus = () => {
      const connection = (navigator as any).connection || 
                        (navigator as any).mozConnection || 
                        (navigator as any).webkitConnection

      setStatus({
        isOnline: navigator.onLine,
        effectiveType: connection?.effectiveType || null,
        downlink: connection?.downlink || null,
        rtt: connection?.rtt || null,
        saveData: connection?.saveData || false,
      })
    }

    // Initial check
    updateNetworkStatus()

    // Listen for online/offline events
    window.addEventListener('online', updateNetworkStatus)
    window.addEventListener('offline', updateNetworkStatus)

    // Listen for connection changes
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection

    if (connection) {
      connection.addEventListener('change', updateNetworkStatus)
    }

    return () => {
      window.removeEventListener('online', updateNetworkStatus)
      window.removeEventListener('offline', updateNetworkStatus)
      if (connection) {
        connection.removeEventListener('change', updateNetworkStatus)
      }
    }
  }, [])

  return status
}

export const isSlowConnection = (status: NetworkStatus): boolean => {
  return (
    !status.isOnline ||
    status.effectiveType === '2g' ||
    status.effectiveType === 'slow-2g' ||
    (status.downlink !== null && status.downlink < 0.5)
  )
}

export const shouldUseTextOnlyMode = (status: NetworkStatus): boolean => {
  return (
    !status.isOnline ||
    status.effectiveType === '2g' ||
    status.effectiveType === 'slow-2g'
  )
}
