'use client';

import { useEffect, useState, use } from 'react';
import { ArrowLeft, Building2, User, Mail, Calendar, Loader2, Save, Bot, Activity } from 'lucide-react';
import Link from 'next/link';
import { adminApi, getAdminUser } from '@/lib/admin-api';
import styles from './edit.module.css';

interface AdminTenant {
  id: string;
  slug: string;
  business_name: string;
  owner_email: string | null;
  owner_name: string | null;
  status: string | null;
  status_reason: string | null;
  status_updated_at: string | null;
  created_at: string | null;
}

interface AdminPlan {
  code: string;
  name: string;
  is_active: boolean;
}

interface BillingUsage {
  period_start: string;
  period_end: string;
  limits: Record<string, unknown>;
  usage: Record<string, number>;
}

export default function EditTenantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);
  const [tenant, setTenant] = useState<AdminTenant | null>(null);
  const [plans, setPlans] = useState<AdminPlan[]>([]);
  const [usage, setUsage] = useState<BillingUsage | null>(null);
  const [statusValue, setStatusValue] = useState<'ACTIVE' | 'SUSPENDED' | 'CLOSED'>('ACTIVE');
  const [statusReason, setStatusReason] = useState('');
  const [planCode, setPlanCode] = useState('');
  const [planStatus, setPlanStatus] = useState('ACTIVE');
  const [planReason, setPlanReason] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const currentAdmin = getAdminUser();
  const canWrite = ['SUPER_ADMIN', 'ADMIN'].includes(String(currentAdmin?.role || '').toUpperCase());

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setMessage(null);
      try {
        const [tenantData, usageData, plansData] = await Promise.all([
          adminApi.get<AdminTenant>(`/api/v1/admin/tenants/${encodeURIComponent(id)}`),
          adminApi.get<BillingUsage>(`/api/v1/admin/tenants/${encodeURIComponent(id)}/usage`),
          adminApi.get<AdminPlan[]>('/api/v1/admin/plans'),
        ]);
        if (cancelled) return;
        setTenant(tenantData);
        setUsage(usageData);
        const activePlans = (plansData || []).filter((p) => p.is_active);
        setPlans(activePlans);
        setStatusValue((String(tenantData.status || 'ACTIVE').toUpperCase() as 'ACTIVE' | 'SUSPENDED' | 'CLOSED'));
        setPlanCode(activePlans[0]?.code || '');
      } catch (err) {
        if (!cancelled) {
          setMessage({ type: 'error', text: (err as Error).message || 'Erro ao carregar tenant.' });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleSaveStatus = async () => {
    if (!tenant || !canWrite) return;
    if (statusReason.trim().length < 3) {
      setMessage({ type: 'error', text: 'Informe um motivo com no mínimo 3 caracteres para alterar status.' });
      return;
    }

    setSavingStatus(true);
    setMessage(null);
    try {
      await adminApi.patch(`/api/v1/admin/tenants/${encodeURIComponent(id)}/status`, {
        status: statusValue,
        reason: statusReason.trim(),
      });
      setTenant({ ...tenant, status: statusValue, status_reason: statusReason.trim(), status_updated_at: new Date().toISOString() });
      setMessage({ type: 'success', text: 'Status atualizado com sucesso.' });
    } catch (err) {
      setMessage({ type: 'error', text: (err as Error).message || 'Erro ao atualizar status.' });
    } finally {
      setSavingStatus(false);
    }
  };

  const handleSavePlan = async () => {
    if (!tenant || !canWrite) return;
    if (!planCode) {
      setMessage({ type: 'error', text: 'Selecione um plano.' });
      return;
    }
    if (planReason.trim().length < 3) {
      setMessage({ type: 'error', text: 'Informe um motivo com no mínimo 3 caracteres para alterar plano.' });
      return;
    }

    setSavingPlan(true);
    setMessage(null);
    try {
      await adminApi.post(`/api/v1/admin/tenants/${encodeURIComponent(id)}/subscription/set-plan`, {
        plan_code: planCode,
        status: planStatus,
        reason: planReason.trim(),
      });
      setMessage({ type: 'success', text: 'Plano atualizado com sucesso.' });
    } catch (err) {
      setMessage({ type: 'error', text: (err as Error).message || 'Erro ao atualizar plano.' });
    } finally {
      setSavingPlan(false);
    }
  };

  if (loading || !tenant) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 size={32} className={styles.spinner} />
        <p>Carregando dados da empresa...</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Link href="/admin/tenants" className={styles.backButton}>
          <ArrowLeft size={20} />
          Voltar
        </Link>
        <div className={styles.headerInfo}>
          <h1 className={styles.title}>Gerenciar Empresa</h1>
          <p className={styles.subtitle}>ID: {tenant.id}</p>
        </div>
      </div>

      {message && <div className={`${styles.message} ${styles[message.type]}`}>{message.text}</div>}

      <div className={styles.content}>
        <div className={styles.infoCards}>
          <div className={styles.infoCard}>
            <Activity size={24} />
            <div>
              <span className={styles.infoValue}>{tenant.status || 'N/D'}</span>
              <span className={styles.infoLabel}>Status atual</span>
            </div>
          </div>
          <div className={styles.infoCard}>
            <Calendar size={24} />
            <div>
              <span className={styles.infoValue}>
                {tenant.created_at ? new Date(tenant.created_at).toLocaleDateString('pt-BR') : '-'}
              </span>
              <span className={styles.infoLabel}>Criado em</span>
            </div>
          </div>
          <Link href={`/admin/tenants/${id}/ai`} className={styles.infoCardLink}>
            <Bot size={24} />
            <div>
              <span className={styles.infoValue}>Configurar</span>
              <span className={styles.infoLabel}>Agente IA</span>
            </div>
          </Link>
        </div>

        <div className={styles.formGrid}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <Building2 size={20} />
              Dados da Empresa
            </h2>
            <div className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label}>Nome da Empresa</label>
                <input type="text" className={styles.input} value={tenant.business_name} readOnly disabled />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Slug</label>
                <input type="text" className={styles.input} value={tenant.slug} readOnly disabled />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Última razão de status</label>
                <input type="text" className={styles.input} value={tenant.status_reason || '-'} readOnly disabled />
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <User size={20} />
              Owner
            </h2>
            <div className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label}>Nome</label>
                <input type="text" className={styles.input} value={tenant.owner_name || '-'} readOnly disabled />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>
                  <Mail size={14} />
                  Email
                </label>
                <input type="text" className={styles.input} value={tenant.owner_email || '-'} readOnly disabled />
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <Activity size={20} />
              Atualizar Status
            </h2>
            <div className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label}>Status</label>
                <select
                  className={styles.select}
                  value={statusValue}
                  onChange={(e) => setStatusValue(e.target.value as 'ACTIVE' | 'SUSPENDED' | 'CLOSED')}
                  disabled={!canWrite}
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Motivo</label>
                <textarea
                  className={styles.textarea}
                  rows={3}
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="Informe o motivo da alteração"
                  disabled={!canWrite}
                />
              </div>
              {canWrite && (
                <button className={styles.saveButton} onClick={handleSaveStatus} disabled={savingStatus}>
                  {savingStatus ? <Loader2 size={18} className={styles.spinner} /> : <Save size={18} />}
                  {savingStatus ? 'Salvando...' : 'Salvar Status'}
                </button>
              )}
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <Calendar size={20} />
              Plano e Uso
            </h2>
            <div className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label}>Plano</label>
                <select className={styles.select} value={planCode} onChange={(e) => setPlanCode(e.target.value)} disabled={!canWrite}>
                  {plans.map((plan) => (
                    <option key={plan.code} value={plan.code}>
                      {plan.name} ({plan.code})
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Status da assinatura</label>
                <select className={styles.select} value={planStatus} onChange={(e) => setPlanStatus(e.target.value)} disabled={!canWrite}>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="TRIAL">TRIAL</option>
                  <option value="PAST_DUE">PAST_DUE</option>
                  <option value="CANCELED">CANCELED</option>
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Motivo</label>
                <textarea
                  className={styles.textarea}
                  rows={3}
                  value={planReason}
                  onChange={(e) => setPlanReason(e.target.value)}
                  placeholder="Motivo da troca de plano"
                  disabled={!canWrite}
                />
              </div>
              {canWrite && (
                <button className={styles.saveButton} onClick={handleSavePlan} disabled={savingPlan}>
                  {savingPlan ? <Loader2 size={18} className={styles.spinner} /> : <Save size={18} />}
                  {savingPlan ? 'Salvando...' : 'Salvar Plano'}
                </button>
              )}
              <div className={styles.field}>
                <label className={styles.label}>Uso atual (JSON)</label>
                <textarea
                  className={styles.textarea}
                  rows={8}
                  value={JSON.stringify(
                    {
                      period_start: usage?.period_start || null,
                      period_end: usage?.period_end || null,
                      usage: usage?.usage || {},
                      limits: usage?.limits || {},
                    },
                    null,
                    2
                  )}
                  readOnly
                  disabled
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
