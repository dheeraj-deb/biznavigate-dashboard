import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { apiClient } from '@/lib/api-client';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';

// Define our types based on the API docs
export type SenderType = 'lead' | 'business';
export type MessageType = 'text' | 'image' | 'audio' | 'video' | 'document' | 'interactive' | 'order';
export type DeliveryStatus = 'received' | 'sent' | 'delivered' | 'read' | 'failed';
export type ConversationStatus = 'active' | 'waiting' | 'ended';
export type Channel = 'whatsapp' | 'instagram' | 'comment'; // assuming comment is possible based on UI

export interface ConversationListItem {
    conversation_id: string;
    customer_id: string;
    sender_name: string;
    channel: Channel;
    status: ConversationStatus;
    message_text: string;
    updated_at: string;
    unreadCount?: number; // UI state tracking
    contactAvatar?: string; // UI state tracking
}

export interface ConversationDetail {
    conversation_id: string;
    customer_id: string;
    sender_name: string;
    sender_id: string;
    channel: Channel;
    status: ConversationStatus;
    lead_id: string;
    business_id: string;
}

export interface MessageData {
    conversation_id: string;
    sender_type: SenderType;
    message_type: MessageType;
    message_text: string;
    platform_message_id?: string;
    delivery_status?: DeliveryStatus;
    timestamp: string;
}

export interface InboxPagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface ConversationsResponse {
    data: ConversationListItem[];
    pagination: InboxPagination;
}

// ── Added for Customer Grouping ───────────────────────────────────────────────
export interface GroupedCustomer {
    customer_id: string;
    sender_name: string;
    contactAvatar?: string;
    channels: Channel[];
    conversation_ids: string[];
    latest_message: string;
    updated_at: string;
    unreadCount: number;
}

export interface AggregatedCustomerDetail {
    customer_id: string;
    sender_name: string;
    conversations: ConversationDetail[];
    messages: MessageData[]; // All messages sorted by timestamp
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ── Shared Helper ─────────────────────────────────────────────────────────────
const getAuthToken = () => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('biznavigate_auth_token') || '';
    }
    return '';
};

// ── WebSocket Hook ────────────────────────────────────────────────────────────
export function useInboxWebSocket() {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        const token = getAuthToken();
        const businessId = user?.business_id;

        if (!token || !businessId) return;

        // Connect to WebSocket
        const socket = io(`${API_BASE_URL}/inbox`, {
            auth: { token },
            transports: ['websocket'],
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('Inbox WebSocket connected');
            socket.emit('join', businessId);
        });

        socket.on('new_message', ({ conversationId, message }: { conversationId: string, message: MessageData }) => {
            // Optimistically update the specific conversation's message list
            queryClient.setQueryData(['conversation', conversationId], (old: any) => {
                if (!old) return old;
                // Prevent duplicate messages
                if (old.messages?.find((m: MessageData) => m.timestamp === message.timestamp && m.message_text === message.message_text)) {
                    return old;
                }
                return {
                    ...old,
                    messages: [...(old.messages || []), message]
                };
            });

            // Optimistically update the conversation list
            queryClient.setQueryData(['conversations'], (old: any) => {
                if (!old?.data) return old;
                const prev = old.data as ConversationListItem[];
                const index = prev.findIndex(c => c.conversation_id === conversationId);

                if (index === -1) {
                    // New conversation, trigger a refetch of the list
                    queryClient.invalidateQueries({ queryKey: ['conversations'] });
                    return old;
                }

                const convo = prev[index];
                const updatedList = [...prev];
                updatedList.splice(index, 1);

                updatedList.unshift({
                    ...convo,
                    message_text: message.message_text,
                    updated_at: message.timestamp,
                    unreadCount: (convo.unreadCount || 0) + 1
                });

                return { ...old, data: updatedList };
            });
        });

        socket.on('message_sent', ({ conversationId, message }: { conversationId: string, message: MessageData }) => {
            queryClient.setQueryData(['conversation', conversationId], (old: any) => {
                if (!old) return old;

                const chatMsgs: MessageData[] = old.messages || [];
                // Check if we already appended this optimistically
                const exists = chatMsgs.findIndex(m => m.timestamp === message.timestamp && m.message_text === message.message_text);

                if (exists >= 0) {
                    const newMsgs = [...chatMsgs];
                    newMsgs[exists] = message;
                    return { ...old, messages: newMsgs };
                }

                return { ...old, messages: [...chatMsgs, message] };
            });
        });

        socket.on('status_update', ({ conversationId, platformMessageId, status }: { conversationId: string, platformMessageId: string, status: DeliveryStatus }) => {
            queryClient.setQueryData(['conversation', conversationId], (old: any) => {
                if (!old) return old;

                const chatMsgs: MessageData[] = old.messages || [];
                const index = chatMsgs.findIndex(m => m.platform_message_id === platformMessageId);

                if (index === -1) return old;

                const newMsgs = [...chatMsgs];
                newMsgs[index] = { ...newMsgs[index], delivery_status: status };

                return { ...old, messages: newMsgs };
            });
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [user?.business_id, queryClient]);

    return socketRef.current;
}

// ── React Query API Hooks ─────────────────────────────────────────────────────

export interface InboxFilters {
    status?: ConversationStatus | 'all';
    channel?: Channel | 'all';
    search?: string;
    page?: number;
    limit?: number;
}

export function useConversations(filters?: InboxFilters) {
    const { user } = useAuthStore();
    const params = {
        ...filters,
        business_id: user?.business_id,
        status: filters?.status === 'all' ? undefined : filters?.status,
        channel: filters?.channel === 'all' ? undefined : filters?.channel,
    };

    return useQuery({
        queryKey: ['conversations', params],
        queryFn: async () => {
            const response = await apiClient.get('/inbox/conversations', { params });
            const body = response.data as any;
            const list: ConversationListItem[] = Array.isArray(body) ? body : (body?.data ?? []);
            const pagination = Array.isArray(body)
                ? { total: list.length, page: 1, limit: 20, totalPages: 1 }
                : (body?.pagination ?? { total: 0, page: 1, limit: 20, totalPages: 1 });
            return { data: list, pagination } as ConversationsResponse;
        },
        enabled: !!user?.business_id,
        staleTime: 30000,
    });
}

export function useConversation(conversationId: string | null) {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['conversation', conversationId],
        queryFn: async () => {
            if (!conversationId) return null;
            const response = await apiClient.get(`/inbox/conversations/${conversationId}`);
            const body = response.data as any;

            // Auto clear unread count in conversations list when viewing details
            queryClient.setQueryData(['conversations'], (old: any) => {
                if (!old?.data) return old;
                return {
                    ...old,
                    data: old.data.map((c: ConversationListItem) =>
                        c.conversation_id === conversationId ? { ...c, unreadCount: 0 } : c
                    )
                };
            });

            return {
                conversation: body?.conversation as ConversationDetail,
                messages: body?.messages as MessageData[]
            };
        },
        enabled: !!user?.business_id && !!conversationId,
    });

    return query;
}

export function useCustomerConversations(conversationIds: string[]) {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();

    const query = useInfiniteQuery({
        // We use a unique key based on the sorted IDs so it caches predictably
        queryKey: ['customer_conversations', [...conversationIds].sort().join(',')],
        queryFn: async ({ pageParam = undefined }: { pageParam?: string }) => {
            if (!conversationIds || conversationIds.length === 0) return null;

            const payload: any = {
                conversationIds,
                limit: 50
            };
            if (pageParam) {
                payload.cursor = pageParam;
            }

            const response = await apiClient.post(`/inbox/conversations/batch-messages`, payload);
            const body = response.data as any;

            let allMessages: MessageData[] = [];

            if (body?.data) {
                Object.values(body.data).forEach((msgs: any) => {
                    if (Array.isArray(msgs)) {
                        allMessages = [...allMessages, ...msgs];
                    }
                });
            }

            // Sort all messages chronologically
            allMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

            // Auto clear unread count in conversations list for all these IDs
            if (!pageParam) {
                queryClient.setQueryData(['conversations'], (old: any) => {
                    if (!old?.data) return old;
                    return {
                        ...old,
                        data: old.data.map((c: ConversationListItem) =>
                            conversationIds.includes(c.conversation_id) ? { ...c, unreadCount: 0 } : c
                        )
                    };
                });
            }

            return {
                messages: allMessages,
                meta: body?.meta
            };
        },
        getNextPageParam: (lastPage: any) => lastPage?.meta?.nextCursor || undefined,
        initialPageParam: undefined as string | undefined,
        enabled: !!user?.business_id && conversationIds.length > 0,
        retry: 1,
        refetchOnWindowFocus: false,
        staleTime: 30000,
    });

    return query;
}

export function useSendMessage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ conversationId, content }: { conversationId: string, content: string }) => {
            const response = await apiClient.post(`/inbox/conversations/${conversationId}/send`, { content });
            return response.data as { success: boolean, message: MessageData };
        },
        onMutate: async ({ conversationId, content }) => {
            // Optimistic UI update
            await queryClient.cancelQueries({ queryKey: ['conversation', conversationId] });
            const previousData = queryClient.getQueryData(['conversation', conversationId]);

            const optimisticMessage: MessageData = {
                conversation_id: conversationId,
                sender_type: 'business',
                message_type: 'text',
                message_text: content,
                delivery_status: 'sent',
                timestamp: new Date().toISOString(),
                platform_message_id: `temp_${Date.now()}`
            };

            queryClient.setQueryData(['conversation', conversationId], (old: any) => {
                if (!old) return old;
                return {
                    ...old,
                    messages: [...(old.messages || []), optimisticMessage]
                };
            });

            return { previousData };
        },
        onError: (err, { conversationId }, context) => {
            toast.error('Failed to send message');
            // Rollback optimistic update
            if (context?.previousData) {
                queryClient.setQueryData(['conversation', conversationId], context.previousData);
            }
        },
        onSettled: (data, error, { conversationId }) => {
            // Fetch fresh data in backgound to ensure sync
            // queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
        }
    });
}

export function useUpdateConversationStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ conversationId, status, assignedTo }: { conversationId: string, status: ConversationStatus, assignedTo?: string }) => {
            const body: any = { status };
            if (assignedTo) body.assigned_to = assignedTo;
            await apiClient.patch(`/inbox/conversations/${conversationId}`, body);
        },
        onSuccess: (data, { conversationId, status }) => {
            // Update conversation list status
            queryClient.setQueryData(['conversations'], (old: any) => {
                if (!old?.data) return old;
                return {
                    ...old,
                    data: old.data.map((c: ConversationListItem) =>
                        c.conversation_id === conversationId ? { ...c, status } : c
                    )
                };
            });

            // Update detail status
            queryClient.setQueryData(['conversation', conversationId], (old: any) => {
                if (!old?.conversation) return old;
                return {
                    ...old,
                    conversation: { ...old.conversation, status }
                };
            });
        },
        onError: () => {
            toast.error('Failed to update conversation status');
        }
    });
}
