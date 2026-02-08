'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Loader2, MessageSquare, RefreshCw } from 'lucide-react';
import { Button, Modal, ModalFooter } from '@/components/ui';
import { ApiError } from '@/lib/api';
import {
    ConversationListItem,
    getConversationsQuery,
    resumeConversation,
} from '@/lib/conversations';
import { useAuth } from '@/lib/auth-context';
import styles from './conversations.module.css';

type ConversationFilter = 'all' | 'waiting_human' | 'active';

const PAGE_SIZE = 30;

const FILTERS: Array<{ key: ConversationFilter; label: string }> = [
    { key: 'all', label: 'Todas' },
    { key: 'waiting_human', label: 'Aguardando humano' },
    { key: 'active', label: 'Ativas' },
];

function toApiState(filter: ConversationFilter): string | undefined {
    if (filter === 'all') return undefined;
    return filter;
}

function maskExternalId(externalId: string): string {
    const base = externalId.split('@')[0].trim();
    const digits = base.replace(/\D/g, '');

    if (digits.length >= 8) {
        return `+${digits.slice(0, 4)}****${digits.slice(-4)}`;
    }
    if (base.length > 8) {
        return `${base.slice(0, 4)}****${base.slice(-2)}`;
    }
    return base;
}

function humanizeReason(reason: string | null): string {
    if (!reason) return '-';
    switch (reason) {
        case 'circuit_breaker':
            return 'Circuit breaker';
        case 'loop_detected':
            return 'Loop detectado';
        case 'agent_out_of_scope':
            return 'Fora de escopo do agente';
        default:
            return reason.replaceAll('_', ' ');
    }
}

function formatRelative(dateIso: string | null): string {
    if (!dateIso) return '-';
    const parsed = new Date(dateIso);
    if (Number.isNaN(parsed.getTime())) return '-';

    const diffMs = parsed.getTime() - Date.now();
    const absSeconds = Math.round(Math.abs(diffMs) / 1000);
    const rtf = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });

    if (absSeconds < 60) return rtf.format(Math.round(diffMs / 1000), 'second');

    const absMinutes = Math.round(absSeconds / 60);
    if (absMinutes < 60) return rtf.format(Math.round(diffMs / 60000), 'minute');

    const absHours = Math.round(absMinutes / 60);
    if (absHours < 24) return rtf.format(Math.round(diffMs / 3600000), 'hour');

    return rtf.format(Math.round(diffMs / 86400000), 'day');
}

function getErrorMessage(err: unknown): string {
    const apiError = err as ApiError;
    return apiError.message || 'Erro ao carregar conversas.';
}

export default function ConversationsPage() {
    const { user } = useAuth();
    const [filter, setFilter] = useState<ConversationFilter>('waiting_human');
    const [conversations, setConversations] = useState<ConversationListItem[]>([]);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
    const [selectedConversation, setSelectedConversation] = useState<ConversationListItem | null>(null);
    const [resumingId, setResumingId] = useState<string | null>(null);

    const canResume = useMemo(() => {
        const normalizedRole = String(user?.role || '').trim().toLowerCase();
        if (!normalizedRole) {
            // Fallback defensivo: alguns tokens/sessões antigas podem não expor role no front.
            // O backend continua protegendo via RBAC.
            return true;
        }
        return normalizedRole === 'owner' || normalizedRole === 'admin';
    }, [user?.role]);

    const loadConversations = useCallback(
        async (reset: boolean) => {
            const cursor = reset ? null : nextCursor;
            if (!reset && !cursor) return;

            setError(null);
            if (reset) {
                setIsLoading(true);
            } else {
                setIsLoadingMore(true);
            }

            try {
                const response = await getConversationsQuery({
                    state: toApiState(filter),
                    limit: PAGE_SIZE,
                    cursor,
                });
                setNextCursor(response.next_cursor);
                if (reset) {
                    setConversations(response.items);
                } else {
                    setConversations((previous) => {
                        const known = new Set(previous.map((item) => item.id));
                        const additions = response.items.filter((item) => !known.has(item.id));
                        return [...previous, ...additions];
                    });
                }
            } catch (err) {
                setError(getErrorMessage(err));
            } finally {
                setIsLoading(false);
                setIsLoadingMore(false);
            }
        },
        [filter, nextCursor],
    );

    useEffect(() => {
        void loadConversations(true);
    }, [loadConversations]);

    const handleRetry = () => {
        void loadConversations(true);
    };

    const handleOpenResumeModal = (conversation: ConversationListItem) => {
        setSelectedConversation(conversation);
        setActionError(null);
        setIsResumeModalOpen(true);
    };

    const handleCloseResumeModal = () => {
        if (resumingId) return;
        setSelectedConversation(null);
        setActionError(null);
        setIsResumeModalOpen(false);
    };

    const handleResumeConversation = async () => {
        if (!selectedConversation) return;

        const target = selectedConversation;
        const snapshot = conversations;
        setResumingId(target.id);
        setActionError(null);

        setConversations((previous) => {
            if (filter === 'waiting_human') {
                return previous.filter((item) => item.id !== target.id);
            }
            return previous.map((item) =>
                item.id === target.id
                    ? {
                        ...item,
                        state: 'active',
                        requires_human: false,
                        handoff_reason: null,
                        handoff_requested_at: null,
                    }
                    : item,
            );
        });

        try {
            const response = await resumeConversation(target.id);
            const updated = response.conversation;
            if (filter !== 'waiting_human') {
                setConversations((previous) =>
                    previous.map((item) => (item.id === updated.id ? updated : item)),
                );
            }
            setIsResumeModalOpen(false);
            setSelectedConversation(null);
        } catch (err) {
            setConversations(snapshot);
            setActionError(getErrorMessage(err));
        } finally {
            setResumingId(null);
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Conversas</h1>
                    <p className={styles.subtitle}>
                        Acompanhe handoff e retome o agente quando necessario.
                    </p>
                </div>
                <Button
                    variant="secondary"
                    leftIcon={<RefreshCw size={16} />}
                    onClick={() => void loadConversations(true)}
                    isLoading={isLoading}
                >
                    Atualizar
                </Button>
            </div>

            <div className={styles.filters}>
                {FILTERS.map((entry) => (
                    <button
                        key={entry.key}
                        type="button"
                        className={`${styles.filterButton} ${filter === entry.key ? styles.active : ''}`}
                        onClick={() => setFilter(entry.key)}
                    >
                        {entry.label}
                    </button>
                ))}
            </div>

            {error && (
                <div className={styles.errorState}>
                    <AlertCircle size={18} />
                    <span>{error}</span>
                    <Button variant="secondary" size="sm" onClick={handleRetry}>
                        Tentar novamente
                    </Button>
                </div>
            )}

            {isLoading ? (
                <div className={styles.loadingState}>
                    <Loader2 size={28} className={styles.spinner} />
                    <span>Carregando conversas...</span>
                </div>
            ) : conversations.length === 0 ? (
                <div className={styles.emptyState}>
                    <MessageSquare size={30} />
                    <h3>Nenhuma conversa encontrada</h3>
                    <p>Altere os filtros ou aguarde novas mensagens.</p>
                </div>
            ) : (
                <>
                    <div className={styles.cards}>
                        {conversations.map((conversation) => {
                            const waitingHuman = conversation.state === 'waiting_human' || conversation.requires_human;
                            return (
                                <article key={conversation.id} className={styles.card}>
                                    <div className={styles.cardHeader}>
                                        <div className={styles.identity}>{maskExternalId(conversation.external_id)}</div>
                                        <span
                                            className={`${styles.stateBadge} ${
                                                waitingHuman ? styles.waitingHuman : styles.activeState
                                            }`}
                                        >
                                            {waitingHuman ? 'Aguardando humano' : 'Ativa'}
                                        </span>
                                    </div>

                                    <div className={styles.meta}>
                                        <span>Motivo: {humanizeReason(conversation.handoff_reason)}</span>
                                        <span>Pausada: {formatRelative(conversation.handoff_requested_at)}</span>
                                    </div>

                                    <p className={styles.preview}>{conversation.last_message_preview || '-'}</p>

                                    {canResume && waitingHuman && (
                                        <div className={styles.actions}>
                                            <Button
                                                size="sm"
                                                onClick={() => handleOpenResumeModal(conversation)}
                                            >
                                                Retomar Agente
                                            </Button>
                                        </div>
                                    )}
                                </article>
                            );
                        })}
                    </div>

                    {nextCursor && (
                        <div className={styles.loadMore}>
                            <Button
                                variant="secondary"
                                onClick={() => void loadConversations(false)}
                                isLoading={isLoadingMore}
                            >
                                Carregar mais
                            </Button>
                        </div>
                    )}
                </>
            )}

            <Modal
                isOpen={isResumeModalOpen}
                onClose={handleCloseResumeModal}
                title="Retomar agente"
                size="sm"
            >
                <p className={styles.modalText}>
                    Tem certeza? O agente voltara a responder automaticamente nesta conversa.
                </p>
                {actionError && <p className={styles.modalError}>{actionError}</p>}
                <ModalFooter>
                    <Button variant="secondary" onClick={handleCloseResumeModal} disabled={Boolean(resumingId)}>
                        Cancelar
                    </Button>
                    <Button onClick={handleResumeConversation} isLoading={Boolean(resumingId)}>
                        Confirmar retomada
                    </Button>
                </ModalFooter>
            </Modal>
        </div>
    );
}
