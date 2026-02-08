import { api } from '@/lib/api';

export type ConversationState = 'active' | 'waiting_human' | 'resolved' | 'abandoned' | string;

export interface ConversationListItem {
    id: string;
    channel: string;
    external_id: string;
    state: ConversationState;
    requires_human: boolean;
    handoff_reason: string | null;
    handoff_requested_at: string | null;
    staff_id: string | null;
    last_message_at: string | null;
    last_agent_response_at: string | null;
    last_message_preview: string | null;
}

export interface ConversationQueryResponse {
    items: ConversationListItem[];
    next_cursor: string | null;
}

export interface ConversationStats {
    waiting_human: number;
    active: number;
    total: number;
}

export interface GetConversationsQueryParams {
    state?: string;
    limit?: number;
    cursor?: string | null;
}

function buildQueryString(params: GetConversationsQueryParams): string {
    const searchParams = new URLSearchParams();
    if (params.state) {
        searchParams.set('state', params.state);
    }
    if (typeof params.limit === 'number') {
        searchParams.set('limit', String(params.limit));
    }
    if (params.cursor) {
        searchParams.set('cursor', params.cursor);
    }
    const query = searchParams.toString();
    return query ? `?${query}` : '';
}

export async function getConversationsQuery(
    params: GetConversationsQueryParams = {},
): Promise<ConversationQueryResponse> {
    const query = buildQueryString(params);
    return api.get<ConversationQueryResponse>(`/api/v1/conversations/query${query}`);
}

export async function getConversationStats(): Promise<ConversationStats> {
    return api.get<ConversationStats>('/api/v1/conversations/stats');
}

export async function resumeConversation(
    conversationId: string,
): Promise<{ ok: boolean; conversation: ConversationListItem }> {
    return api.patch<{ ok: boolean; conversation: ConversationListItem }>(
        `/api/v1/conversations/${encodeURIComponent(conversationId)}/resume`,
    );
}
