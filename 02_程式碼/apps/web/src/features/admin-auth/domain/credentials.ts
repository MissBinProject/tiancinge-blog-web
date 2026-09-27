export const ADMIN_USERNAME_PATTERN = /^[a-z0-9_-]{4,32}$/;

export function normalizeAdminUsername(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidAdminUsername(value: string): boolean {
  return ADMIN_USERNAME_PATTERN.test(value);
}
