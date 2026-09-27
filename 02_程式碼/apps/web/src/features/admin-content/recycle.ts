export const RECYCLE_COLLECTIONS = ['articles', 'services', 'article_categories', 'media_assets', 'contact_messages'] as const;
export type RecycleCollection = (typeof RECYCLE_COLLECTIONS)[number];
export type RecycleAction = 'restore' | 'purge';

export function isRecycleCollection(value: unknown): value is RecycleCollection {
  return typeof value === 'string' && (RECYCLE_COLLECTIONS as readonly string[]).includes(value);
}

export function isRecycleAction(value: unknown): value is RecycleAction {
  return value === 'restore' || value === 'purge';
}

export function recycleResourceType(collection: RecycleCollection): string {
  return ({
    articles: 'article',
    services: 'service',
    article_categories: 'article_category',
    media_assets: 'media_asset',
    contact_messages: 'contact_message',
  } as const)[collection];
}
