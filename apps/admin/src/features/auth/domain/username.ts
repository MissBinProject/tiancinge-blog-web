export const ADMIN_USERNAME = 'tiancinge';

export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidUsername(value: string): boolean {
  return /^[a-z0-9_-]{4,32}$/.test(value);
}
