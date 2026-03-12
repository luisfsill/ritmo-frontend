type MaybeUser = {
  email?: string | null;
  role?: string | null;
};

export const SYSTEM_ADMIN_ONLY_ROUTES = [
  '/dashboard/pricing',
  '/dashboard/emergency',
  '/dashboard/operations',
] as const;

const SYSTEM_ADMIN_EMAILS = ['admin@admin.com', 'admin@ritmo.com'] as const;

export function isSystemAdminUser(user: MaybeUser | null | undefined): boolean {
  const allowDevelopmentBypass =
    process.env.NODE_ENV === 'development' &&
    process.env.NEXT_PUBLIC_ENABLE_SYSTEM_ADMIN_DEV_BYPASS === 'true';
  if (allowDevelopmentBypass) {
    return true;
  }

  const email = user?.email?.trim().toLowerCase();
  return typeof email === 'string' && SYSTEM_ADMIN_EMAILS.includes(email as (typeof SYSTEM_ADMIN_EMAILS)[number]);
}

export function isSystemAdminOnlyRoute(pathname: string | null | undefined): boolean {
  const current = pathname || '';
  return SYSTEM_ADMIN_ONLY_ROUTES.some((route) => current === route || current.startsWith(`${route}/`));
}
