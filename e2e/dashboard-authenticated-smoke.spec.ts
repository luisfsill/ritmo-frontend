import { expect, test, type Page, type Route } from '@playwright/test';

const appBaseUrl = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000';
const alternateAppBaseUrl = appBaseUrl.includes('127.0.0.1')
  ? appBaseUrl.replace('127.0.0.1', 'localhost')
  : appBaseUrl.replace('localhost', '127.0.0.1');

function encodeBase64Url(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function buildJwt(payload: Record<string, unknown>): string {
  return `${encodeBase64Url({ alg: 'HS256', typ: 'JWT' })}.${encodeBase64Url(payload)}.signature`;
}

async function seedTenantSession(
  page: Page,
  options: {
    email?: string;
  } = {},
): Promise<void> {
  const accessToken = buildJwt({
    sub: 'tenant-user',
    tenant_id: 'tenant-a',
    email: options.email || 'owner@example.com',
    exp: Math.floor(Date.now() / 1000) + 3600,
  });
  const refreshToken = buildJwt({ sub: 'tenant-user', type: 'refresh', exp: Math.floor(Date.now() / 1000) + 86400 });

  await page.context().addCookies([
    { name: 'ritmo_access_token', value: accessToken, url: appBaseUrl },
    { name: 'ritmo_refresh_token', value: refreshToken, url: appBaseUrl },
    { name: 'ritmo_access_token', value: accessToken, url: alternateAppBaseUrl },
    { name: 'ritmo_refresh_token', value: refreshToken, url: alternateAppBaseUrl },
  ]);

  await page.addInitScript(
    ({ seededAccessToken, seededRefreshToken }) => {
      localStorage.setItem('ritmo_access_token', seededAccessToken);
      localStorage.setItem('ritmo_refresh_token', seededRefreshToken);
    },
    { seededAccessToken: accessToken, seededRefreshToken: refreshToken },
  );
}

async function seedAdminSession(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem(
      'ritmo_admin_session',
      JSON.stringify({
        type: 'jwt',
        accessToken: 'platform-access',
        refreshToken: 'platform-refresh',
        user: {
          id: 'platform-user-1',
          email: 'super-admin@example.com',
          full_name: 'Super Admin',
          role: 'SUPER_ADMIN',
          is_active: true,
          must_change_password: false,
          password_changed_at: null,
          last_login_at: null,
          created_at: '2026-03-10T12:00:00Z',
          created_by_user_id: null,
        },
      }),
    );
  });
}

async function seedLegacyAdminSession(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem(
      'ritmo_admin_session',
      JSON.stringify({
        type: 'legacy',
        adminToken: 'platform-legacy-token',
        user: {
          id: 'platform-user-legacy',
          email: 'legacy-admin@example.com',
          full_name: 'Legacy Admin',
          role: 'SUPER_ADMIN',
          is_active: true,
          must_change_password: false,
          password_changed_at: null,
          last_login_at: null,
          created_at: '2026-03-10T12:00:00Z',
          created_by_user_id: null,
        },
      }),
    );
  });
}

async function fulfillJson(route: Route, body: unknown, status = 200): Promise<void> {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

async function mockAdminApis(page: Page): Promise<void> {
  await page.route('**/api/v1/platform-auth/login', async (route) => {
    await fulfillJson(route, {
      must_change_password: false,
      access_token: 'platform-access',
      refresh_token: 'platform-refresh',
      user: {
        id: 'platform-user-1',
        email: 'super-admin@example.com',
        full_name: 'Super Admin',
        role: 'SUPER_ADMIN',
        is_active: true,
        must_change_password: false,
        password_changed_at: null,
        last_login_at: null,
        created_at: '2026-03-10T12:00:00Z',
        created_by_user_id: null,
      },
    });
  });

  await page.route('**/api/v1/admin/tenants?limit=200', async (route) => {
    await fulfillJson(route, [
      {
        id: 'tenant-a',
        slug: 'tenant-a',
        business_name: 'Clinica Ritmo',
        owner_email: 'owner@example.com',
        owner_name: 'Patricia Lima',
        status: 'ACTIVE',
        created_at: '2026-03-01T12:00:00Z',
      },
    ]);
  });

  await page.route('**/api/v1/platform-users/?include_inactive=true', async (route) => {
    await fulfillJson(route, [
      {
        id: 'platform-user-1',
        email: 'super-admin@example.com',
        full_name: 'Super Admin',
        role: 'SUPER_ADMIN',
        is_active: true,
        must_change_password: false,
        password_changed_at: null,
        last_login_at: null,
        created_at: '2026-03-10T12:00:00Z',
        created_by_user_id: null,
      },
    ]);
  });
}

async function mockTenantApis(
  page: Page,
  options: {
    email?: string;
  } = {},
): Promise<void> {
  await page.route('**/api/v1/me', async (route) => {
    await fulfillJson(route, {
      user_id: 'tenant-user',
      tenant_id: 'tenant-a',
      role: 'owner',
      email: options.email || 'owner@example.com',
      full_name: 'Patricia Lima',
      tenant_slug: 'tenant-a',
      business_name: 'Clinica Ritmo',
    });
  });

  await page.route('**/api/v1/tenants/profile', async (route) => {
    await fulfillJson(route, {
      id: 'tenant-a',
      slug: 'tenant-a',
      business_name: 'Clinica Ritmo',
      address: { city: 'Sao Paulo' },
    });
  });

  await page.route('**/api/v1/tenants/preferences', async (route) => {
    await fulfillJson(route, {
      settings: { timezone: 'America/Sao_Paulo' },
      feature_flags: [
        { key: 'enable_waitlist', enabled: true, source: 'tenant_settings' },
        { key: 'enable_proactive_reschedule', enabled: true, source: 'backend_env' },
        { key: 'enable_broadcast_offers', enabled: false, source: 'backend_env' },
      ],
    });
  });

  await page.route('**/api/v1/billing/usage', async (route) => {
    await fulfillJson(route, {
      period_start: '2026-03-01',
      period_end: '2026-03-31',
      limits: { conversations: 1000 },
      usage: { conversations: 320 },
    });
  });

  await page.route('**/api/v1/front-commands?limit=30', async (route) => {
    await fulfillJson(route, [
      { command_id: 'cmd-1', type: 'update_catalog', status: 'committed', created_at: '2026-03-10T12:00:00Z' },
    ]);
  });

  await page.route('**/api/v1/waitlist', async (route) => {
    await fulfillJson(route, [
      {
        id: 'wait-1',
        status: 'active',
        priority_score: 12,
        created_at: '2026-03-10T12:00:00Z',
      },
    ]);
  });

  await page.route('**/api/v1/pricing/rules', async (route) => {
    if (route.request().method() === 'POST') {
      await fulfillJson(route, {
        id: 'rule-2',
        name: 'Happy Hour',
        rule_type: 'window',
        priority: 20,
        is_active: true,
        min_visits: null,
        discount_percent: 10,
        bonus_cents: 0,
        window_start_at: null,
        window_end_at: null,
        min_occupancy: null,
        max_occupancy: null,
        metadata_json: null,
        created_at: '2026-03-10T12:00:00Z',
        updated_at: '2026-03-10T12:00:00Z',
      });
      return;
    }

    await fulfillJson(route, [
      {
        id: 'rule-1',
        name: 'VIP',
        rule_type: 'frequency',
        priority: 10,
        is_active: true,
        min_visits: 3,
        discount_percent: 15,
        bonus_cents: 0,
        window_start_at: null,
        window_end_at: null,
        min_occupancy: null,
        max_occupancy: null,
        metadata_json: null,
        created_at: '2026-03-10T12:00:00Z',
        updated_at: '2026-03-10T12:00:00Z',
      },
    ]);
  });

  await page.route('**/api/v1/pricing/simulate', async (route) => {
    await fulfillJson(route, {
      base_price_cents: 12000,
      applied_price_cents: 10200,
      pricing_rule_id: 'rule-1',
      pricing_reason: 'vip_discount',
      occupancy_ratio: 0.5,
    });
  });

  await page.route('**/api/v1/catalog', async (route) => {
    await fulfillJson(route, {
      tenant: { id: 'tenant-a', slug: 'tenant-a', business_name: 'Clinica Ritmo' },
      settings: { timezone: 'America/Sao_Paulo', cancellation_policy: {} },
      services: [{ id: 'svc-1', name: 'Consulta', duration_minutes: 60 }],
      staff: [{ id: 'staff-1', display_name: 'Maria', is_active: true }],
      staff_service_links: [{ staff_id: 'staff-1', service_id: 'svc-1' }],
      generated_at: '2026-03-10T12:00:00Z',
      catalog_hash: 'catalog-hash-fixed',
    });
  });
}

test('@smoke admin login stores session and opens dashboard', async ({ page }) => {
  await mockAdminApis(page);

  await page.goto('/admin/login');
  await page.getByLabel('Email').fill('super-admin@example.com');
  await page.getByLabel('Senha').fill('platform-pass');
  await page.getByRole('button', { name: /acessar painel admin/i }).click();

  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByText(/dashboard administrativo/i)).toBeVisible();
});

test('@smoke admin tenants list renders with mocked session', async ({ page }) => {
  await seedAdminSession(page);
  await mockAdminApis(page);

  await page.goto('/admin/tenants');

  await expect(page).toHaveURL(/\/admin\/tenants$/);
  await expect(page.getByRole('heading', { name: /empresas/i })).toBeVisible();
  await expect(page.getByText('Clinica Ritmo')).toBeVisible();
});

test('@smoke admin tenants list renders with legacy token session', async ({ page }) => {
  await seedLegacyAdminSession(page);
  await mockAdminApis(page);

  await page.goto('/admin/tenants');

  await expect(page).toHaveURL(/\/admin\/tenants$/);
  await expect(page.getByRole('heading', { name: /empresas/i })).toBeVisible();
  await expect(page.getByText('Clinica Ritmo')).toBeVisible();
});

test('@smoke operations page shows flags usage logs and waitlist', async ({ page }) => {
  await seedTenantSession(page, { email: 'admin@admin.com' });
  await mockTenantApis(page, { email: 'admin@admin.com' });

  await page.goto('/dashboard/operations');

  await expect(page.getByRole('heading', { name: /operacoes/i })).toBeVisible();
  await expect(page.getByText(/enable_waitlist/i)).toBeVisible();
  await expect(page.getByText(/Periodo:/)).toBeVisible();
  await expect(page.getByText(/"conversations": 320/)).toBeVisible();
  await expect(page.getByText(/wait-1 \| status=active \| prioridade=12/i)).toBeVisible();
  await expect(page.getByText(/update_catalog \| committed/i)).toBeVisible();
});

test('@smoke pricing page renders catalog and simulator', async ({ page }) => {
  await seedTenantSession(page, { email: 'admin@admin.com' });
  await mockTenantApis(page, { email: 'admin@admin.com' });

  await page.goto('/dashboard/pricing');

  await expect(page.getByRole('heading', { name: /preco dinamico/i })).toBeVisible();
  await expect(page.getByText('VIP')).toBeVisible();

  await page.getByLabel('Horario').fill('2026-03-10T14:00');
  await page.getByRole('button', { name: /^simular$/i }).click();

  await expect(page.getByText(/Preco aplicado: R\$ 102\.00/)).toBeVisible();
  await expect(page.getByText(/Motivo: vip_discount/)).toBeVisible();
});

test('@smoke emergency page covers loading and empty states', async ({ page }) => {
  await seedTenantSession(page, { email: 'admin@admin.com' });
  await mockTenantApis(page, { email: 'admin@admin.com' });

  await page.route('**/api/v1/emergency/incidents', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    await fulfillJson(route, []);
  });

  await page.goto('/dashboard/emergency');

  await expect(page.getByText(/carregando/i)).toBeVisible();
  await expect(page.getByText(/nenhum incidente registrado/i)).toBeVisible();
});

test('@smoke emergency page shows error toast fallback', async ({ page }) => {
  await seedTenantSession(page, { email: 'admin@admin.com' });
  await mockTenantApis(page, { email: 'admin@admin.com' });

  await page.route('**/api/v1/emergency/incidents', async (route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ detail: 'server_error' }),
    });
  });

  await page.goto('/dashboard/emergency?scenario=error');

  await expect(page.getByRole('heading', { name: /mensagens de emergencia/i })).toBeVisible();
  await expect(page.getByRole('status').getByText(/falha ao carregar incidentes/i)).toBeVisible();
  await expect(page.getByText(/nenhum incidente registrado/i)).toBeVisible();
});

test('@smoke non-system-admin tenant users are redirected away from protected dashboard routes', async ({ page }) => {
  await seedTenantSession(page, { email: 'owner@example.com' });
  await mockTenantApis(page, { email: 'owner@example.com' });

  await page.goto('/dashboard/pricing');

  await expect(page).toHaveURL(/\/dashboard$/);
});
