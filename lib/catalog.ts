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

export interface CatalogResponse {
  tenant: CatalogTenant;
  settings: CatalogSettings;
  services: CatalogService[];
  staff: CatalogStaff[];
  generated_at: string;
  catalog_hash: string;
}

let cachedCatalog: CatalogResponse | null = null;

export async function getCatalog(options?: { force?: boolean }): Promise<CatalogResponse> {
  if (!options?.force && cachedCatalog) return cachedCatalog;

  cachedCatalog = await api.get<CatalogResponse>('/api/v1/catalog');
  return cachedCatalog;
}

export function clearCatalogCache() {
  cachedCatalog = null;
}
