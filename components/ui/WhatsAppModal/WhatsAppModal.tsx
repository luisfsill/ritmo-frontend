'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { X, MessageCircle, Loader2, RefreshCw, Smartphone, AlertCircle, Check, Unplug, Trash2, Clock3 } from 'lucide-react';
import { uazapi, UazapiInstance, UazapiIntegrationStatus, UazapiStatus } from '@/lib/uazapi';
import { PendingCommandResponse, waitFrontCommand } from '@/lib/front-commands';
import { useAuth } from '@/lib/auth-context';
import styles from './WhatsAppModal.module.css';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ConnectionState = 'loading' | 'no-instance' | 'disconnected' | 'connecting' | 'connected' | 'error';

function normalizeError(err: unknown): string {
  if (err instanceof Error && err.message.trim()) {
    return err.message;
  }
  if (typeof err === 'object' && err && 'message' in err) {
    const message = (err as { message?: string }).message;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }
  return 'Erro inesperado no fluxo de integração do WhatsApp';
}

function humanizeUazapiError(message: string): string {
  if (
    message.includes('missing webhook connection') ||
    message.includes('invalid webhook connection') ||
    message.includes('uazapi_connection_not_configured')
  ) {
    return 'A autenticação do webhook está inválida. Registre o webhook novamente para gerar uma nova conexão.';
  }
  if (message.includes('uazapi_token_missing')) {
    return 'Nenhuma instância ativa foi encontrada para este número. Crie uma nova instância para continuar.';
  }
  if (message.includes('uazapi_error:401') || message.toLowerCase().includes('invalid token')) {
    return 'A instância do WhatsApp foi removida ou o token expirou. Crie uma nova instância para reconectar.';
  }
  if (message.includes('uazapi_delete_not_confirmed')) {
    return 'A UAZAPI nao confirmou a exclusao da instancia. Tente novamente em alguns segundos.';
  }
  if (message.includes('capability_disabled')) {
    return 'Integração temporariamente indisponível. Tente novamente em alguns instantes.';
  }
  if (
    message.includes('429') ||
    message.includes('max_instances') ||
    message.toLowerCase().includes('maximum') ||
    message.toLowerCase().includes('limit')
  ) {
    return 'Limite de instâncias atingido no servidor WhatsApp. Entre em contato com o suporte para liberar novas instâncias.';
  }
  return message;
}

function isMaxInstancesError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    message.includes('429') ||
    message.includes('max_instances') ||
    lower.includes('maximum') ||
    lower.includes('limit')
  );
}

function userFacingActionForBlocker(blocker: string): string | null {
  switch (blocker) {
    case 'provider_not_uazapi':
      return 'Confirme com o suporte se o canal oficial do WhatsApp está ativo para esta conta.';
    case 'missing_uazapi_token':
      return 'Crie uma nova instância e faça a conexão novamente.';
    case 'webhook_not_registered':
    case 'missing_webhook_url':
    case 'webhook_url_localhost':
      return 'Clique em "Registrar Webhook" para concluir a configuração de recebimento de mensagens.';
    case 'agent_worker_disabled':
      return 'As respostas automáticas estão desativadas no momento.';
    default:
      return null;
  }
}

function buildIntegrationWarning(
  connected: boolean,
  integrationStatus: UazapiIntegrationStatus | null | undefined,
  webhookError?: string | null,
): string | null {
  if (!connected) {
    return null;
  }
  if (!webhookError && integrationStatus?.ready_for_inbound !== false) {
    return null;
  }

  const blockers = (integrationStatus?.blockers || []).filter((item) => item.trim().length > 0);
  const actions = blockers
    .map((item) => userFacingActionForBlocker(item))
    .filter((item): item is string => Boolean(item && item.trim().length > 0));
  const details = webhookError ? `Detalhe: ${humanizeUazapiError(webhookError)}.` : null;
  const remediation =
    actions.length > 0
      ? `Ações recomendadas: ${actions.join(' ')}`
      : null;
  const parts = [
    'WhatsApp conectado, mas o recebimento de mensagens ainda não está pronto.',
    details,
    remediation,
  ].filter(Boolean);
  return parts.join(' ');
}

export function WhatsAppModal({ isOpen, onClose }: WhatsAppModalProps) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [state, setState] = useState<ConnectionState>('loading');
  const [instance, setInstance] = useState<UazapiInstance | null>(null);
  const [statusData, setStatusData] = useState<UazapiStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [integrationWarning, setIntegrationWarning] = useState<string | null>(null);
  const [pendingCommand, setPendingCommand] = useState<PendingCommandResponse | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [qrImageSrc, setQrImageSrc] = useState<string | null>(null);
  const [blockedReason, setBlockedReason] = useState<string | null>(null);
  const statusPollingInFlight = useRef(false);

  const tenantId = user?.tenant_id?.trim() || null;
  const canCreateInstance = Boolean(tenantId) && !isAuthLoading;
  const businessName = user?.business_name || user?.name || 'Meu Negócio';

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 20);
  };

  const waitPendingCommand = useCallback(async (pending: PendingCommandResponse): Promise<boolean> => {
    setPendingCommand(pending);
    const settled = await waitFrontCommand(pending.command_id);

    if (settled.kind === 'committed') {
      setPendingCommand(null);
      return true;
    }

    setPendingCommand(null);
    setState('error');
    setError(humanizeUazapiError(settled.message));
    return false;
  }, []);

  const applyStatus = useCallback((status: UazapiStatus) => {
    setInstance(status.instance);
    setStatusData(status);

    if (status.status.connected && status.status.loggedIn) {
      setState('connected');
      return;
    }

    if (status.instance.status === 'connecting' || status.instance.qrcode || status.instance.paircode) {
      setState('connecting');
      return;
    }

    setState('disconnected');
  }, []);

  const loadInstanceStatus = useCallback(async () => {
    setError(null);
    let shouldRetry = true;

    while (shouldRetry) {
      shouldRetry = false;

      try {
        const statusResult = await uazapi.getStatus();

        if (statusResult.kind === 'pending') {
          const committed = await waitPendingCommand(statusResult.pending);
          if (committed) {
            shouldRetry = true;
          }
          continue;
        }

        setPendingCommand(null);
        const status = statusResult.data.status;
        applyStatus(status);
        const connected = Boolean(status?.status?.connected) && Boolean(status?.status?.loggedIn);
        try {
          const integrationStatus = await uazapi.getIntegrationStatus();
          setIntegrationWarning(buildIntegrationWarning(connected, integrationStatus));
        } catch {
          setIntegrationWarning(null);
        }
        return;
      } catch (err) {
        const message = normalizeError(err);
        if (message.includes('uazapi_token_missing')) {
          setState('no-instance');
          setInstance(null);
          setStatusData(null);
          setIntegrationWarning(null);
          return;
        }

        setState('error');
        setIntegrationWarning(null);
        setError(humanizeUazapiError(message));
        return;
      }
    }
  }, [applyStatus, waitPendingCommand]);

  useEffect(() => {
    if (isOpen) {
      setState('loading');
      setBlockedReason(null);
      setIntegrationWarning(null);
      void (async () => {
        try {
          const capabilities = await uazapi.getCapabilities();
          if (!capabilities.enabled) {
            const reason = capabilities.reason || 'capability_disabled';
            setBlockedReason(reason);
            setState('error');
            setIntegrationWarning(null);
            setError(humanizeUazapiError(reason));
            return;
          }
          await loadInstanceStatus();
        } catch (err) {
          setState('error');
          setError(humanizeUazapiError(normalizeError(err)));
        }
      })();
    }
  }, [isOpen, loadInstanceStatus]);

  useEffect(() => {
    let isCancelled = false;

    const renderQr = async () => {
      const qrRaw = instance?.qrcode?.trim();
      if (!qrRaw) {
        setQrImageSrc(null);
        return;
      }

      if (qrRaw.startsWith('data:image/') || qrRaw.startsWith('http://') || qrRaw.startsWith('https://')) {
        setQrImageSrc(qrRaw);
        return;
      }

      const encoded = encodeURIComponent(qrRaw);
      const image = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encoded}`;
      if (!isCancelled) {
        setQrImageSrc(image);
      }
    };

    void renderQr();

    return () => {
      isCancelled = true;
    };
  }, [instance?.qrcode]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isOpen && state === 'connecting') {
      interval = setInterval(async () => {
        if (statusPollingInFlight.current) {
          return;
        }
        statusPollingInFlight.current = true;
        try {
          const statusResult = await uazapi.getStatus();
          if (statusResult.kind === 'pending') {
            setPendingCommand(statusResult.pending);
            return;
          }

          setPendingCommand(null);
          const status = statusResult.data.status;
          applyStatus(status);
          const connected = Boolean(status?.status?.connected) && Boolean(status?.status?.loggedIn);
          if (connected) {
            try {
              const integrationStatus = await uazapi.getIntegrationStatus();
              setIntegrationWarning(buildIntegrationWarning(true, integrationStatus));
            } catch {
              // Keep polling status even if integration endpoint is temporarily unavailable.
            }
          } else {
            setIntegrationWarning(null);
          }
        } catch (err) {
          console.error('Erro no polling de status do WhatsApp:', err);
        } finally {
          statusPollingInFlight.current = false;
        }
      }, 3000);
    }

    return () => {
      statusPollingInFlight.current = false;
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isOpen, state, applyStatus]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadInstanceStatus();
    setIsRefreshing(false);
  };

  const handleCreateInstance = async () => {
    if (!tenantId) {
      setError('Nao foi possivel identificar sua conta agora. Aguarde alguns segundos e tente novamente.');
      return;
    }

    setActionLoading('create');
    setError(null);

    try {
      const result = await uazapi.createInstance(generateSlug(businessName), tenantId);

      if (result.kind === 'pending') {
        const committed = await waitPendingCommand(result.pending);
        if (committed) {
          await loadInstanceStatus();
        }
        return;
      }

      await loadInstanceStatus();
    } catch (err) {
      setError(humanizeUazapiError(normalizeError(err)));
    } finally {
      setActionLoading(null);
    }
  };

  const applyDeletedState = useCallback(() => {
    setInstance(null);
    setStatusData(null);
    setIntegrationWarning(null);
    setState('no-instance');
    setQrImageSrc(null);
  }, []);

  const handleConnect = async () => {
    setActionLoading('connect');
    setError(null);

    try {
      const result = await uazapi.connect();

      if (result.kind === 'pending') {
        const committed = await waitPendingCommand(result.pending);
        if (committed) {
          await loadInstanceStatus();
        }
        return;
      }

      if (result.data.connect.instance) {
        setInstance(result.data.connect.instance);
      }
      const connectedNow = Boolean(result.data.connect?.connected) && Boolean(result.data.connect?.loggedIn);
      setIntegrationWarning(
        buildIntegrationWarning(connectedNow, result.data.integration_status, result.data.webhook_error),
      );

      setState('connecting');
      setTimeout(() => {
        void loadInstanceStatus();
      }, 1000);
    } catch (err) {
      const message = normalizeError(err);

      // User-first fallback: when provider refuses new sessions by quota,
      // try finishing webhook setup on the existing instance.
      if (isMaxInstancesError(message)) {
        try {
          const webhookResult = await uazapi.setWebhook({
            enabled: true,
            events: ['messages', 'messages_update', 'connection'],
          });

          if (webhookResult.kind === 'pending') {
            const committed = await waitPendingCommand(webhookResult.pending);
            if (committed) {
              await loadInstanceStatus();
              return;
            }
          } else {
            setIntegrationWarning(null);
            await loadInstanceStatus();
            return;
          }
        } catch {
          // Fall through to the original error message below.
        }
      }

      setError(humanizeUazapiError(message));
    } finally {
      setActionLoading(null);
    }
  };

  const handleRegisterWebhook = async () => {
    setActionLoading('webhook');
    setError(null);

    try {
      const result = await uazapi.setWebhook({
        enabled: true,
        events: ['messages', 'messages_update', 'connection'],
      });

      if (result.kind === 'pending') {
        const committed = await waitPendingCommand(result.pending);
        if (committed) {
          await loadInstanceStatus();
        }
        return;
      }

      setIntegrationWarning(null);
      await loadInstanceStatus();
    } catch (err) {
      setError(humanizeUazapiError(normalizeError(err)));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Tem certeza que deseja desconectar o WhatsApp?')) return;

    setActionLoading('disconnect');
    setError(null);

    try {
      const result = await uazapi.disconnect();
      if (result.kind === 'pending') {
        const committed = await waitPendingCommand(result.pending);
        if (committed) {
          await loadInstanceStatus();
        }
        return;
      }

      setState('disconnected');
      await loadInstanceStatus();
    } catch (err) {
      setError(humanizeUazapiError(normalizeError(err)));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir a integração do WhatsApp? Esta ação não pode ser desfeita.')) return;

    setActionLoading('delete');
    setError(null);

    try {
      const result = await uazapi.deleteInstance();
      if (result.kind === 'pending') {
        const committed = await waitPendingCommand(result.pending);
        if (committed) {
          applyDeletedState();
        }
        return;
      }

      applyDeletedState();
    } catch (err) {
      const message = normalizeError(err);
      if (message.includes('uazapi_error:401') || message.toLowerCase().includes('invalid token')) {
        applyDeletedState();
      } else {
        setError(humanizeUazapiError(message));
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleTestConnection = async () => {
    setActionLoading('test');
    setError(null);

    try {
      const result = await uazapi.getStatus();
      if (result.kind === 'pending') {
        const committed = await waitPendingCommand(result.pending);
        if (!committed) {
          return;
        }
        await loadInstanceStatus();
        return;
      }

      const status = result.data.status;
      if (status.status.connected && status.status.loggedIn) {
        alert('Conexao funcionando corretamente.');
      } else {
        alert('WhatsApp nao esta conectado.');
      }
    } catch (err) {
      setError(humanizeUazapiError(normalizeError(err)));
    } finally {
      setActionLoading(null);
    }
  };

  if (!isOpen) return null;

  const renderContent = () => {
    if (state === 'loading') {
      return (
        <div className={styles.loading}>
          <Loader2 size={40} className={styles.spinner} />
          <span className={styles.loadingText}>Carregando...</span>
        </div>
      );
    }

    if (state === 'no-instance') {
      return (
        <div className={styles.noInstance}>
          <Smartphone size={48} />
          <h3>Nenhuma instância configurada</h3>
          <p>Crie uma instância do WhatsApp para começar a enviar notificações automáticas.</p>
          <button
            className={`${styles.actionButton} ${styles.connectButton}`}
            onClick={handleCreateInstance}
            disabled={actionLoading === 'create' || !canCreateInstance}
          >
            {actionLoading === 'create' ? (
              <Loader2 size={18} className={styles.spinner} />
            ) : (
              <MessageCircle size={18} />
            )}
            Criar Instância
          </button>
        </div>
      );
    }

    const getStatusBadge = () => {
      switch (state) {
        case 'connected':
          return (
            <div className={`${styles.statusBadge} ${styles.statusConnected}`}>
              <span className={styles.statusIcon} />
              Conectado
            </div>
          );
        case 'connecting':
          return (
            <div className={`${styles.statusBadge} ${styles.statusConnecting}`}>
              <span className={styles.statusIcon} />
              Aguardando conexao
            </div>
          );
        default:
          return (
            <div className={`${styles.statusBadge} ${styles.statusDisconnected}`}>
              <span className={styles.statusIcon} />
              Desconectado
            </div>
          );
      }
    };

    return (
      <>
        <div className={styles.statusSection}>
          {getStatusBadge()}

          {state === 'connected' && instance && (
            <div className={styles.profileInfo}>
              {instance.profilePicUrl ? (
                <Image
                  src={instance.profilePicUrl}
                  alt="Profile"
                  className={styles.profilePic}
                  width={48}
                  height={48}
                  unoptimized
                />
              ) : (
                <div className={styles.profilePlaceholder}>
                  <Smartphone size={32} />
                </div>
              )}
              {instance.profileName && <span className={styles.profileName}>{instance.profileName}</span>}
              {statusData?.status.jid?.user && <span className={styles.profilePhone}>+{statusData.status.jid.user}</span>}
            </div>
          )}
        </div>

        {state === 'connecting' && (
          <div className={styles.qrSection}>
            {qrImageSrc ? (
              <div className={styles.qrCode}>
                <Image src={qrImageSrc} alt="QR Code" width={280} height={280} unoptimized />
              </div>
            ) : (
              <div className={styles.loading}>
                <Loader2 size={26} className={styles.spinner} />
                <span className={styles.loadingText}>Aguardando QR code...</span>
              </div>
            )}

            {instance?.paircode && (
              <div className={styles.pairCode}>
                <span>Ou use o codigo:</span>
                <div className={styles.pairCodeValue}>{instance.paircode}</div>
              </div>
            )}

            <div className={styles.qrInstructions}>
              <p>Escaneie o QR code com seu WhatsApp:</p>
              <ol>
                <li>Abra o WhatsApp no celular</li>
                <li>Toque em Menu (⋮) ou Configuracoes</li>
                <li>Selecione &quot;Aparelhos Conectados&quot;</li>
                <li>Toque em &quot;Conectar um aparelho&quot;</li>
                <li>Aponte a camera para o QR code</li>
              </ol>
            </div>
          </div>
        )}

        <div className={styles.actions}>
          {state === 'disconnected' && (
            <button className={`${styles.actionButton} ${styles.connectButton}`} onClick={handleConnect} disabled={!!actionLoading}>
              {actionLoading === 'connect' ? <Loader2 size={18} className={styles.spinner} /> : <MessageCircle size={18} />}
              Conectar WhatsApp
            </button>
          )}

          {state === 'connecting' && (
            <button className={`${styles.actionButton} ${styles.testButton}`} onClick={handleRefresh} disabled={isRefreshing}>
              {isRefreshing ? <Loader2 size={18} className={styles.spinner} /> : <RefreshCw size={18} />}
              Atualizar QR Code
            </button>
          )}

          {state === 'connected' && (
            <>
              {integrationWarning && (
                <button className={`${styles.actionButton} ${styles.connectButton}`} onClick={handleRegisterWebhook} disabled={!!actionLoading}>
                  {actionLoading === 'webhook' ? <Loader2 size={18} className={styles.spinner} /> : <MessageCircle size={18} />}
                  Registrar Webhook
                </button>
              )}

              <button className={`${styles.actionButton} ${styles.testButton}`} onClick={handleTestConnection} disabled={!!actionLoading}>
                {actionLoading === 'test' ? <Loader2 size={18} className={styles.spinner} /> : <Check size={18} />}
                Testar Conexao
              </button>

              <button className={`${styles.actionButton} ${styles.disconnectButton}`} onClick={handleDisconnect} disabled={!!actionLoading}>
                {actionLoading === 'disconnect' ? <Loader2 size={18} className={styles.spinner} /> : <Unplug size={18} />}
                Desconectar
              </button>
            </>
          )}

          {!blockedReason && (state === 'connected' || state === 'disconnected' || state === 'connecting' || state === 'error') && (
            <button className={`${styles.actionButton} ${styles.deleteButton}`} onClick={handleDelete} disabled={!!actionLoading}>
              {actionLoading === 'delete' ? <Loader2 size={18} className={styles.spinner} /> : <Trash2 size={16} />}
              Excluir integracao
            </button>
          )}
        </div>
      </>
    );
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <MessageCircle size={24} />
            <h2>WhatsApp Business</h2>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {state !== 'loading' && state !== 'no-instance' && (
              <button className={`${styles.refreshButton} ${isRefreshing ? styles.spinning : ''}`} onClick={handleRefresh} title="Atualizar">
                <RefreshCw size={18} />
              </button>
            )}
            <button className={styles.closeButton} onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className={styles.content}>
          {pendingCommand && (
            <div className={styles.pendingBanner}>
              <Clock3 size={18} />
              <div>
                <strong>Processando comando pendente</strong>
                <p>{pendingCommand.message}</p>
                <code>command_id: {pendingCommand.command_id}</code>
              </div>
            </div>
          )}

          {error && (
            <div className={styles.error}>
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {integrationWarning && (
            <div className={styles.error}>
              <AlertCircle size={18} />
              {integrationWarning}
            </div>
          )}

          {renderContent()}
        </div>
      </div>
    </div>
  );
}
