import { api } from './api';

export interface FeatureFlagState {
  key: string;
  enabled: boolean;
  source: 'tenant_settings' | 'backend_env';
}

export interface BillingUsageSnapshot {
  period_start: string;
  period_end: string;
  limits: Record<string, number>;
  usage: Record<string, number>;
}

interface TenantProfile {
  id: string;
  slug: string;
  business_name: string;
  address: Record<string, unknown> | null;
}

interface TenantPreferencesResponse {
  settings: Record<string, unknown>;
  feature_flags: FeatureFlagState[];
}

export async function getBillingUsage(): Promise<BillingUsageSnapshot> {
  return api.get<BillingUsageSnapshot>('/api/v1/billing/usage');
}

export async function getFeatureFlags(): Promise<FeatureFlagState[]> {
  const [profile, preferences] = await Promise.all([
    api.get<TenantProfile>('/api/v1/tenants/profile'),
    api.get<TenantPreferencesResponse>('/api/v1/tenants/preferences').catch(() => ({
      settings: {},
      feature_flags: [],
    })),
  ]);
  if (!profile.slug) {
    return [];
  }
  return Array.isArray(preferences?.feature_flags) ? preferences.feature_flags : [];
}

export async function listFrontCommandLogs(limit = 40, status?: string) {
  const qs = new URLSearchParams();
  qs.set('limit', String(limit));
  if (status) qs.set('status', status);
  return api.get<Array<Record<string, unknown>>>(`/api/v1/front-commands?${qs.toString()}`);
}
