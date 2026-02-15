import { api } from './api';

export interface PriceRule {
  id: string;
  name: string;
  rule_type: 'frequency' | 'window' | 'occupancy';
  priority: number;
  is_active: boolean;
  min_visits: number | null;
  discount_percent: number | null;
  bonus_cents: number | null;
  window_start_at: string | null;
  window_end_at: string | null;
  min_occupancy: number | null;
  max_occupancy: number | null;
  metadata_json: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface PriceQuote {
  base_price_cents: number;
  applied_price_cents: number;
  pricing_rule_id: string | null;
  pricing_reason: string | null;
  occupancy_ratio: number | null;
}

export interface PriceRulePayload {
  name: string;
  rule_type: 'frequency' | 'window' | 'occupancy';
  priority: number;
  is_active: boolean;
  min_visits?: number | null;
  discount_percent?: number | null;
  bonus_cents?: number | null;
  window_start_at?: string | null;
  window_end_at?: string | null;
  min_occupancy?: number | null;
  max_occupancy?: number | null;
  metadata_json?: Record<string, unknown> | null;
}

export const pricingApi = {
  listRules: () => api.get<PriceRule[]>('/api/v1/pricing/rules'),
  createRule: (payload: PriceRulePayload) => api.post<PriceRule>('/api/v1/pricing/rules', payload),
  updateRule: (ruleId: string, payload: Partial<PriceRulePayload>) =>
    api.patch<PriceRule>(`/api/v1/pricing/rules/${encodeURIComponent(ruleId)}`, payload),
  deleteRule: (ruleId: string) => api.delete<{ deleted: boolean }>(`/api/v1/pricing/rules/${encodeURIComponent(ruleId)}`),
  quote: (payload: { service_id: string; staff_id: string; start_at: string; client_id?: string | null }) =>
    api.post<PriceQuote>('/api/v1/pricing/quote', payload),
  simulate: (payload: {
    service_id: string;
    staff_id: string;
    start_at: string;
    synthetic_visits?: number;
    synthetic_occupancy_ratio?: number | null;
  }) => api.post<PriceQuote>('/api/v1/pricing/simulate', payload),
};
