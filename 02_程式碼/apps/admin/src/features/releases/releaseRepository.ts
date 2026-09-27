import { adminApiRequest } from '../auth/infrastructure/adminApi';

export type WebRelease = {
  id: string;
  publishedAt: string;
  source: 'automatic';
  mode: 'static' | 'sitemap';
  count: number;
  sequence: number;
  version: string;
};

export async function loadWebReleases(): Promise<{ rows: WebRelease[]; error: string }> {
  const result = await adminApiRequest<WebRelease[]>('/releases');
  return result.ok ? { rows: result.data, error: '' } : { rows: [], error: result.error };
}
