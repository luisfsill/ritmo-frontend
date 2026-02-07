'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { X, MessageCircle, Loader2, RefreshCw, Smartphone, AlertCircle, Check, Unplug, Trash2, Clock3 } from 'lucide-react';
import { toDataURL } from 'qrcode/lib/browser';
import { uazapi, WhatsAppStorage, UazapiInstance, UazapiStatus } from '@/lib/uazapi';
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
  if (message.includes('whatsapp_qr_feature_disabled')) {
    return 'A integração de QR do WhatsApp está em rollout gradual para este tenant.';
  }
  if (message.includes('uazapi_webhook_secret_missing')) {
    return 'Integração temporariamente indisponível: configuração de webhook pendente no backend.';
  }
  if (message.includes('uazapi_token_missing')) {
    return 'Token da instância não encontrado. Crie uma nova instância ou tente novamente.';
  }
  if (
    message.includes('429') ||
    message.includes('max_instances') ||
    message.toLowerCase().includes('maximum') ||
    message.toLowerCase().includes('limit')
  ) {
    return 'Limite de instâncias atingido no servidor WhatsApp. Contate o suporte para liberar mais instâncias.';
  }
  return message;
}

function extractInstanceToken(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const extractFrom = (value: unknown): string | null => {
    if (!value || typeof value !== 'object') {
      return null;
    }
    const record = value as Record<string, unknown>;
    for (const key of ['token', 'instance_token', 'instanceToken']) {
      const raw = record[key];
      if (typeof raw === 'string' && raw.trim()) {
        return raw.trim();
      }
    }
    return null;
  };

  const direct = extractFrom(payload);
  if (direct) {
    return direct;
  }

  const record = payload as Record<string, unknown>;
  const nested = extractFrom(record.instance);
  if (nested) {
    return nested;
  }

  const nestedInstance = record.instance && typeof record.instance === 'object' ? (record.instance as Record<string, unknown>).instance : null;
  return extractFrom(nestedInstance);
}

export function WhatsAppModal({ isOpen, onClose }: WhatsAppModalProps) {
  const { user } = useAuth();
  const [state, setState] = useState<ConnectionState>('loading');
  const [instance, setInstance] = useState<UazapiInstance | null>(null);
  const [statusData, setStatusData] = useState<UazapiStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingCommand, setPendingCommand] = useState<PendingCommandResponse | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [qrImageSrc, setQrImageSrc] = useState<string | null>(null);
  const [blockedReason, setBlockedReason] = useState<string | null>(null);
  const statusPollingInFlight = useRef(false);

  const tenantId = user?.tenant_id || 'demo-tenant';
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

  const configureWebhook = useCallback(async () => {
    try {
      const response = await uazapi.setWebhook({
        enabled: true,
        events: ['messages', 'connection'],
        excludeMessages: ['wasSentByApi'],
      });

      if (response.kind === 'pending') {
        setPendingCommand(response.pending);
      }
    } catch (err) {
      console.error('Erro ao configurar webhook automaticamente:', err);
    }
  }, []);

  const loadInstanceStatus = useCallback(async () => {
    setError(null);

    let hasTriedLegacyToken = false;
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

        if (status.status.connected && status.status.loggedIn) {
          await configureWebhook();
        }

        return;
      } catch (err) {
        const message = normalizeError(err);

        if (message.includes('uazapi_token_missing') && !hasTriedLegacyToken) {
          hasTriedLegacyToken = true;
          const legacyToken = WhatsAppStorage.getToken();

          if (!legacyToken) {
            setState('no-instance');
            setInstance(null);
            setStatusData(null);
            return;
          }

          try {
            const adoptResult = await uazapi.adoptToken(legacyToken);

            if (adoptResult.kind === 'pending') {
              const adopted = await waitPendingCommand(adoptResult.pending);
              if (adopted) {
                WhatsAppStorage.clearToken();
                shouldRetry = true;
              }
              continue;
            }

            WhatsAppStorage.clearToken();
            shouldRetry = true;
            continue;
          } catch (adoptErr) {
            setState('error');
            setError(humanizeUazapiError(normalizeError(adoptErr)));
            return;
          }
        }

        setState('error');
        setError(humanizeUazapiError(message));
        return;
      }
    }
  }, [applyStatus, configureWebhook, waitPendingCommand]);

  useEffect(() => {
    if (isOpen) {
      setState('loading');
      setBlockedReason(null);
      void (async () => {
        try {
          const capabilities = await uazapi.getCapabilities();
          if (!capabilities.enabled) {
            const reason = capabilities.reason || 'canary_disabled';
            if (reason === 'missing_webhook_secret') {
              setBlockedReason(null);
              setError(humanizeUazapiError('uazapi_webhook_secret_missing'));
              await loadInstanceStatus();
              return;
            }
            setBlockedReason(reason);
            setState('error');
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

      try {
        const image = await toDataURL(qrRaw, { margin: 1, width: 280 });
        if (!isCancelled) {
          setQrImageSrc(image);
        }
      } catch {
        if (!isCancelled) {
          setQrImageSrc(null);
          setError('Nao foi possivel renderizar o QR code retornado pela UAZAPI.');
        }
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

          const status = statusResult.data.status;
          applyStatus(status);

          if (status.status.connected && status.status.loggedIn) {
            await configureWebhook();
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
  }, [isOpen, state, applyStatus, configureWebhook]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadInstanceStatus();
    setIsRefreshing(false);
  };

  const handleCreateInstance = async () => {
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

      const token = extractInstanceToken(result.data);
      if (token) {
        WhatsAppStorage.saveToken(token);
      }

      await loadInstanceStatus();
    } catch (err) {
      setError(humanizeUazapiError(normalizeError(err)));
    } finally {
      setActionLoading(null);
    }
  };

  const handleConnect = async () => {
    setActionLoading('connect');
    setError(null);

    try {
      const legacyToken = WhatsAppStorage.getToken();
      const result = await uazapi.connect({ token: legacyToken || undefined });

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

      setState('connecting');
      setTimeout(() => {
        void loadInstanceStatus();
      }, 1000);
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
          await loadInstanceStatus();
        }
        return;
      }

      WhatsAppStorage.clearToken();
      setInstance(null);
      setStatusData(null);
      setState('no-instance');
      setQrImageSrc(null);
    } catch (err) {
      setError(humanizeUazapiError(normalizeError(err)));
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
          <h3>Nenhuma instancia configurada</h3>
          <p>Crie uma instancia do WhatsApp para comecar a enviar notificacoes automaticas.</p>
          <button
            className={`${styles.actionButton} ${styles.connectButton}`}
            onClick={handleCreateInstance}
            disabled={actionLoading === 'create'}
          >
            {actionLoading === 'create' ? (
              <Loader2 size={18} className={styles.spinner} />
            ) : (
              <MessageCircle size={18} />
            )}
            Criar Instancia
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

          {renderContent()}
        </div>
      </div>
    </div>
  );
}
