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

interface TenantSettingsResponse {
  settings: Record<string, unknown>;
}

export async function getBillingUsage(): Promise<BillingUsageSnapshot> {
  return api.get<BillingUsageSnapshot>('/api/v1/billing/usage');
}

export async function getFeatureFlags(): Promise<FeatureFlagState[]> {
  const [profile, settings] = await Promise.all([
    api.get<TenantProfile>('/api/v1/tenants/profile'),
    api.get<TenantSettingsResponse>('/api/v1/catalog').catch(() => ({ settings: {} })),
  ]);
  const tenantSettings: Record<string, unknown> = (settings?.settings || {}) as Record<string, unknown>;
  const flags: FeatureFlagState[] = [
    { key: 'enable_waitlist', enabled: Boolean(tenantSettings['enable_waitlist']), source: 'tenant_settings' },
    {
      key: 'enable_proactive_reschedule',
      enabled: Boolean(tenantSettings['enable_proactive_reschedule']),
      source: 'tenant_settings',
    },
    {
      key: 'enable_broadcast_offers',
      enabled: Boolean(tenantSettings['enable_broadcast_offers']),
      source: 'tenant_settings',
    },
  ];
  if (!profile.slug) {
    return [];
  }
  return flags;
}

export async function listFrontCommandLogs(limit = 40, status?: string) {
  const qs = new URLSearchParams();
  qs.set('limit', String(limit));
  if (status) qs.set('status', status);
  return api.get<Array<Record<string, unknown>>>(`/api/v1/front-commands?${qs.toString()}`);
}
