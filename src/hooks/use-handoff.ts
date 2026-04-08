import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const getAuthToken = () => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('biznavigate_auth_token') || '';
    }
    return '';
};

// ── Types ─────────────────────────────────────────────────────────────────────

export interface HandoffConversation {
    conversation_id: string;
    lead_id: string;
    agent_id: string | null;
    is_ai_handled: boolean;
    human_takeover_at: string;
    human_takeover_reason: string;
    is_resolved: boolean;
    status: string;
    channel: string;
    customer_id: string;
    customer_name: string;
    message_text: string;
}

export interface HandoffMessage {
    _id?: string;
    conversation_id?: string;
    sender_type: 'lead' | 'business' | 'system';
    sender_name?: string;
    message_type: string;
    message_text: string;
    timestamp: string;
    delivery_status?: string;
    platform_message_id?: string;
    metadata?: {
        is_agent?: boolean;
        agent_id?: string;
        is_ai?: boolean;
        is_escalation?: boolean;
        reason?: string;
        [key: string]: unknown;
    };
}

export interface HandoffDetail {
    conversation_id: string;
    lead_id: string;
    agent_id: string | null;
    is_ai_handled: boolean;
    human_takeover_at: string;
    human_takeover_reason: string;
    is_resolved: boolean;
    status: string;
    conversation: Record<string, unknown>;
    messages: HandoffMessage[];
}

// ── WebSocket Hook ─────────────────────────────────────────────────────────────

export function useHandoffWebSocket() {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        const token = getAuthToken();
        const businessId = user?.business_id;
        if (!token || !businessId) return;

        const socket = io(`${API_BASE_URL}/handoff`, {
            auth: { token },
            transports: ['websocket'],
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('[Handoff Socket] connected', socket.id);
            socket.emit('join', businessId);
        });

        socket.on('connect_error', (err) => {
            console.error('[Handoff Socket] connect_error:', err.message);
        });

        socket.on('disconnect', (reason) => {
            console.warn('[Handoff Socket] disconnected:', reason);
        });

        // New escalation — add to queue
        socket.on('new_escalation', (payload: {
            conversationId: string;
            reason: string;
            phone: string;
            escalated_at: string;
            customer_name: string;
            lead_id: string;
        }) => {
            console.log('[Handoff Socket] new_escalation', payload);

            // Invalidate queue so the new card appears
            queryClient.invalidateQueries({ queryKey: ['handoff_queue'] });

            // Inject a live notification into the bell dropdown cache
            const liveNotif = {
                notification_id: `escalation_${payload.conversationId}_${Date.now()}`,
                user_id: '',
                business_id: '',
                title: `${payload.customer_name} needs human support`,
                message: payload.reason,
                type: 'escalation' as const,
                priority: 'urgent' as const,
                is_read: false,
                action_url: `/crm/handoff`,
                metadata: {
                    conversationId: payload.conversationId,
                    phone: payload.phone,
                    lead_id: payload.lead_id,
                },
                created_at: payload.escalated_at,
                updated_at: payload.escalated_at,
            };

            // Prepend to recent notifications list
            queryClient.setQueryData(['notifications', 'recent'], (old: any) => {
                const list = Array.isArray(old) ? old : [];
                return [liveNotif, ...list].slice(0, 5);
            });

            // Increment unread count
            queryClient.setQueryData(['notifications', 'unread-count'], (old: any) => {
                return (old || 0) + 1;
            });

            // Notification sound
            try {
                const audio = new Audio('/notification.mp3');
                audio.volume = 0.5;
                audio.play().catch(() => {});
            } catch (_) {}

            toast(`${payload.customer_name} needs a human agent`, {
                description: payload.reason,
                duration: 8000,
            });
        });

        // Agent assigned — update queue card
        socket.on('agent_assigned', (payload: {
            conversationId: string;
            agent_id: string;
            assigned_at: string;
        }) => {
            console.log('[Handoff Socket] agent_assigned', payload);

            queryClient.setQueriesData(
                { queryKey: ['handoff_queue'], exact: false },
                (old: any) => {
                    if (!old?.data) return old;
                    return {
                        ...old,
                        data: old.data.map((c: HandoffConversation) =>
                            c.conversation_id === payload.conversationId
                                ? { ...c, agent_id: payload.agent_id }
                                : c
                        ),
                    };
                }
            );
        });

        // Agent message — append to chat
        socket.on('agent_message', (payload: {
            conversationId: string;
            message: HandoffMessage;
        }) => {
            console.log('[Handoff Socket] agent_message', payload);
            appendMessage(payload.conversationId, payload.message);
        });

        // Customer replied — append to chat, mark unread if not open
        socket.on('customer_message', (payload: {
            conversationId: string;
            message: HandoffMessage;
        }) => {
            console.log('[Handoff Socket] customer_message', payload);
            appendMessage(payload.conversationId, payload.message);

            // Bump unread count on queue card
            queryClient.setQueriesData(
                { queryKey: ['handoff_queue'], exact: false },
                (old: any) => {
                    if (!old?.data) return old;
                    return {
                        ...old,
                        data: old.data.map((c: HandoffConversation) =>
                            c.conversation_id === payload.conversationId
                                ? { ...c, message_text: payload.message.message_text }
                                : c
                        ),
                    };
                }
            );
        });

        // Conversation resolved — update queue
        socket.on('conversation_resolved', (payload: {
            conversationId: string;
            resolved_at: string;
        }) => {
            console.log('[Handoff Socket] conversation_resolved', payload);

            queryClient.setQueriesData(
                { queryKey: ['handoff_queue'], exact: false },
                (old: any) => {
                    if (!old?.data) return old;
                    return {
                        ...old,
                        data: old.data.map((c: HandoffConversation) =>
                            c.conversation_id === payload.conversationId
                                ? { ...c, is_resolved: true }
                                : c
                        ),
                    };
                }
            );

            // Also update detail if open
            queryClient.setQueryData(
                ['handoff_detail', payload.conversationId],
                (old: any) => old ? { ...old, is_resolved: true } : old
            );
        });

        const appendMessage = (conversationId: string, message: HandoffMessage) => {
            queryClient.setQueryData(
                ['handoff_detail', conversationId],
                (old: any) => {
                    if (!old) return old;
                    const msgs: HandoffMessage[] = old.messages || [];
                    const isDupe = msgs.some(
                        (m) => m._id && m._id === message._id
                    );
                    if (isDupe) return old;
                    return { ...old, messages: [...msgs, message] };
                }
            );
        };

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [user?.business_id, queryClient]);

    return socketRef.current;
}

// ── REST Hooks ─────────────────────────────────────────────────────────────────

export function useHandoffQueue() {
    const { user } = useAuthStore();

    return useQuery({
        queryKey: ['handoff_queue', user?.business_id],
        queryFn: async () => {
            const response = await apiClient.get('/handoff/queue');
            const body = response.data as any;
            const list: HandoffConversation[] = Array.isArray(body) ? body : (body?.data ?? []);
            return { data: list, total: body?.total ?? list.length };
        },
        enabled: !!user?.business_id,
        staleTime: 30000,
    });
}

export function useHandoffDetail(conversationId: string | null) {
    return useQuery({
        queryKey: ['handoff_detail', conversationId],
        queryFn: async () => {
            const response = await apiClient.get(`/handoff/conversations/${conversationId}`);
            return response.data as HandoffDetail;
        },
        enabled: !!conversationId,
        staleTime: 30000,
    });
}

export function useHandoffTakeover() {
    const queryClient = useQueryClient();
    const { user } = useAuthStore();

    return useMutation({
        mutationFn: async (conversationId: string) => {
            const response = await apiClient.post(`/handoff/conversations/${conversationId}/takeover`);
            return response.data as { success: boolean; agent_id: string; assigned_at: string };
        },
        onSuccess: (data, conversationId) => {
            // Update queue card
            queryClient.setQueriesData(
                { queryKey: ['handoff_queue'], exact: false },
                (old: any) => {
                    if (!old?.data) return old;
                    return {
                        ...old,
                        data: old.data.map((c: HandoffConversation) =>
                            c.conversation_id === conversationId
                                ? { ...c, agent_id: data.agent_id }
                                : c
                        ),
                    };
                }
            );
            // Update detail
            queryClient.setQueryData(['handoff_detail', conversationId], (old: any) =>
                old ? { ...old, agent_id: data.agent_id } : old
            );
            toast.success('You are now handling this conversation');
        },
        onError: () => {
            toast.error('Failed to take over conversation');
        },
    });
}

export function useHandoffSendMessage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ conversationId, content }: { conversationId: string; content: string }) => {
            const response = await apiClient.post(`/handoff/conversations/${conversationId}/send`, { content });
            return response.data as { success: boolean; message: HandoffMessage };
        },
        onMutate: async ({ conversationId, content }) => {
            const tempId = `temp_${Date.now()}`;
            const optimistic: HandoffMessage = {
                _id: tempId,
                sender_type: 'business',
                sender_name: 'You',
                message_type: 'text',
                message_text: content,
                timestamp: new Date().toISOString(),
                delivery_status: 'sent',
                metadata: { is_agent: true },
            };

            queryClient.setQueryData(
                ['handoff_detail', conversationId],
                (old: any) => {
                    if (!old) return old;
                    return { ...old, messages: [...(old.messages || []), optimistic] };
                }
            );

            return { tempId };
        },
        onSuccess: (data, { conversationId }, context) => {
            // Replace optimistic with real message
            queryClient.setQueryData(
                ['handoff_detail', conversationId],
                (old: any) => {
                    if (!old) return old;
                    const msgs: HandoffMessage[] = old.messages || [];
                    const idx = msgs.findIndex((m) => m._id === context?.tempId);
                    if (idx === -1) return old;
                    const updated = [...msgs];
                    updated[idx] = data.message;
                    return { ...old, messages: updated };
                }
            );
        },
        onError: (_err, { conversationId }, context) => {
            // Remove optimistic message on failure
            queryClient.setQueryData(
                ['handoff_detail', conversationId],
                (old: any) => {
                    if (!old) return old;
                    return {
                        ...old,
                        messages: (old.messages || []).filter((m: HandoffMessage) => m._id !== context?.tempId),
                    };
                }
            );
            toast.error('Failed to send message');
        },
    });
}

export function useHandoffResolve() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (conversationId: string) => {
            const response = await apiClient.post(`/handoff/conversations/${conversationId}/resolve`);
            return response.data as { success: boolean; resolved_at: string };
        },
        onSuccess: (_data, conversationId) => {
            queryClient.setQueriesData(
                { queryKey: ['handoff_queue'], exact: false },
                (old: any) => {
                    if (!old?.data) return old;
                    return {
                        ...old,
                        data: old.data.map((c: HandoffConversation) =>
                            c.conversation_id === conversationId
                                ? { ...c, is_resolved: true }
                                : c
                        ),
                    };
                }
            );
            queryClient.setQueryData(['handoff_detail', conversationId], (old: any) =>
                old ? { ...old, is_resolved: true } : old
            );
            toast.success('Conversation resolved');
        },
        onError: () => {
            toast.error('Failed to resolve conversation');
        },
    });
}
