export const AUTH_COOKIE = 'gt_role';

export const roles = ['ADMIN', 'MANAGER', 'WAREHOUSE'] as const;

export type UserRole = (typeof roles)[number];

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && roles.includes(value as UserRole);
}
