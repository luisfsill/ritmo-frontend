import { api } from './api';

export interface CatalogTenant {
  id: string;
  slug: string;
  business_name: string;
}

export interface CatalogSettings {
  timezone: string;
  cancellation_policy: Record<string, unknown>;
}

export interface CatalogService {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  buffer_before_minutes: number;
  buffer_after_minutes: number;
  price_cents: number;
  requires_deposit: boolean;
  deposit_cents: number | null;
  is_active: boolean;
  reminder_offsets_hhmm: string[];
}

export interface CatalogStaff {
  id: string;
  display_name: string;
  is_active: boolean;
}

export interface CatalogStaffServiceLink {
  staff_id: string;
  service_id: string;
}

export interface CatalogResponse {
  tenant: CatalogTenant;
  settings: CatalogSettings;
  services: CatalogService[];
  staff: CatalogStaff[];
  staff_service_links: CatalogStaffServiceLink[];
  generated_at: string;
  catalog_hash: string;
}

let cachedCatalog: CatalogResponse | null = null;
let cachedCatalogTenantId: string | null = null;

function getCurrentTenantId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const token = localStorage.getItem('ritmo_access_token');
    if (!token) return null;
    const payloadPart = token.split('.')[1];
    if (!payloadPart) return null;
    const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const payload = JSON.parse(atob(padded)) as { tenant_id?: string };
    return typeof payload.tenant_id === 'string' ? payload.tenant_id : null;
  } catch {
    return null;
  }
}

export async function getCatalog(options?: { force?: boolean }): Promise<CatalogResponse> {
  const tenantId = getCurrentTenantId();
  if (!options?.force && cachedCatalog && cachedCatalogTenantId === tenantId) return cachedCatalog;

  cachedCatalog = await api.get<CatalogResponse>('/api/v1/catalog');
  cachedCatalogTenantId = tenantId || cachedCatalog.tenant.id;
  return cachedCatalog;
}

export function clearCatalogCache() {
  cachedCatalog = null;
  cachedCatalogTenantId = null;
}
