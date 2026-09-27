import { randomUUID } from 'node:crypto';
import type { AuthorizedAdmin } from '../application/authorize';
import type { firebaseServer } from '@/lib/firebase-admin';

type FirebaseServer = NonNullable<ReturnType<typeof firebaseServer>>;

/**
 * Persist a minimal administrative audit event. Payloads and secrets are
 * intentionally excluded; a failed audit must not make a completed write
 * appear unsuccessful to the operator.
 */
export async function recordAdminAudit(
  firebase: FirebaseServer,
  admin: AuthorizedAdmin,
  request: Request,
  action: string,
  resourceType: string,
  resourceId: string,
  result: 'success' | 'failure' = 'success',
): Promise<void> {
  const suppliedRequestId = request.headers.get('x-request-id')?.trim() || '';
  const requestId = /^[A-Za-z0-9._:-]{1,100}$/.test(suppliedRequestId) ? suppliedRequestId : randomUUID();
  await firebase.db.collection('admin_audit_logs').add({
    actor: admin.username,
    action,
    resourceType,
    resourceId: resourceId.slice(0, 200),
    result,
    requestId,
    createdAt: new Date(),
  });
}
