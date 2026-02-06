'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, MessageCircle, Loader2, RefreshCw, Smartphone, AlertCircle, Check, Unplug, Trash2 } from 'lucide-react';
import { uazapi, WhatsAppStorage, UazapiInstance, UazapiStatus } from '@/lib/uazapi';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import styles from './WhatsAppModal.module.css';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ConnectionState = 'loading' | 'no-instance' | 'disconnected' | 'connecting' | 'connected' | 'error';

export function WhatsAppModal({ isOpen, onClose }: WhatsAppModalProps) {
  const { user } = useAuth();
  const [state, setState] = useState<ConnectionState>('loading');
  const [instance, setInstance] = useState<UazapiInstance | null>(null);
  const [statusData, setStatusData] = useState<UazapiStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Tenant ID do usuário logado
  const tenantId = user?.tenant_id || 'demo-tenant';
  const businessName = user?.business_name || user?.name || 'Meu Negócio';

  // Função para gerar slug a partir do nome
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9]+/g, '-') // Substitui caracteres especiais por hífen
      .replace(/^-|-$/g, '') // Remove hífens do início e fim
      .slice(0, 20); // Limita tamanho
  };

  // Função para configurar webhook
  const configureWebhook = async (token: string) => {
    const webhookUrl = process.env.NEXT_PUBLIC_UAZAPI_WEBHOOK_URL;
    if (!webhookUrl) {
      console.log('Webhook URL não configurada no ambiente');
      return false;
    }

    try {
      await uazapi.setWebhook(token, {
        enabled: true,
        url: webhookUrl,
        events: ['messages', 'connection'],
        excludeMessages: ['wasSentByApi'],
      });
      console.log('✅ Webhook configurado com sucesso:', webhookUrl);
      return true;
    } catch (err) {
      console.error('❌ Erro ao configurar webhook:', err);
      return false;
    }
  };

  // Busca instância existente ou status
  const loadInstanceStatus = useCallback(async () => {
    setError(null);
    
    try {
      // SEMPRE verifica primeiro com o backend se existe instância configurada
      let token: string | null = null;
      
      try {
        const statusResult = await api.get<any>('/api/v1/uazapi/instance/status');
        // O backend retorna { status: {...} } contendo os dados da instância
        const instanceData = statusResult?.status?.instance || statusResult?.instance;
        const instanceToken = instanceData?.token || statusResult?.status?.token;
        if (instanceToken) {
          token = instanceToken;
          WhatsAppStorage.saveToken(instanceToken);
        }
      } catch (err: any) {
        // Erros 400/404 significam que não há instância - é esperado
        if (err?.status === 400 || err?.status === 404) {
          // Limpa qualquer token antigo que possa existir
          WhatsAppStorage.clearToken();
          setState('no-instance');
          setInstance(null);
          return;
        }
        // Outros erros podem ser problemas de conexão - tenta usar token local
        console.warn('Erro ao verificar status via backend:', err);
        token = WhatsAppStorage.getToken();
      }

      if (!token) {
        WhatsAppStorage.clearToken();
        setState('no-instance');
        setInstance(null);
        return;
      }

      // Busca o status da instância diretamente no Uazapi
      const status = await uazapi.getStatus(token);
      setInstance(status.instance);
      setStatusData(status);

      // Define o estado baseado no status
      if (status.status.connected && status.status.loggedIn) {
        setState('connected');
        
        // Configura webhook automaticamente quando conectado
        await configureWebhook(token);
      } else if (status.instance.status === 'connecting' || status.instance.qrcode) {
        setState('connecting');
      } else {
        setState('disconnected');
      }
    } catch (err) {
      console.error('Error loading instance:', err);
      // Se der erro de token inválido (401 ou não encontrado), limpa o storage
      const errorMessage = err instanceof Error ? err.message : '';
      if (errorMessage.includes('not found') || errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        WhatsAppStorage.clearToken();
        setState('no-instance');
      } else {
        setState('error');
        setError(err instanceof Error ? err.message : 'Erro ao carregar instância');
      }
    }
  }, [tenantId]);

  // Carrega status inicial
  useEffect(() => {
    if (isOpen) {
      loadInstanceStatus();
    }
  }, [isOpen, loadInstanceStatus]);

  // Polling para atualizar QR code quando conectando
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isOpen && state === 'connecting') {
      interval = setInterval(async () => {
        try {
          const token = WhatsAppStorage.getToken();
          if (token) {
            const status = await uazapi.getStatus(token);
            setInstance(status.instance);
            setStatusData(status);
            
            if (status.status.connected && status.status.loggedIn) {
              setState('connected');
              
              // Configura webhook assim que conectar
              await configureWebhook(token);
            }
          }
        } catch (err) {
          console.error('Polling error:', err);
        }
      }, 3000); // Atualiza a cada 3 segundos
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen, state]);

  // Refresh manual
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadInstanceStatus();
    setIsRefreshing(false);
  };

  // Criar nova instância via backend
  const handleCreateInstance = async () => {
    setActionLoading('create');
    setError(null);

    try {
      const instanceName = generateSlug(businessName);
      
      // Chama o backend que fará a chamada ao Uazapi com o admin token
      const result = await api.post<any>('/api/v1/uazapi/instance/init', {
        name: instanceName,
      });
      
      // Extrai token da resposta
      const instanceToken = result?.instance?.token || result?.token;
      if (instanceToken) {
        WhatsAppStorage.saveToken(instanceToken);
      }
      
      // Navega para o estado desconectado após criar
      if (result.instance) {
        setInstance(result.instance);
        setState('disconnected');
      }
      
      // Atualiza o status após alguns segundos
      setTimeout(loadInstanceStatus, 1000);
    } catch (err: any) {
      console.error('Error creating instance:', err);
      
      // Mensagens de erro mais específicas
      // O 'err' pode ser um ApiError { status, message, details } ou um Error normal
      const errorMessage = err?.message || '';
      const errorDetail = err?.details?.detail || '';
      const fullError = `${errorMessage} ${errorDetail}`.toLowerCase();
      
      if (fullError.includes('uazapi_admin_token_missing')) {
        setError('Configuração do servidor incompleta. Contate o administrador (UAZAPI_ADMIN_TOKEN não configurado).');
      } else if (fullError.includes('uazapi_token_missing')) {
        setError('Token da instância não encontrado. Tente novamente.');
      } else if (err?.status === 401) {
        setError('Sessão expirada. Faça login novamente.');
      } else if (err?.status === 0 || fullError.includes('cors') || fullError.includes('network') || fullError.includes('failed to fetch')) {
        setError('Erro de conexão com o servidor. Verifique sua internet.');
      } else {
        setError(errorMessage || 'Erro ao criar instância. Tente novamente.');
      }
    } finally {
      setActionLoading(null);
    }
  };

  // Conectar (gerar QR code)
  const handleConnect = async () => {
    setActionLoading('connect');
    setError(null);

    try {
      const token = WhatsAppStorage.getToken();
      if (!token) throw new Error('Token não encontrado');

      const result = await uazapi.connect(token);
      setInstance(result.instance);
      setState('connecting');
      
      // Atualiza status imediatamente
      setTimeout(loadInstanceStatus, 1000);
    } catch (err) {
      console.error('Error connecting:', err);
      setError(err instanceof Error ? err.message : 'Erro ao conectar');
    } finally {
      setActionLoading(null);
    }
  };

  // Desconectar
  const handleDisconnect = async () => {
    if (!confirm('Tem certeza que deseja desconectar o WhatsApp?')) return;
    
    setActionLoading('disconnect');
    setError(null);

    try {
      const token = WhatsAppStorage.getToken();
      if (!token) throw new Error('Token não encontrado');

      await uazapi.disconnect(token);
      setState('disconnected');
      await loadInstanceStatus();
    } catch (err) {
      console.error('Error disconnecting:', err);
      setError(err instanceof Error ? err.message : 'Erro ao desconectar');
    } finally {
      setActionLoading(null);
    }
  };

  // Deletar instância
  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir a integração do WhatsApp? Esta ação não pode ser desfeita.')) return;
    
    setActionLoading('delete');
    setError(null);

    try {
      const token = WhatsAppStorage.getToken();
      if (!token) throw new Error('Token não encontrado');

      await uazapi.deleteInstance(token);
      WhatsAppStorage.clearToken();
      setInstance(null);
      setState('no-instance');
    } catch (err) {
      console.error('Error deleting:', err);
      setError(err instanceof Error ? err.message : 'Erro ao excluir instância');
    } finally {
      setActionLoading(null);
    }
  };

  // Testar conexão
  const handleTestConnection = async () => {
    setActionLoading('test');
    setError(null);

    try {
      const token = WhatsAppStorage.getToken();
      if (!token) throw new Error('Token não encontrado');

      const status = await uazapi.getStatus(token);
      
      if (status.status.connected) {
        alert('✅ Conexão funcionando corretamente!');
      } else {
        alert('⚠️ WhatsApp não está conectado');
      }
    } catch (err) {
      console.error('Error testing:', err);
      setError(err instanceof Error ? err.message : 'Erro ao testar conexão');
    } finally {
      setActionLoading(null);
    }
  };

  if (!isOpen) return null;

  const renderContent = () => {
    // Loading inicial
    if (state === 'loading') {
      return (
        <div className={styles.loading}>
          <Loader2 size={40} className={styles.spinner} />
          <span className={styles.loadingText}>Carregando...</span>
        </div>
      );
    }

    // Sem instância - mostrar botão de criar
    if (state === 'no-instance') {
      return (
        <div className={styles.noInstance}>
          <Smartphone size={48} />
          <h3>Nenhuma instância configurada</h3>
          <p>Crie uma instância do WhatsApp para começar a enviar notificações automáticas.</p>
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
            Criar Instância
          </button>
        </div>
      );
    }

    // Status Badge
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
              Aguardando conexão
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
        {/* Status Section */}
        <div className={styles.statusSection}>
          {getStatusBadge()}
          
          {state === 'connected' && instance && (
            <div className={styles.profileInfo}>
              {instance.profilePicUrl ? (
                <img src={instance.profilePicUrl} alt="Profile" className={styles.profilePic} />
              ) : (
                <div className={styles.profilePlaceholder}>
                  <Smartphone size={32} />
                </div>
              )}
              {instance.profileName && (
                <span className={styles.profileName}>{instance.profileName}</span>
              )}
              {statusData?.status.jid?.user && (
                <span className={styles.profilePhone}>+{statusData.status.jid.user}</span>
              )}
            </div>
          )}
        </div>

        {/* QR Code Section - só mostra quando conectando */}
        {state === 'connecting' && instance?.qrcode && (
          <div className={styles.qrSection}>
            <div className={styles.qrCode}>
              <img src={instance.qrcode} alt="QR Code" />
            </div>
            
            {instance.paircode && (
              <div className={styles.pairCode}>
                <span>Ou use o código:</span>
                <div className={styles.pairCodeValue}>{instance.paircode}</div>
              </div>
            )}
            
            <div className={styles.qrInstructions}>
              <p>Escaneie o QR code com seu WhatsApp:</p>
              <ol>
                <li>Abra o WhatsApp no celular</li>
                <li>Toque em Menu (⋮) ou Configurações</li>
                <li>Selecione &quot;Aparelhos Conectados&quot;</li>
                <li>Toque em &quot;Conectar um aparelho&quot;</li>
                <li>Aponte a câmera para o QR code</li>
              </ol>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className={styles.actions}>
          {state === 'disconnected' && (
            <button
              className={`${styles.actionButton} ${styles.connectButton}`}
              onClick={handleConnect}
              disabled={!!actionLoading}
            >
              {actionLoading === 'connect' ? (
                <Loader2 size={18} className={styles.spinner} />
              ) : (
                <MessageCircle size={18} />
              )}
              Conectar WhatsApp
            </button>
          )}

          {state === 'connecting' && (
            <button
              className={`${styles.actionButton} ${styles.testButton}`}
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <Loader2 size={18} className={styles.spinner} />
              ) : (
                <RefreshCw size={18} />
              )}
              Atualizar QR Code
            </button>
          )}

          {state === 'connected' && (
            <>
              <button
                className={`${styles.actionButton} ${styles.testButton}`}
                onClick={handleTestConnection}
                disabled={!!actionLoading}
              >
                {actionLoading === 'test' ? (
                  <Loader2 size={18} className={styles.spinner} />
                ) : (
                  <Check size={18} />
                )}
                Testar Conexão
              </button>

              <button
                className={`${styles.actionButton} ${styles.disconnectButton}`}
                onClick={handleDisconnect}
                disabled={!!actionLoading}
              >
                {actionLoading === 'disconnect' ? (
                  <Loader2 size={18} className={styles.spinner} />
                ) : (
                  <Unplug size={18} />
                )}
                Desconectar
              </button>
            </>
          )}

          {/* Delete button - shown for all states except loading/no-instance */}
          {(state === 'connected' || state === 'disconnected' || state === 'connecting' || state === 'error') && (
            <button
              className={`${styles.actionButton} ${styles.deleteButton}`}
              onClick={handleDelete}
              disabled={!!actionLoading}
            >
              {actionLoading === 'delete' ? (
                <Loader2 size={18} className={styles.spinner} />
              ) : (
                <Trash2 size={16} />
              )}
              Excluir integração
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
              <button 
                className={`${styles.refreshButton} ${isRefreshing ? styles.spinning : ''}`}
                onClick={handleRefresh}
                title="Atualizar"
              >
                <RefreshCw size={18} />
              </button>
            )}
            <button className={styles.closeButton} onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className={styles.content}>
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
