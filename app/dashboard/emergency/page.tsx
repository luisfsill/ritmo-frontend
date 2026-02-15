'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, Megaphone } from 'lucide-react';
import { Button, Input, useToast } from '@/components/ui';
import { emergencyApi, EmergencyIncident } from '@/lib/emergency';
import styles from './emergency.module.css';

export default function EmergencyPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [incidents, setIncidents] = useState<EmergencyIncident[]>([]);
  const [form, setForm] = useState({
    severity: 'critical' as 'warning' | 'critical',
    title: '',
    message: '',
    dispatch: true,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await emergencyApi.listIncidents();
      setIncidents(data);
    } catch (error) {
      showToast('Falha ao carregar incidentes.', 'error');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleCreateIncident = async () => {
    setSubmitting(true);
    try {
      await emergencyApi.createIncident({
        ...form,
        scope_json: null,
      });
      showToast('Incidente aberto.', 'success');
      setForm({ severity: 'critical', title: '', message: '', dispatch: true });
      await loadData();
    } catch (error) {
      showToast('Nao foi possivel abrir o incidente.', 'error');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async (incidentId: string) => {
    try {
      await emergencyApi.resolveIncident(incidentId);
      showToast('Incidente resolvido.', 'success');
      await loadData();
    } catch (error) {
      showToast('Falha ao resolver incidente.', 'error');
      console.error(error);
    }
  };

  const handleDispatch = async (incidentId: string) => {
    try {
      const result = await emergencyApi.testDispatch(incidentId);
      showToast(`Disparo concluido: ${result.queued} enfileirados, ${result.skipped} ignorados.`, 'success');
      await loadData();
    } catch (error) {
      showToast('Falha ao disparar emergencia.', 'error');
      console.error(error);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Mensagens de Emergencia</h1>
          <p>Abra incidentes criticos, dispare mensagens e acompanhe status operacional.</p>
        </div>
      </header>

      <section className={styles.card}>
        <h2>Novo Incidente</h2>
        <div className={styles.formGrid}>
          <label className={styles.field}>
            Severidade
            <select
              value={form.severity}
              onChange={(event) => setForm((prev) => ({ ...prev, severity: event.target.value as 'warning' | 'critical' }))}
            >
              <option value="critical">Critica</option>
              <option value="warning">Aviso</option>
            </select>
          </label>
          <Input
            label="Titulo"
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            placeholder="Intermitencia no WhatsApp"
          />
        </div>
        <label className={styles.field}>
          Mensagem
          <textarea
            value={form.message}
            onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
            rows={4}
            placeholder="Estamos com instabilidade temporaria e retornaremos em breve."
          />
        </label>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={form.dispatch}
            onChange={(event) => setForm((prev) => ({ ...prev, dispatch: event.target.checked }))}
          />
          Disparar imediatamente para clientes elegiveis
        </label>
        <Button disabled={submitting || !form.title.trim() || !form.message.trim()} onClick={handleCreateIncident}>
          {submitting ? <Loader2 size={16} className={styles.spinner} /> : <AlertTriangle size={16} />}
          Abrir incidente
        </Button>
      </section>

      <section className={styles.card}>
        <h2>Incidentes</h2>
        {loading ? (
          <div className={styles.loading}>
            <Loader2 size={18} className={styles.spinner} />
            Carregando...
          </div>
        ) : incidents.length === 0 ? (
          <p>Nenhum incidente registrado.</p>
        ) : (
          <div className={styles.list}>
            {incidents.map((incident) => (
              <article key={incident.id} className={styles.item}>
                <div className={styles.itemHeader}>
                  <strong>{incident.title}</strong>
                  <span className={incident.status === 'resolved' ? styles.resolved : styles.open}>
                    {incident.status}
                  </span>
                </div>
                <p>{incident.message}</p>
                <small>
                  severidade={incident.severity} | aberto em {new Date(incident.opened_at).toLocaleString('pt-BR')}
                </small>
                <div className={styles.actions}>
                  <Button variant="secondary" onClick={() => void handleDispatch(incident.id)}>
                    <Megaphone size={16} />
                    Test Dispatch
                  </Button>
                  {incident.status !== 'resolved' && (
                    <Button onClick={() => void handleResolve(incident.id)}>
                      <CheckCircle2 size={16} />
                      Resolver
                    </Button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
