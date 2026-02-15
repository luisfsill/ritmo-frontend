'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, PlusCircle, RefreshCw } from 'lucide-react';
import { Button, Input, useToast } from '@/components/ui';
import { pricingApi, PriceQuote, PriceRule } from '@/lib/pricing';
import { api } from '@/lib/api';
import styles from './pricing.module.css';

interface CatalogSnapshot {
  services: Array<{ id: string; name: string }>;
  staff: Array<{ id: string; display_name: string }>;
}

type PricingRuleForm = {
  name: string;
  rule_type: 'frequency' | 'window' | 'occupancy';
  priority: number;
  is_active: boolean;
  min_visits: number;
  discount_percent: number;
  bonus_cents: number;
};

const initialRule: PricingRuleForm = {
  name: '',
  rule_type: 'frequency',
  priority: 100,
  is_active: true,
  min_visits: 3,
  discount_percent: 10,
  bonus_cents: 0,
};

export default function PricingPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [rules, setRules] = useState<PriceRule[]>([]);
  const [catalog, setCatalog] = useState<CatalogSnapshot | null>(null);
  const [form, setForm] = useState<PricingRuleForm>(initialRule);
  const [simulation, setSimulation] = useState({
    service_id: '',
    staff_id: '',
    start_at: '',
    synthetic_visits: 3,
    synthetic_occupancy_ratio: 0.6,
  });
  const [quote, setQuote] = useState<PriceQuote | null>(null);

  const canSimulate = useMemo(() => {
    return simulation.service_id && simulation.staff_id && simulation.start_at;
  }, [simulation]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rulesData, catalogData] = await Promise.all([
        pricingApi.listRules(),
        api.get<CatalogSnapshot>('/api/v1/catalog'),
      ]);
      setRules(rulesData);
      setCatalog(catalogData);
      if (!simulation.service_id && catalogData.services[0]) {
        setSimulation((prev) => ({ ...prev, service_id: catalogData.services[0].id }));
      }
      if (!simulation.staff_id && catalogData.staff[0]) {
        setSimulation((prev) => ({ ...prev, staff_id: catalogData.staff[0].id }));
      }
    } catch (error) {
      showToast('Falha ao carregar configuracoes de preco dinamico.', 'error');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleCreateRule = async () => {
    setCreating(true);
    try {
      await pricingApi.createRule(form);
      showToast('Regra de preco criada.', 'success');
      setForm(initialRule);
      await loadData();
    } catch (error) {
      showToast('Nao foi possivel criar a regra.', 'error');
      console.error(error);
    } finally {
      setCreating(false);
    }
  };

  const handleToggleRule = async (rule: PriceRule) => {
    try {
      await pricingApi.updateRule(rule.id, { is_active: !rule.is_active });
      await loadData();
    } catch (error) {
      showToast('Falha ao atualizar regra.', 'error');
      console.error(error);
    }
  };

  const handleSimulate = async () => {
    if (!canSimulate) return;
    setSimulating(true);
    try {
      const result = await pricingApi.simulate({
        ...simulation,
        start_at: new Date(simulation.start_at).toISOString(),
      });
      setQuote(result);
      showToast('Simulacao concluida.', 'success');
    } catch (error) {
      showToast('Falha ao simular preco.', 'error');
      console.error(error);
    } finally {
      setSimulating(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <Loader2 className={styles.spinner} size={28} />
        <span>Carregando modulo de precificacao...</span>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Preco Dinamico</h1>
          <p>Gerencie regras por tenant e simule impacto de descontos e bonus.</p>
        </div>
        <Button onClick={() => void loadData()} variant="secondary">
          <RefreshCw size={16} />
          Atualizar
        </Button>
      </header>

      <section className={styles.grid}>
        <article className={styles.card}>
          <h2>Nova Regra</h2>
          <div className={styles.formGrid}>
            <Input
              label="Nome"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="VIP recorrente"
            />
            <label className={styles.field}>
              Tipo
              <select
                value={form.rule_type}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, rule_type: event.target.value as 'frequency' | 'window' | 'occupancy' }))
                }
              >
                <option value="frequency">Frequencia</option>
                <option value="window">Janela</option>
                <option value="occupancy">Ocupacao</option>
              </select>
            </label>
            <Input
              label="Prioridade"
              type="number"
              value={String(form.priority)}
              onChange={(event) => setForm((prev) => ({ ...prev, priority: Number(event.target.value || 0) }))}
            />
            <Input
              label="Min. visitas"
              type="number"
              value={String(form.min_visits)}
              onChange={(event) => setForm((prev) => ({ ...prev, min_visits: Number(event.target.value || 0) }))}
            />
            <Input
              label="Desconto (%)"
              type="number"
              value={String(form.discount_percent)}
              onChange={(event) => setForm((prev) => ({ ...prev, discount_percent: Number(event.target.value || 0) }))}
            />
            <Input
              label="Bonus (centavos)"
              type="number"
              value={String(form.bonus_cents)}
              onChange={(event) => setForm((prev) => ({ ...prev, bonus_cents: Number(event.target.value || 0) }))}
            />
          </div>
          <Button disabled={creating || !form.name.trim()} onClick={handleCreateRule}>
            {creating ? <Loader2 size={16} className={styles.spinner} /> : <PlusCircle size={16} />}
            Criar regra
          </Button>
        </article>

        <article className={styles.card}>
          <h2>Simulador</h2>
          <div className={styles.formGrid}>
            <label className={styles.field}>
              Servico
              <select
                value={simulation.service_id}
                onChange={(event) => setSimulation((prev) => ({ ...prev, service_id: event.target.value }))}
              >
                {(catalog?.services || []).map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              Profissional
              <select
                value={simulation.staff_id}
                onChange={(event) => setSimulation((prev) => ({ ...prev, staff_id: event.target.value }))}
              >
                {(catalog?.staff || []).map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.display_name}
                  </option>
                ))}
              </select>
            </label>
            <Input
              label="Horario"
              type="datetime-local"
              value={simulation.start_at}
              onChange={(event) => setSimulation((prev) => ({ ...prev, start_at: event.target.value }))}
            />
            <Input
              label="Visitas sinteticas"
              type="number"
              value={String(simulation.synthetic_visits)}
              onChange={(event) => setSimulation((prev) => ({ ...prev, synthetic_visits: Number(event.target.value || 0) }))}
            />
            <Input
              label="Ocupacao sintetica (0-1)"
              type="number"
              step="0.05"
              value={String(simulation.synthetic_occupancy_ratio)}
              onChange={(event) =>
                setSimulation((prev) => ({ ...prev, synthetic_occupancy_ratio: Number(event.target.value || 0) }))
              }
            />
          </div>
          <Button disabled={simulating || !canSimulate} onClick={handleSimulate}>
            {simulating ? <Loader2 size={16} className={styles.spinner} /> : <RefreshCw size={16} />}
            Simular
          </Button>
          {quote && (
            <div className={styles.quoteBox}>
              <div>Preco base: R$ {(quote.base_price_cents / 100).toFixed(2)}</div>
              <div>Preco aplicado: R$ {(quote.applied_price_cents / 100).toFixed(2)}</div>
              <div>Regra: {quote.pricing_rule_id || 'nenhuma'}</div>
              <div>Motivo: {quote.pricing_reason || 'sem ajuste'}</div>
            </div>
          )}
        </article>
      </section>

      <section className={styles.card}>
        <h2>Regras Atuais</h2>
        <div className={styles.list}>
          {rules.map((rule) => (
            <div key={rule.id} className={styles.listRow}>
              <div>
                <strong>{rule.name}</strong>
                <small>
                  tipo={rule.rule_type} prioridade={rule.priority}
                </small>
              </div>
              <Button variant="secondary" onClick={() => void handleToggleRule(rule)}>
                {rule.is_active ? 'Desativar' : 'Ativar'}
              </Button>
            </div>
          ))}
          {rules.length === 0 && <p>Nenhuma regra cadastrada.</p>}
        </div>
      </section>
    </div>
  );
}
