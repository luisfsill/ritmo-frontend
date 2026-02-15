'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button, useToast } from '@/components/ui';
import { api } from '@/lib/api';
import { BillingUsageSnapshot, FeatureFlagState, getBillingUsage, getFeatureFlags, listFrontCommandLogs } from '@/lib/operations';
import styles from './operations.module.css';

interface WaitlistItem {
  id: string;
  status: string;
  priority_score: number;
  created_at: string;
}

export default function OperationsPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [waitlist, setWaitlist] = useState<WaitlistItem[]>([]);
  const [usage, setUsage] = useState<BillingUsageSnapshot | null>(null);
  const [flags, setFlags] = useState<FeatureFlagState[]>([]);
  const [logs, setLogs] = useState<Array<Record<string, unknown>>>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usageData, flagsData, logsData, waitlistData] = await Promise.all([
        getBillingUsage().catch(() => null),
        getFeatureFlags().catch(() => []),
        listFrontCommandLogs(30).catch(() => []),
        api.get<WaitlistItem[]>('/api/v1/waitlist').catch(() => []),
      ]);
      setUsage(usageData);
      setFlags(flagsData);
      setLogs(logsData);
      setWaitlist(waitlistData);
    } catch (error) {
      showToast('Falha ao carregar operacoes.', 'error');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Operacoes</h1>
          <p>Painel para waitlist/reencaixe, quotas, flags e trilha operacional.</p>
        </div>
        <Button variant="secondary" onClick={() => void loadData()}>
          Atualizar
        </Button>
      </header>

      {loading && (
        <div className={styles.loading}>
          <Loader2 size={18} className={styles.spinner} />
          Carregando dados...
        </div>
      )}

      <section className={styles.grid}>
        <article className={styles.card}>
          <h2>Quota e Uso</h2>
          {!usage ? (
            <p>Uso indisponivel.</p>
          ) : (
            <div className={styles.kv}>
              <div>Periodo: {new Date(usage.period_start).toLocaleDateString('pt-BR')} - {new Date(usage.period_end).toLocaleDateString('pt-BR')}</div>
              <pre>{JSON.stringify({ limits: usage.limits, usage: usage.usage }, null, 2)}</pre>
            </div>
          )}
        </article>

        <article className={styles.card}>
          <h2>Feature Flags</h2>
          {flags.length === 0 ? (
            <p>Nenhuma flag disponivel no contexto atual.</p>
          ) : (
            <ul className={styles.simpleList}>
              {flags.map((flag) => (
                <li key={flag.key}>
                  <strong>{flag.key}</strong>: {flag.enabled ? 'enabled' : 'disabled'} ({flag.source})
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <section className={styles.grid}>
        <article className={styles.card}>
          <h2>Waitlist / Reencaixe</h2>
          {waitlist.length === 0 ? (
            <p>Sem entradas de waitlist.</p>
          ) : (
            <ul className={styles.simpleList}>
              {waitlist.slice(0, 20).map((item) => (
                <li key={item.id}>
                  {item.id} | status={item.status} | prioridade={item.priority_score}
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className={styles.card}>
          <h2>Auditoria Operacional</h2>
          {logs.length === 0 ? (
            <p>Sem registros de front commands.</p>
          ) : (
            <ul className={styles.simpleList}>
              {logs.slice(0, 20).map((row, idx) => (
                <li key={`${String(row.command_id || idx)}`}>
                  {String(row.type || 'unknown')} | {String(row.status || 'unknown')} | {String(row.created_at || '')}
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>
    </div>
  );
}
