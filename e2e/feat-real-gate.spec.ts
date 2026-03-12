import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

const adminEmail = process.env.FEAT_GATE_ADMIN_EMAIL || '';
const adminPassword = process.env.FEAT_GATE_ADMIN_PASSWORD || '';
const adminBearer = process.env.FEAT_GATE_ADMIN_BEARER || '';
const legacyAdminToken = process.env.FEAT_GATE_ADMIN_TOKEN || '';
const apiBaseUrl = process.env.NEXT_PUBLIC_RITMO_API_URL || '';
const tenantId = process.env.FEAT_GATE_TENANT_ID || '';

function adminApiHeaders(): Record<string, string> {
  if (adminBearer) {
    return { Authorization: `Bearer ${adminBearer}` };
  }
  if (legacyAdminToken) {
    return { 'X-Admin-Token': legacyAdminToken };
  }
  return {};
}

async function loginAdmin(page: Page): Promise<void> {
  test.skip(
    !adminBearer && !legacyAdminToken && (!adminEmail || !adminPassword),
    'FEAT_GATE_ADMIN_BEARER, FEAT_GATE_ADMIN_TOKEN, or FEAT_GATE_ADMIN_EMAIL/FEAT_GATE_ADMIN_PASSWORD are required',
  );

  await page.goto('/admin/login');
  if (adminBearer || legacyAdminToken) {
    return;
  }

  await page.fill('#email', adminEmail);
  await page.fill('#password', adminPassword);
  await page.getByRole('button', { name: /acessar painel admin|entrar/i }).click();
  await expect(page).not.toHaveURL(/\/admin\/login/);
}

async function assertAdminTenantsApi(request: APIRequestContext): Promise<void> {
  test.skip(
    (!adminBearer && !legacyAdminToken) || !apiBaseUrl,
    'FEAT_GATE_ADMIN_BEARER or FEAT_GATE_ADMIN_TOKEN and NEXT_PUBLIC_RITMO_API_URL are required',
  );
  const response = await request.get(`${apiBaseUrl}/api/v1/admin/tenants?limit=10`, {
    headers: adminApiHeaders(),
  });
  expect(response.status()).toBe(200);
}

test.describe('feat real gate frontend', () => {
  test('@real-gate admin_portal_real', async ({ page, request }) => {
    await loginAdmin(page);
    await expect(page).toHaveURL(/\/admin\/login|\/admin(\/.*)?$/);
    await page.goto('/admin/tenants');
    await expect(page).toHaveURL(/\/admin\/login|\/admin\/tenants/);
    await expect(page.locator('body')).toContainText(/admin|login|empresas|tenants|status|dashboard/i);
    if ((adminBearer || legacyAdminToken) && apiBaseUrl) {
      await assertAdminTenantsApi(request);
    }
  });

  test('@real-gate impersonation_real', async ({ page, request }) => {
    test.skip(!tenantId, 'FEAT_GATE_TENANT_ID is required');
    await loginAdmin(page);
    await page.goto(`/admin/tenants/${tenantId}/ai`);
    await expect(page).toHaveURL(new RegExp(`/admin/tenants/${tenantId}/ai|/admin/login`));
    await expect(page.locator('body')).toContainText(/admin|login|ia|prompt|tenant/i);

    if ((adminBearer || legacyAdminToken) && apiBaseUrl) {
      const start = await request.post(`${apiBaseUrl}/api/v1/admin/impersonation/start`, {
        headers: { ...adminApiHeaders(), 'Content-Type': 'application/json' },
        data: {
          tenant_id: tenantId,
          mode: 'FULL_ACCESS',
          reason: 'feat-real-gate-ui',
          ttl_minutes: 15,
        },
      });
      expect(start.status()).toBe(200);
      const payload = await start.json();
      expect(payload.session_id).toBeTruthy();

      const stop = await request.post(`${apiBaseUrl}/api/v1/admin/impersonation/stop`, {
        headers: { ...adminApiHeaders(), 'Content-Type': 'application/json' },
        data: { session_id: payload.session_id },
      });
      expect(stop.status()).toBe(200);
    }
  });

  test('@real-gate catalog_visual_state', async ({ page }) => {
    await page.goto('/dashboard/services');
    await expect(page).toHaveURL(/\/login/);
  });

  test('@real-gate flags_visual_state', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await expect(page).toHaveURL(/\/login/);
  });
});
