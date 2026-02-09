'use client';

import { useEffect, useState } from 'react';
import { Save, Loader2, Webhook, Server, Key, AlertCircle, CheckCircle } from 'lucide-react';
import { getAdminUser, getPlatformSettings, updatePlatformSettings } from '@/lib/admin-api';
import styles from './settings.module.css';

interface GlobalSettingsForm {
  uazapi_url: string;
  uazapi_admin_token_masked: string | null;
  default_webhook_url: string;
  webhook_events: string[];
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<GlobalSettingsForm>({
    uazapi_url: '',
    uazapi_admin_token_masked: null,
    default_webhook_url: '',
    webhook_events: ['messages', 'messages_update', 'connection'],
  });
  const [newAdminToken, setNewAdminToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showToken, setShowToken] = useState(false);

  const currentAdmin = getAdminUser();
  const isSuperAdmin = String(currentAdmin?.role || '').toUpperCase() === 'SUPER_ADMIN';

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setMessage(null);
      try {
        const data = await getPlatformSettings();
        if (!cancelled) {
          setSettings({
            uazapi_url: data.uazapi_url || '',
            uazapi_admin_token_masked: data.uazapi_admin_token_masked,
            default_webhook_url: data.default_webhook_url || '',
            webhook_events: data.webhook_events || ['messages', 'messages_update', 'connection'],
          });
        }
      } catch (err) {
        if (!cancelled) {
          setMessage({
            type: 'error',
            text: (err as Error).message || 'Erro ao carregar configurações.',
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    if (!isSuperAdmin) return;
    setSaving(true);
    setMessage(null);

    try {
      const payload: {
        uazapi_url: string | null;
        default_webhook_url: string | null;
        webhook_events: string[];
        uazapi_admin_token?: string | null;
      } = {
        uazapi_url: settings.uazapi_url.trim() || null,
        default_webhook_url: settings.default_webhook_url.trim() || null,
        webhook_events: settings.webhook_events,
      };
      if (newAdminToken.trim()) {
        payload.uazapi_admin_token = newAdminToken.trim();
      }

      const updated = await updatePlatformSettings(payload);

      setSettings({
        uazapi_url: updated.uazapi_url || '',
        uazapi_admin_token_masked: updated.uazapi_admin_token_masked,
        default_webhook_url: updated.default_webhook_url || '',
        webhook_events: updated.webhook_events || [],
      });
      setNewAdminToken('');
      setMessage({
        type: 'success',
        text: 'Configurações salvas com sucesso.',
      });
    } catch (err) {
      setMessage({
        type: 'error',
        text: (err as Error).message || 'Erro ao salvar configurações. Tente novamente.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEventToggle = (event: string) => {
    setSettings((prev) => ({
      ...prev,
      webhook_events: prev.webhook_events.includes(event)
        ? prev.webhook_events.filter((e) => e !== event)
        : [...prev.webhook_events, event],
    }));
  };

  const webhookEventOptions = [
    { id: 'messages', label: 'Mensagens', description: 'Mensagens enviadas e recebidas' },
    { id: 'connection', label: 'Conexão', description: 'Mudanças de status da conexão' },
    { id: 'messages_update', label: 'Atualização de Mensagens', description: 'Status de entrega e leitura' },
    { id: 'chats', label: 'Chats', description: 'Atualizações de conversas' },
    { id: 'contacts', label: 'Contatos', description: 'Atualizações de contatos' },
  ];

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 size={32} className={styles.spinner} />
        <p>Carregando configurações...</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Configurações Globais</h1>
        <p className={styles.subtitle}>Configure as integrações do sistema</p>
      </div>

      {message && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {message.text}
        </div>
      )}

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <Server size={24} />
          <div>
            <h2 className={styles.sectionTitle}>Servidor UAZAPI</h2>
            <p className={styles.sectionDesc}>Configurações de conexão com o servidor WhatsApp</p>
          </div>
        </div>

        <div className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>URL do Servidor</label>
            <input
              type="url"
              className={styles.input}
              value={settings.uazapi_url}
              onChange={(e) => setSettings({ ...settings, uazapi_url: e.target.value })}
              placeholder="https://seu-servidor.uazapi.com"
              disabled={!isSuperAdmin}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              <Key size={14} />
              Admin Token
            </label>
            <div className={styles.inputGroup}>
              <input
                type={showToken ? 'text' : 'password'}
                className={styles.input}
                value={newAdminToken}
                onChange={(e) => setNewAdminToken(e.target.value)}
                placeholder={settings.uazapi_admin_token_masked || 'Token não configurado'}
                disabled={!isSuperAdmin}
              />
              <button
                type="button"
                className={styles.toggleButton}
                onClick={() => setShowToken(!showToken)}
              >
                {showToken ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            <span className={styles.hint}>
              O valor atual permanece mascarado. Preencha apenas se quiser substituir.
            </span>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <Webhook size={24} />
          <div>
            <h2 className={styles.sectionTitle}>Webhook Padrão</h2>
            <p className={styles.sectionDesc}>
              URL padrão para receber eventos de todas as instâncias
            </p>
          </div>
        </div>

        <div className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>URL do Webhook</label>
            <input
              type="url"
              className={styles.input}
              value={settings.default_webhook_url}
              onChange={(e) => setSettings({ ...settings, default_webhook_url: e.target.value })}
              placeholder="https://seu-backend.com/webhook/whatsapp"
              disabled={!isSuperAdmin}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Eventos do Webhook</label>
            <div className={styles.checkboxGroup}>
              {webhookEventOptions.map((option) => (
                <label key={option.id} className={styles.checkboxItem}>
                  <input
                    type="checkbox"
                    checked={settings.webhook_events.includes(option.id)}
                    onChange={() => handleEventToggle(option.id)}
                    disabled={!isSuperAdmin}
                  />
                  <div>
                    <span className={styles.checkboxLabel}>{option.label}</span>
                    <span className={styles.checkboxDesc}>{option.description}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      </section>

      {!isSuperAdmin && (
        <div className={styles.infoBox}>
          <AlertCircle size={20} />
          <div>
            <strong>Permissão:</strong> apenas SUPER_ADMIN pode salvar configurações globais.
          </div>
        </div>
      )}

      {isSuperAdmin && (
        <div className={styles.actions}>
          <button className={styles.saveButton} onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 size={18} className={styles.spinner} /> : <Save size={18} />}
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </div>
      )}
    </div>
  );
}
