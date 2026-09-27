import type { AuthorizedAdmin } from '@/features/admin-auth/application/authorize';

/**
 * Deletions are represented as a tombstone so an operator can investigate or
 * restore a record from a protected Firestore backup without losing the
 * original document immediately. Both field names are accepted for legacy
 * data imported from the former API.
 */
export function isDeleted(row: Record<string, unknown> | undefined | null): boolean {
  if (!row) return false;
  return row.deletedAt != null || row.deleted_at != null;
}

export function deletedBy(admin: AuthorizedAdmin) {
  return { deletedAt: new Date(), deletedBy: admin.username };
}
