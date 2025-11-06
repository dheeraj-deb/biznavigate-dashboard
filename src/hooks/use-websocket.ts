import { useEffect, useRef, useState } from 'react'
import { useAuthStore } from '@/store/auth-store'

interface UseWebSocketOptions {
  onMessage?: (data: any) => void
  onOpen?: () => void
  onClose?: () => void
  onError?: (error: Event) => void
  autoReconnect?: boolean
  reconnectInterval?: number
}

export function useWebSocket(url: string, options: UseWebSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<any>(null)
  const ws = useRef<WebSocket | null>(null)
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null)
  const token = useAuthStore((state) => state.token)

  const {
    onMessage,
    onOpen,
    onClose,
    onError,
    autoReconnect = true,
    reconnectInterval = 5000,
  } = options

  const connect = () => {
    try {
      const wsUrl = token ? `${url}?token=${token}` : url
      ws.current = new WebSocket(wsUrl)

      ws.current.onopen = () => {
        console.log('WebSocket connected')
        setIsConnected(true)
        onOpen?.()
      }

      ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data)
        setLastMessage(data)
        onMessage?.(data)
      }

      ws.current.onclose = () => {
        console.log('WebSocket disconnected')
        setIsConnected(false)
        onClose?.()

        if (autoReconnect) {
          reconnectTimeout.current = setTimeout(() => {
            console.log('Attempting to reconnect...')
            connect()
          }, reconnectInterval)
        }
      }

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error)
        onError?.(error)
      }
    } catch (error) {
      console.error('Failed to connect WebSocket:', error)
    }
  }

  const disconnect = () => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current)
    }
    if (ws.current) {
      ws.current.close()
    }
  }

  const sendMessage = (data: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(data))
    } else {
      console.warn('WebSocket is not connected')
    }
  }

  useEffect(() => {
    connect()

    return () => {
      disconnect()
    }
  }, [url, token])

  return {
    isConnected,
    lastMessage,
    sendMessage,
    disconnect,
  }
}
