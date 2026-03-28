import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

// Types
export interface Conversation {
  conversation_id: string
  contact_name: string
  contact_avatar?: string
  platform: 'whatsapp' | 'instagram' | 'comment'
  last_message: string
  last_message_at: Date | string
  status: 'unread' | 'read' | 'replied'
  priority?: 'high' | 'medium' | 'low'
  tags?: string[]
  is_starred?: boolean
  unread_count?: number
}

export interface Message {
  message_id: string
  content: string
  created_at: Date | string
  direction: 'incoming' | 'outgoing'
  status?: 'sent' | 'delivered' | 'read'
  attachments?: any[]
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[]
}

interface GetConversationsParams {
  search?: string
  platform?: string
  status?: string
  page?: number
  limit?: number
}

// Get conversations
export function useConversations(params?: GetConversationsParams) {
  return useQuery({
    queryKey: ['conversations', params],
    queryFn: async () => {
      const { data } = await apiClient.get('/messages/conversations', { params })
      return data
    },
  })
}

// Get single conversation
export function useConversation(id: string) {
  return useQuery({
    queryKey: ['conversations', id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/messages/conversations/${id}`)
      return data as ConversationWithMessages
    },
    enabled: !!id,
  })
}

// Get messages for a conversation
export function useMessages(conversationId: string) {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      const { data} = await apiClient.get(`/messages/conversations/${conversationId}/messages`)
      return data as Message[]
    },
    enabled: !!conversationId,
  })
}

// Send message
export function useSendMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      conversation_id: string
      content: string
      attachments?: any[]
      use_ai?: boolean
    }) => {
      const { data } = await apiClient.post('/messages/send', payload)
      return data
    },
    onSuccess: (_, variables) => {
      // Invalidate conversations list
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      // Invalidate specific conversation
      queryClient.invalidateQueries({ queryKey: ['conversations', variables.conversation_id] })
      // Invalidate messages
      queryClient.invalidateQueries({ queryKey: ['messages', variables.conversation_id] })
    },
  })
}

// Create conversation
export function useCreateConversation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      contact_name: string
      contact_phone?: string
      contact_email?: string
      platform: string
      platform_contact_id?: string
      initial_message?: string
    }) => {
      const { data } = await apiClient.post('/messages/conversations', payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}

// Update conversation
export function useUpdateConversation(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      status?: string
      priority?: string
      is_starred?: boolean
      tags?: string[]
      assigned_to?: string
    }) => {
      const { data } = await apiClient.patch(`/messages/conversations/${id}`, payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      queryClient.invalidateQueries({ queryKey: ['conversations', id] })
    },
  })
}

// Delete conversation
export function useDeleteConversation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/messages/conversations/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}

// Get AI suggestions
export function useAiSuggestions(conversationId: string) {
  return useQuery({
    queryKey: ['ai-suggestions', conversationId],
    queryFn: async () => {
      const { data } = await apiClient.post('/messages/ai-suggestions', {
        conversation_id: conversationId,
      })
      return data as string[]
    },
    enabled: !!conversationId,
    staleTime: 30000, // Cache for 30 seconds
  })
}
